import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

const downloadImage = async (url, filepath) => {
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });
    return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(filepath);
        response.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
};

export const getYtDlpMetadata = (url) => {
    return new Promise((resolve, reject) => {
        const ytDlpProcess = spawn('yt-dlp', ['--flat-playlist', '--dump-json', '--no-warnings', url]);
        let output = '';
        ytDlpProcess.stdout.on('data', (d) => output += d.toString());

        ytDlpProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    const data = JSON.parse(output.trim().split('\n')[0]);
                    if (data._type === 'playlist' || data.entries) {
                        resolve({
                            title: data.title || 'Playlist',
                            totalTracks: data.entries ? data.entries.length : 0,
                            isPlaylist: true,
                            tracks: data.entries ? data.entries.map(e => ({ url: e.url, title: e.title, type: 'youtube' })) : []
                        });
                    } else {
                        resolve({
                            title: data.title,
                            totalTracks: 1,
                            isPlaylist: false,
                            tracks: [{ url: data.webpage_url || url, title: data.title, type: 'youtube' }]
                        });
                    }
                } catch (e) { reject(new Error("Chyba parsování metadat.")); }
            } else { reject(new Error("yt-dlp selhalo.")); }
        });
    });
};

export const downloadTrack = (track, format, destinationPath, onProgress) => {
    return new Promise(async (resolve, reject) => {
        // If it is a Spotify track with extended metadata, we handle it differently (manual ffmpeg post-processing)
        // ONLY for audio mode. Video mode doesn't really apply to Spotify tracks in this context usually.
        const isSpotifyEnhanced = track.type === 'spotify_search' && track.artist && format === 'audio';

        // Sanitize filename: Replace illegal characters
        const safeTitle = (track.title || 'Unknown').replace(/[<>:"/\\|?*]/g, '');
        const finalFileName = `${safeTitle}.mp3`;
        const finalPath = path.join(destinationPath, finalFileName);

        // For standard YouTube downloads, use the original template logic (letting yt-dlp name it)
        // unless we want to enforce the name.
        // But for Spotify, we want to enforce "Artist - Title.mp3".

        const tempId = Date.now() + Math.floor(Math.random() * 1000);
        const tempAudioPath = path.join(destinationPath, `temp_audio_${tempId}.mp3`);
        const tempCoverPath = path.join(destinationPath, `temp_cover_${tempId}.jpg`);

        // If not enhanced or not audio, fall back to standard yt-dlp with standard args
        // But note: if format is audio, we still want to ensure mp3.

        let outputTemplate;
        let args = [
            track.url,
            '--progress', '--newline', '--no-warnings'
        ];

        if (isSpotifyEnhanced) {
            // Download to temp file, no metadata embedding from yt-dlp
            outputTemplate = tempAudioPath;
            args.push('-o', outputTemplate);
            args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
            // We do NOT add --embed-thumbnail or --add-metadata here, because we do it manually.
        } else {
            // Standard behavior
            outputTemplate = path.join(destinationPath, '%(title)s.%(ext)s');
            args.push('-o', outputTemplate);
            args.push('--embed-thumbnail', '--add-metadata');
            if (format === 'audio') {
                args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0', '--postprocessor-args', 'ffmpeg:-id3v2_version 3');
            } else {
                args.push('-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best');
            }
        }

        const ytDlpProcess = spawn('yt-dlp', args);
        let lastProgress = 0;

        ytDlpProcess.stdout.on('data', (data) => {
            const output = data.toString();
            const progressMatch = output.match(/\[download\]\s+(\d+\.\d+)%/);

            if (progressMatch) {
                const progress = parseFloat(progressMatch[1]);
                // If isSpotifyEnhanced, we save some progress for the post-processing
                // e.g., scale 0-90% for download, 90-100% for ffmpeg
                const scaledProgress = isSpotifyEnhanced ? progress * 0.9 : progress;

                if (scaledProgress - lastProgress >= 2 || progress === 100) {
                    lastProgress = scaledProgress;
                    onProgress(scaledProgress);
                }
            }
        });

        ytDlpProcess.stderr.on('data', (data) => {
             // console.error(`yt-dlp stderr: ${data}`);
        });

        ytDlpProcess.on('close', async (code) => {
            if (code !== 0) {
                return reject(new Error(`yt-dlp exited with code ${code}`));
            }

            if (!isSpotifyEnhanced) {
                resolve(track.title);
                return;
            }

            // Start Post-Processing for Spotify Tracks
            try {
                // 1. Download Cover Art
                if (track.albumArt) {
                    await downloadImage(track.albumArt, tempCoverPath);
                }

                // 2. Build FFmpeg args
                const ffmpegArgs = [
                    '-i', tempAudioPath
                ];

                // Input cover if exists
                let mapIndex = 1;
                if (track.albumArt && fs.existsSync(tempCoverPath)) {
                    ffmpegArgs.push('-i', tempCoverPath);
                    ffmpegArgs.push('-map', '0:0', '-map', '1:0');
                    ffmpegArgs.push('-c', 'copy');
                    ffmpegArgs.push('-id3v2_version', '3');
                    ffmpegArgs.push('-metadata:s:v', 'title="Album cover"');
                    ffmpegArgs.push('-metadata:s:v', 'comment="Cover (front)"');
                    ffmpegArgs.push('-disposition:v:1', 'attached_pic');
                } else {
                    ffmpegArgs.push('-c', 'copy');
                    ffmpegArgs.push('-id3v2_version', '3');
                }

                // Add Metadata
                if (track.artist) ffmpegArgs.push('-metadata', `artist=${track.artist}`);
                if (track.originalTitle) ffmpegArgs.push('-metadata', `title=${track.originalTitle}`);
                if (track.album) ffmpegArgs.push('-metadata', `album=${track.album}`);
                if (track.releaseDate) {
                     ffmpegArgs.push('-metadata', `date=${track.releaseDate.split('-')[0]}`); // Year
                     ffmpegArgs.push('-metadata', `year=${track.releaseDate.split('-')[0]}`);
                }
                if (track.trackNumber) ffmpegArgs.push('-metadata', `track=${track.trackNumber}`);

                // Output file
                ffmpegArgs.push('-y', finalPath); // Overwrite if exists

                // Spawn FFmpeg
                const ffmpeg = spawn('ffmpeg', ffmpegArgs);

                ffmpeg.on('close', (fCode) => {
                    // Cleanup
                    if (fs.existsSync(tempAudioPath)) fs.unlinkSync(tempAudioPath);
                    if (fs.existsSync(tempCoverPath)) fs.unlinkSync(tempCoverPath);

                    if (fCode === 0) {
                        onProgress(100);
                        resolve(track.title);
                    } else {
                        reject(new Error(`FFmpeg exited with code ${fCode}`));
                    }
                });

                ffmpeg.stderr.on('data', () => {}); // Consume stderr to prevent buffer fill

            } catch (err) {
                // Cleanup on error
                if (fs.existsSync(tempAudioPath)) fs.unlinkSync(tempAudioPath);
                if (fs.existsSync(tempCoverPath)) fs.unlinkSync(tempCoverPath);
                reject(err);
            }
        });
    });
};

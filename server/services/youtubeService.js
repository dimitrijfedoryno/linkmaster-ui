import { spawn } from 'child_process';
import path from 'path';

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
    return new Promise((resolve, reject) => {
        const outputTemplate = path.join(destinationPath, '%(title)s.%(ext)s');

        const args = [
            track.url,
            '-o', outputTemplate,
            '--progress', '--newline', '--no-warnings',
            '--embed-thumbnail', '--add-metadata'
        ];

        if (format === 'audio') {
            args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0', '--postprocessor-args', 'ffmpeg:-id3v2_version 3');
        } else {
            args.push('-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best');
        }

        const ytDlpProcess = spawn('yt-dlp', args);
        let lastProgress = 0;

        ytDlpProcess.stdout.on('data', (data) => {
            const output = data.toString();
            const progressMatch = output.match(/\[download\]\s+(\d+\.\d+)%/);

            if (progressMatch) {
                const progress = parseFloat(progressMatch[1]);
                if (progress - lastProgress >= 2 || progress === 100) {
                    lastProgress = progress;
                    onProgress(progress);
                }
            }
        });

        ytDlpProcess.stderr.on('data', (data) => {
             // console.error(`yt-dlp stderr: ${data}`);
        });

        ytDlpProcess.on('close', (code) => {
            if (code === 0) resolve(track.title);
            else reject(new Error(`yt-dlp exited with code ${code}`));
        });
    });
};

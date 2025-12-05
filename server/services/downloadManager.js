import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { downloadTrack } from './youtubeService.js';
import { DOWNLOAD_PATH_AUDIO, DOWNLOAD_PATH_VIDEO } from '../config/env.js';

const activeDownloads = new Map();
let downloadHistory = [];

export const getActiveDownloads = () => Array.from(activeDownloads.values());
export const getDownloadHistory = () => downloadHistory;

const addToHistory = (item, io) => {
    downloadHistory.unshift(item);
    if (downloadHistory.length > 10) {
        downloadHistory = downloadHistory.slice(0, 10);
    }
    io.emit('historyUpdate', downloadHistory);
};

export const startDownload = async (downloadId, tracks, format, url, playlistTitle, io) => {
    const baseDestinationPath = format === 'audio' ? DOWNLOAD_PATH_AUDIO : DOWNLOAD_PATH_VIDEO;
    // Sanitizace názvu složky
    const safeFolderName = (playlistTitle || 'Download').replace(/[<>:"/\\|?*]/g, '').trim();
    const destinationPath = tracks.length > 1 ? path.join(baseDestinationPath, safeFolderName) : baseDestinationPath;

    // Ensure directory exists.
    // NOTE: This might fail if the path is on a network drive that doesn't exist or isn't mounted.
    try {
        fs.mkdirSync(destinationPath, { recursive: true });
    } catch (err) {
        console.error(`Failed to create directory: ${destinationPath}`, err);
        io.emit('downloadError', { id: downloadId, message: `Failed to create directory: ${err.message}` });
        activeDownloads.delete(downloadId);
        return;
    }

    try {
        for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i];

            // Update state
            activeDownloads.set(downloadId, {
                id: downloadId,
                type: tracks.length > 1 ? 'playlist' : 'single',
                title: playlistTitle || track.title,
                state: 'downloading',
                progress: 0,
                message: `Zpracovávám: ${track.title} (${i+1}/${tracks.length})`,
                totalTracks: tracks.length,
                currentTrackIndex: i+1
            });

            io.emit('downloadProgress', {
                id: downloadId,
                state: 'downloading',
                progress: 0,
                message: `Zpracovávám: ${track.title}`,
                currentTrackIndex: i+1,
                totalTracks: tracks.length
            });

            await downloadTrack({ ...track, index: i+1, total: tracks.length }, format, destinationPath, (progress) => {
                 const currentState = activeDownloads.get(downloadId);
                 if (currentState) {
                     currentState.progress = progress;
                     activeDownloads.set(downloadId, currentState);
                     io.emit('downloadProgress', {
                        id: downloadId,
                        progress,
                        message: `Stahuji: ${track.title}`,
                        currentTrackIndex: i+1,
                        totalTracks: tracks.length,
                        state: 'downloading'
                    });
                 }
            });
        }

        // Complete
        activeDownloads.delete(downloadId);
        addToHistory({
            id: downloadId,
            title: playlistTitle || tracks[0].title,
            type: tracks.length > 1 ? 'playlist' : 'single',
            format,
            timestamp: new Date(),
            status: 'success',
            path: destinationPath
        }, io);

        io.emit('downloadComplete', { id: downloadId, path: destinationPath });

    } catch (error) {
        activeDownloads.delete(downloadId);
        io.emit('downloadError', { id: downloadId, message: error.message });
    }
};

export const createDownload = (url, format, tracks, playlistTitle, io) => {
    const downloadId = uuidv4();
    const title = playlistTitle || tracks[0]?.title || "Unknown Download";

    activeDownloads.set(downloadId, {
        id: downloadId, title, state: 'preparing', progress: 0,
        totalTracks: tracks.length, currentTrackIndex: 0
    });

    // Start background process
    startDownload(downloadId, tracks, format, url, playlistTitle, io);

    return downloadId;
};

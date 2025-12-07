import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { downloadTrack } from './youtubeService.js';
import { DOWNLOAD_PATH_AUDIO, DOWNLOAD_PATH_VIDEO } from '../config/env.js';

const activeDownloads = new Map();
let downloadHistory = [];
let notifications = [];

export const getActiveDownloads = () => Array.from(activeDownloads.values());
export const getDownloadHistory = () => downloadHistory;
export const getNotifications = () => notifications;

export const clearNotifications = (io) => {
    notifications = [];
    io.emit('notificationUpdate', notifications);
};

export const deleteNotification = (id, io) => {
    notifications = notifications.filter(n => n.id !== id);
    io.emit('notificationUpdate', notifications);
};

const addNotification = (type, message, details, io) => {
    const notification = {
        id: uuidv4(),
        type, // 'error', 'info', etc.
        message,
        details,
        timestamp: new Date()
    };
    notifications.unshift(notification);
    io.emit('notificationUpdate', notifications);
};

const addToHistory = (item, io) => {
    downloadHistory.unshift(item);
    if (downloadHistory.length > 10) {
        downloadHistory = downloadHistory.slice(0, 10);
    }
    io.emit('historyUpdate', downloadHistory);
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const startDownload = async (downloadId, tracks, format, url, playlistTitle, io) => {
    const baseDestinationPath = format === 'audio' ? DOWNLOAD_PATH_AUDIO : DOWNLOAD_PATH_VIDEO;
    // Sanitizace názvu složky
    const safeFolderName = (playlistTitle || 'Download').replace(/[<>:"/\\|?*]/g, '').trim();
    const destinationPath = tracks.length > 1 ? path.join(baseDestinationPath, safeFolderName) : baseDestinationPath;

    // Ensure directory exists.
    try {
        fs.mkdirSync(destinationPath, { recursive: true });
    } catch (err) {
        console.error(`Failed to create directory: ${destinationPath}`, err);
        io.emit('downloadError', { id: downloadId, message: `Failed to create directory: ${err.message}` });
        activeDownloads.delete(downloadId);
        return;
    }

    let failedTracks = [];

    try {
        for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i];

            // Rate limiting delay (3 seconds) if more than one track or explicitly requested
            if (i > 0) {
                await delay(3000);
            }

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

            let attempts = 0;
            const maxAttempts = 3;
            let success = false;

            while (attempts < maxAttempts && !success) {
                attempts++;
                try {
                    // Pass the full track object which now includes extended metadata (album, art, etc.)
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
                    success = true;
                } catch (err) {
                    console.error(`Attempt ${attempts} failed for ${track.title}:`, err);
                    if (attempts < maxAttempts) {
                        // Exponential backoff or simple delay before retry
                        await delay(2000 * attempts);
                    } else {
                        // Final failure for this track
                        const errorMsg = `Nepodařilo se stáhnout: ${track.title}`;
                        addNotification('error', errorMsg, err.message, io);
                        failedTracks.push({ track: track.title, error: err.message });
                    }
                }
            }
        }

        // Complete
        activeDownloads.delete(downloadId);

        const status = failedTracks.length === 0 ? 'success' : (failedTracks.length === tracks.length ? 'failed' : 'partial');

        addToHistory({
            id: downloadId,
            title: playlistTitle || tracks[0].title,
            type: tracks.length > 1 ? 'playlist' : 'single',
            format,
            timestamp: new Date(),
            status: status,
            path: destinationPath,
            failedCount: failedTracks.length
        }, io);

        io.emit('downloadComplete', { id: downloadId, path: destinationPath });

    } catch (error) {
        // This catch block handles catastrophic errors that crash the loop (should be rare with inner try/catch)
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

import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { downloadTrack } from './youtubeService.js';
import { DOWNLOAD_PATH_AUDIO, DOWNLOAD_PATH_VIDEO } from '../config/env.js';

const activeDownloads = new Map();
let downloadHistory = [];
let notifications = [];

export const getActiveDownloads = (userId) => {
    return Array.from(activeDownloads.values())
        .filter(d => !userId || d.ownerId === userId)
        .map(d => ({
            id: d.id,
            state: d.state,
            title: d.title,
            progress: d.progress,
            totalTracks: d.totalTracks,
            currentTrackIndex: d.currentTrackIndex,
            message: d.message,
            destinationPath: d.destinationPath,
            ownerId: d.ownerId
            // Explicitly exclude 'process' to avoid serialization errors
        }));
};

export const getDownloadHistory = (userId) => {
    // History is global in original, but user requested "Users to only see their own active downloads".
    // They didn't explicitly say "only their own history", but "the cancelled download appear in the 'History' with a 'Cancelled' status"
    // implies history is also scoped or at least relevant.
    // Usually history is personal. Let's filter it if userId is provided.
    return userId ? downloadHistory.filter(h => h.ownerId === userId) : downloadHistory;
};

export const getNotifications = (userId) => {
    // Similarly for notifications
    return userId ? notifications.filter(n => n.ownerId === userId) : notifications;
};

export const clearNotifications = (io, userId) => {
    if (userId) {
        notifications = notifications.filter(n => n.ownerId !== userId);
        io.to(`user:${userId}`).emit('notificationUpdate', []);
    } else {
        notifications = [];
        io.emit('notificationUpdate', notifications);
    }
};

export const deleteNotification = (id, io, userId) => {
    notifications = notifications.filter(n => n.id !== id);
    if (userId) {
        io.to(`user:${userId}`).emit('notificationUpdate', getNotifications(userId));
    } else {
         io.emit('notificationUpdate', notifications);
    }
};

const addNotification = (type, message, details, io, ownerId) => {
    const notification = {
        id: uuidv4(),
        type, // 'error', 'info', etc.
        message,
        details,
        timestamp: new Date(),
        ownerId
    };
    notifications.unshift(notification);
    if (ownerId) {
        io.to(`user:${ownerId}`).emit('notificationUpdate', getNotifications(ownerId));
    }
};

const addToHistory = (item, io) => {
    downloadHistory.unshift(item);
    // Limit history size per user? Or global?
    // The original code limited global history to 10.
    // If we have multiple users, 10 global items is too small.
    // Let's increase it or limit per user.
    // For simplicity, let's keep it larger global limit for now, or filter per user when emitting.
    if (downloadHistory.length > 50) {
        downloadHistory = downloadHistory.slice(0, 50);
    }

    if (item.ownerId) {
        io.to(`user:${item.ownerId}`).emit('historyUpdate', getDownloadHistory(item.ownerId));
    }
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const cancelDownload = (downloadId, userId, io) => {
    const download = activeDownloads.get(downloadId);
    if (!download) return;

    if (download.ownerId !== userId) {
        console.warn(`User ${userId} tried to cancel download ${downloadId} owned by ${download.ownerId}`);
        return;
    }

    // Mark as cancelled
    download.cancelled = true;
    activeDownloads.set(downloadId, download);

    // Kill process if running
    if (download.process) {
        try {
            // Check if it's a child_process object
            if (typeof download.process.kill === 'function') {
                 // specific kill for yt-dlp or ffmpeg
                 // sending SIGKILL or SIGTERM
                 download.process.kill('SIGKILL');
            }
        } catch (e) {
            console.error("Error killing process:", e);
        }
    }

    // Update UI immediately
    io.to(`user:${userId}`).emit('downloadError', {
        id: downloadId,
        message: 'Stahování zrušeno uživatelem.'
    });
};

export const startDownload = async (downloadId, tracks, format, url, playlistTitle, io, ownerId) => {
    const baseDestinationPath = format === 'audio' ? DOWNLOAD_PATH_AUDIO : DOWNLOAD_PATH_VIDEO;
    // Sanitizace názvu složky
    const safeFolderName = (playlistTitle || 'Download').replace(/[<>:"/\\|?*]/g, '').trim();
    const destinationPath = tracks.length > 1 ? path.join(baseDestinationPath, safeFolderName) : baseDestinationPath;

    // Ensure directory exists.
    try {
        fs.mkdirSync(destinationPath, { recursive: true });
    } catch (err) {
        console.error(`Failed to create directory: ${destinationPath}`, err);
        io.to(`user:${ownerId}`).emit('downloadError', { id: downloadId, message: `Failed to create directory: ${err.message}` });
        activeDownloads.delete(downloadId);
        return;
    }

    let failedTracks = [];
    let cancelled = false;

    try {
        for (let i = 0; i < tracks.length; i++) {
            // Check cancellation before starting track
            if (activeDownloads.get(downloadId)?.cancelled) {
                cancelled = true;
                break;
            }

            const track = tracks[i];

            // Rate limiting delay (3 seconds) if more than one track or explicitly requested
            if (i > 0) {
                await delay(3000);
            }

            // Check cancellation after delay
            if (activeDownloads.get(downloadId)?.cancelled) {
                cancelled = true;
                break;
            }

            // Update state
            activeDownloads.set(downloadId, {
                ...activeDownloads.get(downloadId),
                state: 'downloading',
                progress: 0,
                message: `Zpracovávám: ${track.title} (${i+1}/${tracks.length})`,
                currentTrackIndex: i+1
            });

            io.to(`user:${ownerId}`).emit('downloadProgress', {
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
                // Check cancellation inside retry loop
                if (activeDownloads.get(downloadId)?.cancelled) {
                    cancelled = true;
                    break;
                }

                attempts++;
                try {
                    // Pass the full track object which now includes extended metadata (album, art, etc.)
                    await downloadTrack(
                        { ...track, index: i+1, total: tracks.length },
                        format,
                        destinationPath,
                        (progress) => {
                            const currentState = activeDownloads.get(downloadId);
                            if (currentState) {
                                currentState.progress = progress;
                                activeDownloads.set(downloadId, currentState);
                                io.to(`user:${ownerId}`).emit('downloadProgress', {
                                    id: downloadId,
                                    progress,
                                    message: `Stahuji: ${track.title}`,
                                    currentTrackIndex: i+1,
                                    totalTracks: tracks.length,
                                    state: 'downloading'
                                });
                            }
                        },
                        (childProcess) => {
                            // Store the process reference for cancellation
                            const currentState = activeDownloads.get(downloadId);
                            if (currentState) {
                                currentState.process = childProcess;
                                activeDownloads.set(downloadId, currentState);
                            }
                        }
                    );
                    success = true;
                } catch (err) {
                    // If error was caused by cancellation, stop.
                    if (activeDownloads.get(downloadId)?.cancelled) {
                        cancelled = true;
                        break;
                    }

                    console.error(`Attempt ${attempts} failed for ${track.title}:`, err);
                    if (attempts < maxAttempts) {
                        // Exponential backoff or simple delay before retry
                        await delay(2000 * attempts);
                    } else {
                        // Final failure for this track
                        const errorMsg = `Nepodařilo se stáhnout: ${track.title}`;
                        addNotification('error', errorMsg, err.message, io, ownerId);
                        failedTracks.push({ track: track.title, error: err.message });
                    }
                }
            }
            if (cancelled) break;
        }

        // Clean up partial files if cancelled
        if (cancelled) {
            // Logic to clean up?
            // `downloadTrack` might leave temp files if killed.
            // In `youtubeService.js`, we should try to handle cleanup on kill.
            // Also here we might want to cleanup the last track's file if it exists partially.
            // For now, let's assume `downloadTrack` handles its own temp files cleanup or we rely on the fact that we killed the process.
        }

        // Complete
        activeDownloads.delete(downloadId);

        let status;
        if (cancelled) {
            status = 'cancelled';
        } else {
            status = failedTracks.length === 0 ? 'success' : (failedTracks.length === tracks.length ? 'failed' : 'partial');
        }

        addToHistory({
            id: downloadId,
            title: playlistTitle || tracks[0].title,
            type: tracks.length > 1 ? 'playlist' : 'single',
            format,
            timestamp: new Date(),
            status: status,
            path: destinationPath,
            failedCount: failedTracks.length,
            ownerId
        }, io);

        if (cancelled) {
             // Already notified via error/cancel event, but let's ensure history update
        } else {
             io.to(`user:${ownerId}`).emit('downloadComplete', { id: downloadId, path: destinationPath });
        }

    } catch (error) {
        // This catch block handles catastrophic errors that crash the loop (should be rare with inner try/catch)
        activeDownloads.delete(downloadId);
        io.to(`user:${ownerId}`).emit('downloadError', { id: downloadId, message: error.message });
    }
};

export const createDownload = (url, format, tracks, playlistTitle, io, ownerId) => {
    const downloadId = uuidv4();
    const title = playlistTitle || tracks[0]?.title || "Unknown Download";

    if (!ownerId) {
        console.warn("Creating download without ownerId!");
    }

    activeDownloads.set(downloadId, {
        id: downloadId, title, state: 'preparing', progress: 0,
        totalTracks: tracks.length, currentTrackIndex: 0,
        ownerId
    });

    // Start background process
    startDownload(downloadId, tracks, format, url, playlistTitle, io, ownerId);

    return downloadId;
};

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { PORT, ALLOWED_ORIGINS } from './config/env.js';
import { setupRoutes } from './routes.js';
import { getActiveDownloads, getDownloadHistory, getNotifications, clearNotifications, deleteNotification, cancelDownload } from './services/downloadManager.js';

// --- CONFIGURATION ---
const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: ALLOWED_ORIGINS,
        methods: ["GET", "POST"]
    }
});

app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- ROUTES ---
setupRoutes(app, io);

// --- SOCKET IO ---
io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    console.log('Client connected:', socket.id, 'User:', userId);

    if (userId) {
        socket.join(`user:${userId}`);
        socket.emit('syncActiveDownloads', getActiveDownloads(userId));
        socket.emit('historyUpdate', getDownloadHistory(userId));
        socket.emit('notificationUpdate', getNotifications(userId));
    }

    socket.on('clearNotifications', () => {
        // Assuming notifications are also per user in future, but for now we might leave it global or filter it.
        // The task spec didn't explicitly mention notifications filtering but implies "users to only see their own active downloads"
        // Let's pass userId to clearNotifications if needed, or leave it as is if notifications are global system messages.
        // Given the requirement "add option to cancel actual download for each connected user (to his active downloads only)"
        // and "Users to only see their own active downloads in the list"
        // I will assume Notifications should also be scoped or at least handled carefully.
        // For now, I'll pass userId if available.
        if (userId) clearNotifications(io, userId);
    });

    socket.on('deleteNotification', (id) => {
        if (userId) deleteNotification(id, io, userId);
    });

    socket.on('cancelDownload', (downloadId) => {
        if (userId) {
            cancelDownload(downloadId, userId, io);
        }
    });
});

// --- START SERVER ---
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { PORT, ALLOWED_ORIGINS } from './config/env.js';
import { setupRoutes } from './routes.js';
import { getActiveDownloads, getDownloadHistory } from './services/downloadManager.js';

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
    console.log('Client connected:', socket.id);
    socket.emit('syncActiveDownloads', getActiveDownloads());
    socket.emit('historyUpdate', getDownloadHistory());
});

// --- START SERVER ---
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));

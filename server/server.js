// Soubor: server/server.js (KOMPLETNÍ)

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { spawn } from 'child_process';
import path from 'path';
import cors from 'cors';
import axios from 'axios';
import 'dotenv/config'; 
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid'; // Nutné doinstalovat: npm install uuid

// --- KONFIGURACE ---
const app = express();
const httpServer = createServer(app);

const allowedOrigins = ["http://localhost:8080", "http://localhost:5173", "http://localhost:5174"];

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"]
    }
});

app.use(cors({ origin: allowedOrigins }));
// ZVÝŠENÍ LIMITU VELIKOSTI DAT (řeší chybu 413 Payload Too Large u velkých playlistů)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const PORT = 5000;
const BASE_DIR = process.cwd();
const DOWNLOAD_PATH_VIDEO = process.env.DOWNLOAD_PATH_VIDEO || path.join(BASE_DIR, 'downloads', 'videos');
const DOWNLOAD_PATH_AUDIO = process.env.DOWNLOAD_PATH_AUDIO || path.join(BASE_DIR, 'downloads', 'music');

// Vytvoření složek
fs.mkdirSync(DOWNLOAD_PATH_VIDEO, { recursive: true });
fs.mkdirSync(DOWNLOAD_PATH_AUDIO, { recursive: true });

// --- GLOBÁLNÍ STAV (PAMĚŤ SERVERU) ---
const activeDownloads = new Map(); // Ukládá běžící úlohy
let downloadHistory = []; // Ukládá posledních 10 dokončených

// --- HELPER: Historie ---
const addToHistory = (item) => {
    downloadHistory.unshift(item); // Přidat na začátek
    if (downloadHistory.length > 10) {
        downloadHistory = downloadHistory.slice(0, 10); // Držet max 10
    }
    io.emit('historyUpdate', downloadHistory);
};

// --- SPOTIFY AUTH & API ---
let spotifyAccessToken = null;
let tokenExpirationTime = 0;
const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/api/token'; 

const getSpotifyToken = async () => {
    const now = Date.now();
    if (spotifyAccessToken && now < tokenExpirationTime) {
        return spotifyAccessToken;
    }
    
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error("Chybí SPOTIFY_CLIENT_ID nebo SECRET v .env souboru!");
    }
    
    const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    try {
        const response = await axios.post(SPOTIFY_AUTH_URL, 
            new URLSearchParams({ grant_type: 'client_credentials' }), 
            {
                headers: {
                    'Authorization': `Basic ${authString}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        
        spotifyAccessToken = response.data.access_token;
        tokenExpirationTime = now + (response.data.expires_in * 1000) - 60000;
        return spotifyAccessToken;
    } catch (error) {
        console.error("Chyba Spotify Auth:", error.message);
        throw new Error("Nepodařilo se přihlásit do Spotify API.");
    }
};

const getSpotifyPlaylistDetails = async (playlistId) => {
    const token = await getSpotifyToken();
    try {
        const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return { name: response.data.name, total: response.data.tracks.total };
    } catch (error) {
        return { name: "Spotify Playlist", total: 0 };
    }
};

const getSpotifyPlaylistTracks = async (playlistId) => {
    const token = await getSpotifyToken();
    let tracks = [];
    let url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`; 

    try {
        while (url) {
            const response = await axios.get(url, { headers: { 'Authorization': `Bearer ${token}` } });
            const items = response.data.items;
            items.forEach(item => {
                if (item.track) {
                    const artist = item.track.artists.map(a => a.name).join(', ');
                    const title = item.track.name;
                    tracks.push({
                        title: `${artist} - ${title}`,
                        url: `ytsearch1:${artist} - ${title} audio`, 
                        type: 'spotify_search'
                    });
                }
            });
            url = response.data.next; 
        }
        return tracks;
    } catch (error) {
        throw new Error("Nepodařilo se načíst seznam skladeb.");
    }
};

const getSpotifyTrack = async (trackId) => {
    const token = await getSpotifyToken();
    const response = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const artist = response.data.artists.map(a => a.name).join(', ');
    const title = response.data.name;
    return [{
        title: `${artist} - ${title}`,
        url: `ytsearch1:${artist} - ${title} audio`,
        type: 'spotify_search'
    }];
};

// --- PARSOVÁNÍ URL ---
const parseSpotifyUrl = (url) => {
    if (!url) return null;
    const regex = /spotify\.com\/(track|playlist|album)\/([a-zA-Z0-9]+)/;
    const match = url.match(regex);
    if (match) return { type: match[1], id: match[2] };
    return null;
};

const getYtDlpMetadata = (url) => {
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

// --- CORE DOWNLOAD LOGIKA ---
const handleYtDlp = (track, format, url, io, destinationPath, downloadId) => {
    return new Promise((resolve, reject) => {
        const outputTemplate = path.join(destinationPath, '%(title)s.%(ext)s');
        
        const args = [
            track.url, 
            '-o', outputTemplate,
            '--progress', '--newline', '--no-warnings',
            '--embed-thumbnail', '--add-metadata' // Přidání artworků
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
                    
                    // Aktualizace stavu v paměti
                    const currentState = activeDownloads.get(downloadId);
                    if (currentState) {
                        currentState.progress = progress;
                        currentState.message = `Stahuji: ${track.title}`;
                        currentState.currentTrackIndex = track.index;
                        activeDownloads.set(downloadId, currentState);
                    }

                    // Odeslání klientovi
                    io.emit('downloadProgress', { 
                        id: downloadId,
                        progress, 
                        message: `Stahuji: ${track.title}`,
                        currentTrackIndex: track.index, 
                        totalTracks: track.total,
                        state: 'downloading'
                    });
                }
            }
        });

        ytDlpProcess.on('close', (code) => resolve(track.title));
    });
};

const handleSequentialDownload = async (tracks, format, url, io, playlistTitle, downloadId) => {
    const baseDestinationPath = format === 'audio' ? DOWNLOAD_PATH_AUDIO : DOWNLOAD_PATH_VIDEO;
    // Sanitizace názvu složky
    const safeFolderName = (playlistTitle || 'Download').replace(/[<>:"/\\|?*]/g, '').trim();
    const destinationPath = path.join(baseDestinationPath, safeFolderName);
    
    fs.mkdirSync(destinationPath, { recursive: true });

    try {
        for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i];
            
            // Inicializace stavu pro aktuální track
            activeDownloads.set(downloadId, {
                id: downloadId, type: 'playlist', title: playlistTitle,
                state: 'downloading', progress: 0,
                message: `Zpracovávám: ${track.title} (${i+1}/${tracks.length})`,
                totalTracks: tracks.length, currentTrackIndex: i+1
            });

            io.emit('downloadProgress', { 
                id: downloadId, state: 'downloading', progress: 0, 
                message: `Zpracovávám: ${track.title}`,
                currentTrackIndex: i+1, totalTracks: tracks.length
            });
            
            await handleYtDlp({ ...track, index: i+1, total: tracks.length }, format, url, io, destinationPath, downloadId);
        }
        
        // Dokončeno
        activeDownloads.delete(downloadId);
        addToHistory({
            id: downloadId, title: playlistTitle, type: 'playlist', format,
            timestamp: new Date(), status: 'success', path: destinationPath
        });
        io.emit('downloadComplete', { id: downloadId, path: destinationPath });

    } catch (error) {
        activeDownloads.delete(downloadId);
        io.emit('downloadError', { id: downloadId, message: error.message });
    }
};

// --- SOCKET IO CONNECTION ---
io.on('connection', (socket) => {
    console.log('Klient připojen:', socket.id);
    // Sync stavu po připojení
    const currentActive = Array.from(activeDownloads.values());
    socket.emit('syncActiveDownloads', currentActive);
    socket.emit('historyUpdate', downloadHistory);
});

// --- ROUTES ---
app.post('/api/metadata', async (req, res) => {
    try {
        const { url } = req.body;
        const parsed = parseSpotifyUrl(url);

        if (parsed) {
            let tracks = [];
            let title = "";
            if (parsed.type === 'playlist') {
                const details = await getSpotifyPlaylistDetails(parsed.id);
                title = details.name;
                tracks = await getSpotifyPlaylistTracks(parsed.id);
            } else if (parsed.type === 'track') {
                tracks = await getSpotifyTrack(parsed.id);
                title = tracks[0].title;
            }
            res.json({ title, totalTracks: tracks.length, isPlaylist: parsed.type === 'playlist', tracks });
        } else {
            const data = await getYtDlpMetadata(url);
            res.json(data);
        }
    } catch (e) {
        console.error(e);
        res.status(400).json({ message: e.message });
    }
});

app.post('/api/download', (req, res) => {
    const { url, format, tracks, playlistTitle } = req.body;
    const downloadId = uuidv4(); // Unikátní ID
    const title = playlistTitle || tracks[0]?.title || "Unknown Download";

    // Záznam do mapy aktivních stahování
    activeDownloads.set(downloadId, {
        id: downloadId, title, state: 'preparing', progress: 0,
        totalTracks: tracks.length, currentTrackIndex: 0
    });

    res.json({ message: 'Started', downloadId });
    
    if (tracks.length > 1) {
        handleSequentialDownload(tracks, format, url, io, playlistTitle, downloadId);
    } else {
        // Single file logic wrapper
        (async () => {
            const dest = format === 'audio' ? DOWNLOAD_PATH_AUDIO : DOWNLOAD_PATH_VIDEO;
            activeDownloads.set(downloadId, { ...activeDownloads.get(downloadId), state: 'downloading' });
            try {
                await handleYtDlp({ ...tracks[0], index: 1, total: 1 }, format, url, io, dest, downloadId);
                activeDownloads.delete(downloadId);
                addToHistory({
                    id: downloadId, title, type: 'single', format,
                    timestamp: new Date(), status: 'success', path: dest
                });
                io.emit('downloadComplete', { id: downloadId, path: dest });
            } catch (e) {
                activeDownloads.delete(downloadId);
                io.emit('downloadError', { id: downloadId, message: e.message });
            }
        })();
    }
});

httpServer.listen(PORT, () => console.log(`Server běží na portu ${PORT}`));
import express from 'express';
import { parseSpotifyUrl, getSpotifyPlaylistDetails, getSpotifyPlaylistTracks, getSpotifyTrack } from './services/spotifyService.js';
import { getYtDlpMetadata } from './services/youtubeService.js';
import { createDownload, getActiveDownloads, getDownloadHistory } from './services/downloadManager.js';

const router = express.Router();

export const setupRoutes = (app, io) => {
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
        const downloadId = createDownload(url, format, tracks, playlistTitle, io);
        res.json({ message: 'Started', downloadId });
    });
};

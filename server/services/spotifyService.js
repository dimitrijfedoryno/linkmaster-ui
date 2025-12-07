import axios from 'axios';
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from '../config/env.js';

let spotifyAccessToken = null;
let tokenExpirationTime = 0;
const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/api/token';

export const getSpotifyToken = async () => {
    const now = Date.now();
    if (spotifyAccessToken && now < tokenExpirationTime) {
        return spotifyAccessToken;
    }

    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
        throw new Error("Chybí SPOTIFY_CLIENT_ID nebo SECRET v .env souboru!");
    }

    const authString = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');

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

export const getSpotifyPlaylistDetails = async (playlistId) => {
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

export const getSpotifyPlaylistTracks = async (playlistId) => {
    const token = await getSpotifyToken();
    let tracks = [];
    let url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`;

    try {
        while (url) {
            const response = await axios.get(url, { headers: { 'Authorization': `Bearer ${token}` } });
            const items = response.data.items;
            items.forEach(item => {
                if (item.track) {
                    const t = item.track;
                    const artist = t.artists.map(a => a.name).join(', ');
                    const title = t.name;
                    const albumName = t.album.name;
                    const albumArt = t.album.images && t.album.images.length > 0 ? t.album.images[0].url : null;
                    const releaseDate = t.album.release_date;
                    const trackNumber = t.track_number;

                    tracks.push({
                        title: `${artist} - ${title}`,
                        originalTitle: title,
                        artist: artist,
                        album: albumName,
                        albumArt: albumArt,
                        releaseDate: releaseDate,
                        trackNumber: trackNumber,
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

export const getSpotifyTrack = async (trackId) => {
    const token = await getSpotifyToken();
    const response = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const t = response.data;
    const artist = t.artists.map(a => a.name).join(', ');
    const title = t.name;
    const albumName = t.album.name;
    const albumArt = t.album.images && t.album.images.length > 0 ? t.album.images[0].url : null;
    const releaseDate = t.album.release_date;
    const trackNumber = t.track_number;

    return [{
        title: `${artist} - ${title}`,
        originalTitle: title,
        artist: artist,
        album: albumName,
        albumArt: albumArt,
        releaseDate: releaseDate,
        trackNumber: trackNumber,
        url: `ytsearch1:${artist} - ${title} audio`,
        type: 'spotify_search'
    }];
};

export const parseSpotifyUrl = (url) => {
    if (!url) return null;
    const regex = /spotify\.com\/(track|playlist|album)\/([a-zA-Z0-9]+)/;
    const match = url.match(regex);
    if (match) return { type: match[1], id: match[2] };
    return null;
};

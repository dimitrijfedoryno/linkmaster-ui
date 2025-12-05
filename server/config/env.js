import 'dotenv/config';
import path from 'path';

const BASE_DIR = process.cwd();

export const DOWNLOAD_PATH_VIDEO = process.env.DOWNLOAD_PATH_VIDEO || path.join(BASE_DIR, 'downloads', 'videos');
export const DOWNLOAD_PATH_AUDIO = process.env.DOWNLOAD_PATH_AUDIO || path.join(BASE_DIR, 'downloads', 'music');
export const PORT = process.env.PORT || 5000;
export const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
export const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// TATO ČÁST JE NOVÁ - POVOLÍ ADRESY Z PORTAINERU
export const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : ["http://localhost:8080", "http://localhost:5173"];
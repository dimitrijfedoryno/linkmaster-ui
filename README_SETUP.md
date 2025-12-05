# Setup Instructions

## 1. Environment Configuration

The application uses a `.env` file in the `server/` directory to configure download paths and API keys.

I have already created `server/.env` with your requested paths:

```env
DOWNLOAD_PATH_VIDEO=/srv/dev-disk-by-uuid-1cfc3f1a-e64c-4b80-8151-d8f58a25e10f/Surikata/Multimedia/Videa
DOWNLOAD_PATH_AUDIO=/srv/dev-disk-by-uuid-1cfc3f1a-e64c-4b80-8151-d8f58a25e10f/Surikata/Multimedia/Hudba
```

**Important:** Ensure the Node.js process has write permissions to these directories on your server/NAS.

## 2. Spotify Integration

To enable Spotify support, you must add your Spotify Client ID and Secret to the `server/.env` file:

```env
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
```

## 3. Running the App

1.  **Backend**:
    ```bash
    cd server
    npm install
    node server.js
    ```

2.  **Frontend**:
    ```bash
    cd src
    npm install
    npm run dev
    ```

## 4. Troubleshooting

*   **Download Errors**: If downloads fail immediately, check the server logs. It usually means the server cannot write to the destination folder (permissions or path doesn't exist).
*   **yt-dlp**: Ensure `yt-dlp` is installed on your system (`pip install yt-dlp` or via package manager) and available in the system PATH.

FROM node:20-slim

WORKDIR /app

# Install system dependencies (ffmpeg, python3 for yt-dlp)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp directly from GitHub to get the latest version (pip version can be outdated)
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
RUN chmod a+rx /usr/local/bin/yt-dlp

# Copy package files
COPY package.json package-lock.json ./

# Install Node.js dependencies
RUN npm ci --omit=dev

# Copy server source code
COPY . .

# Ensure config directory exists (if not copied) and downloads
RUN mkdir -p config downloads/music downloads/videos

EXPOSE 5000

CMD ["node", "server.js"]

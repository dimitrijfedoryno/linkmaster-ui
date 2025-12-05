export const getApiUrl = () => {
    // 1. If running in Vite dev mode (via localhost), fallback to localhost:5000 or specific env.
    if (import.meta.env.DEV) {
        return "http://localhost:5000";
    }

    // 2. Production (Docker/Nginx)
    // Attempt to guess the backend URL.
    // If the user set a VITE_API_URL, use it.
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }

    // 3. Fallback: Assume Backend is on the same hostname as Frontend, but port 5000.
    // This is the most common home-server setup.
    return `${window.location.protocol}//${window.location.hostname}:5000`;
};

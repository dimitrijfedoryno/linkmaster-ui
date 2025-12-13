import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';

export interface ActiveDownload {
  id: string;
  state: string;
  title: string;
  progress: number;
  totalTracks: number;
  currentTrackIndex: number;
  message?: string;
  destinationPath?: string;
}

export interface HistoryItem {
  id: string;
  title: string;
  path: string;
  timestamp: string;
}

const getUserId = () => {
    let userId = localStorage.getItem("app_user_id");
    if (!userId) {
        userId = uuidv4();
        localStorage.setItem("app_user_id", userId);
    }
    return userId;
};

export const useSocket = (serverUrl: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [downloads, setDownloads] = useState<ActiveDownload[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [userId] = useState(getUserId());

  useEffect(() => {
    const newSocket = io(serverUrl, {
        query: { userId }
    });
    setSocket(newSocket);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    newSocket.on("syncActiveDownloads", (activeItems: any[]) => {
       // eslint-disable-next-line @typescript-eslint/no-explicit-any
       const mapped = activeItems.map((item: any) => ({
           id: item.id,
           state: item.state || 'downloading',
           title: item.title,
           progress: item.progress || 0,
           totalTracks: item.totalTracks || 0,
           currentTrackIndex: item.currentTrackIndex || 0,
           message: item.message
       }));
       setDownloads(mapped);
    });

    newSocket.on("historyUpdate", (data) => {
      setHistory(data);
    });

    newSocket.on("downloadProgress", (data) => {
      setDownloads(prev => {
        const existing = prev.find(d => d.id === data.id);

        // Fix: If download is already in 'error' state (e.g. cancelled), ignore progress updates
        // This prevents race conditions where a late progress event reverts the 'error' state
        if (existing && existing.state === 'error') {
            return prev;
        }

        if (!existing) {
           return [...prev, {
             id: data.id,
             state: data.state || 'downloading',
             title: data.message ? data.message.replace('Stahuji: ', '') : 'Stahování...',
             progress: data.progress,
             totalTracks: data.totalTracks,
             currentTrackIndex: data.currentTrackIndex,
             message: data.message
           }];
        }
        return prev.map(d => d.id === data.id ? { ...d, ...data } : d);
      });
    });

    newSocket.on("downloadComplete", (data) => {
      setDownloads(prev => prev.filter(d => d.id !== data.id));
      toast.success("Hotovo!", {
        description: `Uloženo do: ${data.path}`,
      });
    });

    newSocket.on("downloadError", (data) => {
       // When error (or cancellation) happens, update state to 'error' and set message
       setDownloads(prev => prev.map(d => d.id === data.id ? { ...d, state: 'error', message: data.message } : d));
       toast.error("Chyba při stahování", {
           description: data.message
       });
    });

    return () => { newSocket.disconnect(); };
  }, [serverUrl, userId]);

  return { socket, downloads, history, userId };
};

import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

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

export const useSocket = (serverUrl: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [downloads, setDownloads] = useState<ActiveDownload[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const newSocket = io(serverUrl);
    setSocket(newSocket);

    newSocket.on("syncActiveDownloads", (activeItems: any[]) => {
       const mapped = activeItems.map(item => ({
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
        const exists = prev.find(d => d.id === data.id);
        if (!exists) {
           return [...prev, {
             id: data.id,
             state: data.state || 'downloading',
             title: data.message.replace('Stahuji: ', '') || 'Stahování...',
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
       setDownloads(prev => prev.map(d => d.id === data.id ? { ...d, state: 'error', message: data.message } : d));
       toast.error("Chyba při stahování", {
           description: data.message
       });
    });

    return () => { newSocket.disconnect(); };
  }, [serverUrl]);

  return { socket, downloads, history };
};

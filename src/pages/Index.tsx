import { useState, useEffect } from "react";
import DownloadInput from "@/components/DownloadInput";
import DownloadStatus, { DownloadState } from "@/components/DownloadStatus";
import RecentHistory from "@/components/RecentHistory"; 
import FormatSelector from "@/components/FormatSelector";
import { useToast } from "@/hooks/use-toast";
import { io } from "socket.io-client";
import axios from "axios";
import { Youtube, Music2, Share2, Instagram } from "lucide-react"; // Import ikonek pro patičku

// Definice typu pro aktivní stahování
interface ActiveDownload {
  id: string;
  state: DownloadState;
  title: string;
  progress: number;
  totalTracks: number;
  currentTrackIndex: number;
  message?: string;
  destinationPath?: string;
}

const Index = () => {
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState<"video" | "audio">("audio");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Seznamy pro data ze serveru
  const [downloads, setDownloads] = useState<ActiveDownload[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  
  const { toast } = useToast();

  // Socket logic
  useEffect(() => {
    const socket = io("http://localhost:5000");

    // 1. SYNC: Načtení stavu při připojení
    socket.on("syncActiveDownloads", (activeItems: any[]) => {
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

    // 2. Update historie
    socket.on("historyUpdate", (data) => {
      setHistory(data);
    });

    // 3. Progress update (přidání nebo aktualizace stahování)
    socket.on("downloadProgress", (data) => {
      setDownloads(prev => {
        const exists = prev.find(d => d.id === data.id);
        if (!exists) {
           // Pokud stahování není v seznamu (začalo na jiném PC), přidáme ho
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
        // Aktualizace existujícího
        return prev.map(d => d.id === data.id ? { ...d, ...data } : d);
      });
    });

    // 4. Dokončeno
    socket.on("downloadComplete", (data) => {
      setDownloads(prev => prev.filter(d => d.id !== data.id)); // Odstranit z aktivních
      toast({
        title: "Hotovo!",
        description: `Uloženo do: ${data.path}`,
        duration: 5000,
      });
    });

    // 5. Chyba
    socket.on("downloadError", (data) => {
       setDownloads(prev => prev.map(d => d.id === data.id ? { ...d, state: 'error', message: data.message } : d));
    });

    return () => { socket.disconnect(); };
  }, [toast]);

  const handleDownload = async () => {
    if (!url) {
      toast({ title: "Chyba", description: "Zadejte prosím URL.", variant: "destructive" });
      return;
    }

    setIsAnalyzing(true);
    try {
      // Metadata check
      const metaRes = await axios.post("http://localhost:5000/api/metadata", { url });
      const metadata = metaRes.data;

      // Start download
      await axios.post("http://localhost:5000/api/download", {
        url,
        format,
        tracks: metadata.tracks,
        playlistTitle: metadata.title
      });

      toast({ title: "Stahování zahájeno", description: `Přidáno do fronty: ${metadata.title}` });
      setUrl(""); // Vyčistit input
      
    } catch (error: any) {
      toast({
        title: "Chyba",
        description: error.response?.data?.message || "Něco se pokazilo.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-8 transition-all duration-500">
      <div className="w-full max-w-3xl space-y-8 animate-fade-up">
        
        {/* Header */}
        <div className="text-center space-y-2 mb-12">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-secondary animate-gradient-x">
            Media Downloader
          </h1>
          <p className="text-muted-foreground text-lg sm:text-xl">
            Stahujte obsah z YouTube, Spotify, TikTok a Instagramu přímo do vašeho NAS
          </p>
        </div>

        {/* Main Box */}
        <div className="glass p-6 sm:p-8 rounded-2xl border border-glass-border shadow-2xl shadow-black/50">
          <div className="flex flex-col gap-6">
            <div className="flex justify-end">
              <FormatSelector value={format} onChange={setFormat} />
            </div>
            
            <DownloadInput
              value={url}
              onChange={setUrl}
              onPlatformDetect={() => {}}
              onDownloadClick={handleDownload}
              isLoading={isAnalyzing}
            />

            {/* ACTIVE DOWNLOADS LIST */}
            <div className="space-y-4 mt-4">
               {downloads.map((dl) => (
                 <div key={dl.id} className="border-t border-white/10 pt-4">
                    <DownloadStatus
                      state={dl.state}
                      progress={dl.progress}
                      currentTrackIndex={dl.currentTrackIndex}
                      totalTracks={dl.totalTracks}
                      mediaTitle={dl.title}
                      customMessage={dl.message}
                      destinationPath={dl.destinationPath}
                    />
                 </div>
               ))}
            </div>

            {/* HISTORY SECTION */}
            <RecentHistory history={history} />

          </div>
        </div>

        {/* Footer Logos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 opacity-60">
            <div className="flex flex-col items-center gap-2">
                <Youtube className="w-8 h-8 text-red-500" />
                <span className="text-xs font-medium text-muted-foreground">YouTube</span>
            </div>
            <div className="flex flex-col items-center gap-2">
                <Music2 className="w-8 h-8 text-green-500" />
                <span className="text-xs font-medium text-muted-foreground">Spotify</span>
            </div>
             <div className="flex flex-col items-center gap-2">
                <Share2 className="w-8 h-8 text-pink-500" />
                <span className="text-xs font-medium text-muted-foreground">TikTok</span>
            </div>
             <div className="flex flex-col items-center gap-2">
                <Instagram className="w-8 h-8 text-purple-500" />
                <span className="text-xs font-medium text-muted-foreground">Instagram</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
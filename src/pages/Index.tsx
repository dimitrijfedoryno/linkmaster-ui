import { useState } from "react";
import DownloadInput from "@/components/DownloadInput";
import DownloadStatus from "@/components/DownloadStatus";
import RecentHistory from "@/components/RecentHistory"; 
import FormatSelector from "@/components/FormatSelector";
import { Header, Footer } from "@/components/layout/PageLayout";
import { useSocket } from "@/hooks/useSocket";
import { getApiUrl } from "@/config";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";

type Platform = "youtube" | "spotify" | "tiktok" | "instagram" | null;

const Index = () => {
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState<"video" | "audio">("audio");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [platform, setPlatform] = useState<Platform>(null);
  
  const API_URL = getApiUrl();
  const { downloads, history } = useSocket(API_URL);

  const handleDownload = async () => {
    if (!url) {
      toast.error("Chyba", { description: "Zadejte prosím URL." });
      return;
    }

    setIsAnalyzing(true);
    try {
      // Metadata check
      const metaRes = await axios.post(`${API_URL}/api/metadata`, { url });
      const metadata = metaRes.data;

      // Start download
      await axios.post(`${API_URL}/api/download`, {
        url,
        format,
        tracks: metadata.tracks,
        playlistTitle: metadata.title
      });

      toast.success("Stahování zahájeno", { description: `Přidáno do fronty: ${metadata.title}` });
      setUrl(""); // Vyčistit input
      
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      toast.error("Chyba", {
        description: err.response?.data?.message || "Něco se pokazilo.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePlatformDetect = (detectedPlatform: Platform) => {
    setPlatform(detectedPlatform);
    if (detectedPlatform === "spotify") {
      setFormat("audio");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-8 pt-36 transition-all duration-500">
      <div className="w-full max-w-3xl space-y-8 animate-fade-up">
        
        <Header />

        {/* Main Box */}
        <div className="glass p-4 sm:p-8 rounded-2xl border border-glass-border shadow-2xl shadow-black/50">
          <div className="flex flex-col gap-6">
            <div className="flex justify-center sm:justify-end">
              <FormatSelector
                value={format}
                onChange={setFormat}
                videoDisabled={platform === "spotify"}
              />
            </div>
            
            <DownloadInput
              value={url}
              onChange={setUrl}
              onPlatformDetect={handlePlatformDetect}
              onDownloadClick={handleDownload}
              isLoading={isAnalyzing}
            />

            {/* ACTIVE DOWNLOADS LIST */}
            <div className="space-y-4 mt-4">
               {downloads.map((dl) => (
                 <div key={dl.id} className="border-t border-white/10 pt-4">
                    <DownloadStatus
                      state={dl.state as "downloading" | "completed" | "error" | "converting"}
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

            <RecentHistory history={history} />

          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default Index;
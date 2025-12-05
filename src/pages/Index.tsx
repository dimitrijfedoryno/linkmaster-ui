import { useState } from "react";
import DownloadInput from "@/components/DownloadInput";
import DownloadStatus from "@/components/DownloadStatus";
import RecentHistory from "@/components/RecentHistory"; 
import FormatSelector from "@/components/FormatSelector";
import { Header, Footer } from "@/components/layout/PageLayout";
import { useSocket } from "@/hooks/useSocket";
import axios from "axios";
import { toast } from "sonner";

const Index = () => {
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState<"video" | "audio">("audio");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const { downloads, history } = useSocket("http://localhost:5000");

  const handleDownload = async () => {
    if (!url) {
      toast.error("Chyba", { description: "Zadejte prosím URL." });
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

      toast.success("Stahování zahájeno", { description: `Přidáno do fronty: ${metadata.title}` });
      setUrl(""); // Vyčistit input
      
    } catch (error: any) {
      toast.error("Chyba", {
        description: error.response?.data?.message || "Něco se pokazilo.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-8 transition-all duration-500">
      <div className="w-full max-w-3xl space-y-8 animate-fade-up">
        
        <Header />

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
                      state={dl.state as any}
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
import { useState, useCallback } from "react";
import DownloadInput from "@/components/DownloadInput";
import DownloadStatus, { DownloadState } from "@/components/DownloadStatus";
import { Download } from "lucide-react";

type Platform = "youtube" | "spotify" | "tiktok" | "instagram" | null;

const Index = () => {
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState<Platform>(null);
  const [downloadState, setDownloadState] = useState<DownloadState>("idle");
  const [progress, setProgress] = useState(0);
  const [destinationPath, setDestinationPath] = useState("");

  const handlePlatformDetect = useCallback((detectedPlatform: Platform) => {
    setPlatform(detectedPlatform);
    
    // Simulace stahování při detekci platformy
    if (detectedPlatform && url) {
      simulateDownload();
    } else {
      setDownloadState("idle");
      setProgress(0);
      setDestinationPath("");
    }
  }, [url]);

  const simulateDownload = () => {
    setDownloadState("analyzing");
    setProgress(0);
    
    setTimeout(() => {
      setDownloadState("preparing");
    }, 1000);

    setTimeout(() => {
      setDownloadState("downloading");
      
      // Simulace progressu
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += Math.random() * 15;
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(interval);
          setProgress(100);
          
          setTimeout(() => {
            setDownloadState("complete");
            setDestinationPath("/nas/downloads/media/");
          }, 500);
        } else {
          setProgress(Math.floor(currentProgress));
        }
      }, 300);
    }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "2s" }} />
      </div>

      <div className="w-full max-w-3xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center glass">
              <Download className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
            Media Downloader
          </h1>
          <p className="text-muted-foreground text-lg">
            Stahujte obsah z YouTube, Spotify, TikTok a Instagramu přímo do vašeho NAS
          </p>
        </div>

        {/* Main download card */}
        <div className="glass rounded-2xl p-8 space-y-6 border border-glass-border/30 backdrop-blur-xl animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <DownloadInput
            value={url}
            onChange={setUrl}
            onPlatformDetect={handlePlatformDetect}
          />

          <div className="pt-4 border-t border-glass-border/30">
            <DownloadStatus
              state={downloadState}
              progress={progress}
              destinationPath={destinationPath}
            />
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          {[
            { name: "YouTube", color: "youtube", supported: true },
            { name: "Spotify", color: "spotify", supported: true },
            { name: "TikTok", color: "tiktok", supported: true },
            { name: "Instagram", color: "instagram", supported: true },
          ].map((item) => (
            <div
              key={item.name}
              className="glass rounded-xl p-4 text-center border border-glass-border/20 glass-hover"
            >
              <div className={`text-sm font-medium text-${item.color}`}>
                {item.name}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {item.supported ? "Podporováno" : "Připravujeme"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;

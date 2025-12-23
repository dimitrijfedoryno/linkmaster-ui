import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import PlatformLogo from "./PlatformLogo";
import { Button } from "@/components/ui/button"; 
import { Loader2 } from "lucide-react"; 
import { cn } from "@/lib/utils";

type Platform = "youtube" | "spotify" | "soundcloud" | "tiktok" | "instagram" | null;

interface DownloadInputProps {
  value: string;
  onChange: (value: string) => void;
  onPlatformDetect: (platform: Platform) => void; 
  onDownloadClick: () => void;
  isLoading: boolean;
}

const DownloadInput = ({ value, onChange, onPlatformDetect, onDownloadClick, isLoading }: DownloadInputProps) => {
  const [platform, setPlatform] = useState<Platform>(null);

  useEffect(() => {
    const detectPlatform = (url: string): Platform => {
      if (!url) return null;
      
      const lowerUrl = url.toLowerCase();
      
      if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
        return "youtube";
      }
      // OPRAVA: Správná detekce Spotify
      if (lowerUrl.includes("spotify.com")) {
        return "spotify";
      }
      if (lowerUrl.includes("soundcloud.com") || lowerUrl.includes("on.soundcloud.com")) {
        return "soundcloud";
      }
      if (lowerUrl.includes("tiktok.com")) {
        return "tiktok";
      }
      if (lowerUrl.includes("instagram.com")) {
        return "instagram";
      }
      
      return null;
    };

    const detectedPlatform = detectPlatform(value);
    setPlatform(detectedPlatform);
    onPlatformDetect(detectedPlatform); 
    
  }, [value, onPlatformDetect]);

  return (
    <div className="relative w-full">
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex flex-1 w-full items-center gap-3">
          {platform && (
            <PlatformLogo platform={platform} className="w-8 h-8 flex-shrink-0" />
          )}
          <Input
            type="url"
            placeholder="Vložte odkaz (YouTube, Spotify, SoundCloud...)"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
              "flex-1 h-14 px-6 text-base glass glass-hover",
              platform && `border-${platform}`
            )}
          />
        </div>
        <Button
          onClick={onDownloadClick}
          disabled={!platform || isLoading || value.trim() === ""}
          className="w-full sm:w-auto h-14 px-8 text-base font-bold transition-all duration-300 transform hover:scale-[1.02]"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Stáhnout"}
        </Button>
      </div>
    </div>
  );
};

export default DownloadInput;
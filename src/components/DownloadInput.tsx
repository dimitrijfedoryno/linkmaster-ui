import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import PlatformLogo from "./PlatformLogo";
import { cn } from "@/lib/utils";

type Platform = "youtube" | "spotify" | "tiktok" | "instagram" | null;

interface DownloadInputProps {
  value: string;
  onChange: (value: string) => void;
  onPlatformDetect: (platform: Platform) => void;
}

const DownloadInput = ({ value, onChange, onPlatformDetect }: DownloadInputProps) => {
  const [platform, setPlatform] = useState<Platform>(null);

  useEffect(() => {
    const detectPlatform = (url: string): Platform => {
      if (!url) return null;
      
      const lowerUrl = url.toLowerCase();
      
      if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
        return "youtube";
      }
      if (lowerUrl.includes("spotify.com")) {
        return "spotify";
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
      <div className="flex items-center gap-3">
        {platform && (
          <PlatformLogo platform={platform} />
        )}
        <Input
          type="url"
          placeholder="Vložte odkaz (YouTube, Spotify, TikTok, Instagram)..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "flex-1 h-14 px-6 text-base glass glass-hover",
            "border-glass-border/30 focus:border-primary/50",
            "placeholder:text-muted-foreground/50",
            "transition-all duration-300"
          )}
        />
      </div>
    </div>
  );
};

export default DownloadInput;

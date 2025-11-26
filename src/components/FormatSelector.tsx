import { cn } from "@/lib/utils";
import { Music, Video } from "lucide-react";

interface FormatSelectorProps {
  value: "video" | "audio";
  onChange: (value: "video" | "audio") => void;
}

const FormatSelector = ({ value, onChange }: FormatSelectorProps) => {
  return (
    <div className="flex p-1 bg-black/20 rounded-lg backdrop-blur-sm border border-white/10 w-fit">
      <button
        onClick={() => onChange("video")}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-300",
          value === "video"
            ? "bg-primary text-primary-foreground shadow-lg scale-105"
            : "text-muted-foreground hover:text-white hover:bg-white/5"
        )}
      >
        <Video className="w-4 h-4" />
        Video (.mp4)
      </button>
      <button
        onClick={() => onChange("audio")}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-300",
          value === "audio"
            ? "bg-primary text-primary-foreground shadow-lg scale-105"
            : "text-muted-foreground hover:text-white hover:bg-white/5"
        )}
      >
        <Music className="w-4 h-4" />
        Audio (.mp3)
      </button>
    </div>
  );
};

export default FormatSelector;
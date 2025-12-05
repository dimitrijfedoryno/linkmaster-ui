import { cn } from "@/lib/utils";
import { Music, Video } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FormatSelectorProps {
  value: "video" | "audio";
  onChange: (value: "video" | "audio") => void;
  videoDisabled?: boolean;
}

const FormatSelector = ({ value, onChange, videoDisabled = false }: FormatSelectorProps) => {
  const VideoButton = (
    <button
      onClick={() => !videoDisabled && onChange("video")}
      disabled={videoDisabled}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-300",
        value === "video"
          ? "bg-primary text-primary-foreground shadow-lg scale-105"
          : "text-muted-foreground hover:text-white hover:bg-white/5",
        videoDisabled && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground"
      )}
    >
      <Video className="w-4 h-4" />
      Video (.mp4)
    </button>
  );

  return (
    <div className="flex p-1 bg-black/20 rounded-lg backdrop-blur-sm border border-white/10 w-fit">
      {videoDisabled ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-not-allowed" tabIndex={0}>
              {VideoButton}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Video is not supported for Spotify tracks</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        VideoButton
      )}

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
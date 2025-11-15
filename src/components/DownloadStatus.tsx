import { cn } from "@/lib/utils";
import { Loader2, CheckCircle2, Folder } from "lucide-react";

export type DownloadState = "idle" | "analyzing" | "preparing" | "downloading" | "complete";

interface DownloadStatusProps {
  state: DownloadState;
  progress?: number;
  destinationPath?: string;
}

const DownloadStatus = ({ state, progress = 0, destinationPath }: DownloadStatusProps) => {
  const statusMessages: Record<DownloadState, string> = {
    idle: "Čekám na odkaz...",
    analyzing: "Analyzuji odkaz...",
    preparing: "Připravuji ke stažení...",
    downloading: `Stahuji... ${progress}%`,
    complete: "Stažení dokončeno!",
  };

  const statusIcons: Record<DownloadState, JSX.Element> = {
    idle: <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse-glow" />,
    analyzing: <Loader2 className="w-4 h-4 animate-spin text-primary" />,
    preparing: <Loader2 className="w-4 h-4 animate-spin text-secondary" />,
    downloading: <Loader2 className="w-4 h-4 animate-spin text-accent" />,
    complete: <CheckCircle2 className="w-4 h-4 text-spotify" />,
  };

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center gap-3">
        {statusIcons[state]}
        <span className={cn(
          "text-sm transition-colors duration-300",
          state === "complete" ? "text-spotify font-medium" : "text-muted-foreground"
        )}>
          {statusMessages[state]}
        </span>
      </div>

      {state === "downloading" && (
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {state === "complete" && destinationPath && (
        <div className="flex items-center gap-2 p-3 glass rounded-lg border border-glass-border/30">
          <Folder className="w-4 h-4 text-secondary shrink-0" />
          <span className="text-xs text-muted-foreground truncate">
            {destinationPath}
          </span>
        </div>
      )}
    </div>
  );
};

export default DownloadStatus;

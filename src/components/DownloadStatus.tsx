import { cn } from "@/lib/utils";
import { Loader2, CheckCircle2, Folder, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export type DownloadState = "idle" | "analyzing" | "preparing" | "downloading" | "complete" | "error"; 

interface DownloadStatusProps {
  state: DownloadState;
  progress?: number;
  destinationPath?: string;
  customMessage?: string;
  currentTrackIndex?: number;
  totalTracks?: number;
  mediaTitle?: string;
  onCancel?: () => void;
}

const DownloadStatus = ({ 
    state, 
    progress = 0, 
    destinationPath, 
    customMessage,
    currentTrackIndex = 0,
    totalTracks = 0,
    mediaTitle,
    onCancel,
}: DownloadStatusProps) => {
  
  const getDynamicMessage = (currentState: DownloadState): string => {
      if (customMessage) return customMessage;
      
      switch (currentState) {
          case "idle": return "Čekám na odkaz...";
          case "analyzing": return "Analyzuji odkaz a získávám metadata...";
          case "preparing": return "Data připravena. Spouštím stahování...";
          case "downloading":
              if (totalTracks > 1) {
                  return `Stahuji: Track ${currentTrackIndex} z ${totalTracks}. Progress: ${progress.toFixed(1)}%`;
              }
              return `Stahuji ${mediaTitle ? `"${mediaTitle}"` : 'video'}. Progress: ${progress.toFixed(1)}%`;
          case "complete": return "Stažení dokončeno!";
          case "error": return "Stažení selhalo!";
          default: return "Neznámý stav...";
      }
  };

  const statusIcons: Record<DownloadState, JSX.Element> = {
    idle: <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse-glow" />,
    analyzing: <Loader2 className="w-4 h-4 animate-spin text-primary" />,
    preparing: <Loader2 className="w-4 h-4 animate-spin text-secondary" />,
    downloading: <Loader2 className="w-4 h-4 animate-spin text-accent" />,
    complete: <CheckCircle2 className="w-4 h-4 text-green-500" />,
    error: <XCircle className="w-4 h-4 text-red-500" />,
  };
  
  const currentMessage = getDynamicMessage(state);

  return (
    <div className="space-y-3 animate-fade-in relative">
      <div className="flex items-center gap-3">
        {statusIcons[state]}
        <span className={cn(
          "text-sm transition-colors duration-300",
          state === "complete" && "text-green-500 font-medium",
          state === "error" ? "text-red-500 font-medium" : "text-muted-foreground"
        )}>
          {currentMessage}
        </span>
      </div>

      {(state === "downloading" || state === "analyzing" || state === "preparing") && (
        <>
            {totalTracks > 1 && (
                <div className="text-xs text-muted-foreground/80">
                    {mediaTitle && <p className="mb-1 font-medium truncate">{mediaTitle}</p>}
                    {currentTrackIndex > 0 && totalTracks > 0 && (
                        <p className="text-xs opacity-75">Položka {currentTrackIndex} / {totalTracks}</p>
                    )}
                </div>
            )}
            
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {onCancel && (
                <Button
                    variant="destructive"
                    size="lg"
                    className="w-full mt-2 font-bold uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-500/20 transition-all duration-300"
                    onClick={onCancel}
                >
                    Zrušit stahování
                </Button>
            )}
        </>
      )}

      {state === "complete" && destinationPath && (
        <div className="flex items-center gap-2 p-3 glass rounded-lg border border-white/10 bg-black/20">
          <Folder className="w-4 h-4 text-green-500 flex-shrink-0" />
          <span className="text-xs text-muted-foreground/80 truncate block w-full">
            Uloženo: {destinationPath}
          </span>
        </div>
      )}
      
      {state === "error" && customMessage && (
        <div className="p-3 glass rounded-lg border border-red-500/30 bg-red-500/5">
          <span className="text-xs text-red-400 font-medium break-all">
            {customMessage}
          </span>
        </div>
      )}
    </div>
  );
};

export default DownloadStatus;
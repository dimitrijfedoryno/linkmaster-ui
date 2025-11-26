import { Clock, CheckCircle2, Music, Video } from "lucide-react";
import { cn } from "@/lib/utils";

interface HistoryItem {
  id: string;
  title: string;
  type: 'playlist' | 'single';
  format: 'audio' | 'video';
  timestamp: string;
  status: 'success' | 'error';
  path: string;
}

interface RecentHistoryProps {
  history: HistoryItem[];
}

const RecentHistory = ({ history }: RecentHistoryProps) => {
  if (!history || history.length === 0) return null;

  return (
    <div className="w-full mt-8 animate-fade-in">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-primary" />
        Nedávná historie
      </h3>
      
      <div className="grid gap-2">
        {history.map((item) => (
          <div 
            key={item.id}
            className="group flex items-center justify-between p-3 rounded-lg glass border border-white/5 bg-black/20 hover:bg-white/5 transition-all duration-300"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className={cn(
                "p-2 rounded-full",
                item.format === 'audio' ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"
              )}>
                {item.format === 'audio' ? <Music className="w-4 h-4" /> : <Video className="w-4 h-4" />}
              </div>
              
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium text-gray-200 truncate max-w-[200px] sm:max-w-[300px]">
                  {item.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })} • {item.type === 'playlist' ? 'Playlist' : 'Single'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
               <span className="text-xs text-muted-foreground hidden sm:block truncate max-w-[150px] opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.path}
               </span>
               <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentHistory;
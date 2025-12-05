import { Header, Footer } from "@/components/layout/PageLayout";
import RecentHistory from "@/components/RecentHistory";
import { useSocket } from "@/hooks/useSocket";
import { getApiUrl } from "@/config";
import { History as HistoryIcon } from "lucide-react";

const History = () => {
  const API_URL = getApiUrl();
  const { history } = useSocket(API_URL);

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-8 pt-36 transition-all duration-500">
      <div className="w-full max-w-3xl space-y-8 animate-fade-up">

        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Historie
          </h1>
          <p className="text-muted-foreground text-lg">
            Přehled všech stažených souborů
          </p>
        </div>

        {/* Reuse the existing RecentHistory component but in a full page context */}
        <div className="glass p-4 sm:p-8 rounded-2xl border border-glass-border shadow-2xl shadow-black/50">
          <div className="flex items-center gap-2 mb-6 text-primary">
            <HistoryIcon className="w-6 h-6" />
            <h2 className="text-xl font-semibold">Nedávné stahování</h2>
          </div>

          <RecentHistory history={history} />

          {history.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>Zatím žádná historie stahování.</p>
            </div>
          )}
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default History;

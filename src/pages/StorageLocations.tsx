import { useEffect, useState } from "react";
import { Header, Footer } from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HardDrive, FolderOpen, Video, Music } from "lucide-react";
import { getApiUrl } from "@/config";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";

interface StorageConfig {
  videoPath: string;
  audioPath: string;
}

const StorageLocations = () => {
  const [config, setConfig] = useState<StorageConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const API_URL = getApiUrl();
        const res = await axios.get(`${API_URL}/api/config`);
        setConfig(res.data);
      } catch (error) {
        console.error("Failed to fetch storage config", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-8 pt-24 transition-all duration-500">
      <div className="w-full max-w-3xl space-y-8 animate-fade-up">

        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Úložiště
          </h1>
          <p className="text-muted-foreground text-lg">
            Přehled cílových složek pro stahování
          </p>
        </div>

        <div className="grid gap-4">
          <Card className="glass border-glass-border bg-black/20 text-foreground">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg font-medium text-primary">
                <Video className="w-5 h-5" />
                Video soubory
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-6 w-3/4 bg-white/10" />
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-black/40 border border-white/5">
                  <FolderOpen className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <code className="text-sm sm:text-base font-mono break-all text-blue-200">
                    {config?.videoPath || "Neznámá cesta"}
                  </code>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass border-glass-border bg-black/20 text-foreground">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg font-medium text-primary">
                <Music className="w-5 h-5" />
                Audio soubory
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-6 w-3/4 bg-white/10" />
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-black/40 border border-white/5">
                  <FolderOpen className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <code className="text-sm sm:text-base font-mono break-all text-purple-200">
                    {config?.audioPath || "Neznámá cesta"}
                  </code>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-8 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex gap-3">
              <HardDrive className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-yellow-500 mb-1">Informace o NAS</h3>
                <p className="text-sm text-yellow-200/80">
                  Tyto cesty odpovídají struktuře souborů uvnitř kontejneru.
                  Ujistěte se, že máte správně nastavené volume mappingy v Docker/Portainer konfiguraci.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default StorageLocations;

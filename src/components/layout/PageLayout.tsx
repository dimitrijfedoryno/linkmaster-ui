import { Youtube, Music2, Share2, Instagram } from "lucide-react";

export const Header = () => (
  <div className="text-center space-y-2 mb-12">
    <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-secondary animate-gradient-x">
      Media Downloader
    </h1>
    <p className="text-muted-foreground text-lg sm:text-xl">
      Stahujte obsah z YouTube, Spotify, TikTok a Instagramu přímo do vašeho NAS
    </p>
  </div>
);

export const Footer = () => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 opacity-60">
    <div className="flex flex-col items-center gap-2">
      <Youtube className="w-8 h-8 text-red-500" />
      <span className="text-xs font-medium text-muted-foreground">YouTube</span>
    </div>
    <div className="flex flex-col items-center gap-2">
      <Music2 className="w-8 h-8 text-green-500" />
      <span className="text-xs font-medium text-muted-foreground">Spotify</span>
    </div>
    <div className="flex flex-col items-center gap-2">
      <Share2 className="w-8 h-8 text-pink-500" />
      <span className="text-xs font-medium text-muted-foreground">TikTok</span>
    </div>
    <div className="flex flex-col items-center gap-2">
      <Instagram className="w-8 h-8 text-purple-500" />
      <span className="text-xs font-medium text-muted-foreground">Instagram</span>
    </div>
  </div>
);

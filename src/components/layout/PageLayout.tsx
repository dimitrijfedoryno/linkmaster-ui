import PlatformLogo from "@/components/PlatformLogo";

export const Header = () => (
  <div className="text-center space-y-2 mb-12">
    <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-secondary animate-gradient-x">
      Media Downloader
    </h1>
    <p className="text-muted-foreground text-lg sm:text-xl">
      Stahujte obsah z YouTube, Spotify, TikTok, Instagramu, SoundCloud, Twitch a Kick přímo do vašeho NAS
    </p>
  </div>
);

const platforms = [
  { id: "youtube", label: "YouTube" },
  { id: "spotify", label: "Spotify" },
  { id: "tiktok", label: "TikTok" },
  { id: "instagram", label: "Instagram" },
  { id: "soundcloud", label: "SoundCloud" },
  { id: "twitch", label: "Twitch" },
  { id: "kick", label: "Kick" },
] as const;

export const Footer = () => (
  <div className="flex flex-wrap justify-center gap-6 pt-8 opacity-60 max-w-4xl mx-auto">
    {platforms.map((p) => (
      <div key={p.id} className="flex flex-col items-center gap-2 min-w-[80px]">
        <PlatformLogo platform={p.id} className="w-8 h-8" />
        <span className="text-xs font-medium text-muted-foreground">{p.label}</span>
      </div>
    ))}
  </div>
);

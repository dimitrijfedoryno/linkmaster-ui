import { Link, useLocation } from "react-router-dom";
import { HardDrive, History, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import NotificationBell from "@/components/ui/NotificationBell";

const Navbar = () => {
  const location = useLocation();

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
    <Link to={to}>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "gap-2 px-3",
          location.pathname === to ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
        )}
      >
        <Icon className="w-4 h-4" />
        <span className="hidden xs:inline text-sm font-medium">{label}</span>
      </Button>
    </Link>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl supports-[backdrop-filter]:bg-black/20">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* Navigation Links - Centered/Left aligned depending on preference, but here we span them */}
        <div className="flex items-center gap-1 sm:gap-2 mx-auto sm:mx-0">
          <NavItem to="/" icon={Home} label="Domů" />
          <NavItem to="/history" icon={History} label="Historie" />
          <NavItem to="/storage" icon={HardDrive} label="Úložiště" />
        </div>

        {/* Right Side - Notifications */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 sm:static sm:transform-none">
            <NotificationBell />
        </div>

      </div>
    </nav>
  );
};

export default Navbar;

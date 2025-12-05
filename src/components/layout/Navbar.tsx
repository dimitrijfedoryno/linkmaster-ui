import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, HardDrive, History, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const NavItems = () => (
    <>
      <Link to="/" onClick={() => setIsOpen(false)}>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-2",
            location.pathname === "/" && "bg-white/10"
          )}
        >
          <Home className="w-4 h-4" />
          Domů
        </Button>
      </Link>
      <Link to="/history" onClick={() => setIsOpen(false)}>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-2",
            location.pathname === "/history" && "bg-white/10"
          )}
        >
          <History className="w-4 h-4" />
          Historie
        </Button>
      </Link>
      <Link to="/storage" onClick={() => setIsOpen(false)}>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-2",
            location.pathname === "/storage" && "bg-white/10"
          )}
        >
          <HardDrive className="w-4 h-4" />
          Úložiště
        </Button>
      </Link>
    </>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl supports-[backdrop-filter]:bg-black/20">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-center relative">

        {/* Desktop Navigation - Centered */}
        <div className="hidden sm:flex items-center gap-2">
          <NavItems />
        </div>

        {/* Mobile Navigation - Centered */}
        <div className="sm:hidden flex justify-center w-full">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-white/10">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80%] border-l-white/10 bg-black/95 backdrop-blur-xl">
              <div className="flex flex-col gap-4 mt-8">
                <NavItems />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

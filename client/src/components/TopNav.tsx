import { Moon, Sun, Menu, Search, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/providers/ThemeProvider";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface TopNavProps {
  title: string;
  onMenuClick: () => void;
}

export default function TopNav({ title, onMenuClick }: TopNavProps) {
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Used for the initial render to prevent transition flickering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Add scroll detection for shadow effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header 
      className={cn(
        "sticky top-0 z-20 w-full bg-background/90 backdrop-blur-sm",
        "transition-all duration-300",
        isScrolled ? "border-b shadow-sm" : "",
        !mounted ? "duration-0" : "" // No transition on first render
      )}
    >
      <div className={cn(
        "transition-all duration-300 max-w-[1600px] mx-auto",
        isMobile ? "px-3 py-2.5" : "px-4 py-3 md:px-6"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8 hover:bg-black/5 dark:hover:bg-white/5"
              onClick={onMenuClick}
              aria-label="Toggle navigation menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
            
            <h1 className={cn(
              "font-semibold tracking-tight truncate transition-all duration-300",
              isScrolled ? "text-base md:text-lg" : "text-lg md:text-xl",
              "bg-gradient-to-r from-black to-black/80 dark:from-white dark:to-white/80 bg-clip-text text-transparent"
            )}>
              {title}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Search Bar - On tablets and up */}
            {!isMobile && (
              <div className="relative max-w-xs mr-1 group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10 transition-all duration-200 group-focus-within:text-primary">
                  <Search className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <Input
                  type="search" 
                  placeholder="Search..." 
                  className="w-full py-1.5 pl-9 pr-4 text-sm h-9 bg-muted/40 dark:bg-muted/20 border-input/60"
                />
              </div>
            )}
            
            {/* Theme Toggle Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className={cn(
                "transition-all duration-200 relative overflow-hidden bg-muted/40 dark:bg-muted/20 border-input/60", 
                isMobile ? "h-8 w-8" : "h-9 w-9"
              )}
            >
              <Sun className={cn(
                "h-4 w-4 transition-all duration-300 absolute",
                theme === "dark" ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
              )} />
              <Moon className={cn(
                "h-4 w-4 transition-all duration-300 absolute",
                theme === "dark" ? "translate-y-10 opacity-0" : "translate-y-0 opacity-100"
              )} />
            </Button>

            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="More options"
                className="h-8 w-8 hover:bg-black/5 dark:hover:bg-white/5"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

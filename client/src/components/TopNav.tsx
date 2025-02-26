import { Moon, Sun, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/providers/ThemeProvider";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

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
        "sticky top-0 z-20 w-full bg-background",
        "transition-all duration-150",
        isScrolled ? "border-b" : "",
        !mounted ? "duration-0" : "" // No transition on first render
      )}
    >
      <div className={cn(
        "transition-all duration-150",
        isMobile ? "px-3 py-2.5" : "px-4 py-3 md:px-6"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8"
              onClick={onMenuClick}
              aria-label="Toggle navigation menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
            
            <h1 className={cn(
              "font-medium truncate", 
              isMobile ? "text-lg" : "text-xl"
            )}>
              {title}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Search Bar - On tablets and up */}
            {!isMobile && (
              <div className="relative max-w-xs mr-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <input 
                  type="search" 
                  placeholder="Search..." 
                  className="w-full py-1.5 pl-9 pr-4 text-sm bg-muted/50 border border-input rounded-md 
                            focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                "transition-all duration-150", 
                isMobile ? "h-8 w-8" : "h-9 w-9"
              )}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

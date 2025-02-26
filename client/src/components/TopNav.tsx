import { Moon, Sun, HelpCircle, Menu, Search, Bell } from "lucide-react";
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
        "sticky top-0 z-20 w-full bg-background/95 backdrop-blur-sm",
        "transition-all duration-200 ease-in-out",
        isScrolled ? "shadow-sm border-b" : "",
        !mounted ? "duration-0" : "" // No transition on first render
      )}
    >
      <div className={cn(
        "transition-all duration-200 ease-in-out",
        isMobile ? "px-3 py-2.5" : "px-4 py-3 md:px-6"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8 rounded-md hover:bg-primary/10 hover:text-primary transition-all duration-200"
              onClick={onMenuClick}
              aria-label="Toggle navigation menu"
            >
              <Menu className="h-4 w-4 transition-transform duration-200 hover:scale-110" />
            </Button>
            
            <h1 className={cn(
              "font-semibold truncate transition-all", 
              isMobile ? "text-lg" : "text-xl"
            )}>
              {title}
            </h1>
          </div>
          
          <div className="flex items-center gap-1.5 md:gap-3">
            {/* Search Bar - On tablets and up */}
            {!isMobile && (
              <div className="relative max-w-xs mr-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="w-3.5 h-3.5 text-muted-foreground transition-colors duration-200 group-focus-within:text-primary" />
                </div>
                <div className="group">
                  <input 
                    type="search" 
                    placeholder="Search..." 
                    className="w-full py-1.5 pl-9 pr-4 text-sm bg-muted/50 border border-transparent rounded-md 
                             focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary/30 focus-visible:outline-none
                             shadow-sm hover:shadow-md transition-all duration-200"
                  />
                </div>
              </div>
            )}
            
            {/* Notifications Icon */}
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(
                "relative transition-all duration-200 hover:bg-primary/10 hover:text-primary rounded-full", 
                isMobile ? "h-8 w-8" : "h-9 w-9"
              )}
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4 transition-transform duration-200 hover:scale-110" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            </Button>
            
            {/* Help Button - Desktop Only */}
            {!isMobile && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center transition-all duration-200 hover:bg-primary/10 hover:text-primary hover:shadow-md group"
              >
                <HelpCircle className="mr-1.5 h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110" />
                <span className="transition-transform duration-200 group-hover:translate-x-0.5">Help</span>
              </Button>
            )}
            
            {/* Theme Toggle Button */}
            <Button
              variant={isMobile ? "ghost" : "outline"}
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className={cn(
                "transition-all duration-200 hover:bg-primary/10 hover:text-primary rounded-full hover:shadow-md", 
                isMobile ? "h-8 w-8" : "h-9 w-9"
              )}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 transition-transform duration-300 rotate-0 hover:rotate-45" />
              ) : (
                <Moon className="h-4 w-4 transition-all duration-300 hover:scale-110" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

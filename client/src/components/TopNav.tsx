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
      <div className="px-4 py-3 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="mr-1 lg:hidden"
              onClick={onMenuClick}
              aria-label="Toggle navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <h1 className="text-xl font-semibold truncate">{title}</h1>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
            {!isMobile && (
              <div className="relative max-w-xs mr-2">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="w-4 h-4 text-muted-foreground" />
                </div>
                <input 
                  type="search" 
                  placeholder="Search..." 
                  className="w-full py-1.5 pl-10 pr-4 text-sm bg-muted/50 border-0 rounded-md focus:ring-1 focus:ring-primary/30 focus:outline-none"
                />
              </div>
            )}
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1.5 w-2 h-2 bg-primary rounded-full"></span>
            </Button>
            
            {!isMobile && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center transition-all hover:bg-primary/10 hover:text-primary"
              >
                <HelpCircle className="mr-1.5 h-4 w-4" />
                <span>Help</span>
              </Button>
            )}
            
            <Button
              variant={isMobile ? "ghost" : "outline"}
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="transition-all hover:bg-primary/10 hover:text-primary"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

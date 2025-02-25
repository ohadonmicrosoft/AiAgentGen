import { Moon, Sun, HelpCircle, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/providers/ThemeProvider";

interface TopNavProps {
  title: string;
  onMenuClick: () => void;
}

export default function TopNav({ title, onMenuClick }: TopNavProps) {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-10 py-3 bg-background">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="flex items-center">
            <HelpCircle className="mr-1.5 h-4 w-4" />
            <span>Help</span>
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}

import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { 
  Home, 
  Bot, 
  MessageSquare, 
  Settings, 
  LogOut,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: <Home className="mr-3 text-lg" /> },
    { path: "/agents", label: "Agents", icon: <Bot className="mr-3 text-lg" /> },
    { path: "/prompts", label: "Prompts", icon: <MessageSquare className="mr-3 text-lg" /> },
    { path: "/settings", label: "Settings", icon: <Settings className="mr-3 text-lg" /> },
  ];

  return (
    <aside
      className={cn(
        "fixed inset-y-0 z-10 flex flex-col flex-shrink-0 w-64 max-h-screen overflow-hidden transition-all transform bg-background border-r shadow-sm lg:static lg:translate-x-0",
        isMobile && !open ? "-translate-x-full" : "translate-x-0"
      )}
    >
      <div className="flex items-center justify-between flex-shrink-0 p-4">
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
            <Bot className="text-xl text-primary" />
          </div>
          <span className="text-lg font-bold">AI Agent Generator</span>
        </Link>
        
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto">
        <ul className="p-2 space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link href={item.path}>
                <a
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium transition-colors rounded-md",
                    location === item.path 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {item.icon}
                  {item.label}
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex-shrink-0 p-4 border-t">
        <div className="flex items-center">
          <Avatar className="relative flex-shrink-0 w-9 h-9">
            <AvatarImage src="https://github.com/shadcn.png" alt={user?.username || "User"} />
            <AvatarFallback>{user?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
          
          <div className="ml-3">
            <p className="text-sm font-medium">{user?.username || "User"}</p>
            <p className="text-xs text-muted-foreground">{user?.email || "user@example.com"}</p>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="p-1.5 ml-auto rounded-full" 
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}

import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";
import { 
  Home, 
  Bot, 
  MessageSquare, 
  Settings, 
  LogOut,
  X,
  Zap,
  Users
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PERMISSIONS } from "@shared/schema";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  
  // Used for the initial render to prevent transition flickering
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleLinkClick = () => {
    if (isMobile) {
      onClose();
    }
  };

  // Check if user has admin access
  const isAdmin = user?.role === 'admin' || (user?.customPermissions && 
    user.customPermissions.includes(PERMISSIONS.MANAGE_USERS));

  const navItems = [
    { path: "/", label: "Dashboard", icon: <Home className="mr-3 h-5 w-5" /> },
    { path: "/agents", label: "Agents", icon: <Bot className="mr-3 h-5 w-5" /> },
    { path: "/prompts", label: "Prompts", icon: <MessageSquare className="mr-3 h-5 w-5" /> },
    { path: "/settings", label: "Settings", icon: <Settings className="mr-3 h-5 w-5" /> },
  ];
  
  // Admin routes
  const adminItems = [
    { path: "/admin/users", label: "Manage Users", icon: <Users className="mr-3 h-5 w-5" /> },
    { path: "/admin/agents", label: "All Agents", icon: <Zap className="mr-3 h-5 w-5" /> },
  ];

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex flex-col w-64 md:w-72 max-h-screen overflow-hidden bg-background border-r",
        "transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:shadow-none",
        open ? "translate-x-0 shadow-xl" : "-translate-x-full shadow-none",
        !mounted ? "duration-0" : "",  // No transition on first render
        "backdrop-blur-sm bg-background/95"  // Adding glass effect
      )}
    >
      <div className="flex items-center justify-between flex-shrink-0 p-4 border-b">
        <div className="flex items-center space-x-2" onClick={handleLinkClick}>
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold">AI Agent Generator</span>
          </Link>
        </div>
        
        {isMobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="lg:hidden h-8 w-8 rounded-full hover:bg-muted"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto">
        <ul className="p-3 space-y-1.5">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link 
                href={item.path}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center px-3 py-2.5 text-sm font-medium rounded-md",
                  "transition-all duration-200 ease-in-out relative overflow-hidden",
                  location === item.path 
                    ? "bg-primary/10 text-primary font-semibold" 
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground hover:translate-x-1"
                )}
              >
                <span className={cn(
                  "mr-3 h-5 w-5 transition-transform duration-200",
                  location === item.path ? "text-primary" : "group-hover:scale-110"
                )}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
          
          {/* Admin section - only shown to users with admin privileges */}
          {isAdmin && (
            <>
              <li className="pt-2">
                <div className="px-3 py-2">
                  <h2 className="mb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Admin
                  </h2>
                  <div className="h-px bg-border" />
                </div>
              </li>
              {adminItems.map((item) => (
                <li key={item.path}>
                  <Link 
                    href={item.path}
                    onClick={handleLinkClick}
                    className={cn(
                      "flex items-center px-3 py-2.5 text-sm font-medium rounded-md",
                      "transition-all duration-200 ease-in-out relative overflow-hidden",
                      location === item.path 
                        ? "bg-primary/10 text-primary font-semibold" 
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground hover:translate-x-1"
                    )}
                  >
                    <span className={cn(
                      "mr-3 h-5 w-5 transition-transform duration-200",
                      location === item.path ? "text-primary" : "group-hover:scale-110"
                    )}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </>
          )}
        </ul>
      </nav>

      <div className="flex-shrink-0 p-3 sm:p-4 border-t bg-muted/50">
        <div className="flex items-center">
          <Avatar className="relative flex-shrink-0 w-8 h-8 md:w-9 md:h-9 border">
            <AvatarImage 
              src={`https://avatar.vercel.sh/${user?.username || 'user'}`} 
              alt={user?.username || "User"} 
            />
            <AvatarFallback>{user?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
          
          <div className="ml-3 overflow-hidden">
            <p className="text-sm font-medium truncate">
              {user?.username || "User"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "User"}
            </p>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-auto h-8 w-8 rounded-full hover:bg-red-500/10 hover:text-red-500" 
            onClick={handleLogout}
            title="Log out"
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}

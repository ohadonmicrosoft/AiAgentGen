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
        "backdrop-blur-sm bg-background/95 dark:bg-background/90"  // Enhanced glass effect
      )}
    >
      <div className="flex items-center justify-between flex-shrink-0 p-4 border-b border-primary/5">
        <div className="flex items-center space-x-2" onClick={handleLinkClick}>
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shadow-sm 
                          transition-all duration-300 group-hover:bg-primary/15 group-hover:shadow-md">
              <Bot className="h-5 w-5 text-primary transition-transform duration-300 group-hover:scale-110" />
            </div>
            <span className="text-lg font-bold transition-colors duration-300 group-hover:text-primary">AI Agent Generator</span>
          </Link>
        </div>
        
        {isMobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="lg:hidden h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-300"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4 transition-transform duration-200 hover:rotate-90" />
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
                  "flex items-center px-3 py-2.5 text-sm font-medium rounded-md group relative",
                  "transition-all duration-300 ease-in-out overflow-hidden",
                  location === item.path 
                    ? "bg-primary/10 text-primary font-semibold shadow-sm" 
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground hover:shadow-sm"
                )}
              >
                {/* Background animation for active state */}
                {location === item.path && (
                  <span className="absolute inset-0 bg-primary/5 rounded-md opacity-50"></span>
                )}
                
                {/* Left accent bar for active item */}
                <span className={cn(
                  "absolute left-0 top-1/2 h-1/2 w-0.5 -translate-y-1/2 rounded-full bg-primary transition-all duration-300",
                  location === item.path ? "opacity-100" : "opacity-0"
                )} />
                
                <span className={cn(
                  "mr-3 h-5 w-5 transition-all duration-300",
                  location === item.path 
                    ? "text-primary" 
                    : "text-muted-foreground group-hover:text-primary group-hover:scale-110"
                )}>
                  {item.icon}
                </span>
                <span className="transition-transform duration-300 group-hover:translate-x-0.5">{item.label}</span>
              </Link>
            </li>
          ))}
          
          {/* Admin section - only shown to users with admin privileges */}
          {isAdmin && (
            <>
              <li className="pt-2">
                <div className="px-3 py-2">
                  <h2 className="mb-1 text-xs font-semibold tracking-wider text-primary/70 uppercase transition-colors duration-300 hover:text-primary/90">
                    Admin
                  </h2>
                  <div className="h-px bg-gradient-to-r from-primary/20 via-primary/10 to-transparent rounded-full" />
                </div>
              </li>
              {adminItems.map((item) => (
                <li key={item.path}>
                  <Link 
                    href={item.path}
                    onClick={handleLinkClick}
                    className={cn(
                      "flex items-center px-3 py-2.5 text-sm font-medium rounded-md group relative",
                      "transition-all duration-300 ease-in-out overflow-hidden",
                      location === item.path 
                        ? "bg-primary/10 text-primary font-semibold shadow-sm" 
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground hover:shadow-sm"
                    )}
                  >
                    {/* Background animation for active state */}
                    {location === item.path && (
                      <span className="absolute inset-0 bg-primary/5 rounded-md opacity-50"></span>
                    )}
                    
                    {/* Left accent bar for active item */}
                    <span className={cn(
                      "absolute left-0 top-1/2 h-1/2 w-0.5 -translate-y-1/2 rounded-full bg-primary transition-all duration-300",
                      location === item.path ? "opacity-100" : "opacity-0"
                    )} />
                    
                    <span className={cn(
                      "mr-3 h-5 w-5 transition-all duration-300",
                      location === item.path 
                        ? "text-primary" 
                        : "text-muted-foreground group-hover:text-primary group-hover:scale-110"
                    )}>
                      {item.icon}
                    </span>
                    <span className="transition-transform duration-300 group-hover:translate-x-0.5">{item.label}</span>
                  </Link>
                </li>
              ))}
            </>
          )}
        </ul>
      </nav>

      <div className="flex-shrink-0 p-3 sm:p-4 border-t border-primary/5 bg-muted/30 backdrop-blur-sm transition-colors duration-300 hover:bg-muted/40">
        <div className="flex items-center">
          <Avatar className="relative flex-shrink-0 w-8 h-8 md:w-9 md:h-9 border border-primary/10 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/20">
            <AvatarImage 
              src={`https://avatar.vercel.sh/${user?.username || 'user'}`} 
              alt={user?.username || "User"} 
              className="transition-transform duration-500 hover:scale-110"
            />
            <AvatarFallback className="bg-primary/10 text-primary">{user?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
          
          <div className="ml-3 overflow-hidden">
            <p className="text-sm font-medium truncate transition-colors duration-300 hover:text-primary">
              {user?.username || "User"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "User"}
            </p>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-auto h-8 w-8 rounded-full hover:bg-red-500/10 hover:text-red-500 transition-all duration-300 group" 
            onClick={handleLogout}
            title="Log out"
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
          </Button>
        </div>
      </div>
    </aside>
  );
}

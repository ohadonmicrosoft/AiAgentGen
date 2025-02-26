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
    <>
      {/* Backdrop overlay - shown only on mobile when sidebar is open */}
      {isMobile && open && (
        <div 
          className="fixed inset-0 z-20 bg-black/50"
          onClick={onClose}
        />
      )}
      
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex flex-col w-64 max-h-screen overflow-hidden bg-background border-r",
          "transform transition-all duration-150 lg:translate-x-0 lg:static",
          open ? "translate-x-0" : "-translate-x-full",
          !mounted ? "duration-0" : "" // No transition on first render
        )}
      >
        <div className="flex items-center justify-between flex-shrink-0 p-4 border-b">
          <div className="flex items-center" onClick={handleLinkClick}>
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-md border">
                <Bot className="h-4 w-4" />
              </div>
              <span className="text-base font-medium">AI Agent Generator</span>
            </Link>
          </div>
          
          {isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose} 
              className="lg:hidden h-8 w-8"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          <ul className="px-3 space-y-1.5">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link 
                  href={item.path}
                  onClick={handleLinkClick}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                    "transition-colors",
                    location === item.path 
                      ? "bg-muted text-foreground" 
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  {/* Left accent bar for active item */}
                  {location === item.path && (
                    <span className="absolute left-0 top-1/2 h-1/2 w-0.5 -translate-y-1/2 bg-foreground" />
                  )}
                  
                  <span className="mr-3 h-5 w-5">
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            ))}
            
            {/* Admin section - only shown to users with admin privileges */}
            {isAdmin && (
              <>
                <li className="pt-4 pb-1">
                  <div className="px-4 py-2">
                    <h2 className="text-xs font-semibold tracking-wider text-black/50 dark:text-white/50 uppercase">
                      Admin Tools
                    </h2>
                    <div className="h-px mt-1 bg-black/10 dark:bg-white/10" />
                  </div>
                </li>
                {adminItems.map((item) => (
                  <li key={item.path}>
                    <Link 
                      href={item.path}
                      onClick={handleLinkClick}
                      className={cn(
                        "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                        "transition-colors",
                        location === item.path 
                          ? "bg-muted text-foreground" 
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      {/* Left accent bar for active item */}
                      {location === item.path && (
                        <span className="absolute left-0 top-1/2 h-1/2 w-0.5 -translate-y-1/2 bg-foreground" />
                      )}
                      
                      <span className="mr-3 h-5 w-5">
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </>
            )}
          </ul>
        </nav>

        <div className="flex-shrink-0 p-4 border-t border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
          <div className="flex items-center">
            <Avatar className="flex-shrink-0 w-9 h-9 border border-black/10 dark:border-white/10 shadow-sm bg-black/5 dark:bg-white/5">
              <AvatarImage 
                src={`https://avatar.vercel.sh/${user?.username || 'user'}`} 
                alt={user?.username || "User"} 
              />
              <AvatarFallback className="font-medium">{user?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium truncate text-black dark:text-white">
                {user?.username || "User"}
              </p>
              <p className="text-xs text-black/60 dark:text-white/60 truncate">
                {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "User"}
              </p>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-auto h-8 w-8 hover:bg-black/5 dark:hover:bg-white/5 rounded-full" 
              onClick={handleLogout}
              title="Log out"
              aria-label="Log out"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}

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
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex flex-col w-72 max-h-screen overflow-hidden bg-background/95 backdrop-blur-sm border-r",
          "transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static",
          open ? "translate-x-0 shadow-xl" : "-translate-x-full",
          !mounted ? "duration-0" : "" // No transition on first render
        )}
      >
        <div className="flex items-center justify-between flex-shrink-0 px-5 py-4 border-b">
          <div className="flex items-center" onClick={handleLinkClick}>
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="flex items-center justify-center w-9 h-9 rounded-md bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 transition-all duration-300 group-hover:border-black/20 dark:group-hover:border-white/20 shadow-sm">
                <Bot className="h-4 w-4 transition-all duration-300 group-hover:scale-110" />
              </div>
              <span className="text-base font-semibold tracking-tight bg-gradient-to-r from-black to-black/80 dark:from-white dark:to-white/80 bg-clip-text text-transparent group-hover:to-black dark:group-hover:to-white transition-all duration-300">
                AI Agent Generator
              </span>
            </Link>
          </div>
          
          {isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose} 
              className="lg:hidden h-8 w-8 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
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
                    "relative flex items-center px-4 py-2.5 text-sm font-medium rounded-md group",
                    "transition-all duration-300 overflow-hidden",
                    location === item.path 
                      ? "bg-black/[0.03] dark:bg-white/[0.03] text-black dark:text-white shadow-sm" 
                      : "text-black/70 dark:text-white/70 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] hover:text-black dark:hover:text-white",
                    "before:absolute before:content-[''] before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-8 before:w-[3px] before:rounded-r-full before:scale-y-0 before:transition-transform before:duration-300 before:origin-center",
                    location === item.path && "before:bg-primary before:scale-y-100"
                  )}
                >
                  <div className={cn(
                    "mr-3 h-5 w-5 transition-all duration-300",
                    location === item.path ? "text-primary" : "text-black/50 dark:text-white/50 group-hover:text-black dark:group-hover:text-white/80"
                  )}>
                    {item.icon}
                  </div>
                  <span className="transition-all duration-300">{item.label}</span>
                  
                  {/* Subtle hover effect */}
                  <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
                        "relative flex items-center px-4 py-2.5 text-sm font-medium rounded-md group",
                        "transition-all duration-300 overflow-hidden",
                        location === item.path 
                          ? "bg-black/[0.03] dark:bg-white/[0.03] text-black dark:text-white shadow-sm" 
                          : "text-black/70 dark:text-white/70 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] hover:text-black dark:hover:text-white",
                        "before:absolute before:content-[''] before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-8 before:w-[3px] before:rounded-r-full before:scale-y-0 before:transition-transform before:duration-300 before:origin-center",
                        location === item.path && "before:bg-primary before:scale-y-100"
                      )}
                    >
                      <div className={cn(
                        "mr-3 h-5 w-5 transition-all duration-300",
                        location === item.path ? "text-primary" : "text-black/50 dark:text-white/50 group-hover:text-black dark:group-hover:text-white/80"
                      )}>
                        {item.icon}
                      </div>
                      <span className="transition-all duration-300">{item.label}</span>
                      
                      {/* Subtle hover effect */}
                      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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

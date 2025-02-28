import { useLocation, Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Bot,
  MessageSquare,
  Settings,
  LogOut,
  X,
  Zap,
  Users,
  FormInput,
  ChevronRight,
  Palette,
  Layout,
  Move,
  ListFilter,
  ScrollText,
  EyeIcon,
  BarChart2,
  AlertTriangle,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PERMISSIONS } from '@shared/schema';
import { useSidebarState } from '@/hooks/use-sidebar-state';
import { SidebarToggle } from '@/components/ui/sidebar-toggle';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { NavItem } from '@/types';
import { usePreferences } from '@/context/preferences-context';
import { useAuth as useAuthContext } from '@/context/auth-context';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  navItems: NavItem[];
  demoItems: NavItem[];
  adminItems: NavItem[];
}

export default function Sidebar({
  open,
  onClose,
  navItems,
  demoItems,
  adminItems,
}: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const { isCollapsed, setIsHovering } = useSidebarState();
  const prefersReducedMotion = useReducedMotion();

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
  const isAdmin =
    user?.role === 'admin' ||
    (user?.customPermissions &&
      user.customPermissions.includes(PERMISSIONS.MANAGE_USERS));

  const sidebarVariants = {
    expanded: { width: '16rem' }, // 64 = 16rem
    collapsed: { width: '4.5rem' }, // Collapsed state
  };

  const labelVariants = {
    expanded: { opacity: 1, x: 0, display: 'block' },
    collapsed: {
      opacity: 0,
      x: -10,
      transitionEnd: { display: 'none' },
    },
  };

  const iconVariants = {
    expanded: { marginRight: '0.75rem' },
    collapsed: { marginRight: 0 },
  };

  const sectionLabelVariants = {
    expanded: { opacity: 1, height: 'auto', marginBottom: '0.25rem' },
    collapsed: {
      opacity: 0,
      height: 0,
      marginBottom: 0,
      transitionEnd: { display: 'none' },
    },
  };

  const navItemVariants = {
    expanded: {
      paddingLeft: '0.75rem',
      paddingRight: '0.75rem',
      justifyContent: 'flex-start',
    },
    collapsed: {
      paddingLeft: '0.5rem',
      paddingRight: '0.5rem',
      justifyContent: 'center',
    },
  };

  // Animation transition based on reduced motion preference
  const getTransition = () => {
    return prefersReducedMotion
      ? { duration: 0 }
      : { type: 'spring', stiffness: 400, damping: 30 };
  };

  // Renders nav item with appropriate animations
  const renderNavItem = (item: NavItem, index: number, isActive = false) => {
    const itemContent = (
      <motion.div
        className={cn(
          'group relative flex items-center px-3 py-2 rounded-md text-muted-foreground',
          isActive && 'text-foreground font-medium',
          !isActive && 'hover:text-foreground hover:bg-accent/50',
        )}
        variants={navItemVariants}
        whileTap={{ scale: 0.98 }}
        transition={getTransition()}
        role="menuitem"
        aria-current={isActive ? 'page' : undefined}
      >
        {/* Left accent bar for active item */}
        {isActive && (
          <motion.span
            className="absolute left-0 top-1/2 h-1/2 w-0.5 -translate-y-1/2 bg-foreground"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.2 }}
            aria-hidden="true"
          />
        )}

        <motion.span
          variants={iconVariants}
          className={cn('flex-shrink-0', isCollapsed ? 'mx-auto' : 'mr-3')}
          aria-hidden="true"
        >
          {item.icon}
        </motion.span>

        <motion.span
          variants={labelVariants}
          className="fluid-body fluid-leading-snug truncate"
        >
          {item.label}
        </motion.span>

        {/* Indicator for active state */}
        {isActive && isCollapsed && (
          <motion.div
            className="absolute right-2 flex-shrink-0 h-1.5 w-1.5 rounded-full bg-primary"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            aria-hidden="true"
          />
        )}
      </motion.div>
    );

    // When sidebar is collapsed, add tooltips for the nav items
    return isCollapsed ? (
      <TooltipProvider key={item.path} delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={item.path}
              onClick={handleLinkClick}
              className="block"
              aria-label={`Navigate to ${item.label}`}
            >
              {itemContent}
            </Link>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            align="center"
            className="font-medium fluid-small"
          >
            {item.label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ) : (
      <Link
        key={item.path}
        href={item.path}
        onClick={handleLinkClick}
        className="block"
        aria-label={`Navigate to ${item.label}`}
      >
        {itemContent}
      </Link>
    );
  };

  const renderSectionLabel = (title: string) => (
    <motion.div
      className="px-3 py-2"
      initial={false}
      animate={isCollapsed ? 'collapsed' : 'expanded'}
    >
      <motion.h2
        className="mb-1 fluid-small font-semibold tracking-wider text-muted-foreground uppercase"
        variants={sectionLabelVariants}
        id={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        {title}
      </motion.h2>
      <motion.div
        className="h-px bg-border"
        variants={{
          expanded: { opacity: 1 },
          collapsed: { opacity: 0.5 },
        }}
        aria-hidden="true"
      />
    </motion.div>
  );

  return (
    <motion.aside
      id="main-sidebar"
      className={cn(
        'fixed inset-y-0 left-0 z-30 flex flex-col max-h-screen overflow-hidden bg-background border-r',
        'transition-all lg:translate-x-0 lg:static',
        open ? 'translate-x-0' : '-translate-x-full',
        !mounted ? 'duration-0' : '', // No transition on first render
      )}
      initial={false}
      animate={isCollapsed && !isMobile ? 'collapsed' : 'expanded'}
      variants={sidebarVariants}
      transition={getTransition()}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      aria-label="Main navigation"
      aria-expanded={!isCollapsed}
    >
      <div className="flex items-center justify-between flex-shrink-0 p-4 border-b">
        <div className="flex items-center" onClick={handleLinkClick}>
          <Link
            href="/"
            className="flex items-center space-x-2"
            aria-label="Go to home page"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-md border">
              <Bot className="h-4 w-4" aria-hidden="true" />
            </div>
            <motion.span
              className="text-base font-medium"
              variants={labelVariants}
            >
              AI Agent Generator
            </motion.span>
          </Link>
        </div>

        {isMobile ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden h-8 w-8"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </Button>
        ) : (
          <SidebarToggle
            className={cn(
              'invisible opacity-0 transition-opacity group-hover:visible group-hover:opacity-100',
              isCollapsed && 'invisible opacity-0',
            )}
          />
        )}
      </div>

      {/* Toggle button positioned on border */}
      {!isMobile && (
        <div className="absolute top-16 -right-4 hidden lg:block">
          <SidebarToggle />
        </div>
      )}

      <nav className="flex-1 overflow-y-auto" aria-label="Application">
        <ul className="p-3 space-y-1" role="menu">
          {navItems.map((item, index) => (
            <li key={item.path} role="none">
              {renderNavItem(item, index, location === item.path)}
            </li>
          ))}

          {/* Demo section */}
          <li className="pt-2" role="none">
            {renderSectionLabel('UI Demos')}
          </li>
          {demoItems.map((item, index) => (
            <li key={item.path} role="none">
              {renderNavItem(item, index, location === item.path)}
            </li>
          ))}

          {/* Admin section - only shown to users with admin privileges */}
          {isAdmin && (
            <>
              <li className="pt-2" role="none">
                {renderSectionLabel('Admin')}
              </li>
              {adminItems.map((item, index) => (
                <li key={item.path} role="none">
                  {renderNavItem(item, index, location === item.path)}
                </li>
              ))}
            </>
          )}
        </ul>
      </nav>

      <div className="flex-shrink-0 p-3 border-t">
        <div className="flex items-center">
          <Avatar className="flex-shrink-0 w-8 h-8 border">
            <AvatarImage
              src={`https://avatar.vercel.sh/${user?.username || 'user'}`}
              alt={user?.username || 'User'}
            />
            <AvatarFallback>
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>

          <motion.div className="ml-3 overflow-hidden" variants={labelVariants}>
            <div className="flex flex-col">
              <span className="font-medium fluid-body">
                {user?.username || 'User'}
              </span>
              <span className="fluid-xs text-muted-foreground">
                {user?.email || 'user@example.com'}
              </span>
            </div>
          </motion.div>

          <motion.div
            variants={{
              expanded: { marginLeft: 'auto' },
              collapsed: { marginLeft: 0 },
            }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleLogout}
              title="Log out"
              aria-label="Log out"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.aside>
  );
}

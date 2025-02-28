import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useTheme } from '@/hooks/use-theme';
import { AnimatePresence, motion } from 'framer-motion';
import { Monitor, Moon, Palette, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const prefersReducedMotion = useReducedMotion();

  // Define icon to use based on current theme
  const getButtonIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      case 'custom':
        return <Palette className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={theme}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, rotate: -90 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, rotate: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              {getButtonIcon()}
            </motion.div>
          </AnimatePresence>
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="mr-2 h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
        {theme === 'custom' && (
          <DropdownMenuItem onClick={() => setTheme('system')}>
            <Palette className="mr-2 h-4 w-4" />
            <span>Custom</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

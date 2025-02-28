import { FC } from 'react';
import { cn } from '@/lib/utils';
import { Loader } from 'lucide-react';
import { motion } from 'framer-motion';

export interface LoadingIndicatorProps {
  /**
   * Optional CSS class name to apply to the component
   */
  className?: string;

  /**
   * Size of the loading indicator in pixels
   * @default 24
   */
  size?: number;

  /**
   * Color of the loading indicator
   * @default 'currentColor'
   */
  color?: string;

  /**
   * Text to display next to the loading indicator
   */
  text?: string;

  /**
   * Whether to center the loading indicator
   * @default false
   */
  centered?: boolean;

  /**
   * Whether the loading indicator should be inline
   * @default false
   */
  inline?: boolean;
}

/**
 * A loading indicator component that can be used to show loading states
 * Particularly useful with infinite scroll to indicate when more content is loading
 */
export const LoadingIndicator: FC<LoadingIndicatorProps> = ({
  className,
  size = 24,
  color = 'currentColor',
  text,
  centered = false,
  inline = false,
}) => {
  return (
    <div
      className={cn(
        'flex items-center gap-2',
        centered && 'justify-center',
        inline ? 'inline-flex' : 'w-full py-2',
        className,
      )}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <Loader size={size} color={color} />
      </motion.div>
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
};

/**
 * A specialized loading indicator for use with infinite scroll
 */
export const InfiniteScrollLoader: FC<Omit<LoadingIndicatorProps, 'text' | 'centered'>> = (
  props,
) => {
  return <LoadingIndicator text="Loading more items..." centered {...props} />;
};

import { cn } from '@/lib/utils';
import { GripVertical, Move } from 'lucide-react';
import React, { forwardRef } from 'react';

export interface DragHandleProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'minimal' | 'icon';
  orientation?: 'vertical' | 'horizontal';
  dragHandleProps?: any;
}

const DragHandle = forwardRef<HTMLDivElement, DragHandleProps>(
  (
    {
      variant = 'default',
      orientation = 'vertical',
      className,
      dragHandleProps,
      ...props
    },
    ref,
  ) => {
    const getIcon = () => {
      if (variant === 'icon') {
        return <Move className="h-4 w-4" />;
      } else {
        return <GripVertical className="h-4 w-4" />;
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded p-0.5 cursor-grab active:cursor-grabbing hover:bg-muted transition-colors',
          variant === 'default' &&
            'text-muted-foreground hover:text-foreground flex items-center justify-center',
          variant === 'minimal' &&
            'absolute top-2 right-2 w-6 h-6 bg-background shadow-sm border',
          variant === 'icon' && 'flex items-center justify-center p-1',
          className,
        )}
        {...dragHandleProps}
        {...props}
        data-drag-handle
      >
        {getIcon()}
      </div>
    );
  },
);

DragHandle.displayName = 'DragHandle';

export { DragHandle };

import { useDroppable } from '@/hooks/use-droppable';
import { cn } from '@/lib/utils';
import { DragResult, DraggableItem, DroppableConfig } from '@/types/drag-types';
import { motion } from 'framer-motion';
import React, { forwardRef } from 'react';

export interface DroppableProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string;
  accepts: string[]; // Types of items this container accepts
  disabled?: boolean;
  orientation?: 'vertical' | 'horizontal';
  onDragEnter?: (item: DraggableItem) => void;
  onDragLeave?: (item: DraggableItem) => void;
  onDrop?: (result: DragResult) => void;
  children: React.ReactNode;
  emptyPlaceholder?: React.ReactNode;
  highlightOnHover?: boolean;
}

const Droppable = forwardRef<HTMLDivElement, DroppableProps>(
  (
    {
      id,
      accepts,
      disabled = false,
      orientation = 'vertical',
      onDragEnter,
      onDragLeave,
      onDrop,
      children,
      emptyPlaceholder,
      highlightOnHover = true,
      className,
      ...props
    },
    ref,
  ) => {
    const config: DroppableConfig = {
      id,
      accepts,
      isDisabled: disabled,
      orientation,
      onDragEnter,
      onDragLeave,
      onDrop,
    };

    const { droppableProps, isOver, canAccept, animationControls } = useDroppable(config);

    // Default placeholder if no children and an emptyPlaceholder is provided
    const hasChildren = React.Children.count(children) > 0;
    const shouldShowPlaceholder = !hasChildren && emptyPlaceholder;

    return (
      <motion.div
        ref={ref}
        className={cn(
          'min-h-[50px] rounded-md transition-colors',
          orientation === 'vertical' ? 'flex flex-col' : 'flex flex-row',
          highlightOnHover && isOver && canAccept && 'bg-primary/10 border-primary',
          highlightOnHover && !isOver && 'border-dashed',
          className,
        )}
        animate={animationControls}
        initial={false}
        {...droppableProps}
        {...props}
      >
        {shouldShowPlaceholder ? emptyPlaceholder : children}

        {/* Visual feedback for when item can be dropped */}
        {isOver && canAccept && highlightOnHover && (
          <motion.div
            className="absolute inset-0 bg-primary/5 border-2 border-primary/40 rounded-md pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </motion.div>
    );
  },
);

Droppable.displayName = 'Droppable';

export { Droppable };

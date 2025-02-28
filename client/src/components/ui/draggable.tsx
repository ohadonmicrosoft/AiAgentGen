import { useDraggable } from '@/hooks/use-draggable';
import { cn } from '@/lib/utils';
import { DraggableConfig, DraggableItem } from '@/types/drag-types';
import { motion } from 'framer-motion';
import React, { forwardRef } from 'react';

export interface DraggableProps extends React.HTMLAttributes<HTMLDivElement> {
  item: DraggableItem;
  containerId: string;
  disabled?: boolean;
  dragHandleSelector?: string;
  onDragStart?: (item: DraggableItem) => void;
  onDragEnd?: (result: any) => void;
  children: React.ReactNode;
  dragHandleRender?: (props: any) => React.ReactNode;
}

const Draggable = forwardRef<HTMLDivElement, DraggableProps>(
  (
    {
      item,
      containerId,
      disabled = false,
      dragHandleSelector,
      onDragStart,
      onDragEnd,
      children,
      dragHandleRender,
      className,
      ...props
    },
    ref,
  ) => {
    const config: DraggableConfig = {
      id: containerId,
      dragDisabled: disabled,
      dragHandleSelector,
      onDragStart,
      onDragEnd,
    };

    const { draggableProps, dragHandleProps, isDragging, animationControls } =
      useDraggable(item, config);

    return (
      <motion.div
        ref={ref}
        className={cn('relative', isDragging && 'opacity-50', className)}
        animate={animationControls}
        {...draggableProps}
        {...props}
      >
        {children}

        {dragHandleSelector &&
          dragHandleRender &&
          dragHandleRender(dragHandleProps)}
      </motion.div>
    );
  },
);

Draggable.displayName = 'Draggable';

export { Draggable };

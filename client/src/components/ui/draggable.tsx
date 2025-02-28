import { useDraggable } from "@/hooks/use-draggable";
import { cn } from "@/lib/utils";
import type { DraggableConfig, DraggableItem } from "@/types/drag-types";
import { motion } from "framer-motion";
import type React from "react";
import { forwardRef } from "react";

export interface DraggableProps extends React.HTMLAttributes<HTMLDivElement> {
  item: DraggableItem;
  containerId: string;
  disabled?: boolean;
  dragHandleSelector?: string;
  onDragStart?: (item: DraggableItem) => void;
  onDragEnd?: (result: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  children: React.ReactNode;
  dragHandleRender?: (props: any) => React.ReactNode; // eslint-disable-line @typescript-eslint/no-explicit-any
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
        className={cn("relative", isDragging && "opacity-50", className)}
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

Draggable.displayName = "Draggable";

export { Draggable };

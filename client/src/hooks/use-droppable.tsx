import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useDragContext } from '@/contexts/drag-context';
import { DroppableConfig } from '@/types/drag-types';

/**
 * Hook to make an element act as a drop target
 *
 * @param config Configuration options for the droppable
 * @returns Props to spread onto the droppable element
 */
export function useDroppable(config: DroppableConfig) {
  const {
    dragState,
    registerDropContainer,
    unregisterDropContainer,
    endDrag,
    prefersReducedMotion,
  } = useDragContext();

  const elementRef = useRef<HTMLDivElement | null>(null);
  const [isOver, setIsOver] = useState(false);
  const controls = useAnimation();

  // Determine if this container is the current drop target
  const isCurrentDropTarget = dragState.isDragging && dragState.targetContainerId === config.id;

  // Determine if this container can accept the currently dragged item
  const canAcceptDraggedItem =
    dragState.isDragging &&
    dragState.draggedItem &&
    config.accepts.includes(dragState.draggedItem.type);

  // Register this container when mounted
  useEffect(() => {
    if (elementRef.current) {
      registerDropContainer(config.id, elementRef.current, config.accepts);
    }

    return () => {
      unregisterDropContainer(config.id);
    };
  }, [registerDropContainer, unregisterDropContainer, config.id, config.accepts]);

  // Update isOver state when target container changes
  useEffect(() => {
    const newIsOver = isCurrentDropTarget && canAcceptDraggedItem;

    if (newIsOver !== isOver) {
      setIsOver(newIsOver);

      // Trigger animation if not in reduced motion mode
      if (!prefersReducedMotion) {
        controls.start(
          newIsOver
            ? {
                scale: 1.01,
                borderColor: 'var(--primary)',
                backgroundColor: 'var(--primary-light)',
                transition: { duration: 0.2 },
              }
            : {
                scale: 1,
                borderColor: 'var(--border)',
                backgroundColor: 'var(--background)',
                transition: { duration: 0.2 },
              },
        );
      }

      // Call callbacks if defined
      if (newIsOver && config.onDragEnter && dragState.draggedItem) {
        config.onDragEnter(dragState.draggedItem);
      } else if (!newIsOver && isOver && config.onDragLeave && dragState.draggedItem) {
        config.onDragLeave(dragState.draggedItem);
      }
    }
  }, [
    isCurrentDropTarget,
    canAcceptDraggedItem,
    isOver,
    controls,
    config,
    dragState.draggedItem,
    prefersReducedMotion,
  ]);

  // Handle drop event
  const handleDrop = useCallback(() => {
    if (isOver && dragState.draggedItem) {
      // Figure out the index where the item was dropped
      // This is a simplistic implementation - you might need a more sophisticated
      // calculation based on mouse position, item sizes, etc.
      const index = 0; // Default to start of list

      // End the drag operation with this container as the target
      const result = endDrag(config.id, index);

      // Call the onDrop callback if provided
      if (config.onDrop && result) {
        config.onDrop(result);
      }
    }
  }, [isOver, dragState.draggedItem, endDrag, config]);

  // When drag state ends, check if we need to handle a drop
  useEffect(() => {
    if (!dragState.isDragging && isOver) {
      handleDrop();
      setIsOver(false);
    }
  }, [dragState.isDragging, isOver, handleDrop]);

  return {
    ref: elementRef,
    droppableProps: {
      ref: elementRef,
      'data-droppable': 'true',
      'data-droppable-id': config.id,
      'aria-dropeffect': config.isDisabled ? 'none' : 'move',
    },
    isOver,
    animationControls: controls,
    // The container can accept the current drag if the item type is in the accepts list
    canAccept: canAcceptDraggedItem,
  };
}

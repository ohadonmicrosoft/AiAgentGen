import { useDragContext } from '@/contexts/drag-context';
import {
  createDragGhost,
  getCursorPosition,
  removeDragGhost,
  updateDragAnimation,
} from '@/lib/drag-and-drop';
import { DraggableConfig, DraggableItem, Position } from '@/types/drag-types';
import { motion, useAnimation } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Hook to make an element draggable
 *
 * @param item The data representing this draggable item
 * @param config Configuration options for the draggable
 * @returns Props to spread onto the draggable element
 */
export function useDraggable(item: DraggableItem, config: DraggableConfig) {
  const { dragState, startDrag, prefersReducedMotion } = useDragContext();

  const elementRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<HTMLElement | null>(null);
  const ghostRef = useRef<HTMLElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const controls = useAnimation();

  // Find drag handle element inside draggable
  useEffect(() => {
    if (elementRef.current && config.dragHandleSelector) {
      handleRef.current = elementRef.current.querySelector(
        config.dragHandleSelector,
      ) as HTMLElement;
    } else {
      handleRef.current = elementRef.current;
    }
  }, [config.dragHandleSelector]);

  // Handle drag start
  const handleDragStart = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      if (config.dragDisabled) return;

      // Prevent default to avoid text selection during drag
      event.preventDefault();

      // Get the initial cursor position
      const position = getCursorPosition(event);

      // Start the drag operation through context
      startDrag(item, item.id, config.id, event);
      setIsDragging(true);

      // Create a drag ghost element if not in reduced motion mode
      if (!prefersReducedMotion && elementRef.current) {
        ghostRef.current = createDragGhost(elementRef.current);
      }

      // Trigger animation
      updateDragAnimation(controls, true, prefersReducedMotion);

      // Call onDragStart callback if provided
      if (config.onDragStart) {
        config.onDragStart(item);
      }
    },
    [config, item, startDrag, controls, prefersReducedMotion],
  );

  // Update ghost element position during drag
  useEffect(() => {
    if (isDragging && ghostRef.current && dragState.currentPosition) {
      const offsetX = 15; // Offset from cursor for better visibility
      const offsetY = 15;

      ghostRef.current.style.left = `${dragState.currentPosition.x + offsetX}px`;
      ghostRef.current.style.top = `${dragState.currentPosition.y + offsetY}px`;
    }
  }, [isDragging, dragState.currentPosition]);

  // Clean up after drag ends
  useEffect(() => {
    if (isDragging && !dragState.isDragging) {
      setIsDragging(false);

      // Remove the ghost element
      if (ghostRef.current) {
        removeDragGhost(ghostRef.current);
        ghostRef.current = null;
      }

      // Reset animation
      updateDragAnimation(controls, false, prefersReducedMotion);
    }
  }, [isDragging, dragState.isDragging, controls, prefersReducedMotion]);

  // Check if this item is currently being dragged
  const isThisItemDragging = dragState.isDragging && dragState.draggedId === item.id;

  return {
    ref: elementRef,
    draggableProps: {
      ref: elementRef,
      onMouseDown: !config.dragHandleSelector ? handleDragStart : undefined,
      onTouchStart: !config.dragHandleSelector ? handleDragStart : undefined,
      style: {
        cursor: config.dragDisabled ? 'default' : 'grab',
        touchAction: 'none', // Prevents browser handling of touch gestures
      },
      'data-draggable': 'true',
      'data-draggable-id': item.id,
      'aria-grabbed': isThisItemDragging,
    },
    dragHandleProps: config.dragHandleSelector
      ? {
          onMouseDown: handleDragStart,
          onTouchStart: handleDragStart,
          style: {
            cursor: config.dragDisabled ? 'default' : 'grab',
            touchAction: 'none',
          },
        }
      : {},
    isDragging: isThisItemDragging,
    animationControls: controls,
  };
}

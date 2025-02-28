/**
 * Drag and Drop Utilities
 *
 * This module provides utilities to implement smooth and animated
 * drag and drop functionality throughout the application.
 */

import { Position, DragState } from '@/types/drag-types';
import { AnimationControls } from 'framer-motion';

// Constants for drag animation configuration
export const DRAG_TRANSITION = {
  type: 'spring',
  damping: 35,
  stiffness: 400,
  mass: 0.5,
};

export const ANIMATION_DURATION = 0.4;
export const SCALE_WHILE_DRAGGING = 1.04;

/**
 * Calculate position delta between current position and original position
 */
export function getPositionDelta(
  currentPosition: Position,
  originalPosition: Position,
): Position {
  return {
    x: currentPosition.x - originalPosition.x,
    y: currentPosition.y - originalPosition.y,
  };
}

/**
 * Generate position constraints for a drag area
 */
export function createDragConstraints(
  containerRef: React.RefObject<HTMLElement>,
  elementWidth: number,
  elementHeight: number,
): { top: number; right: number; bottom: number; left: number } | false {
  if (!containerRef.current) return false;

  const container = containerRef.current.getBoundingClientRect();

  return {
    left: 0,
    right: Math.max(0, container.width - elementWidth),
    top: 0,
    bottom: Math.max(0, container.height - elementHeight),
  };
}

/**
 * Check if one element is overlapping another
 */
export function isOverlapping(
  draggedElem: DOMRect,
  dropTargetElem: DOMRect,
): boolean {
  return !(
    draggedElem.right < dropTargetElem.left ||
    draggedElem.left > dropTargetElem.right ||
    draggedElem.bottom < dropTargetElem.top ||
    draggedElem.top > dropTargetElem.bottom
  );
}

/**
 * Calculate intersection area between two elements
 */
export function getOverlapArea(rect1: DOMRect, rect2: DOMRect): number {
  const xOverlap = Math.max(
    0,
    Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left),
  );

  const yOverlap = Math.max(
    0,
    Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top),
  );

  return xOverlap * yOverlap;
}

/**
 * Find the best drop target among multiple candidates
 */
export function findBestDropTarget(
  draggedRect: DOMRect,
  dropTargets: { id: string; rect: DOMRect }[],
): string | null {
  let bestTarget = null;
  let maxOverlap = 0;

  for (const target of dropTargets) {
    if (isOverlapping(draggedRect, target.rect)) {
      const overlapArea = getOverlapArea(draggedRect, target.rect);

      if (overlapArea > maxOverlap) {
        maxOverlap = overlapArea;
        bestTarget = target.id;
      }
    }
  }

  return bestTarget;
}

/**
 * Update animation controls during drag operations
 */
export function updateDragAnimation(
  controls: AnimationControls,
  isDragging: boolean,
  disableAnimation = false,
): void {
  if (disableAnimation) return;

  if (isDragging) {
    controls.start({
      scale: SCALE_WHILE_DRAGGING,
      boxShadow:
        '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      transition: { duration: ANIMATION_DURATION },
    });
  } else {
    controls.start({
      scale: 1,
      boxShadow:
        '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      transition: { duration: ANIMATION_DURATION },
    });
  }
}

/**
 * Generate drag ghost element (visible while dragging)
 */
export function createDragGhost(
  element: HTMLElement,
  offsetX = 20,
  offsetY = 20,
): HTMLElement {
  const rect = element.getBoundingClientRect();
  const ghost = element.cloneNode(true) as HTMLElement;

  // Style the ghost element
  Object.assign(ghost.style, {
    position: 'fixed',
    top: `${rect.top + offsetY}px`,
    left: `${rect.left + offsetX}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    opacity: '0.8',
    pointerEvents: 'none',
    zIndex: '9999',
    transition: 'transform 0.15s ease-out',
    transform: 'scale(0.95)',
    boxShadow:
      '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  });

  document.body.appendChild(ghost);

  // Apply a slight "pop" effect
  requestAnimationFrame(() => {
    ghost.style.transform = 'scale(1.02)';
  });

  return ghost;
}

/**
 * Remove drag ghost element
 */
export function removeDragGhost(ghost: HTMLElement): void {
  ghost.style.transform = 'scale(0.9)';
  ghost.style.opacity = '0';

  setTimeout(() => {
    if (ghost.parentNode) {
      ghost.parentNode.removeChild(ghost);
    }
  }, 200);
}

/**
 * Reorder an array after drag and drop
 */
export function reorderItems<T>(
  list: T[],
  startIndex: number,
  endIndex: number,
): T[] {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
}

/**
 * Move an item from one list to another
 */
export function moveItemBetweenLists<T>(
  sourceList: T[],
  destinationList: T[],
  sourceIndex: number,
  destinationIndex: number,
): { sourceList: T[]; destinationList: T[] } {
  const sourceCopy = Array.from(sourceList);
  const destCopy = Array.from(destinationList);
  const [removed] = sourceCopy.splice(sourceIndex, 1);

  destCopy.splice(destinationIndex, 0, removed);

  return {
    sourceList: sourceCopy,
    destinationList: destCopy,
  };
}

/**
 * Get cursor position from drag event
 */
export function getCursorPosition(
  event: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent,
): Position {
  // Touch event
  if ('touches' in event) {
    return {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    };
  }

  // Mouse event
  return {
    x: event.clientX,
    y: event.clientY,
  };
}

/**
 * Calculate if cursor is out of element bounds
 */
export function isCursorOutOfBounds(
  cursorPos: Position,
  elementRect: DOMRect,
  threshold = 0,
): boolean {
  return (
    cursorPos.x < elementRect.left - threshold ||
    cursorPos.x > elementRect.right + threshold ||
    cursorPos.y < elementRect.top - threshold ||
    cursorPos.y > elementRect.bottom + threshold
  );
}

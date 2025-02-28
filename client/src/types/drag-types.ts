/**
 * Type definitions for drag and drop functionality
 */

// Position coordinates
export interface Position {
  x: number;
  y: number;
}

// Drag state for tracking drag operations
export interface DragState {
  isDragging: boolean;
  startPosition: Position | null;
  currentPosition: Position | null;
  draggedItem: any | null; // eslint-disable-line @typescript-eslint/no-explicit-any
  draggedId: string | null;
  sourceContainerId: string | null;
  targetContainerId: string | null;
}

// Item that can be dragged
export interface DraggableItem {
  id: string;
  type: string;
  [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

// Container that can accept dropped items
export interface DropContainer {
  id: string;
  accepts: string[]; // Types of items this container accepts
  items: DraggableItem[];
}

// Configuration for draggable items
export interface DraggableConfig {
  id: string;
  dragDisabled?: boolean;
  dragHandleSelector?: string;
  animateLayout?: boolean;
  onDragStart?: (item: DraggableItem) => void;
  onDragEnd?: (result: DragResult) => void;
}

// Configuration for drop containers
export interface DroppableConfig {
  id: string;
  accepts: string[];
  isDisabled?: boolean;
  orientation?: "vertical" | "horizontal";
  onDragEnter?: (item: DraggableItem) => void;
  onDragLeave?: (item: DraggableItem) => void;
  onDrop?: (result: DragResult) => void;
}

// Result of a drag operation
export interface DragResult {
  item: DraggableItem;
  source: {
    id: string;
    index: number;
  };
  destination: {
    id: string;
    index: number;
  } | null;
  // True if the item was dropped in a valid drop zone
  isDropped: boolean;
  // True if the item was reordered within the same container
  isReordered: boolean;
  // True if the item was moved between containers
  isMoved: boolean;
}

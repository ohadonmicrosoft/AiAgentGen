import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { getCursorPosition, isCursorOutOfBounds } from "@/lib/drag-and-drop";
import {
  type DragResult,
  type DragState,
  DraggableItem,
  type Position,
} from "@/types/drag-types";
import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";

// Initial drag state
const initialDragState: DragState = {
  isDragging: false,
  startPosition: null,
  currentPosition: null,
  draggedItem: null,
  draggedId: null,
  sourceContainerId: null,
  targetContainerId: null,
};

// Actions for drag state reducer
type DragAction =
  | {
      type: "START_DRAG";
      payload: {
        item: any; // eslint-disable-line @typescript-eslint/no-explicit-any
        id: string;
        containerId: string;
        position: Position;
      };
    }
  | {
      type: "UPDATE_DRAG";
      payload: { position: Position; targetContainerId?: string };
    }
  | {
      type: "END_DRAG";
      payload?: { targetContainerId?: string; targetIndex?: number };
    }
  | { type: "CANCEL_DRAG" }
  | { type: "SET_TARGET_CONTAINER"; payload: { containerId: string | null } };

// Reducer for drag state
function dragReducer(state: DragState, action: DragAction): DragState {
  switch (action.type) {
    case "START_DRAG":
      return {
        ...state,
        isDragging: true,
        startPosition: action.payload.position,
        currentPosition: action.payload.position,
        draggedItem: action.payload.item,
        draggedId: action.payload.id,
        sourceContainerId: action.payload.containerId,
        targetContainerId: action.payload.containerId, // Initially the same as source
      };

    case "UPDATE_DRAG":
      return {
        ...state,
        currentPosition: action.payload.position,
        targetContainerId:
          action.payload.targetContainerId || state.targetContainerId,
      };

    case "END_DRAG":
      return {
        ...state,
        isDragging: false,
        targetContainerId:
          action.payload?.targetContainerId || state.targetContainerId,
      };

    case "CANCEL_DRAG":
      return initialDragState;

    case "SET_TARGET_CONTAINER":
      return {
        ...state,
        targetContainerId: action.payload.containerId,
      };

    default:
      return state;
  }
}

// Context interface
interface DragContextValue {
  dragState: DragState;
  startDrag: (
    item: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    id: string,
    containerId: string,
    event: React.MouseEvent | React.TouchEvent,
  ) => void;
  updateDrag: (
    event: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent,
  ) => void;
  endDrag: (
    targetContainerId?: string,
    targetIndex?: number,
  ) => DragResult | null;
  cancelDrag: () => void;
  setTargetContainer: (containerId: string | null) => void;
  registerDropContainer: (
    id: string,
    element: HTMLElement,
    accepts: string[],
  ) => void;
  unregisterDropContainer: (id: string) => void;
  prefersReducedMotion: boolean;
}

// Create context
const DragContext = createContext<DragContextValue | undefined>(undefined);

// Map to store drop container references
type DropContainerRef = {
  element: HTMLElement;
  accepts: string[];
};

// Provider component
export const DragProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [dragState, dispatch] = useReducer(dragReducer, initialDragState);
  const dropContainersRef = useRef<Map<string, DropContainerRef>>(new Map());
  const prefersReducedMotion = useReducedMotion();

  // Track document event listeners
  const dragListenersAttached = useRef(false);

  // Register a drop container
  const registerDropContainer = useCallback(
    (id: string, element: HTMLElement, accepts: string[]) => {
      dropContainersRef.current.set(id, { element, accepts });
    },
    [],
  );

  // Unregister a drop container
  const unregisterDropContainer = useCallback((id: string) => {
    dropContainersRef.current.delete(id);
  }, []);

  // Start drag operation
  const startDrag = useCallback(
    (
      item: any, // eslint-disable-line @typescript-eslint/no-explicit-any
      id: string,
      containerId: string,
      event: React.MouseEvent | React.TouchEvent,
    ) => {
      const position = getCursorPosition(event);

      dispatch({
        type: "START_DRAG",
        payload: { item, id, containerId, position },
      });
    },
    [],
  );

  // Update drag position
  const updateDrag = useCallback(
    (event: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
      if (!dragState.isDragging) return;

      const position = getCursorPosition(event);

      // Find which container we're over (if any)
      let targetContainerId: string | null = null;
      let maxOverlapArea = 0;

      dropContainersRef.current.forEach((container, id) => {
        const { element, accepts } = container;

        // Skip if the container doesn't accept this type of item
        if (
          dragState.draggedItem &&
          !accepts.includes(dragState.draggedItem.type)
        ) {
          return;
        }

        const rect = element.getBoundingClientRect();

        // Check if cursor is inside this container
        if (
          position.x >= rect.left &&
          position.x <= rect.right &&
          position.y >= rect.top &&
          position.y <= rect.bottom
        ) {
          // Calculate area to find the most specific container (in case of nesting)
          const area = rect.width * rect.height;
          if (area < maxOverlapArea || maxOverlapArea === 0) {
            maxOverlapArea = area;
            targetContainerId = id;
          }
        }
      });

      dispatch({
        type: "UPDATE_DRAG",
        payload: { position, targetContainerId },
      });
    },
    [dragState.isDragging, dragState.draggedItem],
  );

  // End drag operation
  const endDrag = useCallback(
    (targetContainerId?: string, targetIndex?: number): DragResult | null => {
      if (
        !dragState.isDragging ||
        !dragState.draggedItem ||
        !dragState.draggedId ||
        !dragState.sourceContainerId
      ) {
        return null;
      }

      const finalTargetId = targetContainerId || dragState.targetContainerId;

      const result: DragResult = {
        item: dragState.draggedItem,
        source: {
          id: dragState.sourceContainerId,
          index: dragState.draggedItem.index || 0,
        },
        destination: finalTargetId
          ? { id: finalTargetId, index: targetIndex || 0 }
          : null,
        isDropped: Boolean(finalTargetId),
        isReordered: finalTargetId === dragState.sourceContainerId,
        isMoved:
          Boolean(finalTargetId) &&
          finalTargetId !== dragState.sourceContainerId,
      };

      dispatch({
        type: "END_DRAG",
        payload: { targetContainerId: finalTargetId, targetIndex },
      });

      setTimeout(() => {
        dispatch({ type: "CANCEL_DRAG" });
      }, 100);

      return result;
    },
    [dragState],
  );

  // Cancel drag operation
  const cancelDrag = useCallback(() => {
    dispatch({ type: "CANCEL_DRAG" });
  }, []);

  // Set target container manually
  const setTargetContainer = useCallback((containerId: string | null) => {
    dispatch({
      type: "SET_TARGET_CONTAINER",
      payload: { containerId },
    });
  }, []);

  // Set up and clean up global event listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => updateDrag(e);
    const handleTouchMove = (e: TouchEvent) => updateDrag(e);

    const handleMouseUp = (e: MouseEvent) => {
      if (dragState.isDragging) {
        endDrag();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (dragState.isDragging) {
        endDrag();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cancel drag on escape key
      if (e.key === "Escape" && dragState.isDragging) {
        cancelDrag();
      }
    };

    // Only attach listeners when dragging
    if (dragState.isDragging && !dragListenersAttached.current) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchend", handleTouchEnd);
      document.addEventListener("keydown", handleKeyDown);
      dragListenersAttached.current = true;
    } else if (!dragState.isDragging && dragListenersAttached.current) {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("keydown", handleKeyDown);
      dragListenersAttached.current = false;
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [dragState.isDragging, updateDrag, endDrag, cancelDrag]);

  const contextValue: DragContextValue = {
    dragState,
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
    setTargetContainer,
    registerDropContainer,
    unregisterDropContainer,
    prefersReducedMotion,
  };

  return (
    <DragContext.Provider value={contextValue}>{children}</DragContext.Provider>
  );
};

// Hook to use the drag context
export const useDragContext = () => {
  const context = useContext(DragContext);

  if (context === undefined) {
    throw new Error("useDragContext must be used within a DragProvider");
  }

  return context;
};

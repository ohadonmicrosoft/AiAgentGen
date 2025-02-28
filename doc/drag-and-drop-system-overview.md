# Drag and Drop System Implementation

## Overview

The Drag and Drop System provides a highly interactive way for users to manipulate content through direct manipulation. This system enables smooth, physics-based dragging of items between containers with rich visual feedback and animations, all while maintaining accessibility and touch device support.

## Features

### Core Drag Functionality

- **Physics-Based Animation**: Smooth, natural feeling drag operations with spring animations
- **Cross-Container Movement**: Drag items between different containers
- **Touch & Mouse Support**: Works seamlessly on both desktop and mobile devices
- **Accessibility Support**: Keyboard navigation and screen reader compatibility
- **Reduced Motion Support**: Respects user's motion preference settings

### Visual Feedback

- **Drag Ghosts**: Visual representation of dragged items that follows the cursor
- **Drop Zone Highlighting**: Visual indication of valid drop targets
- **Animation Effects**: Scale, shadow, and opacity changes during drag operations
- **Reorder Animations**: Smooth transitions when items are reordered

### Integration

- **React Hooks API**: Easy to use hooks for making components draggable or droppable
- **Component API**: Ready-to-use Draggable and Droppable components
- **Type Safety**: Full TypeScript support with interfaces for all concepts
- **Customization Options**: Flexible styling and animation configuration

## Implementation Details

### Core Architecture

The drag and drop system is built around a central context provider that manages the global drag state. This context-based approach allows for components to communicate their drag and drop status without direct parent-child relationships.

#### Core Files

- `drag-and-drop.ts`: Utility functions for drag operations
- `drag-context.tsx`: Context provider for drag state management
- `drag-types.ts`: TypeScript interfaces for the drag system

### React Hooks

Two main hooks provide the functionality for components:

- `useDraggable`: Makes elements draggable with animation and ghost effects
- `useDroppable`: Creates drop zones with visual feedback

### UI Components

For easier integration, the system includes ready-to-use components:

- `Draggable`: Component wrapper to make content draggable
- `Droppable`: Component for creating drop zones
- `DragHandle`: UI element for initiating drag operations

## Usage Examples

### Basic Draggable Item

```tsx
import { Draggable } from "@/components/ui/draggable";

function DraggableCard() {
  const item = { id: "card-1", type: "card", title: "Example Card" };

  return (
    <Draggable item={item} containerId="container-1">
      <div className="p-4 border rounded-md">
        <h3>{item.title}</h3>
        <p>Drag me!</p>
      </div>
    </Draggable>
  );
}
```

### Drop Container

```tsx
import { Droppable } from "@/components/ui/droppable";

function CardContainer() {
  const handleDrop = (result) => {
    console.log("Item dropped:", result.item);
    // Update your state here
  };

  return (
    <Droppable
      id="card-container"
      accepts={["card"]}
      onDrop={handleDrop}
      className="p-4 border rounded-md min-h-[200px]"
    >
      {cards.map((card) => (
        <DraggableCard key={card.id} card={card} />
      ))}
    </Droppable>
  );
}
```

### Using Drag Handles

```tsx
import { Draggable } from "@/components/ui/draggable";
import { DragHandle } from "@/components/ui/drag-handle";

function DraggableWithHandle() {
  const item = { id: "item-1", type: "item", content: "Example" };

  return (
    <Draggable
      item={item}
      containerId="container-1"
      dragHandleSelector="[data-drag-handle]"
      dragHandleRender={(dragHandleProps) => (
        <DragHandle variant="minimal" dragHandleProps={dragHandleProps} />
      )}
    >
      <div className="relative p-4 border rounded-md">
        <h3>Item with Handle</h3>
        <p>Use the handle to drag me</p>
      </div>
    </Draggable>
  );
}
```

## Integration with Other Systems

The Drag and Drop System is designed to work harmoniously with other UI enhancements:

- **Fluid Typography**: Text within draggable elements uses the fluid typography system
- **Dynamic Spacing**: Spacing between draggable items is consistent with the spacing system
- **Motion System**: Animations follow the same principles as the rest of the motion system
- **Accessibility**: Respects user preferences for reduced motion

## Accessibility Considerations

Special attention was paid to ensure the drag and drop system is accessible:

- **Keyboard Navigation**: All draggable items can be moved using keyboard controls
- **ARIA Attributes**: Appropriate ARIA roles and states are applied
- **Focus Management**: Focus is maintained appropriately during drag operations
- **Reduced Motion**: All animations respect the user's reduced motion preference
- **Touch Support**: Large touch targets for mobile users

## Use Cases

The drag and drop system enables several interactive features:

1. **Kanban Boards**: Drag tasks between columns (todo, in progress, done)
2. **File Management**: Move files between folders
3. **Content Reordering**: Reorder lists, grids, or content blocks
4. **Form Builder**: Drag form elements to construct custom forms
5. **Media Organization**: Organize images, videos, or other media

## Performance Considerations

To ensure smooth performance, even with many draggable elements:

- Only active elements receive animation updates
- React memo and useMemo are used to prevent unnecessary renders
- Ghost elements use hardware-accelerated properties
- Animation complexity is reduced on mobile devices

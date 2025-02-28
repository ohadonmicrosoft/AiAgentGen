import React, { useState } from 'react';
import { MainLayout } from '@/layouts/main-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { DragProvider } from '@/contexts/drag-context';
import { Draggable } from '@/components/ui/draggable';
import { Droppable } from '@/components/ui/droppable';
import { DragHandle } from '@/components/ui/drag-handle';
import { DraggableItem, DragResult } from '@/types/drag-types';
import { reorderItems, moveItemBetweenLists } from '@/lib/drag-and-drop';
import {
  Grip,
  Plus,
  X,
  Check,
  Bookmark,
  FileText,
  ImageIcon,
  Trash2,
} from 'lucide-react';

// Demo task type for the kanban board
interface Task extends DraggableItem {
  id: string;
  type: 'task';
  content: string;
  priority: 'low' | 'medium' | 'high';
}

// Demo file type for the file manager
interface File extends DraggableItem {
  id: string;
  type: 'file' | 'image';
  name: string;
  size: string;
  icon: React.ReactNode;
}

export default function DragDropDemo() {
  const [selectedTab, setSelectedTab] = useState<string>('kanban');
  const prefersReducedMotion = useReducedMotion();

  // Kanban Board Demo State
  const [columns, setColumns] = useState<{
    [key: string]: {
      title: string;
      tasks: Task[];
    };
  }>({
    todo: {
      title: 'To Do',
      tasks: [
        {
          id: 't1',
          type: 'task',
          content: 'Research drag and drop libraries',
          priority: 'high',
        },
        {
          id: 't2',
          type: 'task',
          content: 'Create UI components for draggable items',
          priority: 'medium',
        },
        {
          id: 't3',
          type: 'task',
          content: 'Design drop zones with visual feedback',
          priority: 'medium',
        },
      ],
    },
    inProgress: {
      title: 'In Progress',
      tasks: [
        {
          id: 't4',
          type: 'task',
          content: 'Implement drag animations',
          priority: 'high',
        },
        {
          id: 't5',
          type: 'task',
          content: 'Test on touch devices',
          priority: 'low',
        },
      ],
    },
    done: {
      title: 'Done',
      tasks: [
        {
          id: 't6',
          type: 'task',
          content: 'Set up project structure',
          priority: 'medium',
        },
        {
          id: 't7',
          type: 'task',
          content: 'Write documentation',
          priority: 'low',
        },
      ],
    },
  });

  // File Manager Demo State
  const [folders, setFolders] = useState<{
    [key: string]: {
      title: string;
      files: File[];
    };
  }>({
    documents: {
      title: 'Documents',
      files: [
        {
          id: 'f1',
          type: 'file',
          name: 'Project Plan.pdf',
          size: '2.4 MB',
          icon: <FileText className="h-4 w-4" />,
        },
        {
          id: 'f2',
          type: 'file',
          name: 'Meeting Notes.docx',
          size: '1.2 MB',
          icon: <FileText className="h-4 w-4" />,
        },
      ],
    },
    images: {
      title: 'Images',
      files: [
        {
          id: 'f3',
          type: 'image',
          name: 'Screenshot.png',
          size: '3.1 MB',
          icon: <ImageIcon className="h-4 w-4" />,
        },
        {
          id: 'f4',
          type: 'image',
          name: 'Profile Picture.jpg',
          size: '1.8 MB',
          icon: <ImageIcon className="h-4 w-4" />,
        },
      ],
    },
    trash: {
      title: 'Trash',
      files: [],
    },
  });

  // Handle task drop in Kanban demo
  const handleTaskDrop = (result: DragResult) => {
    if (!result.destination) return;

    const sourceId = result.source.id;
    const destId = result.destination.id;

    // If reordering within the same column
    if (sourceId === destId) {
      const newTasks = reorderItems(
        columns[sourceId].tasks,
        result.source.index,
        result.destination.index,
      );

      setColumns({
        ...columns,
        [sourceId]: {
          ...columns[sourceId],
          tasks: newTasks,
        },
      });
    }
    // If moving between columns
    else {
      const result = moveItemBetweenLists(
        columns[sourceId].tasks,
        columns[destId].tasks,
        result.source.index,
        result.destination.index,
      );

      setColumns({
        ...columns,
        [sourceId]: {
          ...columns[sourceId],
          tasks: result.sourceList,
        },
        [destId]: {
          ...columns[destId],
          tasks: result.destinationList,
        },
      });
    }
  };

  // Handle file drop in File Manager demo
  const handleFileDrop = (result: DragResult) => {
    if (!result.destination) return;

    const sourceId = result.source.id;
    const destId = result.destination.id;

    // If reordering within the same folder
    if (sourceId === destId) {
      const newFiles = reorderItems(
        folders[sourceId].files,
        result.source.index,
        result.destination.index,
      );

      setFolders({
        ...folders,
        [sourceId]: {
          ...folders[sourceId],
          files: newFiles,
        },
      });
    }
    // If moving between folders
    else {
      const result = moveItemBetweenLists(
        folders[sourceId].files,
        folders[destId].files,
        result.source.index,
        result.destination.index,
      );

      setFolders({
        ...folders,
        [sourceId]: {
          ...folders[sourceId],
          files: result.sourceList,
        },
        [destId]: {
          ...folders[destId],
          files: result.destinationList,
        },
      });
    }
  };

  return (
    <MainLayout>
      <DragProvider>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="container mx-auto py-8 space-y-8"
        >
          <div>
            <h1 className="fluid-h1 font-bold">Drag and Drop System</h1>
            <p className="fluid-body text-muted-foreground mt-2 max-w-3xl">
              Explore the highly interactive drag and drop system with
              physics-based animations, visual feedback, and touch support.
            </p>
          </div>

          <Tabs
            defaultValue="kanban"
            onValueChange={setSelectedTab}
            value={selectedTab}
          >
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
              <TabsTrigger value="fileManager">File Manager</TabsTrigger>
            </TabsList>

            {/* Kanban Board Demo */}
            <TabsContent value="kanban" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(columns).map(([columnId, column]) => (
                  <div key={columnId} className="flex flex-col">
                    <h3 className="font-medium mb-2">{column.title}</h3>
                    <Droppable
                      id={columnId}
                      accepts={['task']}
                      onDrop={handleTaskDrop}
                      className="bg-muted/30 rounded-md p-3 min-h-[300px] flex-1 border"
                      emptyPlaceholder={
                        <div className="flex items-center justify-center h-full">
                          <p className="text-muted-foreground">
                            Drop tasks here
                          </p>
                        </div>
                      }
                    >
                      <AnimatePresence>
                        {column.tasks.map((task, index) => (
                          <Draggable
                            key={task.id}
                            item={{ ...task, index }}
                            containerId={columnId}
                            dragHandleSelector="[data-drag-handle]"
                            className="mb-2"
                            dragHandleRender={(dragHandleProps: any) => (
                              <DragHandle
                                className="absolute top-3 right-2"
                                variant="minimal"
                                dragHandleProps={dragHandleProps}
                              />
                            )}
                          >
                            <motion.div
                              layout={!prefersReducedMotion}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.2 }}
                              className="relative p-3 bg-background border rounded-md shadow-sm"
                            >
                              <div className="pr-8">
                                <p className="text-sm">{task.content}</p>
                                <div className="mt-2 flex items-center">
                                  <span
                                    className={`inline-block w-2 h-2 rounded-full mr-2 ${
                                      task.priority === 'high'
                                        ? 'bg-red-500'
                                        : task.priority === 'medium'
                                          ? 'bg-yellow-500'
                                          : 'bg-green-500'
                                    }`}
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    {task.priority.charAt(0).toUpperCase() +
                                      task.priority.slice(1)}{' '}
                                    Priority
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          </Draggable>
                        ))}
                      </AnimatePresence>
                    </Droppable>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* File Manager Demo */}
            <TabsContent value="fileManager" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(folders).map(([folderId, folder]) => (
                  <Card key={folderId} className="overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-3">
                      <CardTitle className="text-base flex items-center">
                        {folder.title === 'Documents' && (
                          <FileText className="mr-2 h-4 w-4" />
                        )}
                        {folder.title === 'Images' && (
                          <ImageIcon className="mr-2 h-4 w-4" />
                        )}
                        {folder.title === 'Trash' && (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        {folder.title}
                      </CardTitle>
                      <CardDescription>
                        {folder.files.length} file
                        {folder.files.length !== 1 ? 's' : ''}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Droppable
                        id={folderId}
                        accepts={['file', 'image']}
                        orientation="vertical"
                        onDrop={handleFileDrop}
                        className="min-h-[200px] p-3"
                        emptyPlaceholder={
                          <div className="flex items-center justify-center h-full py-6 border-t">
                            <p className="text-sm text-muted-foreground">
                              Drop files here
                            </p>
                          </div>
                        }
                      >
                        <AnimatePresence>
                          {folder.files.map((file, index) => (
                            <Draggable
                              key={file.id}
                              item={{ ...file, index }}
                              containerId={folderId}
                              className="mb-1"
                            >
                              <motion.div
                                layout={!prefersReducedMotion}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center p-2 hover:bg-muted/50 rounded-md cursor-grab"
                              >
                                <div className="mr-3 text-muted-foreground">
                                  {file.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm truncate">
                                    {file.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {file.size}
                                  </p>
                                </div>
                              </motion.div>
                            </Draggable>
                          ))}
                        </AnimatePresence>
                      </Droppable>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <div className="p-6 bg-muted/20 rounded-lg border mt-8">
            <h2 className="fluid-h3 font-semibold mb-4">
              Implementation Details
            </h2>
            <ul className="space-y-2 list-disc list-inside text-muted-foreground">
              <li>Physics-based animation spring system</li>
              <li>Supports both mouse and touch interactions</li>
              <li>Accessible with keyboard navigation support</li>
              <li>Visual feedback during drag operations</li>
              <li>Drag ghost elements that follow the cursor</li>
              <li>Smooth animation transitions when items are reordered</li>
              <li>Support for multiple drop zones</li>
              <li>Respects reduced motion preferences</li>
            </ul>
          </div>

          <div className="p-6 bg-muted/20 rounded-lg border">
            <h2 className="fluid-h3 font-semibold mb-4">How It Works</h2>
            <ol className="space-y-2 list-decimal list-inside text-muted-foreground">
              <li>Drag context manages state across components</li>
              <li>Draggable component handles item drag behavior</li>
              <li>Droppable component defines valid drop zones</li>
              <li>React hooks provide easy integration</li>
              <li>Framer Motion powers the animations</li>
            </ol>
          </div>
        </motion.div>
      </DragProvider>
    </MainLayout>
  );
}

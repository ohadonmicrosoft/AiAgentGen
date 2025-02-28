import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/layouts/MainLayout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Prompt } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Clock,
  Edit,
  Loader2,
  Plus,
  Search,
  Star,
  StarOff,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const promptFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(10, "Prompt must be at least 10 characters"),
  tags: z.string().optional(),
  isFavorite: z.boolean().default(false),
});

type PromptFormValues = z.infer<typeof promptFormSchema>;

export default function Prompts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch prompts from API
  const { data: prompts, isLoading: isLoadingPrompts } = useQuery<Prompt[]>({
    queryKey: ["/api/prompts"],
    enabled: !!user,
  });

  // Create new prompt mutation
  const createPromptMutation = useMutation({
    mutationFn: async (values: PromptFormValues) => {
      const tagsArray = values.tags
        ? values.tags.split(",").map((tag) => tag.trim())
        : [];
      const promptData = {
        title: values.title,
        content: values.content,
        tags: tagsArray,
        isFavorite: values.isFavorite,
      };

      const res = await apiRequest("POST", "/api/prompts", promptData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
      toast({
        title: "Prompt created",
        description: "Your prompt has been created successfully.",
      });
      form.reset();
      setIsCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating prompt",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update prompt mutation
  const updatePromptMutation = useMutation({
    mutationFn: async (values: PromptFormValues & { id: number }) => {
      const { id, ...promptData } = values;
      const tagsArray = values.tags
        ? values.tags.split(",").map((tag) => tag.trim())
        : [];

      const res = await apiRequest("PUT", `/api/prompts/${id}`, {
        ...promptData,
        tags: tagsArray,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
      toast({
        title: "Prompt updated",
        description: "Your prompt has been updated successfully.",
      });
      editForm.reset();
      setIsEditDialogOpen(false);
      setCurrentPrompt(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating prompt",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle favorite status mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({
      id,
      isFavorite,
    }: {
      id: number;
      isFavorite: boolean;
    }) => {
      const res = await apiRequest("PUT", `/api/prompts/${id}`, {
        isFavorite,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating favorite status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete prompt mutation
  const deletePromptMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/prompts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
      toast({
        title: "Prompt deleted",
        description: "Your prompt has been deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
      setCurrentPrompt(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting prompt",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create prompt form
  const form = useForm<PromptFormValues>({
    resolver: zodResolver(promptFormSchema),
    defaultValues: {
      title: "",
      content: "",
      tags: "",
      isFavorite: false,
    },
  });

  // Edit prompt form
  const editForm = useForm<PromptFormValues & { id: number }>({
    resolver: zodResolver(
      promptFormSchema.extend({
        id: z.number(),
      }),
    ),
    defaultValues: {
      id: 0,
      title: "",
      content: "",
      tags: "",
      isFavorite: false,
    },
  });

  const onSubmit = (values: PromptFormValues) => {
    createPromptMutation.mutate(values);
  };

  const onEditSubmit = (values: PromptFormValues & { id: number }) => {
    updatePromptMutation.mutate(values);
  };

  const handleEditPrompt = (prompt: Prompt) => {
    setCurrentPrompt(prompt);
    editForm.reset({
      id: prompt.id,
      title: prompt.title,
      content: prompt.content,
      tags: Array.isArray(prompt.tags) ? prompt.tags.join(", ") : "",
      isFavorite: prompt.isFavorite || false,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeletePrompt = (prompt: Prompt) => {
    setCurrentPrompt(prompt);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (currentPrompt) {
      deletePromptMutation.mutate(currentPrompt.id);
    }
  };

  const handleToggleFavorite = (prompt: Prompt) => {
    toggleFavoriteMutation.mutate({
      id: prompt.id,
      isFavorite: !(prompt.isFavorite || false),
    });
  };

  const filteredPrompts = prompts?.filter(
    (prompt) =>
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (Array.isArray(prompt.tags) &&
        prompt.tags.some((tag: string) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase()),
        )),
  );

  const favoritePrompts = filteredPrompts?.filter(
    (prompt) => prompt.isFavorite,
  );

  return (
    <MainLayout title="Prompts">
      <div className="py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search prompts..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Prompt
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Prompt</DialogTitle>
                <DialogDescription>
                  Create a new prompt template for your AI agents.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter a descriptive title"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prompt</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter your prompt text..."
                            rows={6}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags (comma separated)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. customer-service, sales"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter className="pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createPromptMutation.isPending}
                    >
                      {createPromptMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Prompt"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Prompt Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Prompt</DialogTitle>
              <DialogDescription>
                Make changes to your prompt template.
              </DialogDescription>
            </DialogHeader>

            <Form {...editForm}>
              <form
                onSubmit={editForm.handleSubmit(onEditSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter a descriptive title"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prompt</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter your prompt text..."
                          rows={6}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags (comma separated)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. customer-service, sales"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="isFavorite"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Mark as favorite</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <DialogFooter className="pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updatePromptMutation.isPending}
                  >
                    {updatePromptMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Prompt"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                prompt "{currentPrompt?.title}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={deletePromptMutation.isPending}
              >
                {deletePromptMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">
              All Prompts ({filteredPrompts?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="favorites">
              Favorites ({favoritePrompts?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPrompts?.map((prompt) => (
                <Card key={prompt.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{prompt.title}</CardTitle>
                      <button
                        type="button"
                        onClick={() => handleToggleFavorite(prompt)}
                        className="text-yellow-400 hover:text-yellow-500 focus:outline-none"
                      >
                        {prompt.isFavorite ? (
                          <Star className="h-5 w-5 fill-yellow-400" />
                        ) : (
                          <StarOff className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {Array.isArray(prompt.tags) &&
                        prompt.tags.map((tag: string) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {prompt.content}
                    </p>
                  </CardContent>
                  <CardFooter className="border-t bg-muted/50 py-3 px-5 flex justify-between">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="mr-1 h-3 w-3" />
                      <span>
                        Updated{" "}
                        {new Date(prompt.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPrompt(prompt)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePrompt(prompt)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
              {filteredPrompts?.length === 0 && (
                <div className="col-span-full py-8 text-center">
                  <p className="text-muted-foreground">
                    No prompts found. Try a different search term or create a
                    new prompt.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="favorites">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {favoritePrompts?.map((prompt) => (
                <Card key={prompt.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{prompt.title}</CardTitle>
                      <button
                        type="button"
                        onClick={() => handleToggleFavorite(prompt)}
                        className="text-yellow-400 hover:text-yellow-500 focus:outline-none"
                      >
                        <Star className="h-5 w-5 fill-yellow-400" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {Array.isArray(prompt.tags) &&
                        prompt.tags.map((tag: string) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {prompt.content}
                    </p>
                  </CardContent>
                  <CardFooter className="border-t bg-muted/50 py-3 px-5 flex justify-between">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="mr-1 h-3 w-3" />
                      <span>
                        Updated{" "}
                        {new Date(prompt.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPrompt(prompt)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePrompt(prompt)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
              {favoritePrompts?.length === 0 && (
                <div className="col-span-full py-8 text-center">
                  <p className="text-muted-foreground">
                    No favorite prompts found. Star your most used prompts to
                    access them quickly.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

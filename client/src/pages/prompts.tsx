import { useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Edit, Clock, Star, Tag } from "lucide-react";

interface Prompt {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isFavorite: boolean;
}

const promptFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(10, "Prompt must be at least 10 characters"),
  tags: z.string().optional(),
});

type PromptFormValues = z.infer<typeof promptFormSchema>;

export default function Prompts() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Mock data - would come from API in real implementation
  const { data: prompts } = useQuery<Prompt[]>({
    queryKey: ["/api/prompts"],
    queryFn: () => ([
      {
        id: "1",
        title: "Customer Greeting",
        content: "You are a helpful customer service agent for a tech company. Greet the customer warmly and ask how you can help them today.",
        tags: ["customer-service", "greeting"],
        createdAt: "2023-05-15T10:30:00Z",
        updatedAt: "2023-05-15T10:30:00Z",
        isFavorite: true
      },
      {
        id: "2",
        title: "Product Recommendation",
        content: "Based on the customer's preferences, recommend products from our catalog that match their needs. Be specific and provide reasons for each recommendation.",
        tags: ["sales", "recommendation"],
        createdAt: "2023-06-02T14:45:00Z",
        updatedAt: "2023-06-10T09:15:00Z",
        isFavorite: false
      },
      {
        id: "3",
        title: "Technical Support",
        content: "You are a technical support specialist. Ask diagnostic questions to understand the user's problem, then provide step-by-step troubleshooting instructions.",
        tags: ["technical", "support"],
        createdAt: "2023-06-20T16:22:00Z",
        updatedAt: "2023-06-22T11:05:00Z",
        isFavorite: true
      }
    ]),
  });

  const form = useForm<PromptFormValues>({
    resolver: zodResolver(promptFormSchema),
    defaultValues: {
      title: "",
      content: "",
      tags: "",
    },
  });

  const onSubmit = (values: PromptFormValues) => {
    console.log(values);
    // Here you would send the data to your API
    form.reset();
    setIsCreateDialogOpen(false);
  };

  const filteredPrompts = prompts?.filter(prompt => 
    prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    prompt.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prompt.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const favoritePrompts = filteredPrompts?.filter(prompt => prompt.isFavorite);

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
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter a descriptive title" {...field} />
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
                          <Textarea placeholder="Enter your prompt text..." rows={6} {...field} />
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
                          <Input placeholder="e.g. customer-service, sales" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Prompt</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Prompts ({filteredPrompts?.length || 0})</TabsTrigger>
            <TabsTrigger value="favorites">Favorites ({favoritePrompts?.length || 0})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPrompts?.map(prompt => (
                <Card key={prompt.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{prompt.title}</CardTitle>
                      {prompt.isFavorite && <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {prompt.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="text-sm text-muted-foreground line-clamp-3">{prompt.content}</p>
                  </CardContent>
                  <CardFooter className="border-t bg-muted/50 py-3 px-5 flex justify-between">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="mr-1 h-3 w-3" />
                      <span>Updated {new Date(prompt.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </CardFooter>
                </Card>
              ))}
              {filteredPrompts?.length === 0 && (
                <div className="col-span-full py-8 text-center">
                  <p className="text-muted-foreground">No prompts found. Try a different search term or create a new prompt.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="favorites">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {favoritePrompts?.map(prompt => (
                <Card key={prompt.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{prompt.title}</CardTitle>
                      <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {prompt.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="text-sm text-muted-foreground line-clamp-3">{prompt.content}</p>
                  </CardContent>
                  <CardFooter className="border-t bg-muted/50 py-3 px-5 flex justify-between">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="mr-1 h-3 w-3" />
                      <span>Updated {new Date(prompt.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </CardFooter>
                </Card>
              ))}
              {favoritePrompts?.length === 0 && (
                <div className="col-span-full py-8 text-center">
                  <p className="text-muted-foreground">No favorite prompts found. Star your most used prompts to access them quickly.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

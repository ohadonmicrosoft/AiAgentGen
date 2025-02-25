import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Info, Search, Star, BookOpen, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Prompt } from "@shared/schema";

const formSchema = z.object({
  systemPrompt: z.string().min(10, "System prompt must be at least 10 characters"),
});

type FormValues = z.infer<typeof formSchema>;

interface AgentPromptProps {
  formData: any;
  updateFormData: (data: Partial<any>) => void;
  onNext: () => void;
  onBack: () => void;
  preview?: boolean;
}

export default function AgentPrompt({ 
  formData, 
  updateFormData, 
  onNext, 
  onBack, 
  preview = false 
}: AgentPromptProps) {
  const { user } = useAuth();
  const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch prompts from library
  const { data: prompts } = useQuery<Prompt[]>({
    queryKey: ["/api/prompts"],
    enabled: !!user,
  });
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      systemPrompt: formData.systemPrompt || getDefaultSystemPrompt(formData),
    },
  });

  function onSubmit(values: FormValues) {
    updateFormData(values);
    onNext();
  }
  
  // Filter prompts based on search query
  const filteredPrompts = prompts?.filter(prompt => 
    prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    prompt.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (Array.isArray(prompt.tags) && prompt.tags.some((tag: string) => 
      tag.toLowerCase().includes(searchQuery.toLowerCase())
    ))
  );
  
  const favoritePrompts = filteredPrompts?.filter(prompt => prompt.isFavorite);
  
  // Handle selecting a prompt from the library
  const handleSelectPrompt = (prompt: Prompt) => {
    form.setValue("systemPrompt", prompt.content);
    setIsPromptLibraryOpen(false);
  };

  // Generate a default system prompt based on the agent type and configuration
  function getDefaultSystemPrompt(data: any) {
    const style = data.responseStyle || "formal";
    
    if (data.type === "customer-support") {
      return `You are a helpful customer service agent. Respond in a ${style} tone. Your goal is to help customers with their inquiries and solve their problems efficiently.`;
    } else if (data.type === "sales") {
      return `You are a knowledgeable sales assistant. Respond in a ${style} tone. Your goal is to understand customer needs and recommend appropriate products or services.`;
    } else {
      return `You are an AI assistant. Respond in a ${style} tone. Your goal is to provide helpful, accurate, and thoughtful responses to any questions or requests.`;
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>System Prompt</AlertTitle>
            <AlertDescription>
              The system prompt defines your agent's behavior and personality. It's the foundation that guides how the AI responds.
            </AlertDescription>
          </Alert>

          <FormField
            control={form.control}
            name="systemPrompt"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>System Prompt</FormLabel>
                  <Dialog open={isPromptLibraryOpen} onOpenChange={setIsPromptLibraryOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" type="button" size="sm" className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        Prompt Library
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Prompt Library</DialogTitle>
                        <DialogDescription>
                          Select a prompt from your library to use as a starting point.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="relative w-full mb-4">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="search"
                          placeholder="Search prompts..."
                          className="pl-8"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      
                      <Tabs defaultValue="all" className="w-full">
                        <TabsList className="mb-4">
                          <TabsTrigger value="all">All Prompts ({filteredPrompts?.length || 0})</TabsTrigger>
                          <TabsTrigger value="favorites">Favorites ({favoritePrompts?.length || 0})</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="all">
                          <div className="grid grid-cols-1 gap-3">
                            {filteredPrompts?.map(prompt => (
                              <Card key={prompt.id} className="overflow-hidden cursor-pointer hover:border-primary transition-colors"
                                onClick={() => handleSelectPrompt(prompt)}>
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-medium">{prompt.title}</h3>
                                    {prompt.isFavorite && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
                                  </div>
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {Array.isArray(prompt.tags) && prompt.tags.map((tag: string) => (
                                      <Badge key={tag} variant="secondary" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                  <p className="text-sm text-muted-foreground line-clamp-2">{prompt.content}</p>
                                </CardContent>
                              </Card>
                            ))}
                            {filteredPrompts?.length === 0 && (
                              <div className="text-center py-8">
                                <p className="text-muted-foreground">No prompts found. Try a different search term or create prompts in the Prompts page.</p>
                              </div>
                            )}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="favorites">
                          <div className="grid grid-cols-1 gap-3">
                            {favoritePrompts?.map(prompt => (
                              <Card key={prompt.id} className="overflow-hidden cursor-pointer hover:border-primary transition-colors"
                                onClick={() => handleSelectPrompt(prompt)}>
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-medium">{prompt.title}</h3>
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  </div>
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {Array.isArray(prompt.tags) && prompt.tags.map((tag: string) => (
                                      <Badge key={tag} variant="secondary" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                  <p className="text-sm text-muted-foreground line-clamp-2">{prompt.content}</p>
                                </CardContent>
                              </Card>
                            ))}
                            {favoritePrompts?.length === 0 && (
                              <div className="text-center py-8">
                                <p className="text-muted-foreground">No favorite prompts found. Star your favorite prompts to access them quickly.</p>
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </DialogContent>
                  </Dialog>
                </div>
                <FormControl>
                  <Textarea 
                    placeholder="Enter the system prompt for your agent..." 
                    className="h-40 font-mono"
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  This is the first instruction given to the AI model to set its behavior and context.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="bg-muted p-4 rounded-md">
            <h3 className="text-sm font-medium mb-2">Tips for effective prompts:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Be clear about the agent's role and purpose</li>
              <li>• Specify the tone and style of responses</li>
              <li>• Include limitations or things the agent should avoid</li>
              <li>• Add specific domain knowledge if relevant</li>
            </ul>
          </div>
        </div>
        
        <div className="flex justify-between mt-6">
          <Button type="button" variant="outline" onClick={onBack} disabled={preview}>
            Back
          </Button>
          <Button type="submit" disabled={preview}>
            Continue
          </Button>
        </div>
      </form>
    </Form>
  );
}

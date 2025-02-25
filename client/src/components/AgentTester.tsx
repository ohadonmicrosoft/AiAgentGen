import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, RotateCcw, Bot, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Agent } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";

// Form schema
const formSchema = z.object({
  message: z.string().min(1, "Please enter a message")
});
type FormValues = z.infer<typeof formSchema>;

// Message types
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

interface AgentTesterProps {
  agent: Partial<Agent>;
  onClose?: () => void;
}

export default function AgentTester({ agent, onClose }: AgentTesterProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Non-streaming response mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const res = await apiRequest(
        "POST",
        "/api/agents/test",
        {
          agentId: agent.id,
          message: values.message,
          stream: false
        }
      );
      return await res.json();
    },
    onSuccess: (data) => {
      const responseMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, responseMsg]);
      setTokenUsage(data.usage || null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error testing agent",
        description: error.message,
        variant: "destructive",
      });
      // Add error message as assistant
      const errorMsg: Message = {
        id: `assistant-error-${Date.now()}`,
        role: 'assistant',
        content: "Sorry, I couldn't process your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    },
  });

  // Function to handle streaming responses
  const streamResponse = async (message: string) => {
    setIsStreaming(true);
    
    // Add placeholder message for streaming response
    const assistantMsgId = `assistant-${Date.now()}`;
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };
    
    setMessages((prev) => [...prev, assistantMsg]);
    
    try {
      const response = await fetch('/api/agents/test/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          message
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      // Set up the event source
      const reader = response.body?.getReader();
      if (!reader) throw new Error("Failed to get reader from response");
      
      let accumulated = '';
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        // Decode the stream chunk
        const chunkText = decoder.decode(value, { stream: true });
        console.log('Received chunk:', chunkText);
        
        // Try to parse each line as JSON
        const lines = chunkText.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          try {
            const jsonData = JSON.parse(line);
            console.log('Parsed JSON:', jsonData);
            
            // Handle different types of chunks
            if (jsonData.usage) {
              console.log('Setting token usage:', jsonData.usage);
              setTokenUsage(jsonData.usage);
            } else if (jsonData.content !== undefined) {
              accumulated += jsonData.content;
            } else if (jsonData.error) {
              throw new Error(jsonData.error);
            }
          } catch (e) {
            // If not valid JSON, treat as content
            accumulated += line;
          }
        }
        
        // Update the message content
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMsgId 
              ? { ...msg, content: accumulated } 
              : msg
          )
        );
      }
      
      // Finalize the message
      setMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMsgId 
            ? { ...msg, isStreaming: false } 
            : msg
        )
      );
      
    } catch (error: any) {
      toast({
        title: "Error streaming response",
        description: error.message,
        variant: "destructive",
      });
      
      // Update the placeholder with an error
      setMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMsgId 
            ? { 
                ...msg, 
                content: "Sorry, I couldn't process your request. Please try again.", 
                isStreaming: false 
              } 
            : msg
        )
      );
      
    } finally {
      setIsStreaming(false);
      form.reset();
    }
  };

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    // Add user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: values.message,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMsg]);
    
    // Send to backend - use streaming when available, fallback to standard
    try {
      // Log the message being sent
      console.log('Sending message to agent:', values.message);
      await streamResponse(values.message);
    } catch (error) {
      console.error('Streaming failed, falling back to standard request:', error);
      // Fallback to non-streaming if streaming fails
      sendMessageMutation.mutate(values);
    }
  };

  // Clear chat
  const clearChat = () => {
    setMessages([]);
    setTokenUsage(null);
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Test: {agent.name || "Agent"}
            </CardTitle>
            <CardDescription>
              Test your agent in real-time before deploying
            </CardDescription>
          </div>
          <Badge>{agent.model || "gpt-4o"}</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow">
        <ScrollArea className="h-[400px] pr-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Bot className="h-12 w-12 mb-2 opacity-20" />
              <p>Start a conversation with your agent</p>
              <p className="text-sm">Your agent will respond based on your configuration</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1 text-xs font-medium">
                      {message.role === "user" ? (
                        <>
                          <span>You</span>
                          <User className="h-3 w-3" />
                        </>
                      ) : (
                        <>
                          <Bot className="h-3 w-3" />
                          <span>{agent.name || "Agent"}</span>
                        </>
                      )}
                    </div>
                    <div className="whitespace-pre-wrap">
                      {message.content}
                      {message.isStreaming && (
                        <span className="animate-pulse">▊</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
        
        {tokenUsage && (
          <div className="mt-2 flex justify-between text-xs text-muted-foreground border-t pt-2">
            <span>Tokens: {tokenUsage.totalTokens}</span>
            <span>Prompt: {tokenUsage.promptTokens}</span>
            <span>Completion: {tokenUsage.completionTokens}</span>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2 w-full">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex space-x-2">
                      <Textarea
                        placeholder="Type your message here..."
                        className="flex-grow resize-none"
                        {...field}
                        disabled={isStreaming || sendMessageMutation.isPending}
                      />
                      <div className="flex flex-col space-y-2">
                        <Button
                          type="submit"
                          size="sm"
                          className="flex-grow"
                          disabled={isStreaming || sendMessageMutation.isPending}
                        >
                          {isStreaming || sendMessageMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="flex-grow"
                          onClick={clearChat}
                          disabled={messages.length === 0}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardFooter>
    </Card>
  );
}
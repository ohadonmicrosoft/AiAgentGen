import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, RotateCcw, Bot, User, Clock, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Agent, Conversation, Message as DBMessage } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

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
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [showConversations, setShowConversations] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch user's conversations with this agent
  const { data: conversations, isLoading: loadingConversations } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations', agent.id],
    queryFn: getQueryFn({ on401: 'throw' }),
    enabled: !!agent.id && showConversations,
  });
  
  // Fetch messages for the active conversation
  const { data: conversationMessages, isLoading: loadingMessages } = useQuery<{
    conversation: Conversation;
    messages: DBMessage[];
  }>({
    queryKey: ['/api/conversations', activeConversation?.id, 'messages'],
    queryFn: getQueryFn({ on401: 'throw' }),
    enabled: !!activeConversation?.id,
  });
  
  // Update messages when conversation data changes
  useEffect(() => {
    if (conversationMessages) {
      // Convert DB messages to UI messages
      const uiMessages: Message[] = conversationMessages.messages.map(msg => ({
        id: `${msg.role}-${msg.id}`,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.createdAt as unknown as string),
      }));
      setMessages(uiMessages);
    }
  }, [conversationMessages]);
  
  // Create a new conversation
  const createConversationMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await apiRequest(
        "POST",
        "/api/conversations",
        {
          agentId: agent.id,
          title
        }
      );
      return await res.json();
    },
    onSuccess: (data: Conversation) => {
      setActiveConversation(data);
      setMessages([]);
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', agent.id] });
      setShowConversations(false);
      toast({
        title: "Conversation created",
        description: "New conversation started.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating conversation",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Save a message to the conversation
  const saveMessageMutation = useMutation({
    mutationFn: async ({ content, role, tokenCount }: { content: string; role: string; tokenCount?: number }) => {
      if (!activeConversation?.id) throw new Error("No active conversation");
      
      const res = await apiRequest(
        "POST",
        `/api/conversations/${activeConversation.id}/messages`,
        {
          content,
          role,
          tokenCount
        }
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', activeConversation?.id, 'messages'] });
    },
    onError: (error: Error) => {
      console.error("Failed to save message:", error);
    }
  });

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
      console.log('Sending non-streaming request with agent:', agent);
      console.log('Message content:', values.message);
      const res = await apiRequest(
        "POST",
        "/api/agents/test",
        {
          agentId: agent.id,
          systemPrompt: agent.systemPrompt || "You are an AI assistant. Help the user with their questions.",
          model: agent.model || 'gpt-4o',
          temperature: agent.temperature || 0.7,
          maxTokens: agent.maxTokens || 1000,
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
      // Debug the agent info
      console.log('Streaming with agent:', agent);
      console.log('Sending message:', message);
      
      const response = await fetch('/api/agents/test/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          systemPrompt: agent.systemPrompt || "You are an AI assistant. Help the user with their questions.",
          model: agent.model || 'gpt-4o',
          temperature: agent.temperature || 0.7,
          maxTokens: agent.maxTokens || 1000,
          message: message
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

  // Create a new conversation
  const startNewConversation = () => {
    const title = `Conversation ${new Date().toLocaleString()}`;
    
    // First create the conversation
    createConversationMutation.mutate(title, {
      onSuccess: async (newConversation) => {
        // If we have existing messages, save them to the new conversation
        if (messages.length > 0) {
          // Save each message in sequence to maintain order
          for (const message of messages) {
            await saveMessageMutation.mutateAsync({
              role: message.role,
              content: message.content,
              tokenCount: message.role === 'assistant' ? tokenUsage?.totalTokens : undefined
            });
          }
          
          toast({
            title: "Chat saved",
            description: "Your conversation has been saved successfully.",
          });
        }
      }
    });
  };

  // Load a conversation history
  const loadConversation = (conversation: Conversation) => {
    setActiveConversation(conversation);
    setShowConversations(false);
  };
  
  // Delete a conversation
  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      const res = await apiRequest(
        "DELETE",
        `/api/conversations/${conversationId}`,
        {}
      );
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', agent.id] });
      toast({
        title: "Conversation deleted",
        description: "The conversation has been deleted.",
      });
      
      // If this was the active conversation, clear it
      if (activeConversation && conversations?.find(c => c.id === activeConversation.id) === undefined) {
        setActiveConversation(null);
        setMessages([]);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting conversation",
        description: error.message,
        variant: "destructive",
      });
    }
  });

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
    
    // If in a conversation, save the user message
    if (activeConversation?.id) {
      saveMessageMutation.mutate({
        role: 'user',
        content: values.message
      });
    }
    
    // Send to backend - use streaming when available, fallback to standard
    try {
      // Log the message being sent
      console.log('Sending message to agent:', values.message);
      await streamResponse(values.message);
      
      // If in a conversation, save the assistant message
      if (activeConversation?.id) {
        // Find the most recent assistant message
        const lastMessage = [...messages].reverse().find(m => m.role === 'assistant' && !m.isStreaming);
        if (lastMessage) {
          saveMessageMutation.mutate({
            role: 'assistant',
            content: lastMessage.content,
            tokenCount: tokenUsage?.totalTokens
          });
        }
      }
      
    } catch (error) {
      console.error('Streaming failed, falling back to standard request:', error);
      // Fallback to non-streaming if streaming fails
      sendMessageMutation.mutate(values);
      
      if (activeConversation?.id) {
        // Handle saving message for non-streaming case in the onSuccess callback
        sendMessageMutation.mutate(values, {
          onSuccess: (data) => {
            saveMessageMutation.mutate({
              role: 'assistant',
              content: data.content,
              tokenCount: data.usage?.totalTokens
            });
          }
        });
      }
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
              {activeConversation && (
                <Badge variant="outline" className="ml-2">
                  {activeConversation.title}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Test your agent in real-time before deploying
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {agent.id && ( // Only show conversation options if this is a real agent
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowConversations(!showConversations)}
                  className="flex items-center gap-1"
                >
                  <Clock className="h-4 w-4" />
                  History
                </Button>
                
                {messages.length > 0 && !activeConversation && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={startNewConversation}
                    className="flex items-center gap-1"
                  >
                    <Save className="h-4 w-4" />
                    Save Chat
                  </Button>
                )}
              </>
            )}
            <Badge>{agent.model || "gpt-4o"}</Badge>
          </div>
        </div>
        
        {/* Conversation History Panel */}
        {showConversations && (
          <div className="mt-4 p-3 border rounded-md bg-muted/50">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium">Conversation History</h3>
              <Button variant="default" size="sm" onClick={startNewConversation}>
                New Conversation
              </Button>
            </div>
            
            {loadingConversations ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : conversations && conversations.length > 0 ? (
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                {conversations.map((conversation) => (
                  <div 
                    key={conversation.id} 
                    className={`flex justify-between items-center p-2 rounded-md hover:bg-muted cursor-pointer ${
                      activeConversation?.id === conversation.id ? 'bg-muted border-primary' : ''
                    }`}
                    onClick={() => loadConversation(conversation)}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{conversation.title}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversationMutation.mutate(conversation.id);
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive">
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-sm text-muted-foreground">
                No saved conversations. Start a new one to save your chat history.
              </div>
            )}
          </div>
        )}
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
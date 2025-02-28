import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest, getQueryFn } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2,
  Send,
  RotateCcw,
  Bot,
  User,
  Clock,
  Save,
  Maximize2,
  Minimize2,
  X,
  ChevronDown,
  ChevronUp,
  Download,
  Info,
  MessageSquare,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Agent, Conversation, Message as DBMessage } from '@shared/schema';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

// Form schema
const formSchema = z.object({
  message: z.string().min(1, 'Please enter a message'),
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTokens, setShowTokens] = useState(false);
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  // Used for the initial render to prevent transition flickering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close fullscreen when escape is pressed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Determine chat container height based on screen size and fullscreen state
  const getChatHeight = () => {
    if (isFullscreen) {
      if (isMobile) return 'h-[calc(100vh-190px)]';
      return 'h-[calc(100vh-230px)]';
    }
    if (isMobile) return 'h-[350px]';
    if (isTablet) return 'h-[420px]';
    return 'h-[480px]';
  };

  // Format timestamp for message display
  const formatMessageTime = (date: Date): string => {
    return format(date, 'h:mm a');
  };

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
      const uiMessages: Message[] = conversationMessages.messages.map((msg) => ({
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
      const res = await apiRequest('POST', '/api/conversations', {
        agentId: agent.id,
        title,
      });
      return await res.json();
    },
    onSuccess: (data: Conversation) => {
      setActiveConversation(data);
      setMessages([]);
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', agent.id] });
      setShowConversations(false);
      toast({
        title: 'Conversation created',
        description: 'New conversation started.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating conversation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Save a message to the conversation
  const saveMessageMutation = useMutation({
    mutationFn: async ({
      content,
      role,
      tokenCount,
    }: { content: string; role: string; tokenCount?: number }) => {
      if (!activeConversation?.id) throw new Error('No active conversation');

      const res = await apiRequest('POST', `/api/conversations/${activeConversation.id}/messages`, {
        content,
        role,
        tokenCount,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/conversations', activeConversation?.id, 'messages'],
      });
    },
    onError: (error: Error) => {
      console.error('Failed to save message:', error);
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: '',
    },
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Non-streaming response mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      console.log('Sending non-streaming request with agent:', agent);
      console.log('Message content:', values.message);
      const res = await apiRequest('POST', '/api/agents/test', {
        agentId: agent.id,
        systemPrompt:
          agent.systemPrompt || 'You are an AI assistant. Help the user with their questions.',
        model: agent.model || 'gpt-4o',
        temperature: agent.temperature || 0.7,
        maxTokens: agent.maxTokens || 1000,
        message: values.message,
        stream: false,
      });
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
        title: 'Error testing agent',
        description: error.message,
        variant: 'destructive',
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
      isStreaming: true,
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
          systemPrompt:
            agent.systemPrompt || 'You are an AI assistant. Help the user with their questions.',
          model: agent.model || 'gpt-4o',
          temperature: agent.temperature || 0.7,
          maxTokens: agent.maxTokens || 1000,
          message: message,
        }),
        credentials: 'include',
      });

      if (response.status === 401) {
        throw new Error(
          'You need to be logged in to use this feature. Please log in and try again.',
        );
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Error: ${response.status}`;

        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If not JSON, use text directly if available
          if (errorText) errorMessage = errorText;
        }

        throw new Error(errorMessage);
      }

      // Set up the event source
      const reader = response.body?.getReader();
      if (!reader) throw new Error('Failed to get reader from response');

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
        const lines = chunkText.split('\n').filter((line) => line.trim() !== '');

        for (const line of lines) {
          try {
            console.log('Processing line:', line);

            // Handle multiple JSON objects in one line (sometimes the API sends multiple chunks)
            if (line.includes('}{')) {
              const jsonObjects = line.match(/\{[^{}]*\}/g) || [];

              for (const jsonStr of jsonObjects) {
                try {
                  const jsonData = JSON.parse(jsonStr);
                  console.log('Parsed JSON object:', jsonData);

                  // Handle different types of chunks
                  if (jsonData.usage) {
                    console.log('Setting token usage:', jsonData.usage);
                    setTokenUsage(jsonData.usage);
                  } else if (jsonData.content !== undefined) {
                    // Just append the content directly
                    accumulated += jsonData.content;
                  } else if (jsonData.error) {
                    throw new Error(jsonData.error);
                  }
                } catch (innerError) {
                  console.error('Error parsing JSON object:', innerError);
                }
              }
            } else {
              // Simple case: just one JSON object per line
              const jsonData = JSON.parse(line);
              console.log('Parsed JSON:', jsonData);

              // Handle different types of chunks
              if (jsonData.usage) {
                console.log('Setting token usage:', jsonData.usage);
                setTokenUsage(jsonData.usage);
              } else if (jsonData.content !== undefined) {
                // Just append the content directly
                accumulated += jsonData.content;
              } else if (jsonData.error) {
                throw new Error(jsonData.error);
              }
            }
          } catch (e) {
            console.error('Error parsing line:', e);
            // If not valid JSON, treat as content
            accumulated += line;
          }
        }

        // Update the message content
        setMessages((prev) =>
          prev.map((msg) => (msg.id === assistantMsgId ? { ...msg, content: accumulated } : msg)),
        );
      }

      // Finalize the message
      setMessages((prev) =>
        prev.map((msg) => (msg.id === assistantMsgId ? { ...msg, isStreaming: false } : msg)),
      );
    } catch (error: any) {
      toast({
        title: 'Error streaming response',
        description: error.message,
        variant: 'destructive',
      });

      // Update the placeholder with an error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content: "Sorry, I couldn't process your request. Please try again.",
                isStreaming: false,
              }
            : msg,
        ),
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
              tokenCount: message.role === 'assistant' ? tokenUsage?.totalTokens : undefined,
            });
          }

          toast({
            title: 'Chat saved',
            description: 'Your conversation has been saved successfully.',
          });
        }
      },
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
      const res = await apiRequest('DELETE', `/api/conversations/${conversationId}`, {});
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', agent.id] });
      toast({
        title: 'Conversation deleted',
        description: 'The conversation has been deleted.',
      });

      // If this was the active conversation, clear it
      if (
        activeConversation &&
        conversations?.find((c) => c.id === activeConversation.id) === undefined
      ) {
        setActiveConversation(null);
        setMessages([]);
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting conversation',
        description: error.message,
        variant: 'destructive',
      });
    },
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
        content: values.message,
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
        const lastMessage = [...messages]
          .reverse()
          .find((m) => m.role === 'assistant' && !m.isStreaming);
        if (lastMessage) {
          saveMessageMutation.mutate({
            role: 'assistant',
            content: lastMessage.content,
            tokenCount: tokenUsage?.totalTokens,
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
              tokenCount: data.usage?.totalTokens,
            });
          },
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
    <div
      className={cn(
        'relative transition-all duration-300 ease-in-out',
        isFullscreen
          ? 'fixed inset-0 z-50 bg-background flex items-center justify-center p-0 md:p-4'
          : '',
      )}
    >
      <Card
        className={cn(
          'border shadow-lg w-full transition-all duration-300 overflow-hidden',
          isFullscreen
            ? 'rounded-none max-w-full h-full md:rounded-lg md:max-w-5xl md:h-[calc(100vh-40px)]'
            : 'rounded-lg max-w-3xl',
        )}
      >
        <CardHeader
          className={cn(
            'border-b transition-all',
            isFullscreen ? 'px-3 py-2 md:px-4 md:py-3' : isMobile ? 'px-3 py-3' : 'px-6 py-4 pb-3',
          )}
        >
          <div
            className={cn(
              'flex gap-2 transition-all',
              isFullscreen || isMobile
                ? 'flex-row items-center justify-between'
                : 'flex-col sm:flex-row sm:items-center sm:justify-between',
            )}
          >
            <div className="flex-1 min-w-0">
              <CardTitle
                className={cn(
                  'flex items-center gap-2',
                  isFullscreen || isMobile ? 'text-base' : 'text-lg md:text-xl',
                )}
              >
                <Bot className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="truncate">{agent.name || 'Agent'}</span>
                {activeConversation && (
                  <Badge variant="outline" className="ml-1 text-xs">
                    {activeConversation.title}
                  </Badge>
                )}
              </CardTitle>
              {(!isMobile || isFullscreen) && (
                <CardDescription
                  className={cn(
                    'transition-all',
                    isFullscreen ? 'hidden md:block mt-1 text-xs' : 'mt-1',
                  )}
                >
                  Test your agent in real-time before deploying
                </CardDescription>
              )}
            </div>

            <div className="flex flex-wrap gap-1 sm:gap-2 justify-end">
              {agent.id && ( // Only show conversation options if this is a real agent
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowConversations(!showConversations)}
                    className="h-8 w-8 sm:h-9 sm:w-9"
                    title="Conversation History"
                  >
                    <Clock className="h-4 w-4" />
                    <span className="sr-only">History</span>
                  </Button>

                  {messages.length > 0 && !activeConversation && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={startNewConversation}
                      className="h-8 w-8 sm:h-9 sm:w-9"
                      title="Save Conversation"
                    >
                      <Save className="h-4 w-4" />
                      <span className="sr-only">Save</span>
                    </Button>
                  )}
                </>
              )}

              {messages.length > 0 && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={clearChat}
                  className="h-8 w-8 sm:h-9 sm:w-9"
                  title="Clear Chat"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="sr-only">Clear</span>
                </Button>
              )}

              <Button
                variant="outline"
                size="icon"
                onClick={toggleFullscreen}
                className="h-8 w-8 sm:h-9 sm:w-9"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Mode'}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
                <span className="sr-only">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
              </Button>

              {onClose && !isFullscreen && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 sm:h-9 sm:w-9"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              )}

              <Badge className="h-8 px-2 flex items-center justify-center">
                {agent.model || 'gpt-4o'}
              </Badge>
            </div>
          </div>

          {/* Conversation History Panel */}
          {showConversations && (
            <div
              className={cn(
                'mt-3 border rounded-md bg-muted/50 transition-all',
                isFullscreen ? 'p-3 md:p-4 mx-0 md:mx-0' : 'p-3 mx-0',
              )}
            >
              <div
                className={cn(
                  'flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 xs:gap-0 mb-3',
                  isFullscreen ? 'pb-1' : '',
                )}
              >
                <h3 className={cn('font-medium', isFullscreen ? 'text-base' : 'text-sm')}>
                  Conversation History
                </h3>
                <Button
                  variant="default"
                  size={isFullscreen && !isMobile ? 'default' : 'sm'}
                  onClick={startNewConversation}
                  className="w-full xs:w-auto"
                >
                  <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                  New Conversation
                </Button>
              </div>

              {loadingConversations ? (
                <div className="flex justify-center py-6">
                  <Loader2
                    className={cn(
                      'animate-spin text-muted-foreground',
                      isFullscreen ? 'h-6 w-6' : 'h-5 w-5',
                    )}
                  />
                </div>
              ) : conversations && conversations.length > 0 ? (
                <div
                  className={cn(
                    'space-y-2 overflow-y-auto pr-2',
                    isFullscreen ? 'max-h-[250px]' : 'max-h-[200px]',
                  )}
                >
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={cn(
                        'flex justify-between items-center p-2 rounded-md hover:bg-muted cursor-pointer transition-colors',
                        activeConversation?.id === conversation.id
                          ? 'bg-muted border border-primary/30'
                          : 'border border-transparent',
                      )}
                      onClick={() => loadConversation(conversation)}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm truncate">{conversation.title}</span>
                      </div>
                      <div className="flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversationMutation.mutate(conversation.id);
                          }}
                          title="Delete conversation"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-destructive"
                          >
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
                <div
                  className={cn(
                    'py-6 text-center text-muted-foreground',
                    isFullscreen ? 'text-base' : 'text-sm',
                  )}
                >
                  <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  No saved conversations.
                  <br />
                  Start a new one to save your chat history.
                </div>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent
          className={cn(
            'flex-grow overflow-hidden p-0',
            isFullscreen ? 'px-0 md:px-0' : isMobile ? 'px-2' : '',
          )}
        >
          <ScrollArea
            className={cn(
              getChatHeight(),
              'px-2 py-3 md:px-4',
              isFullscreen ? 'px-3 md:px-6' : '',
              mounted ? 'transition-all duration-300' : '',
            )}
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Bot
                  className={cn(
                    'mb-4 opacity-20 transition-all',
                    isFullscreen ? 'h-16 w-16' : 'h-12 w-12',
                  )}
                />
                <p className={cn('text-center', isFullscreen && !isMobile ? 'text-lg' : '')}>
                  Start a conversation with your agent
                </p>
                <p
                  className={cn(
                    'text-sm text-center max-w-[280px] mx-auto mt-2',
                    isFullscreen && !isMobile ? 'text-base max-w-[340px]' : '',
                  )}
                >
                  {agent.name ? agent.name : 'This agent'} will respond based on your configuration
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={cn(
                        'relative rounded-lg',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground max-w-[85%] md:max-w-[75%] px-3 py-2'
                          : 'bg-muted max-w-[90%] md:max-w-[80%] px-3 py-2.5',
                      )}
                    >
                      <div
                        className={cn(
                          'flex items-center gap-1 mb-1',
                          isFullscreen ? 'mb-1.5' : '',
                          'text-xs font-medium',
                        )}
                      >
                        {message.role === 'user' ? (
                          <>
                            <span>You</span>
                            <User className="h-3 w-3" />
                            <span className="ml-auto text-[10px] opacity-70">
                              {formatMessageTime(message.timestamp)}
                            </span>
                          </>
                        ) : (
                          <>
                            <Bot className="h-3 w-3" />
                            <span className="truncate max-w-[100px] md:max-w-[160px]">
                              {agent.name || 'Agent'}
                            </span>
                            <span className="ml-auto text-[10px] opacity-70">
                              {formatMessageTime(message.timestamp)}
                            </span>
                          </>
                        )}
                      </div>
                      <div
                        className={cn(
                          'whitespace-pre-wrap',
                          isFullscreen || !isMobile
                            ? 'text-sm leading-relaxed'
                            : 'text-[14px] leading-snug',
                        )}
                      >
                        {(() => {
                          try {
                            // Check if the content looks like JSON but only render as normal text
                            if (
                              message.content?.startsWith('{') &&
                              message.content?.includes('content')
                            ) {
                              // Parse the JSON-like structure and extract content
                              const formattedContent = message.content
                                .split(/(?<=})\s*(?={)/) // Split by JSON objects
                                .map((chunk) => {
                                  try {
                                    const parsed = JSON.parse(chunk);
                                    return parsed.content || '';
                                  } catch (e) {
                                    return chunk;
                                  }
                                })
                                .join('');
                              return formattedContent;
                            }
                            // Not JSON, just return the content
                            return message.content;
                          } catch (e) {
                            // If any error, return the original content
                            return message.content;
                          }
                        })()}
                        {message.isStreaming && <span className="animate-pulse">▊</span>}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {tokenUsage && showTokens && (
            <div
              className={cn(
                'mt-1 flex flex-wrap justify-between text-xs text-muted-foreground border-t pt-2',
                isFullscreen || isMobile ? 'px-3' : 'px-4',
              )}
            >
              <span>Total: {tokenUsage.totalTokens}</span>
              <span>Prompt: {tokenUsage.promptTokens}</span>
              <span>Completion: {tokenUsage.completionTokens}</span>
            </div>
          )}
        </CardContent>

        <CardFooter
          className={cn(
            'border-t transition-all',
            isFullscreen ? 'px-3 py-3 md:px-6 md:py-4' : isMobile ? 'px-3 py-3' : 'px-6 py-4',
          )}
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <div
                      className={cn(
                        'flex items-center justify-between',
                        isFullscreen ? 'mb-2' : 'mb-1',
                      )}
                    >
                      <div className="flex gap-2">
                        {tokenUsage && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={cn('transition-all', isFullscreen ? 'h-8 w-8' : 'h-7 w-7')}
                            onClick={() => setShowTokens(!showTokens)}
                            title="Toggle Token Usage"
                          >
                            <Info className={isFullscreen ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
                            <span className="sr-only">Tokens</span>
                          </Button>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {messages.length > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={cn('transition-all', isFullscreen ? 'h-8 w-8' : 'h-7 w-7')}
                            onClick={clearChat}
                            title="Clear Chat"
                          >
                            <RotateCcw className={isFullscreen ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
                            <span className="sr-only">Clear</span>
                          </Button>
                        )}
                      </div>
                    </div>

                    <FormControl>
                      <div className="flex space-x-2">
                        <Textarea
                          placeholder="Type your message here..."
                          className={cn(
                            'flex-grow resize-none',
                            isFullscreen
                              ? 'min-h-[80px] md:min-h-[100px] text-base'
                              : 'min-h-[70px] text-sm',
                          )}
                          {...field}
                          disabled={isStreaming || sendMessageMutation.isPending}
                        />
                        <Button
                          type="submit"
                          size="icon"
                          className={cn(
                            'self-end transition-all',
                            isFullscreen ? 'h-10 w-10 md:h-12 md:w-12' : 'h-9 w-9',
                          )}
                          disabled={isStreaming || sendMessageMutation.isPending || !field.value}
                        >
                          {isStreaming || sendMessageMutation.isPending ? (
                            <Loader2
                              className={cn('animate-spin', isFullscreen ? 'h-5 w-5' : 'h-4 w-4')}
                            />
                          ) : (
                            <Send className={isFullscreen ? 'h-5 w-5' : 'h-4 w-4'} />
                          )}
                        </Button>
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
    </div>
  );
}

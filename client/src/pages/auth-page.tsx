import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertUserSchema } from '@shared/schema';
import { Bot } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation } from 'wouter';
import { z } from 'zod';

const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = insertUserSchema
  .extend({
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onLoginSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  const onRegisterSubmit = (values: RegisterFormValues) => {
    // Remove confirmPassword as it's not needed for the API
    const { confirmPassword, ...registerData } = values;
    registerMutation.mutate(registerData);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">AI Agent Generator</h1>
            </div>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Login</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form
                      onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your username"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Enter your password"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? 'Logging in...' : 'Login'}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  <div className="text-xs text-muted-foreground text-center w-full mb-1">
                    Developer Quick Login
                  </div>
                  <div className="flex gap-2 w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs h-8"
                      onClick={() => {
                        loginForm.setValue('username', 'developer');
                        loginForm.setValue('password', 'developer123');
                        loginForm.handleSubmit(onLoginSubmit)();
                      }}
                    >
                      Dev Login
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs h-8"
                      onClick={() => {
                        registerForm.setValue(
                          'username',
                          'developer' + Math.floor(Math.random() * 1000),
                        );
                        const password = 'developer123';
                        registerForm.setValue('password', password);
                        registerForm.setValue('confirmPassword', password);
                        registerForm.handleSubmit(onRegisterSubmit)();
                      }}
                    >
                      Create Dev Account
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1 text-xs h-8"
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/devlogin', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            credentials: 'include',
                          });

                          if (response.ok) {
                            window.location.href = '/'; // Force reload to update auth state
                          }
                        } catch (error) {
                          console.error('Dev quick login failed:', error);
                        }
                      }}
                    >
                      Quick Login
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create an account</CardTitle>
                  <CardDescription>
                    Enter your details to create a new account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form
                      onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Choose a username"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Choose a password"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Confirm your password"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending
                          ? 'Creating account...'
                          : 'Register'}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side - Hero */}
      <div className="hidden md:flex flex-1 bg-primary/5 p-8 items-center justify-center">
        <div className="max-w-md">
          <h2 className="text-3xl font-bold mb-4">
            Build powerful AI agents with ease
          </h2>
          <p className="text-muted-foreground mb-6">
            Create, manage, and deploy AI-powered agents through an intuitive
            step-by-step interface. Our platform offers real-time AI response
            previews, prompt engineering tools, and REST API integration for
            automation.
          </p>
          <ul className="space-y-2">
            <li className="flex items-center">
              <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
              </div>
              <span>Multi-step wizard for AI agent creation</span>
            </li>
            <li className="flex items-center">
              <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
              </div>
              <span>Live AI response previews</span>
            </li>
            <li className="flex items-center">
              <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
              </div>
              <span>Prompt engineering tools</span>
            </li>
            <li className="flex items-center">
              <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
              </div>
              <span>REST API for automation</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import MainLayout from '@/layouts/MainLayout';
import { useAuth } from '@/hooks/use-auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/providers/ThemeProvider';
import { Moon, Sun, Info, Loader2, Laptop } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const profileFormSchema = z
  .object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Please enter a valid email'),
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(6, 'New password must be at least 6 characters')
      .optional()
      .or(z.literal('')),
    confirmPassword: z.string().optional().or(z.literal('')),
  })
  .refine((data) => !data.newPassword || data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

const apiKeySchema = z.object({
  apiKey: z.string().min(1, 'API Key is required'),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type ApiKeyFormValues = z.infer<typeof apiKeySchema>;

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    platform: true,
    marketing: false,
  });

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: user?.username || '',
      email: 'user@example.com', // This would come from API in real implementation
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const apiKeyForm = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      apiKey: '', // We'll populate this from the API
    },
  });

  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [apiKeySubmitting, setApiKeySubmitting] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [apiKeySuccess, setApiKeySuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  // Check if user has an API key
  useEffect(() => {
    async function checkApiKey() {
      try {
        const response = await fetch('/api/user/apikey', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.hasApiKey) {
            // If they have a key, we'll put a placeholder
            apiKeyForm.setValue('apiKey', '········');
          }
        }
      } catch (error) {
        console.error('Failed to check API key status:', error);
        // Still allow the form to work even if the check fails
        apiKeyForm.setValue('apiKey', '');
      }
    }

    // Update the profile form with user data when available
    if (user) {
      // Update username from auth context
      profileForm.setValue('username', user.username || '');

      // Attempt to check API key, but don't block rendering if it fails
      checkApiKey().catch((err) => {
        console.error('API key check failed but continuing', err);
      });
    }
  }, [user, profileForm, apiKeyForm]);

  const onProfileSubmit = async (values: ProfileFormValues) => {
    try {
      setProfileSubmitting(true);
      setProfileError(null);
      setProfileSuccess(false);

      // If we're changing password, use the password endpoint
      if (
        values.currentPassword &&
        values.newPassword &&
        values.newPassword === values.confirmPassword
      ) {
        setPasswordSubmitting(true);

        const passwordResponse = await fetch('/api/user/password', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
          }),
        });

        if (!passwordResponse.ok) {
          const errorData = await passwordResponse.json();
          throw new Error(errorData.error || 'Failed to update password');
        }

        setPasswordSuccess(true);
        // Clear the password fields
        profileForm.setValue('currentPassword', '');
        profileForm.setValue('newPassword', '');
        profileForm.setValue('confirmPassword', '');
      }

      // Update profile information
      const profileResponse = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: values.username,
          email: values.email,
        }),
      });

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      setProfileSuccess(true);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setProfileError(error.message || 'An error occurred while updating your profile');
    } finally {
      setProfileSubmitting(false);
      setPasswordSubmitting(false);
    }
  };

  const onApiKeySubmit = async (values: ApiKeyFormValues) => {
    try {
      setApiKeySubmitting(true);
      setApiKeyError(null);
      setApiKeySuccess(false);

      const response = await fetch('/api/user/apikey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          apiKey: values.apiKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save API key');
      }

      setApiKeySuccess(true);
    } catch (error: any) {
      console.error('Error saving API key:', error);
      setApiKeyError(error.message || 'An error occurred while saving your API key');
    } finally {
      setApiKeySubmitting(false);
    }
  };

  return (
    <MainLayout title="Settings">
      <div className="py-6 max-w-4xl mx-auto">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="api">API Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Manage your account details and security settings</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      <FormField
                        control={profileForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="pt-4 border-t">
                      <h3 className="text-lg font-medium mb-4">Change Password</h3>
                      <div className="space-y-4">
                        <FormField
                          control={profileForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={profileForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={profileForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm New Password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {profileError && (
                      <div className="text-sm text-destructive mt-2">Error: {profileError}</div>
                    )}

                    {profileSuccess && (
                      <div className="text-sm text-green-600 dark:text-green-500 mt-2">
                        Profile information updated successfully!
                      </div>
                    )}

                    {passwordSuccess && (
                      <div className="text-sm text-green-600 dark:text-green-500 mt-2">
                        Password updated successfully!
                      </div>
                    )}

                    <Button type="submit" disabled={profileSubmitting}>
                      {profileSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize the look and feel of the application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Theme</h3>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <Button
                        type="button"
                        variant={theme === 'light' ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => {
                          try {
                            setTheme('light');
                            toast({
                              title: 'Theme changed',
                              description: 'Light theme applied successfully',
                            });
                          } catch (error) {
                            console.error('Failed to set light theme:', error);
                            toast({
                              title: 'Theme change failed',
                              description: 'There was an error applying the theme',
                              variant: 'destructive',
                            });
                          }
                        }}
                      >
                        <Sun className="mr-2 h-4 w-4" />
                        Light
                      </Button>
                      <Button
                        type="button"
                        variant={theme === 'dark' ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => {
                          try {
                            setTheme('dark');
                            toast({
                              title: 'Theme changed',
                              description: 'Dark theme applied successfully',
                            });
                          } catch (error) {
                            console.error('Failed to set dark theme:', error);
                            toast({
                              title: 'Theme change failed',
                              description: 'There was an error applying the theme',
                              variant: 'destructive',
                            });
                          }
                        }}
                      >
                        <Moon className="mr-2 h-4 w-4" />
                        Dark
                      </Button>
                      <Button
                        type="button"
                        variant={theme === 'system' ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => {
                          try {
                            setTheme('system');
                            toast({
                              title: 'Theme changed',
                              description: 'System preference applied',
                            });
                          } catch (error) {
                            console.error('Failed to set system theme:', error);
                            toast({
                              title: 'Theme change failed',
                              description: 'There was an error applying the theme',
                              variant: 'destructive',
                            });
                          }
                        }}
                      >
                        <Laptop className="mr-2 h-4 w-4" />
                        System
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure how and when you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h3 className="text-base font-medium">Email Notifications</h3>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={notifications.email}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, email: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h3 className="text-base font-medium">Platform Notifications</h3>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications within the platform
                      </p>
                    </div>
                    <Switch
                      checked={notifications.platform}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, platform: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h3 className="text-base font-medium">Marketing Notifications</h3>
                      <p className="text-sm text-muted-foreground">
                        Receive updates about new features and offers
                      </p>
                    </div>
                    <Switch
                      checked={notifications.marketing}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, marketing: checked })
                      }
                    />
                  </div>
                </div>

                <Button>Save Preferences</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>API Settings</CardTitle>
                <CardDescription>Configure API keys and integration options</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...apiKeyForm}>
                  <form onSubmit={apiKeyForm.handleSubmit(onApiKeySubmit)} className="space-y-6">
                    <div className="space-y-4">
                      <FormField
                        control={apiKeyForm.control}
                        name="apiKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>OpenAI API Key</FormLabel>
                            <div className="flex items-center gap-2">
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <Button type="button" variant="outline" size="icon">
                                <Info className="h-4 w-4" />
                              </Button>
                            </div>
                            <FormDescription>
                              Your OpenAI API key is required for AI functionality. Get one from{' '}
                              <a
                                href="https://platform.openai.com/account/api-keys"
                                className="text-primary hover:underline"
                                target="_blank"
                                rel="noreferrer"
                              >
                                OpenAI
                              </a>
                              .
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {apiKeyError && (
                      <div className="text-sm text-destructive mt-2">Error: {apiKeyError}</div>
                    )}

                    {apiKeySuccess && (
                      <div className="text-sm text-green-600 dark:text-green-500 mt-2">
                        API key saved successfully!
                      </div>
                    )}

                    <Button type="submit" disabled={apiKeySubmitting}>
                      {apiKeySubmitting ? 'Saving...' : 'Save API Key'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

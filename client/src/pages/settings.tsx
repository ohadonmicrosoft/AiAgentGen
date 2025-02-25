import { useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/providers/ThemeProvider";
import { Moon, Sun, Info } from "lucide-react";

const profileFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters").optional().or(z.literal("")),
  confirmPassword: z.string().optional().or(z.literal("")),
}).refine(data => !data.newPassword || data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const apiKeySchema = z.object({
  apiKey: z.string().min(1, "API Key is required"),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type ApiKeyFormValues = z.infer<typeof apiKeySchema>;

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState({
    email: true,
    platform: true,
    marketing: false,
  });

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: user?.username || "",
      email: "user@example.com", // This would come from API in real implementation
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const apiKeyForm = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      apiKey: process.env.OPENAI_API_KEY || "",
    },
  });

  const onProfileSubmit = (values: ProfileFormValues) => {
    console.log(values);
    // Here you would send the data to your API
  };

  const onApiKeySubmit = (values: ApiKeyFormValues) => {
    console.log(values);
    // Here you would send the data to your API
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
                <CardDescription>
                  Manage your account details and security settings
                </CardDescription>
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

                    <Button type="submit">Save Changes</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="appearance" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize the look and feel of the application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Theme</h3>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      <Button
                        type="button"
                        variant={theme === "light" ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => setTheme("light")}
                      >
                        <Sun className="mr-2 h-4 w-4" />
                        Light
                      </Button>
                      <Button
                        type="button"
                        variant={theme === "dark" ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => setTheme("dark")}
                      >
                        <Moon className="mr-2 h-4 w-4" />
                        Dark
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
                <CardDescription>
                  Configure how and when you receive notifications
                </CardDescription>
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
                      onCheckedChange={(checked) => setNotifications({...notifications, email: checked})}
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
                      onCheckedChange={(checked) => setNotifications({...notifications, platform: checked})}
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
                      onCheckedChange={(checked) => setNotifications({...notifications, marketing: checked})}
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
                <CardDescription>
                  Configure API keys and integration options
                </CardDescription>
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
                              Your OpenAI API key is required for AI functionality. Get one from <a href="https://platform.openai.com/account/api-keys" className="text-primary hover:underline" target="_blank" rel="noreferrer">OpenAI</a>.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Button type="submit">Save API Key</Button>
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

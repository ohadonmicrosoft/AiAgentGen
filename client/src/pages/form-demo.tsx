import { AnimatedFormField } from '@/components/ui/animated-form-field';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import MainLayout from '@/layouts/MainLayout';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Define schema
const formSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof formSchema>;

export default function FormDemo() {
  const prefersReducedMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState('standard');
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Standard form with default components
  const standardForm = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Form with floating label inputs
  const floatingLabelForm = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Form with animated form fields
  const animatedForm = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (
    values: FormValues,
    form: 'standard' | 'floating' | 'animated',
  ) => {
    console.log(`Form submitted (${form}):`, values);
    setFormSubmitted(true);
    setTimeout(() => {
      setFormSubmitted(false);
    }, 3000);
  };

  return (
    <MainLayout title="Form Enhancements Demo">
      <div className="container mx-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
        >
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Form Animation Examples</h1>
            <p className="text-muted-foreground mb-8">
              This demo showcases different approaches to form animations and
              enhancements, from standard forms to fully animated form controls
              with validation feedback.
            </p>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-3 mb-8">
                <TabsTrigger value="standard">Standard Form</TabsTrigger>
                <TabsTrigger value="floating">Floating Labels</TabsTrigger>
                <TabsTrigger value="animated">Fully Animated</TabsTrigger>
              </TabsList>

              {/* Standard Form */}
              <TabsContent value="standard">
                <Card>
                  <CardHeader>
                    <CardTitle>Standard Form</CardTitle>
                    <CardDescription>
                      Basic form with standard components and minimal
                      animations.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...standardForm}>
                      <form
                        onSubmit={standardForm.handleSubmit((values) =>
                          onSubmit(values, 'standard'),
                        )}
                        className="space-y-6"
                      >
                        <FormField
                          control={standardForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter your name"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Your full name as it appears on your ID.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={standardForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter your email"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={standardForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="Create a password"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={standardForm.control}
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

                        <Button type="submit" className="w-full">
                          Submit
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Floating Label Form */}
              <TabsContent value="floating">
                <Card>
                  <CardHeader>
                    <CardTitle>Floating Label Form</CardTitle>
                    <CardDescription>
                      Form with animated floating labels and validation
                      feedback.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...floatingLabelForm}>
                      <form
                        onSubmit={floatingLabelForm.handleSubmit((values) =>
                          onSubmit(values, 'floating'),
                        )}
                        className="space-y-6"
                      >
                        <FormField
                          control={floatingLabelForm.control}
                          name="name"
                          render={({ field, fieldState }) => (
                            <FormItem>
                              <FormControl>
                                <FloatingLabelInput
                                  label="Name"
                                  error={fieldState.error?.message}
                                  success={
                                    field.value?.length >= 2 &&
                                    !fieldState.error
                                  }
                                  required
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Your full name as it appears on your ID.
                              </FormDescription>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={floatingLabelForm.control}
                          name="email"
                          render={({ field, fieldState }) => (
                            <FormItem>
                              <FormControl>
                                <FloatingLabelInput
                                  label="Email"
                                  error={fieldState.error?.message}
                                  success={
                                    field.value?.includes('@') &&
                                    !fieldState.error
                                  }
                                  required
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={floatingLabelForm.control}
                          name="password"
                          render={({ field, fieldState }) => (
                            <FormItem>
                              <FormControl>
                                <FloatingLabelInput
                                  label="Password"
                                  type="password"
                                  error={fieldState.error?.message}
                                  success={
                                    field.value?.length >= 8 &&
                                    !fieldState.error
                                  }
                                  required
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={floatingLabelForm.control}
                          name="confirmPassword"
                          render={({ field, fieldState }) => (
                            <FormItem>
                              <FormControl>
                                <FloatingLabelInput
                                  label="Confirm Password"
                                  type="password"
                                  error={fieldState.error?.message}
                                  success={
                                    field.value ===
                                      floatingLabelForm.getValues('password') &&
                                    field.value?.length > 0 &&
                                    !fieldState.error
                                  }
                                  required
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <Button type="submit" className="w-full">
                          Submit
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Fully Animated Form */}
              <TabsContent value="animated">
                <Card>
                  <CardHeader>
                    <CardTitle>Fully Animated Form</CardTitle>
                    <CardDescription>
                      Enhanced form with animated form fields, validation, and
                      feedback.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...animatedForm}>
                      <form
                        onSubmit={animatedForm.handleSubmit((values) =>
                          onSubmit(values, 'animated'),
                        )}
                        className="space-y-6"
                      >
                        <AnimatedFormField
                          control={animatedForm.control}
                          name="name"
                          label="Name"
                          placeholder="Enter your name"
                          description="Your full name as it appears on your ID."
                          floatingLabel
                          showSuccessState
                          rules={{ required: 'Name is required' }}
                        />

                        <AnimatedFormField
                          control={animatedForm.control}
                          name="email"
                          label="Email"
                          placeholder="Enter your email"
                          floatingLabel
                          showSuccessState
                          rules={{ required: 'Email is required' }}
                        />

                        <AnimatedFormField
                          control={animatedForm.control}
                          name="password"
                          label="Password"
                          type="password"
                          placeholder="Create a password"
                          floatingLabel
                          showSuccessState
                          rules={{ required: 'Password is required' }}
                        />

                        <AnimatedFormField
                          control={animatedForm.control}
                          name="confirmPassword"
                          label="Confirm Password"
                          type="password"
                          placeholder="Confirm your password"
                          floatingLabel
                          showSuccessState
                          rules={{ required: 'Please confirm your password' }}
                        />

                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{
                            duration: prefersReducedMotion ? 0 : 0.2,
                          }}
                        >
                          <Button type="submit" className="w-full">
                            Submit
                          </Button>
                        </motion.div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Success message on submit */}
            <motion.div
              className="mt-6"
              initial={{ opacity: 0, height: 0 }}
              animate={{
                opacity: formSubmitted ? 1 : 0,
                height: formSubmitted ? 'auto' : 0,
              }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-green-500/10 text-green-600 dark:text-green-400 p-4 rounded-lg">
                <p className="font-medium text-center">
                  Form submitted successfully!
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}

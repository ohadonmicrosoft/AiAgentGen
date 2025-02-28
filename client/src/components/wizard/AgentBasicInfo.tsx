import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { HeadphonesIcon, Settings, ShoppingCart } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const formSchema = z.object({
  name: z.string().min(3, 'Agent name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  type: z.enum(['customer-support', 'sales', 'custom']),
});

type FormValues = z.infer<typeof formSchema>;

interface AgentBasicInfoProps {
  formData: any;
  updateFormData: (data: Partial<any>) => void;
  onNext: () => void;
  preview?: boolean;
}

export default function AgentBasicInfo({
  formData,
  updateFormData,
  onNext,
  preview = false,
}: AgentBasicInfoProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: formData.name,
      description: formData.description,
      type: formData.type,
    },
  });

  function onSubmit(values: FormValues) {
    updateFormData(values);
    onNext();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="mb-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Agent Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter agent name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mb-4">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="What is this agent's purpose?" rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mb-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Agent Type</FormLabel>
                <FormControl>
                  <RadioGroup
                    className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-2"
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <div
                      className={`relative p-4 border rounded-lg cursor-pointer ${
                        field.value === 'customer-support'
                          ? 'border-primary ring-2 ring-primary/50'
                          : 'border-border'
                      }`}
                    >
                      <RadioGroupItem
                        value="customer-support"
                        id="agent-type-customer"
                        className="sr-only"
                      />
                      <Label
                        htmlFor="agent-type-customer"
                        className="flex flex-col items-center cursor-pointer"
                      >
                        <div className="p-2 mb-2 rounded-full bg-blue-100 dark:bg-blue-900">
                          <HeadphonesIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-sm font-medium">Customer Support</span>
                      </Label>
                    </div>

                    <div
                      className={`relative p-4 border rounded-lg cursor-pointer ${
                        field.value === 'sales'
                          ? 'border-primary ring-2 ring-primary/50'
                          : 'border-border'
                      }`}
                    >
                      <RadioGroupItem value="sales" id="agent-type-sales" className="sr-only" />
                      <Label
                        htmlFor="agent-type-sales"
                        className="flex flex-col items-center cursor-pointer"
                      >
                        <div className="p-2 mb-2 rounded-full bg-green-100 dark:bg-green-900">
                          <ShoppingCart className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-sm font-medium">Sales Assistant</span>
                      </Label>
                    </div>

                    <div
                      className={`relative p-4 border rounded-lg cursor-pointer ${
                        field.value === 'custom'
                          ? 'border-primary ring-2 ring-primary/50'
                          : 'border-border'
                      }`}
                    >
                      <RadioGroupItem value="custom" id="agent-type-custom" className="sr-only" />
                      <Label
                        htmlFor="agent-type-custom"
                        className="flex flex-col items-center cursor-pointer"
                      >
                        <div className="p-2 mb-2 rounded-full bg-primary/10">
                          <Settings className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-sm font-medium">Custom Agent</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end mt-6 space-x-3">
          <Button type="button" variant="outline" disabled={preview}>
            Cancel
          </Button>
          <Button type="submit" disabled={preview}>
            Continue
          </Button>
        </div>
      </form>
    </Form>
  );
}

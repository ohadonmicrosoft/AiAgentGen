import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const formSchema = z.object({
  temperature: z.number().min(0).max(1),
  maxTokens: z.number().min(100).max(8000),
  model: z.string(),
  responseStyle: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

interface AgentConfigurationProps {
  formData: any;
  updateFormData: (data: Partial<any>) => void;
  onNext: () => void;
  onBack: () => void;
  preview?: boolean;
}

export default function AgentConfiguration({
  formData,
  updateFormData,
  onNext,
  onBack,
  preview = false,
}: AgentConfigurationProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      temperature: formData.temperature,
      maxTokens: formData.maxTokens,
      model: formData.model,
      responseStyle: formData.responseStyle,
    },
  });

  function onSubmit(values: FormValues) {
    updateFormData(values);
    onNext();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>AI Model</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an AI model" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="gpt-4o">GPT-4o (Latest & Most Capable)</SelectItem>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select the AI model that will power your agent. Different models have different
                  capabilities and costs.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="temperature"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Temperature: {field.value.toFixed(1)}</FormLabel>
                <FormControl>
                  <Slider
                    min={0}
                    max={1}
                    step={0.1}
                    defaultValue={[field.value]}
                    onValueChange={(values) => field.onChange(values[0])}
                  />
                </FormControl>
                <FormDescription>
                  Controls randomness: 0 is focused and deterministic, 1 is more creative and
                  random.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxTokens"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Tokens: {field.value}</FormLabel>
                <FormControl>
                  <Slider
                    min={100}
                    max={8000}
                    step={100}
                    defaultValue={[field.value]}
                    onValueChange={(values) => field.onChange(values[0])}
                  />
                </FormControl>
                <FormDescription>
                  Maximum number of tokens that can be generated in the response.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="responseStyle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Response Style</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a response style" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Choose the tone of your AI agent's responses.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
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

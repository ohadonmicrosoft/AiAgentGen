import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

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
                <FormLabel>System Prompt</FormLabel>
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

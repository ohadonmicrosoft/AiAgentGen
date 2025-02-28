import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { cn } from '@/lib/utils';
import {
  FormField,
  FormItem,
  FormControl,
  FormDescription,
  FormMessage,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ControllerProps, FieldPath, FieldValues } from 'react-hook-form';

interface AnimatedFormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<ControllerProps<TFieldValues, TName>, 'render'> {
  label: string;
  description?: string;
  placeholder?: string;
  type?: React.InputHTMLAttributes<HTMLInputElement>['type'];
  className?: string;
  floatingLabel?: boolean;
  showSuccessState?: boolean;
  /** Optional className for the input element */
  inputClassName?: string;
}

export function AnimatedFormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  description,
  placeholder,
  type = 'text',
  className,
  floatingLabel = true,
  showSuccessState = false,
  inputClassName,
  ...props
}: AnimatedFormFieldProps<TFieldValues, TName>) {
  const prefersReducedMotion = useReducedMotion();

  // Get transition based on reduced motion preference
  const getTransition = (type: 'spring' | 'tween' = 'spring') => {
    if (prefersReducedMotion) return { duration: 0 };
    return type === 'spring'
      ? { type: 'spring', stiffness: 500, damping: 30 }
      : { type: 'tween', duration: 0.2 };
  };

  return (
    <FormField
      {...props}
      render={({ field, fieldState }) => {
        const { error } = fieldState;
        const hasValue = field.value !== undefined && field.value !== '';
        const isSuccess = showSuccessState && !error && hasValue;

        return (
          <FormItem className={cn('relative', className)}>
            {!floatingLabel && (
              <FormLabel>
                {label}
                {/* Required indicator */}
                {props.rules?.required && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </FormLabel>
            )}

            <FormControl>
              <div className="relative">
                <Input
                  {...field}
                  placeholder={placeholder || (floatingLabel ? ' ' : undefined)}
                  type={type}
                  className={cn(
                    'transition-all duration-200',
                    isSuccess && 'border-green-500 pr-8',
                    floatingLabel && 'pt-4',
                    inputClassName,
                  )}
                  // For floating label inputs we need additional handlers
                  {...(floatingLabel && {
                    'data-has-value': hasValue ? 'true' : 'false',
                    'data-has-error': error ? 'true' : 'false',
                  })}
                />

                {/* Floating label */}
                {floatingLabel && (
                  <motion.span
                    className={cn(
                      'absolute left-3 pointer-events-none',
                      'text-sm font-medium transition-colors',
                      error
                        ? 'text-destructive'
                        : field.value
                          ? 'text-muted-foreground'
                          : 'text-muted-foreground',
                      hasValue || field.name === document.activeElement?.id
                        ? 'text-xs translate-y-1'
                        : 'translate-y-3',
                    )}
                    initial={false}
                    animate={{
                      y:
                        hasValue || field.name === document.activeElement?.id
                          ? 4
                          : 10,
                      scale:
                        hasValue || field.name === document.activeElement?.id
                          ? 0.8
                          : 1,
                      x: 0,
                    }}
                    transition={getTransition()}
                  >
                    {label}
                    {props.rules?.required && (
                      <span className="text-destructive ml-1">*</span>
                    )}
                  </motion.span>
                )}

                {/* Success state icon */}
                {isSuccess && (
                  <motion.div
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={getTransition('tween')}
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                  </motion.div>
                )}
              </div>
            </FormControl>

            {description && <FormDescription>{description}</FormDescription>}

            {/* Animated error message */}
            <AnimatePresence mode="wait">
              {error?.message && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  transition={getTransition('tween')}
                >
                  <FormMessage />
                </motion.div>
              )}
            </AnimatePresence>
          </FormItem>
        );
      }}
    />
  );
}

// Simple check icon for success state
function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );
}

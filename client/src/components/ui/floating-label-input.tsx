import * as React from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useFormAnimations } from '@/hooks/use-form-animations';

export interface FloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  id?: string;
  success?: boolean;
}

const FloatingLabelInput = React.forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  ({ className, label, id, error, success, required, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(!!props.value || !!props.defaultValue);
    const inputId = id || React.useId();

    const { labelVariants, inputVariants, errorVariants, successIconVariants, getTransition } =
      useFormAnimations();

    // Determine which variant to use
    const getLabelVariant = () => {
      if (error) return 'error';
      if (isFocused) return 'focus';
      if (hasValue) return 'filled';
      return 'idle';
    };

    const getInputVariant = () => {
      if (error) return 'error';
      if (success) return 'success';
      if (isFocused) return 'focus';
      return 'idle';
    };

    // Handle input change to track if it has a value
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value);
      props.onChange && props.onChange(e);
    };

    return (
      <div className="relative">
        <motion.div
          className={cn('relative rounded-md border bg-transparent transition-colors', className)}
          variants={inputVariants}
          initial="idle"
          animate={getInputVariant()}
          transition={getTransition()}
        >
          <motion.label
            htmlFor={inputId}
            className={cn(
              'absolute left-3 pointer-events-none origin-[0%_0%] px-1',
              'inline-block font-medium cursor-text z-10',
              'bg-background',
              // Apply negative margins to create spacing for the background
              '-mt-0.5 -ml-0.5',
            )}
            initial={hasValue || props.placeholder ? 'filled' : 'idle'}
            animate={getLabelVariant()}
            variants={labelVariants}
            transition={getTransition()}
          >
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </motion.label>

          <input
            id={inputId}
            ref={ref}
            className={cn(
              'flex h-10 w-full rounded-md bg-transparent px-3 py-2 text-sm',
              'ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium',
              'focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
              'transition-shadow duration-200',
              'placeholder:text-transparent focus:placeholder:text-muted-foreground',
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={handleChange}
            {...props}
          />

          {/* Success icon */}
          <AnimatePresence>
            {success && !error && (
              <motion.div
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500"
                variants={successIconVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={getTransition('tween')}
              >
                <CheckCircleIcon className="h-4 w-4" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Error message with animation */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              className="text-destructive text-sm mt-1"
              variants={errorVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={getTransition('tween')}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  },
);

FloatingLabelInput.displayName = 'FloatingLabelInput';

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

export { FloatingLabelInput };

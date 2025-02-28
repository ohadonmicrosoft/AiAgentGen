import { ButtonProps } from '@/components/ui/button';
import { withErrorBoundary } from '@/components/ui/error-boundary';
import { cn } from '@/lib/utils';
import * as React from 'react';

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The alignment of the buttons in the group
   * @default "center"
   */
  align?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';

  /**
   * The spacing between buttons in the group
   * @default "default"
   */
  spacing?: 'none' | 'xs' | 'sm' | 'default' | 'md' | 'lg';

  /**
   * The orientation of the button group
   * @default "horizontal"
   */
  orientation?: 'horizontal' | 'vertical';

  /**
   * Whether buttons should have the same width
   * @default false
   */
  equalWidth?: boolean;

  /**
   * The children to render inside the button group
   */
  children: React.ReactNode;

  /**
   * Whether to wrap buttons on small screens
   * @default true
   */
  wrap?: boolean;
}

const ButtonGroupBase = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  (
    {
      className,
      align = 'center',
      spacing = 'default',
      orientation = 'horizontal',
      equalWidth = false,
      wrap = true,
      children,
      ...props
    },
    ref,
  ) => {
    // Map alignment values to Tailwind classes
    const alignmentClasses = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly',
    };

    // Map spacing values to Tailwind classes
    const spacingClasses = {
      none: 'gap-0',
      xs: 'gap-1',
      sm: 'gap-2',
      default: 'gap-3',
      md: 'gap-4',
      lg: 'gap-6',
    };

    // Process children to ensure they inherit consistent sizing if equalWidth is true
    const processedChildren = React.Children.map(children, (child) => {
      if (!React.isValidElement(child)) return child;

      // Only process button-like elements
      if (
        child.type &&
        (child.type.displayName === 'Button' ||
          child.type.displayName === 'TouchButton' ||
          child.type.displayName === 'ButtonBase')
      ) {
        return React.cloneElement(child, {
          className: cn(child.props.className, equalWidth && 'w-full'),
        });
      }

      return child;
    });

    return (
      <div
        ref={ref}
        className={cn(
          'flex',
          orientation === 'horizontal' ? 'flex-row' : 'flex-col',
          alignmentClasses[align],
          spacingClasses[spacing],
          wrap && orientation === 'horizontal' ? 'flex-wrap' : '',
          className,
        )}
        {...props}
      >
        {processedChildren}
      </div>
    );
  },
);

ButtonGroupBase.displayName = 'ButtonGroupBase';

// Wrap with error boundary
const ButtonGroup = withErrorBoundary(ButtonGroupBase);
ButtonGroup.displayName = 'ButtonGroup';

export { ButtonGroup };

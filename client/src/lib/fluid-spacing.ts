/**
 * Fluid Spacing System
 * 
 * This utility creates responsive spacing values based on viewport width,
 * allowing for dynamic margins, padding, and layout spacing.
 */

interface FluidSpacingOptions {
  minSize: number;
  maxSize: number;
  minWidth?: number; // Viewport width at which minSize applies
  maxWidth?: number; // Viewport width at which maxSize applies
  unit?: 'px' | 'rem' | 'em' | 'vh' | 'vw';
}

/**
 * Convert pixel value to specified unit
 */
export function convertToUnit(value: number, unit: 'px' | 'rem' | 'em' | 'vh' | 'vw'): string {
  switch (unit) {
    case 'rem':
      return `${value / 16}rem`;
    case 'em':
      return `${value / 16}em`;
    case 'vh':
      return `${value / 10}vh`;
    case 'vw':
      return `${value / 10}vw`;
    case 'px':
    default:
      return `${value}px`;
  }
}

/**
 * Generate fluid space value using CSS clamp function
 * This allows for responsive spacing that scales with viewport width
 */
export function fluidSpace({
  minSize,
  maxSize,
  minWidth = 320,
  maxWidth = 1200,
  unit = 'px'
}: FluidSpacingOptions): string {
  // Calculate the slope
  const slope = (maxSize - minSize) / (maxWidth - minWidth);
  
  // Calculate the intersection with y-axis (b in y = mx + b)
  const intersection = -minWidth * slope + minSize;
  
  // Convert to appropriate units
  const minSizeValue = convertToUnit(minSize, unit);
  const maxSizeValue = convertToUnit(maxSize, unit);
  
  // Calculate the preferred value using the slope formula
  // For preferred value, we use vw (viewport width) unit with calculated slope
  const preferredValue = `${slope * 100}vw + ${convertToUnit(intersection, unit)}`;
  
  // Build the CSS clamp function
  return `clamp(${minSizeValue}, ${preferredValue}, ${maxSizeValue})`;
}

/**
 * Predefined spacing scale for common spacing values
 */
export const fluidSpaceScale = {
  '3xs': fluidSpace({ minSize: 2, maxSize: 4 }),
  '2xs': fluidSpace({ minSize: 4, maxSize: 8 }),
  'xs': fluidSpace({ minSize: 8, maxSize: 12 }),
  'sm': fluidSpace({ minSize: 12, maxSize: 16 }),
  'md': fluidSpace({ minSize: 16, maxSize: 24 }),
  'lg': fluidSpace({ minSize: 24, maxSize: 32 }),
  'xl': fluidSpace({ minSize: 32, maxSize: 48 }),
  '2xl': fluidSpace({ minSize: 48, maxSize: 64 }),
  '3xl': fluidSpace({ minSize: 64, maxSize: 96 }),
  '4xl': fluidSpace({ minSize: 96, maxSize: 128 }),
};

/**
 * Generate spacing for container padding that adjusts based on viewport
 */
export function containerPadding({
  minPadding = 16,
  maxPadding = 40,
  minWidth = 320,
  maxWidth = 1200,
  unit = 'px'
}: Partial<FluidSpacingOptions>): string {
  return fluidSpace({
    minSize: minPadding,
    maxSize: maxPadding,
    minWidth,
    maxWidth,
    unit
  });
}

/**
 * Generate a responsive gap value for grid/flex layouts
 */
export function responsiveGap({
  minGap = 16,
  maxGap = 40,
  minWidth = 320,
  maxWidth = 1200,
  unit = 'px'
}: Partial<FluidSpacingOptions>): string {
  return fluidSpace({
    minSize: minGap,
    maxSize: maxGap,
    minWidth,
    maxWidth,
    unit
  });
}

/**
 * Generate content-aware spacing that adjusts based on content density
 */
export function contentAwareSpace(
  contentLength: number,
  { minSpace = 16, maxSpace = 40, threshold = 100 }: { minSpace?: number; maxSpace?: number; threshold?: number }
): string {
  // For longer content, use smaller spacing to conserve space
  const size = contentLength > threshold
    ? minSpace
    : maxSpace - ((maxSpace - minSpace) * (contentLength / threshold));
  
  return `${Math.max(minSpace, size)}px`;
}

/**
 * Calculate optimal spacing between related elements based on hierarchy
 */
export function hierarchicalSpacing(importance: 'primary' | 'secondary' | 'tertiary'): string {
  switch (importance) {
    case 'primary':
      return fluidSpace({ minSize: 24, maxSize: 48 });
    case 'secondary':
      return fluidSpace({ minSize: 16, maxSize: 32 });
    case 'tertiary':
      return fluidSpace({ minSize: 8, maxSize: 16 });
    default:
      return fluidSpace({ minSize: 16, maxSize: 32 });
  }
}

/**
 * Generate equal spacing on both sides (margin or padding) that is fluid
 */
export function fluidSymmetricSpace(size: keyof typeof fluidSpaceScale): { 
  paddingX: string;
  paddingY: string;
  marginX: string;
  marginY: string;
} {
  return {
    paddingX: fluidSpaceScale[size],
    paddingY: fluidSpaceScale[size],
    marginX: fluidSpaceScale[size],
    marginY: fluidSpaceScale[size],
  };
}

/**
 * Responsive container max-width based on content type
 */
export function contentMaxWidth(contentType: 'text' | 'ui' | 'full'): string {
  switch (contentType) {
    case 'text':
      // Optimal reading width (65ch ≈ 65 characters)
      return 'min(65ch, 100%)';
    case 'ui':
      // Standard UI container
      return fluidSpace({ minSize: 640, maxSize: 1200 });
    case 'full':
      // Full width with padding
      return '100%';
    default:
      return fluidSpace({ minSize: 640, maxSize: 1200 });
  }
} 
import { useMemo } from 'react';
import {
  fluidTypography,
  fluidTypeScale,
  fluidLineHeight,
  calculateOptimalLineLength,
} from '@/lib/fluid-typography';

export type TypeScaleKey = keyof typeof fluidTypeScale;

export interface FluidTypeOptions {
  size?: TypeScaleKey | number;
  lineHeight?: number | [number, number]; // Single value or [min, max]
  maxWidth?: number | boolean; // Character count or true for optimal
  fontWeight?: number;
  tracking?: string; // letter-spacing
  unit?: 'px' | 'rem' | 'em';
}

/**
 * Hook for using fluid typography in React components
 *
 * @example
 * const headingStyles = useFluidType({ size: 'h1', lineHeight: [1.1, 1.2], fontWeight: 700 });
 * return <h1 style={headingStyles}>Heading</h1>;
 *
 * @example
 * const bodyStyles = useFluidType({ size: 'body', lineHeight: 1.5, maxWidth: true });
 * return <p style={bodyStyles}>Paragraph with optimal line length</p>;
 */
export function useFluidType({
  size = 'body',
  lineHeight,
  maxWidth,
  fontWeight,
  tracking,
  unit = 'rem',
}: FluidTypeOptions = {}) {
  return useMemo(() => {
    const styles: Record<string, string | number> = {};

    // Calculate font size
    if (typeof size === 'string') {
      // Use predefined scale
      const { minSize, maxSize } = fluidTypeScale[size];
      styles.fontSize = fluidTypography({ minSize, maxSize, unit });
    } else if (typeof size === 'number') {
      // Use custom size (25% smaller on mobile)
      const minSize = size * 0.75;
      const maxSize = size;
      styles.fontSize = fluidTypography({ minSize, maxSize, unit });
    }

    // Calculate line height
    if (lineHeight) {
      if (Array.isArray(lineHeight)) {
        // Fluid line height between min and max
        const [min, max] = lineHeight;
        styles.lineHeight = fluidLineHeight(min, max);
      } else {
        // Fixed line height
        styles.lineHeight = lineHeight;
      }
    }

    // Calculate max width
    if (maxWidth) {
      if (maxWidth === true) {
        // Use optimal line length
        const currentSize =
          typeof size === 'string'
            ? fluidTypeScale[size].minSize
            : typeof size === 'number'
              ? size
              : 16;
        styles.maxWidth = calculateOptimalLineLength(currentSize);
      } else {
        // Use specified character count
        styles.maxWidth = calculateOptimalLineLength(16, maxWidth as number);
      }
    }

    // Add font weight if specified
    if (fontWeight) {
      styles.fontWeight = fontWeight;
    }

    // Add letter spacing if specified
    if (tracking) {
      styles.letterSpacing = tracking;
    }

    return styles;
  }, [size, lineHeight, maxWidth, fontWeight, tracking, unit]);
}

/**
 * Helper function to convert fluid type styles to CSS string
 * for use in CSS-in-JS or inline styles
 */
export function fluidTypeStyles(options: FluidTypeOptions = {}): string {
  const styles = useFluidType(options);
  return Object.entries(styles)
    .map(([key, value]) => {
      // Convert camelCase to kebab-case
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${cssKey}: ${value};`;
    })
    .join(' ');
}

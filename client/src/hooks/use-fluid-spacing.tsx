import { useMemo } from 'react';
import { fluidSpaceScale, contentMaxWidth, responsiveGap, containerPadding, hierarchicalSpacing } from '@/lib/fluid-spacing';

export type SpaceScaleKey = keyof typeof fluidSpaceScale;

interface FluidSpacingOptions {
  space?: SpaceScaleKey;
  gap?: SpaceScaleKey;
  padding?: SpaceScaleKey | { x?: SpaceScaleKey; y?: SpaceScaleKey; };
  margin?: SpaceScaleKey | { x?: SpaceScaleKey; y?: SpaceScaleKey; };
  maxWidth?: 'text' | 'ui' | 'full' | number;
  hierarchy?: 'primary' | 'secondary' | 'tertiary';
}

/**
 * Hook to provide fluid spacing values for components
 * 
 * @example
 * const { style } = useFluidSpacing({ 
 *   space: 'md', 
 *   padding: { x: 'lg', y: 'md' },
 *   maxWidth: 'text'
 * });
 */
export function useFluidSpacing(options: FluidSpacingOptions = {}) {
  const {
    space,
    gap,
    padding,
    margin,
    maxWidth,
    hierarchy
  } = options;
  
  // Build the style object based on provided options
  const style = useMemo(() => {
    const result: Record<string, string> = {};
    
    // Add spacing based on hierarchy if provided
    if (hierarchy) {
      result.margin = hierarchicalSpacing(hierarchy);
    }
    
    // General space value (gap)
    if (space) {
      result.gap = fluidSpaceScale[space];
    }
    
    // Specific gap value
    if (gap) {
      result.gap = fluidSpaceScale[gap];
    }
    
    // Handle padding (can be string or object with x/y)
    if (padding) {
      if (typeof padding === 'string') {
        result.padding = fluidSpaceScale[padding];
      } else {
        if (padding.x) result.paddingLeft = result.paddingRight = fluidSpaceScale[padding.x];
        if (padding.y) result.paddingTop = result.paddingBottom = fluidSpaceScale[padding.y];
      }
    }
    
    // Handle margin (can be string or object with x/y)
    if (margin) {
      if (typeof margin === 'string') {
        result.margin = fluidSpaceScale[margin];
      } else {
        if (margin.x) result.marginLeft = result.marginRight = fluidSpaceScale[margin.x];
        if (margin.y) result.marginTop = result.marginBottom = fluidSpaceScale[margin.y];
      }
    }
    
    // Handle maxWidth
    if (maxWidth) {
      if (typeof maxWidth === 'number') {
        result.maxWidth = `${maxWidth}px`;
      } else {
        result.maxWidth = contentMaxWidth(maxWidth);
      }
    }
    
    return result;
  }, [space, gap, padding, margin, maxWidth, hierarchy]);
  
  // Generate spacing classes for use with Tailwind
  const getSpacingClass = useMemo(() => {
    return (type: 'gap' | 'p' | 'px' | 'py' | 'm' | 'mx' | 'my', size: SpaceScaleKey): string => {
      return `fluid-${type}-${size}`;
    };
  }, []);
  
  return { style, getSpacingClass };
}

/**
 * Generate fluid container padding based on viewport width
 */
export function useContainerPadding(options: { 
  minPadding?: number; 
  maxPadding?: number; 
  minWidth?: number; 
  maxWidth?: number;
} = {}) {
  return useMemo(() => {
    return {
      padding: containerPadding(options)
    };
  }, [options.minPadding, options.maxPadding, options.minWidth, options.maxWidth]);
}

/**
 * Generate responsive gap values for grid/flex layouts
 */
export function useResponsiveGap(options: {
  minGap?: number;
  maxGap?: number;
  minWidth?: number;
  maxWidth?: number;
} = {}) {
  return useMemo(() => {
    return {
      gap: responsiveGap(options)
    };
  }, [options.minGap, options.maxGap, options.minWidth, options.maxWidth]);
}

/**
 * Convert fluidSpacing options to a className string for Tailwind
 * 
 * @example
 * const className = fluidSpacingToClassName({
 *   padding: { x: 'lg', y: 'md' },
 *   margin: { y: 'sm' }
 * });
 * // Result: "fluid-px-lg fluid-py-md fluid-my-sm"
 */
export function fluidSpacingToClassName(options: FluidSpacingOptions = {}): string {
  const classes: string[] = [];
  const { space, gap, padding, margin } = options;
  
  if (space) classes.push(`fluid-space-${space}`);
  if (gap) classes.push(`fluid-gap-${gap}`);
  
  if (padding) {
    if (typeof padding === 'string') {
      classes.push(`fluid-p-${padding}`);
    } else {
      if (padding.x) classes.push(`fluid-px-${padding.x}`);
      if (padding.y) classes.push(`fluid-py-${padding.y}`);
    }
  }
  
  if (margin) {
    if (typeof margin === 'string') {
      classes.push(`fluid-m-${margin}`);
    } else {
      if (margin.x) classes.push(`fluid-mx-${margin.x}`);
      if (margin.y) classes.push(`fluid-my-${margin.y}`);
    }
  }
  
  return classes.join(' ');
} 
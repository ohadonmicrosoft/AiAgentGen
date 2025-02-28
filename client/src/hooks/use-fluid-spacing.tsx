import { useMemo } from 'react';
import { 
  fluidSpaceScale, 
  contentMaxWidth, 
  responsiveGap, 
  containerPadding, 
  hierarchicalSpacing,
  deviceSpecificSpace
} from '@/lib/fluid-spacing';
import { useActiveBreakpoint } from './use-mobile';

export type SpaceScaleKey = keyof typeof fluidSpaceScale;

interface FluidSpacingOptions {
  space?: SpaceScaleKey;
  gap?: SpaceScaleKey;
  padding?: SpaceScaleKey | { x?: SpaceScaleKey; y?: SpaceScaleKey; };
  margin?: SpaceScaleKey | { x?: SpaceScaleKey; y?: SpaceScaleKey; };
  maxWidth?: 'text' | 'ui' | 'full' | number;
  hierarchy?: 'primary' | 'secondary' | 'tertiary';
  deviceSpecific?: boolean;
}

type DeviceType = 'mobile' | 'tablet' | 'desktop';

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
    hierarchy,
    deviceSpecific = false
  } = options;
  
  const activeBreakpoint = useActiveBreakpoint();
  
  // Determine current device type based on active breakpoint
  const currentDevice = useMemo((): DeviceType => {
    if (activeBreakpoint === 'sm' || activeBreakpoint === 'xs') return 'mobile';
    if (activeBreakpoint === 'md') return 'tablet';
    return 'desktop';
  }, [activeBreakpoint]);
  
  // Build the style object based on provided options
  const style = useMemo(() => {
    const result: Record<string, string> = {};
    
    // Add spacing based on hierarchy if provided
    if (hierarchy) {
      result.margin = hierarchicalSpacing(hierarchy);
    }
    
    // General space value (gap)
    if (space) {
      if (deviceSpecific && space !== 'form-gap' && space !== 'card-padding' && 
          space !== 'section-gap' && space !== 'container-padding') {
        // For standard sizes, map to device-specific spacing when deviceSpecific is true
        const sizeMap: Record<string, 'xs' | 'sm' | 'md' | 'lg' | 'xl'> = {
          '3xs': 'xs', '2xs': 'xs', 'xs': 'xs',
          'sm': 'sm',
          'md': 'md',
          'lg': 'lg',
          'xl': 'xl', '2xl': 'xl', '3xl': 'xl', '4xl': 'xl'
        };
        
        // Use the translated size if available, otherwise use 'md'
        const translatedSize = sizeMap[space] || 'md';
        result.gap = deviceSpecificSpace(currentDevice, translatedSize);
      } else {
        result.gap = fluidSpaceScale[space];
      }
    }
    
    // Specific gap value
    if (gap) {
      if (deviceSpecific && gap !== 'form-gap' && gap !== 'card-padding' && 
          gap !== 'section-gap' && gap !== 'container-padding') {
        // For standard sizes, map to device-specific spacing when deviceSpecific is true
        const sizeMap: Record<string, 'xs' | 'sm' | 'md' | 'lg' | 'xl'> = {
          '3xs': 'xs', '2xs': 'xs', 'xs': 'xs',
          'sm': 'sm',
          'md': 'md',
          'lg': 'lg',
          'xl': 'xl', '2xl': 'xl', '3xl': 'xl', '4xl': 'xl'
        };
        
        // Use the translated size if available, otherwise use 'md'
        const translatedSize = sizeMap[gap] || 'md';
        result.gap = deviceSpecificSpace(currentDevice, translatedSize);
      } else {
        result.gap = fluidSpaceScale[gap];
      }
    }
    
    // Handle padding (can be string or object with x/y)
    if (padding) {
      if (typeof padding === 'string') {
        if (deviceSpecific && padding !== 'form-gap' && padding !== 'card-padding' && 
            padding !== 'section-gap' && padding !== 'container-padding') {
          const sizeMap: Record<string, 'xs' | 'sm' | 'md' | 'lg' | 'xl'> = {
            '3xs': 'xs', '2xs': 'xs', 'xs': 'xs',
            'sm': 'sm',
            'md': 'md',
            'lg': 'lg',
            'xl': 'xl', '2xl': 'xl', '3xl': 'xl', '4xl': 'xl'
          };
          const translatedSize = sizeMap[padding] || 'md';
          result.padding = deviceSpecificSpace(currentDevice, translatedSize);
        } else {
          result.padding = fluidSpaceScale[padding];
        }
      } else {
        if (padding.x) {
          if (deviceSpecific && padding.x !== 'form-gap' && padding.x !== 'card-padding' && 
              padding.x !== 'section-gap' && padding.x !== 'container-padding') {
            const sizeMap: Record<string, 'xs' | 'sm' | 'md' | 'lg' | 'xl'> = {
              '3xs': 'xs', '2xs': 'xs', 'xs': 'xs',
              'sm': 'sm',
              'md': 'md',
              'lg': 'lg',
              'xl': 'xl', '2xl': 'xl', '3xl': 'xl', '4xl': 'xl'
            };
            const translatedSize = sizeMap[padding.x] || 'md';
            result.paddingLeft = result.paddingRight = deviceSpecificSpace(currentDevice, translatedSize);
          } else {
            result.paddingLeft = result.paddingRight = fluidSpaceScale[padding.x];
          }
        }
        
        if (padding.y) {
          if (deviceSpecific && padding.y !== 'form-gap' && padding.y !== 'card-padding' && 
              padding.y !== 'section-gap' && padding.y !== 'container-padding') {
            const sizeMap: Record<string, 'xs' | 'sm' | 'md' | 'lg' | 'xl'> = {
              '3xs': 'xs', '2xs': 'xs', 'xs': 'xs',
              'sm': 'sm',
              'md': 'md',
              'lg': 'lg',
              'xl': 'xl', '2xl': 'xl', '3xl': 'xl', '4xl': 'xl'
            };
            const translatedSize = sizeMap[padding.y] || 'md';
            result.paddingTop = result.paddingBottom = deviceSpecificSpace(currentDevice, translatedSize);
          } else {
            result.paddingTop = result.paddingBottom = fluidSpaceScale[padding.y];
          }
        }
      }
    }
    
    // Handle margin (can be string or object with x/y)
    if (margin) {
      if (typeof margin === 'string') {
        if (deviceSpecific && margin !== 'form-gap' && margin !== 'card-padding' && 
            margin !== 'section-gap' && margin !== 'container-padding') {
          const sizeMap: Record<string, 'xs' | 'sm' | 'md' | 'lg' | 'xl'> = {
            '3xs': 'xs', '2xs': 'xs', 'xs': 'xs',
            'sm': 'sm',
            'md': 'md',
            'lg': 'lg',
            'xl': 'xl', '2xl': 'xl', '3xl': 'xl', '4xl': 'xl'
          };
          const translatedSize = sizeMap[margin] || 'md';
          result.margin = deviceSpecificSpace(currentDevice, translatedSize);
        } else {
          result.margin = fluidSpaceScale[margin];
        }
      } else {
        if (margin.x) {
          if (deviceSpecific && margin.x !== 'form-gap' && margin.x !== 'card-padding' && 
              margin.x !== 'section-gap' && margin.x !== 'container-padding') {
            const sizeMap: Record<string, 'xs' | 'sm' | 'md' | 'lg' | 'xl'> = {
              '3xs': 'xs', '2xs': 'xs', 'xs': 'xs',
              'sm': 'sm',
              'md': 'md',
              'lg': 'lg',
              'xl': 'xl', '2xl': 'xl', '3xl': 'xl', '4xl': 'xl'
            };
            const translatedSize = sizeMap[margin.x] || 'md';
            result.marginLeft = result.marginRight = deviceSpecificSpace(currentDevice, translatedSize);
          } else {
            result.marginLeft = result.marginRight = fluidSpaceScale[margin.x];
          }
        }
        
        if (margin.y) {
          if (deviceSpecific && margin.y !== 'form-gap' && margin.y !== 'card-padding' && 
              margin.y !== 'section-gap' && margin.y !== 'container-padding') {
            const sizeMap: Record<string, 'xs' | 'sm' | 'md' | 'lg' | 'xl'> = {
              '3xs': 'xs', '2xs': 'xs', 'xs': 'xs',
              'sm': 'sm',
              'md': 'md',
              'lg': 'lg',
              'xl': 'xl', '2xl': 'xl', '3xl': 'xl', '4xl': 'xl'
            };
            const translatedSize = sizeMap[margin.y] || 'md';
            result.marginTop = result.marginBottom = deviceSpecificSpace(currentDevice, translatedSize);
          } else {
            result.marginTop = result.marginBottom = fluidSpaceScale[margin.y];
          }
        }
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
  }, [space, gap, padding, margin, maxWidth, hierarchy, deviceSpecific, currentDevice]);
  
  // Size mapping for consistent class names
  const sizeMap = useMemo(() => {
    return {
      '3xs': 'xs', '2xs': 'xs', 'xs': 'xs',
      'sm': 'sm',
      'md': 'md',
      'lg': 'lg',
      'xl': 'xl', '2xl': 'xl', '3xl': 'xl', '4xl': 'xl'
    };
  }, []);
  
  // Generate spacing classes for use with Tailwind
  const getSpacingClass = useMemo(() => {
    return (type: 'gap' | 'p' | 'px' | 'py' | 'm' | 'mx' | 'my', size: SpaceScaleKey): string => {
      // For device-specific spacing, use a different prefix
      if (deviceSpecific && size !== 'form-gap' && size !== 'card-padding' && 
          size !== 'section-gap' && size !== 'container-padding') {
        const translatedSize = (sizeMap as Record<string, string>)[size] || 'md';
        return `${currentDevice}-${type}-${translatedSize}`;
      }
      return `fluid-${type}-${size}`;
    };
  }, [deviceSpecific, currentDevice, sizeMap]);
  
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
  const { space, gap, padding, margin, deviceSpecific } = options;
  
  // Get current device type for device-specific classes
  const getDeviceType = (): DeviceType => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
    if (width < 640) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  };
  
  const currentDevice = deviceSpecific ? getDeviceType() : null;
  
  // Size mapping for consistent class names
  const sizeMap: Record<string, 'xs' | 'sm' | 'md' | 'lg' | 'xl'> = {
    '3xs': 'xs', '2xs': 'xs', 'xs': 'xs',
    'sm': 'sm',
    'md': 'md',
    'lg': 'lg',
    'xl': 'xl', '2xl': 'xl', '3xl': 'xl', '4xl': 'xl',
    'form-gap': 'md',
    'card-padding': 'md',
    'section-gap': 'lg',
    'container-padding': 'md'
  };
  
  // Helper to get the correct class prefix based on deviceSpecific flag
  const getPrefix = (size: SpaceScaleKey): string => {
    if (!deviceSpecific || !currentDevice) return 'fluid';
    
    // Special named spacings always use fluid prefix
    if (size === 'form-gap' || size === 'card-padding' || 
        size === 'section-gap' || size === 'container-padding') {
      return 'fluid';
    }
    
    return currentDevice;
  };
  
  // Helper to get the correct size name based on the mapping
  const getSizeName = (size: SpaceScaleKey): string => {
    if (deviceSpecific && 
        size !== 'form-gap' && 
        size !== 'card-padding' && 
        size !== 'section-gap' && 
        size !== 'container-padding') {
      return sizeMap[size] || 'md';
    }
    return size;
  };
  
  if (space) {
    const prefix = getPrefix(space);
    const sizeName = getSizeName(space);
    classes.push(`${prefix}-space-${sizeName}`);
  }
  
  if (gap) {
    const prefix = getPrefix(gap);
    const sizeName = getSizeName(gap);
    classes.push(`${prefix}-gap-${sizeName}`);
  }
  
  if (padding) {
    if (typeof padding === 'string') {
      const prefix = getPrefix(padding);
      const sizeName = getSizeName(padding);
      classes.push(`${prefix}-p-${sizeName}`);
    } else {
      if (padding.x) {
        const prefix = getPrefix(padding.x);
        const sizeName = getSizeName(padding.x);
        classes.push(`${prefix}-px-${sizeName}`);
      }
      if (padding.y) {
        const prefix = getPrefix(padding.y);
        const sizeName = getSizeName(padding.y);
        classes.push(`${prefix}-py-${sizeName}`);
      }
    }
  }
  
  if (margin) {
    if (typeof margin === 'string') {
      const prefix = getPrefix(margin);
      const sizeName = getSizeName(margin);
      classes.push(`${prefix}-m-${sizeName}`);
    } else {
      if (margin.x) {
        const prefix = getPrefix(margin.x);
        const sizeName = getSizeName(margin.x);
        classes.push(`${prefix}-mx-${sizeName}`);
      }
      if (margin.y) {
        const prefix = getPrefix(margin.y);
        const sizeName = getSizeName(margin.y);
        classes.push(`${prefix}-my-${sizeName}`);
      }
    }
  }
  
  return classes.join(' ');
} 
/**
 * Fluid Typography Utilities
 *
 * This module provides utilities for generating fluid typography values
 * that scale smoothly between minimum and maximum sizes based on viewport width.
 */

export interface FluidTypographyOptions {
  minSize: number;
  maxSize: number;
  minWidth?: number;
  maxWidth?: number;
  unit?: 'px' | 'rem' | 'em';
}

/**
 * Converts a pixel value to the specified unit
 */
export function convertToUnit(value: number, unit: 'px' | 'rem' | 'em' = 'px'): string {
  if (unit === 'px') return `${value}px`;
  if (unit === 'rem') return `${value / 16}rem`;
  if (unit === 'em') return `${value / 16}em`;
  return `${value}px`;
}

/**
 * Generates a fluid typography value using CSS clamp
 */
export function fluidTypography({
  minSize,
  maxSize,
  minWidth = 320,
  maxWidth = 1280,
  unit = 'px',
}: FluidTypographyOptions): string {
  const slope = (maxSize - minSize) / (maxWidth - minWidth);
  const slopeVw = slope * 100; // Convert to vw units
  const intercept = minSize - slope * minWidth;

  const minSizeValue = convertToUnit(minSize, unit);
  const maxSizeValue = convertToUnit(maxSize, unit);
  const interceptValue =
    unit === 'px' ? `${intercept.toFixed(4)}px` : `${(intercept / 16).toFixed(4)}${unit}`;

  return `clamp(${minSizeValue}, ${interceptValue} + ${slopeVw.toFixed(4)}vw, ${maxSizeValue})`;
}

/**
 * Predefined fluid type scale with semantic naming
 */
export const fluidTypeScale = {
  h1: { minSize: 28, maxSize: 40 },
  h2: { minSize: 24, maxSize: 36 },
  h3: { minSize: 20, maxSize: 30 },
  h4: { minSize: 18, maxSize: 24 },
  h5: { minSize: 16, maxSize: 20 },
  h6: { minSize: 14, maxSize: 18 },
  body: { minSize: 14, maxSize: 16 },
  small: { minSize: 12, maxSize: 14 },
  xs: { minSize: 10, maxSize: 12 },
};

/**
 * Get a fluid font size from the predefined scale
 * @param key The key from the type scale
 * @param unit The unit to use (px, rem, em)
 * @returns A fluid typography value using CSS clamp
 */
export function getFluidType(
  key: keyof typeof fluidTypeScale,
  unit: 'px' | 'rem' | 'em' = 'px',
): string {
  const { minSize, maxSize } = fluidTypeScale[key];
  return fluidTypography({ minSize, maxSize, unit });
}

/**
 * Generate a fluid line height value
 * @param minLineHeight The minimum line height
 * @param maxLineHeight The maximum line height
 * @param minWidth The minimum viewport width
 * @param maxWidth The maximum viewport width
 * @returns A fluid line height value using CSS clamp
 */
export function fluidLineHeight(
  minLineHeight: number,
  maxLineHeight: number,
  minWidth: number = 320,
  maxWidth: number = 1280,
): string {
  const slope = (maxLineHeight - minLineHeight) / (maxWidth - minWidth);
  const slopeVw = slope * 100;
  const intercept = minLineHeight - slope * minWidth;
  return `clamp(${minLineHeight}, ${intercept.toFixed(4)} + ${slopeVw.toFixed(4)}vw, ${maxLineHeight})`;
}

/**
 * Calculate an optimal line length (max-width) for readability
 * @param fontSize The font size in pixels
 * @param charactersPerLine The desired number of characters per line (45-75 is ideal)
 * @returns A CSS max-width value for optimal readability
 */
export function calculateOptimalLineLength(
  fontSize: number,
  charactersPerLine: number = 66,
): string {
  // Using the approximation that 1em contains ~2 characters for average English text
  const emLength = charactersPerLine / 2;
  return `${emLength}em`;
}

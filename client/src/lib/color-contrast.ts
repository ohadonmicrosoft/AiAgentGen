import { hexToRgb, rgbToHex } from './color-utils';

/**
 * Interface for color contrast check results
 */
export interface ContrastResult {
  /**
   * The contrast ratio between the two colors
   */
  ratio: number;

  /**
   * Whether the contrast passes WCAG AA for normal text (4.5:1)
   */
  aa: boolean;

  /**
   * Whether the contrast passes WCAG AA for large text (3:1)
   */
  aaLarge: boolean;

  /**
   * Whether the contrast passes WCAG AAA for normal text (7:1)
   */
  aaa: boolean;

  /**
   * Whether the contrast passes WCAG AAA for large text (4.5:1)
   */
  aaaLarge: boolean;
}

/**
 * Calculate the relative luminance of a color
 * @see https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
export function getLuminance(color: string): number {
  // Convert hex to rgb if needed
  const rgb = color.startsWith('#') ? hexToRgb(color) : color;

  // Extract RGB values
  const rgbMatch = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!rgbMatch) {
    throw new Error(`Invalid color format: ${rgb}`);
  }

  // Convert RGB to normalized values
  const [, r, g, b] = rgbMatch.map(Number);

  // Convert RGB to sRGB
  const sR = r / 255;
  const sG = g / 255;
  const sB = b / 255;

  // Calculate luminance
  const R = sR <= 0.03928 ? sR / 12.92 : Math.pow((sR + 0.055) / 1.055, 2.4);
  const G = sG <= 0.03928 ? sG / 12.92 : Math.pow((sG + 0.055) / 1.055, 2.4);
  const B = sB <= 0.03928 ? sB / 12.92 : Math.pow((sB + 0.055) / 1.055, 2.4);

  // Calculate relative luminance
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Calculate the contrast ratio between two colors
 * @see https://www.w3.org/TR/WCAG20/#contrast-ratiodef
 */
export function getContrastRatio(
  foreground: string,
  background: string,
): number {
  const foregroundLuminance = getLuminance(foreground);
  const backgroundLuminance = getLuminance(background);

  // Calculate contrast ratio
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if two colors have sufficient contrast according to WCAG guidelines
 */
export function checkContrast(
  foreground: string,
  background: string,
): ContrastResult {
  const ratio = getContrastRatio(foreground, background);

  return {
    ratio,
    aa: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaa: ratio >= 7,
    aaaLarge: ratio >= 4.5,
  };
}

/**
 * Get a suggested color with better contrast if the current contrast is insufficient
 */
export function suggestBetterContrast(
  foreground: string,
  background: string,
  targetRatio = 4.5,
): string {
  const currentRatio = getContrastRatio(foreground, background);

  // If already meeting target, return original color
  if (currentRatio >= targetRatio) {
    return foreground;
  }

  // Convert to RGB for manipulation
  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);

  // Extract RGB values
  const fgMatch = fgRgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  const bgMatch = bgRgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);

  if (!fgMatch || !bgMatch) {
    throw new Error('Invalid color format');
  }

  const [, fR, fG, fB] = fgMatch.map(Number);
  const [, bR, bG, bB] = bgMatch.map(Number);

  // Determine if we should lighten or darken
  const bgLuminance = getLuminance(background);
  const shouldLighten = bgLuminance < 0.5;

  // Adjust color until we reach target contrast
  let adjustedR = fR;
  let adjustedG = fG;
  let adjustedB = fB;
  let adjustedRatio = currentRatio;
  let iterations = 0;
  const maxIterations = 100; // Prevent infinite loops

  while (adjustedRatio < targetRatio && iterations < maxIterations) {
    if (shouldLighten) {
      // Lighten the foreground color
      adjustedR = Math.min(255, adjustedR + 5);
      adjustedG = Math.min(255, adjustedG + 5);
      adjustedB = Math.min(255, adjustedB + 5);
    } else {
      // Darken the foreground color
      adjustedR = Math.max(0, adjustedR - 5);
      adjustedG = Math.max(0, adjustedG - 5);
      adjustedB = Math.max(0, adjustedB - 5);
    }

    const adjustedColor = `rgb(${adjustedR}, ${adjustedG}, ${adjustedB})`;
    adjustedRatio = getContrastRatio(adjustedColor, background);
    iterations++;
  }

  // Convert back to hex
  return rgbToHex(`rgb(${adjustedR}, ${adjustedG}, ${adjustedB})`);
}

/**
 * Get a color's contrast level description
 */
export function getContrastLevel(ratio: number): string {
  if (ratio >= 7) {
    return 'AAA (Excellent)';
  } else if (ratio >= 4.5) {
    return 'AA (Good)';
  } else if (ratio >= 3) {
    return 'AA Large (Moderate)';
  } else {
    return 'Insufficient';
  }
}

/**
 * Check if a color is light or dark
 */
export function isLightColor(color: string): boolean {
  return getLuminance(color) > 0.5;
}

/**
 * Get a recommended text color (black or white) based on background
 */
export function getRecommendedTextColor(backgroundColor: string): string {
  return isLightColor(backgroundColor) ? '#000000' : '#FFFFFF';
}

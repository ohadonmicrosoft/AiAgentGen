/**
 * Color Palette Generator
 * 
 * This utility creates harmonious color palettes from a base color,
 * generating shades, tints, complementary colors, and more.
 */

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

/**
 * Convert a hex color string to RGB object
 */
export function hexToRgb(hex: string): RGB {
  // Remove the # if present
  hex = hex.replace(/^#/, '');
  
  // Parse the hex values
  const bigint = parseInt(hex, 16);
  
  // Extract RGB components
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  
  return { r, g, b };
}

/**
 * Convert RGB object to hex string
 */
export function rgbToHex({ r, g, b }: RGB): string {
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/**
 * Convert RGB object to HSL object
 */
export function rgbToHsl({ r, g, b }: RGB): HSL {
  // Convert RGB to [0, 1] range
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    
    h /= 6;
  }

  return { 
    h: Math.round(h * 360), 
    s: Math.round(s * 100), 
    l: Math.round(l * 100) 
  };
}

/**
 * Convert HSL object to RGB object
 */
export function hslToRgb({ h, s, l }: HSL): RGB {
  // Convert to [0, 1] range
  h /= 360;
  s /= 100;
  l /= 100;

  let r, g, b;

  if (s === 0) {
    // Achromatic (gray)
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return { 
    r: Math.round(r * 255), 
    g: Math.round(g * 255), 
    b: Math.round(b * 255) 
  };
}

/**
 * Convert hex to HSL
 */
export function hexToHsl(hex: string): HSL {
  return rgbToHsl(hexToRgb(hex));
}

/**
 * Convert HSL to hex
 */
export function hslToHex(hsl: HSL): string {
  return rgbToHex(hslToRgb(hsl));
}

/**
 * Generate a complementary color (hue + 180°)
 */
export function getComplementaryColor(hex: string): string {
  const hsl = hexToHsl(hex);
  hsl.h = (hsl.h + 180) % 360;
  return hslToHex(hsl);
}

/**
 * Generate a triadic color scheme (hues spaced 120° apart)
 */
export function getTriadicColors(hex: string): [string, string, string] {
  const hsl = hexToHsl(hex);
  const hsl2 = { ...hsl, h: (hsl.h + 120) % 360 };
  const hsl3 = { ...hsl, h: (hsl.h + 240) % 360 };
  
  return [hex, hslToHex(hsl2), hslToHex(hsl3)];
}

/**
 * Generate an analogous color scheme (hues adjacent on the color wheel)
 */
export function getAnalogousColors(hex: string): [string, string, string] {
  const hsl = hexToHsl(hex);
  const hsl2 = { ...hsl, h: (hsl.h + 30) % 360 };
  const hsl3 = { ...hsl, h: (hsl.h + 330) % 360 };
  
  return [hex, hslToHex(hsl2), hslToHex(hsl3)];
}

/**
 * Generate shades (darker variations) of a color
 */
export function getShades(hex: string, count: number = 5): string[] {
  const hsl = hexToHsl(hex);
  const shades: string[] = [];
  
  // Start with the original color
  shades.push(hex);
  
  // Generate darker shades
  const step = Math.min(hsl.l / count, 10);
  for (let i = 1; i < count; i++) {
    const darkened = { ...hsl, l: Math.max(hsl.l - step * i, 0) };
    shades.push(hslToHex(darkened));
  }
  
  return shades;
}

/**
 * Generate tints (lighter variations) of a color
 */
export function getTints(hex: string, count: number = 5): string[] {
  const hsl = hexToHsl(hex);
  const tints: string[] = [];
  
  // Start with the original color
  tints.push(hex);
  
  // Generate lighter tints
  const step = Math.min((100 - hsl.l) / count, 10);
  for (let i = 1; i < count; i++) {
    const lightened = { ...hsl, l: Math.min(hsl.l + step * i, 100) };
    tints.push(hslToHex(lightened));
  }
  
  return tints;
}

/**
 * Generate tones (saturation variations) of a color
 */
export function getTones(hex: string, count: number = 5): string[] {
  const hsl = hexToHsl(hex);
  const tones: string[] = [];
  
  // Start with the original color
  tones.push(hex);
  
  // Generate tones with varying saturation
  const step = hsl.s / count;
  for (let i = 1; i < count; i++) {
    const desaturated = { ...hsl, s: Math.max(hsl.s - step * i, 0) };
    tones.push(hslToHex(desaturated));
  }
  
  return tones;
}

/**
 * Generate a complete color palette from a base color
 */
export function generatePalette(baseColor: string) {
  const complementary = getComplementaryColor(baseColor);
  const [, analogous1, analogous2] = getAnalogousColors(baseColor);
  const [, triadic1, triadic2] = getTriadicColors(baseColor);
  
  // Generate shades and tints for the base color
  const shades = getShades(baseColor, 5);
  const tints = getTints(baseColor, 5);
  
  // Extract HSL values for reference
  const hsl = hexToHsl(baseColor);
  
  return {
    base: baseColor,
    hsl: { h: hsl.h, s: hsl.s, l: hsl.l },
    complementary,
    analogous: [baseColor, analogous1, analogous2],
    triadic: [baseColor, triadic1, triadic2],
    shades,
    tints,
    tones: getTones(baseColor, 5)
  };
}

/**
 * Check contrast ratio between two colors
 * Returns a value between 1 and 21, with 4.5+ being WCAG AA compliant for normal text
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  // Calculate relative luminance for both colors
  const l1 = calculateRelativeLuminance(rgb1);
  const l2 = calculateRelativeLuminance(rgb2);
  
  // Calculate contrast ratio
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  
  return Math.round(ratio * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate the relative luminance of a color
 * Based on WCAG 2.0 formula
 */
function calculateRelativeLuminance(rgb: RGB): number {
  // Convert sRGB to linear RGB
  const rsrgb = rgb.r / 255;
  const gsrgb = rgb.g / 255;
  const bsrgb = rgb.b / 255;
  
  const r = rsrgb <= 0.03928 ? rsrgb / 12.92 : Math.pow((rsrgb + 0.055) / 1.055, 2.4);
  const g = gsrgb <= 0.03928 ? gsrgb / 12.92 : Math.pow((gsrgb + 0.055) / 1.055, 2.4);
  const b = bsrgb <= 0.03928 ? bsrgb / 12.92 : Math.pow((bsrgb + 0.055) / 1.055, 2.4);
  
  // Calculate luminance using the formula: L = 0.2126 * R + 0.7152 * G + 0.0722 * B
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Get accessible text color (black or white) based on background color
 * Returns "#000000" or "#FFFFFF"
 */
export function getAccessibleTextColor(backgroundColor: string): string {
  const whiteContrast = getContrastRatio(backgroundColor, "#FFFFFF");
  const blackContrast = getContrastRatio(backgroundColor, "#000000");
  
  return whiteContrast > blackContrast ? "#FFFFFF" : "#000000";
}

/**
 * Convert a color to CSS HSL format
 */
export function toHslString(hsl: HSL): string {
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

/**
 * Convert a color to tailwind CSS variable format
 */
export function toHslVariable(hsl: HSL): string {
  return `${hsl.h} ${hsl.s}% ${hsl.l}%`;
}

/**
 * Generate CSS variables for a theme based on a primary color
 */
export function generateThemeColors(primaryColor: string) {
  const primary = hexToHsl(primaryColor);
  
  // Auto-generate contrasting neutral/background colors
  const isDark = primary.l < 60;
  
  const baseBackground = isDark 
    ? { h: primary.h, s: Math.min(primary.s, 10), l: 95 }
    : { h: primary.h, s: Math.min(primary.s, 10), l: 5 };
    
  const background = { ...baseBackground };
  const foreground = { h: background.h, s: background.s, l: 100 - background.l };
  
  // Generate accent based on complementary color but adjusted to match theme
  const compHsl = hexToHsl(getComplementaryColor(primaryColor));
  const accent = { 
    h: compHsl.h, 
    s: Math.min(compHsl.s, 90), 
    l: isDark ? 60 : 45
  };
  
  // Generate muted colors (low saturation versions)
  const muted = { h: background.h, s: background.s, l: isDark ? 85 : 15 };
  const mutedForeground = { h: muted.h, s: muted.s, l: isDark ? 40 : 70 };
  
  // Other UI colors
  const card = { ...background, l: isDark ? 98 : 2 };
  const cardForeground = { ...foreground };
  
  const popover = { ...card };
  const popoverForeground = { ...cardForeground };
  
  // Adjustments for primary foreground
  const primaryForeground = getAccessibleTextColor(hslToHex(primary)) === "#FFFFFF" 
    ? { h: primary.h, s: primary.s, l: 98 }
    : { h: primary.h, s: primary.s, l: 10 };
    
  // Adjustments for accent foreground
  const accentForeground = getAccessibleTextColor(hslToHex(accent)) === "#FFFFFF"
    ? { h: accent.h, s: accent.s, l: 98 }
    : { h: accent.h, s: accent.s, l: 10 };
    
  // Secondary color as a muted version of primary
  const secondary = { h: primary.h, s: Math.max(primary.s - 30, 5), l: isDark ? 30 : 70 };
  const secondaryForeground = getAccessibleTextColor(hslToHex(secondary)) === "#FFFFFF"
    ? { h: secondary.h, s: secondary.s, l: 98 }
    : { h: secondary.h, s: secondary.s, l: 10 };
    
  // Destructive/error color (typically red)
  const destructive = { h: 0, s: 80, l: 50 };
  const destructiveForeground = { h: 0, s: 0, l: 98 };
  
  // Border, input, ring colors
  const border = { h: background.h, s: background.s, l: isDark ? 80 : 20 };
  const input = { ...border };
  const ring = { h: primary.h, s: primary.s, l: isDark ? 70 : 30 };
  
  return {
    primary: toHslVariable(primary),
    primaryForeground: toHslVariable(primaryForeground),
    secondary: toHslVariable(secondary),
    secondaryForeground: toHslVariable(secondaryForeground),
    accent: toHslVariable(accent),
    accentForeground: toHslVariable(accentForeground),
    background: toHslVariable(background),
    foreground: toHslVariable(foreground),
    muted: toHslVariable(muted),
    mutedForeground: toHslVariable(mutedForeground),
    card: toHslVariable(card),
    cardForeground: toHslVariable(cardForeground),
    popover: toHslVariable(popover),
    popoverForeground: toHslVariable(popoverForeground),
    border: toHslVariable(border),
    input: toHslVariable(input),
    ring: toHslVariable(ring),
    destructive: toHslVariable(destructive),
    destructiveForeground: toHslVariable(destructiveForeground),
  };
} 
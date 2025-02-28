const plugin = require('tailwindcss/plugin');

/**
 * Calculates a fluid typography value using CSS clamp
 */
function fluidType(minSize, maxSize, minWidth = 320, maxWidth = 1280) {
  const slope = (maxSize - minSize) / (maxWidth - minWidth);
  const slopeVw = slope * 100; // Convert to vw units
  const intercept = minSize - slope * minWidth;
  return `clamp(${minSize}px, ${intercept.toFixed(4)}px + ${slopeVw.toFixed(4)}vw, ${maxSize}px)`;
}

/**
 * Fluid Typography Plugin for Tailwind CSS
 *
 * This plugin adds responsive typography utilities that scale smoothly
 * between minimum and maximum sizes based on the viewport width.
 *
 * It adds:
 * - .fluid-{scale} classes for font sizes
 * - .fluid-leading-{ratio} classes for line heights
 */
module.exports = plugin(function ({ addUtilities, theme, e }) {
  // Define our type scale with min and max sizes
  const fluidTypeScale = {
    h1: { min: 28, max: 40 },
    h2: { min: 24, max: 36 },
    h3: { min: 20, max: 30 },
    h4: { min: 18, max: 24 },
    h5: { min: 16, max: 20 },
    h6: { min: 14, max: 18 },
    body: { min: 14, max: 16 },
    small: { min: 12, max: 14 },
    xs: { min: 10, max: 12 },
  };

  // Create fluid font size utilities
  const fluidFontSizes = Object.entries(fluidTypeScale).reduce((acc, [name, { min, max }]) => {
    acc[`.fluid-${e(name)}`] = {
      fontSize: fluidType(min, max),
    };
    return acc;
  }, {});

  // Create fluid line height utilities based on ratios
  const fluidLineHeights = {
    '.fluid-leading-tight': {
      lineHeight: '1.2',
    },
    '.fluid-leading-snug': {
      lineHeight: '1.35',
    },
    '.fluid-leading-normal': {
      lineHeight: '1.5',
    },
    '.fluid-leading-relaxed': {
      lineHeight: '1.625',
    },
    '.fluid-leading-loose': {
      lineHeight: '1.75',
    },
    '.fluid-leading-1': {
      lineHeight: '1',
    },
    '.fluid-leading-auto': {
      lineHeight: 'auto',
    },
  };

  // Add fluid utilities to Tailwind
  addUtilities({
    ...fluidFontSizes,
    ...fluidLineHeights,
  });
});

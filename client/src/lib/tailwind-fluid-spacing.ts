import plugin from 'tailwindcss/plugin';
import { fluidSpaceScale } from './fluid-spacing';

/**
 * Tailwind plugin to generate fluid spacing utilities
 * 
 * This will create utility classes like:
 * - fluid-p-sm, fluid-p-md, fluid-p-lg (padding)
 * - fluid-m-sm, fluid-m-md, fluid-m-lg (margin)
 * - fluid-gap-sm, fluid-gap-md, fluid-gap-lg (gap)
 * - etc.
 */
export const fluidSpacingPlugin = plugin(({ addUtilities, theme, e }) => {
  // Extract the fluid space scale
  const spacingScale = fluidSpaceScale;
  
  // Create padding utilities
  const paddingUtilities = Object.entries(spacingScale).reduce((acc, [key, value]) => {
    acc[`.${e(`fluid-p-${key}`)}`] = { padding: value };
    acc[`.${e(`fluid-px-${key}`)}`] = { paddingLeft: value, paddingRight: value };
    acc[`.${e(`fluid-py-${key}`)}`] = { paddingTop: value, paddingBottom: value };
    acc[`.${e(`fluid-pt-${key}`)}`] = { paddingTop: value };
    acc[`.${e(`fluid-pr-${key}`)}`] = { paddingRight: value };
    acc[`.${e(`fluid-pb-${key}`)}`] = { paddingBottom: value };
    acc[`.${e(`fluid-pl-${key}`)}`] = { paddingLeft: value };
    return acc;
  }, {});
  
  // Create margin utilities
  const marginUtilities = Object.entries(spacingScale).reduce((acc, [key, value]) => {
    acc[`.${e(`fluid-m-${key}`)}`] = { margin: value };
    acc[`.${e(`fluid-mx-${key}`)}`] = { marginLeft: value, marginRight: value };
    acc[`.${e(`fluid-my-${key}`)}`] = { marginTop: value, marginBottom: value };
    acc[`.${e(`fluid-mt-${key}`)}`] = { marginTop: value };
    acc[`.${e(`fluid-mr-${key}`)}`] = { marginRight: value };
    acc[`.${e(`fluid-mb-${key}`)}`] = { marginBottom: value };
    acc[`.${e(`fluid-ml-${key}`)}`] = { marginLeft: value };
    return acc;
  }, {});
  
  // Create gap utilities
  const gapUtilities = Object.entries(spacingScale).reduce((acc, [key, value]) => {
    acc[`.${e(`fluid-gap-${key}`)}`] = { gap: value };
    acc[`.${e(`fluid-gap-x-${key}`)}`] = { columnGap: value };
    acc[`.${e(`fluid-gap-y-${key}`)}`] = { rowGap: value };
    return acc;
  }, {});
  
  // Create space utilities
  const spaceUtilities = Object.entries(spacingScale).reduce((acc, [key, value]) => {
    acc[`.${e(`fluid-space-x-${key}`)} > * + *`] = { marginLeft: value };
    acc[`.${e(`fluid-space-y-${key}`)} > * + *`] = { marginTop: value };
    return acc;
  }, {});
  
  // Add all utilities
  addUtilities(paddingUtilities);
  addUtilities(marginUtilities);
  addUtilities(gapUtilities);
  addUtilities(spaceUtilities);
  
  // Add responsive container classes
  addUtilities({
    '.fluid-container': {
      width: '100%',
      marginLeft: 'auto',
      marginRight: 'auto',
      paddingLeft: spacingScale.md,
      paddingRight: spacingScale.md,
      '@screen sm': {
        maxWidth: '640px',
      },
      '@screen md': {
        maxWidth: '768px',
      },
      '@screen lg': {
        maxWidth: '1024px',
      },
      '@screen xl': {
        maxWidth: '1280px',
      },
    },
    '.fluid-container-narrow': {
      width: '100%',
      marginLeft: 'auto',
      marginRight: 'auto',
      paddingLeft: spacingScale.md,
      paddingRight: spacingScale.md,
      maxWidth: '65ch',
    },
    '.fluid-container-wide': {
      width: '100%',
      marginLeft: 'auto',
      marginRight: 'auto',
      paddingLeft: spacingScale.md,
      paddingRight: spacingScale.md,
      maxWidth: '1400px',
    },
  });
}); 
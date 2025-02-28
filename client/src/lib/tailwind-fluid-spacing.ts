import plugin from 'tailwindcss/plugin';
import { fluidSpaceScale } from './fluid-spacing';

/**
 * Tailwind plugin to generate fluid spacing utilities
 *
 * This will create utility classes like:
 * - fluid-p-sm, fluid-p-md, fluid-p-lg (padding)
 * - fluid-m-sm, fluid-m-md, fluid-m-lg (margin)
 * - fluid-gap-sm, fluid-gap-md, fluid-gap-lg (gap)
 *
 * As well as device-specific classes:
 * - mobile-p-sm, tablet-p-md, desktop-p-lg
 * - mobile-m-sm, tablet-m-md, desktop-m-lg
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

  // Define device-specific spacing values
  const deviceSpacing = {
    mobile: {
      xs: '8px',
      sm: '12px',
      md: '16px',
      lg: '24px',
      xl: '32px',
    },
    tablet: {
      xs: '8px',
      sm: '12px',
      md: '20px',
      lg: '28px',
      xl: '40px',
    },
    desktop: {
      xs: '8px',
      sm: '16px',
      md: '24px',
      lg: '32px',
      xl: '48px',
    },
  };

  // Create device-specific spacing utilities
  const deviceTypes = ['mobile', 'tablet', 'desktop'];
  const sizeTypes = ['xs', 'sm', 'md', 'lg', 'xl'];

  // Create device-specific padding utilities
  const devicePaddingUtilities = deviceTypes.reduce((deviceAcc, device) => {
    return {
      ...deviceAcc,
      ...sizeTypes.reduce((sizeAcc, size) => {
        const value = deviceSpacing[device][size];
        sizeAcc[`.${e(`${device}-p-${size}`)}`] = { padding: value };
        sizeAcc[`.${e(`${device}-px-${size}`)}`] = { paddingLeft: value, paddingRight: value };
        sizeAcc[`.${e(`${device}-py-${size}`)}`] = { paddingTop: value, paddingBottom: value };
        sizeAcc[`.${e(`${device}-pt-${size}`)}`] = { paddingTop: value };
        sizeAcc[`.${e(`${device}-pr-${size}`)}`] = { paddingRight: value };
        sizeAcc[`.${e(`${device}-pb-${size}`)}`] = { paddingBottom: value };
        sizeAcc[`.${e(`${device}-pl-${size}`)}`] = { paddingLeft: value };
        return sizeAcc;
      }, {}),
    };
  }, {});

  // Create device-specific margin utilities
  const deviceMarginUtilities = deviceTypes.reduce((deviceAcc, device) => {
    return {
      ...deviceAcc,
      ...sizeTypes.reduce((sizeAcc, size) => {
        const value = deviceSpacing[device][size];
        sizeAcc[`.${e(`${device}-m-${size}`)}`] = { margin: value };
        sizeAcc[`.${e(`${device}-mx-${size}`)}`] = { marginLeft: value, marginRight: value };
        sizeAcc[`.${e(`${device}-my-${size}`)}`] = { marginTop: value, marginBottom: value };
        sizeAcc[`.${e(`${device}-mt-${size}`)}`] = { marginTop: value };
        sizeAcc[`.${e(`${device}-mr-${size}`)}`] = { marginRight: value };
        sizeAcc[`.${e(`${device}-mb-${size}`)}`] = { marginBottom: value };
        sizeAcc[`.${e(`${device}-ml-${size}`)}`] = { marginLeft: value };
        return sizeAcc;
      }, {}),
    };
  }, {});

  // Create device-specific gap utilities
  const deviceGapUtilities = deviceTypes.reduce((deviceAcc, device) => {
    return {
      ...deviceAcc,
      ...sizeTypes.reduce((sizeAcc, size) => {
        const value = deviceSpacing[device][size];
        sizeAcc[`.${e(`${device}-gap-${size}`)}`] = { gap: value };
        sizeAcc[`.${e(`${device}-gap-x-${size}`)}`] = { columnGap: value };
        sizeAcc[`.${e(`${device}-gap-y-${size}`)}`] = { rowGap: value };
        return sizeAcc;
      }, {}),
    };
  }, {});

  // Create device-specific space utilities
  const deviceSpaceUtilities = deviceTypes.reduce((deviceAcc, device) => {
    return {
      ...deviceAcc,
      ...sizeTypes.reduce((sizeAcc, size) => {
        const value = deviceSpacing[device][size];
        sizeAcc[`.${e(`${device}-space-x-${size}`)} > * + *`] = { marginLeft: value };
        sizeAcc[`.${e(`${device}-space-y-${size}`)} > * + *`] = { marginTop: value };
        return sizeAcc;
      }, {}),
    };
  }, {});

  // Add all utilities
  addUtilities(paddingUtilities);
  addUtilities(marginUtilities);
  addUtilities(gapUtilities);
  addUtilities(spaceUtilities);

  // Add device-specific utilities
  addUtilities(devicePaddingUtilities);
  addUtilities(deviceMarginUtilities);
  addUtilities(deviceGapUtilities);
  addUtilities(deviceSpaceUtilities);

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
      '@screen 2xl': {
        maxWidth: '1536px',
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
    // Content containers based on purpose
    '.fluid-content-container': {
      width: '100%',
      marginLeft: 'auto',
      marginRight: 'auto',
      paddingLeft: spacingScale.md,
      paddingRight: spacingScale.md,
      maxWidth: '65ch', // Optimal reading width
    },
    '.fluid-card-container': {
      width: '100%',
      padding: spacingScale.card_padding,
      borderRadius: '0.5rem',
      backgroundColor: 'var(--card-bg, white)',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    },
    '.fluid-section-container': {
      width: '100%',
      marginTop: spacingScale.section_gap,
      marginBottom: spacingScale.section_gap,
    },
    '.fluid-form-container': {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: spacingScale.form_gap,
    },
  });

  // Add responsive layout utilities
  addUtilities({
    '.fluid-stack': {
      display: 'flex',
      flexDirection: 'column',
      gap: spacingScale.md,
    },
    '.fluid-row': {
      display: 'flex',
      flexDirection: 'row',
      gap: spacingScale.md,
      flexWrap: 'wrap',
    },
    '.fluid-grid': {
      display: 'grid',
      gap: spacingScale.md,
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    },
  });
});

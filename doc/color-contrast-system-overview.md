# Color Contrast Checking System Overview

This document provides an overview of the color contrast checking system implemented in our application. The system helps ensure that text and UI elements have sufficient contrast against their backgrounds, making the application more accessible to users with visual impairments.

## Features

### Core Functionality
- **Contrast Ratio Calculation**: Accurately calculates the contrast ratio between foreground and background colors according to WCAG standards
- **WCAG Compliance Checking**: Evaluates color combinations against WCAG 2.1 AA and AAA standards
- **Color Suggestions**: Provides alternative color suggestions when contrast is insufficient
- **Visual Preview**: Allows testing of color combinations with different text sizes and UI elements
- **Real-time Feedback**: Instantly updates contrast evaluations as colors are adjusted

### Accessibility Standards Support
- **WCAG 2.1 AA**: 4.5:1 contrast ratio for normal text, 3:1 for large text
- **WCAG 2.1 AAA**: 7:1 contrast ratio for normal text, 4.5:1 for large text
- **UI Component Testing**: Tests contrast on common UI elements like buttons, inputs, and alerts

## Implementation Details

### Core Components

#### 1. Color Contrast Utilities
The primary utilities for calculating and checking color contrast:

```typescript
// Calculate contrast ratio between two colors
function getContrastRatio(foreground: string, background: string): number;

// Check if colors meet WCAG guidelines
function checkContrast(foreground: string, background: string): ContrastResult;

// Get a suggested color with better contrast
function suggestBetterContrast(foreground: string, background: string, targetRatio?: number): string;
```

#### 2. ContrastResult Interface
The result of a contrast check:

```typescript
interface ContrastResult {
  ratio: number;    // The contrast ratio (e.g., 4.5)
  aa: boolean;      // Passes WCAG AA for normal text
  aaLarge: boolean; // Passes WCAG AA for large text
  aaa: boolean;     // Passes WCAG AAA for normal text
  aaaLarge: boolean; // Passes WCAG AAA for large text
}
```

### Technical Implementation

The color contrast system uses the relative luminance formula specified in WCAG 2.1 to calculate contrast ratios:

1. **Color Conversion**: Converts colors between hex and RGB formats as needed
2. **Luminance Calculation**: Calculates the relative luminance of each color
3. **Contrast Ratio**: Determines the ratio between the lighter and darker color
4. **WCAG Evaluation**: Compares the ratio against WCAG thresholds
5. **Color Adjustment**: For insufficient contrast, iteratively adjusts colors until they meet requirements

## Usage Examples

### Basic Contrast Check

```typescript
import { checkContrast } from '@/lib/color-contrast';

// Check if black text on white background meets WCAG standards
const result = checkContrast('#000000', '#FFFFFF');
console.log(`Contrast ratio: ${result.ratio}`);
console.log(`Meets WCAG AA: ${result.aa ? 'Yes' : 'No'}`);
console.log(`Meets WCAG AAA: ${result.aaa ? 'Yes' : 'No'}`);
```

### Getting Color Suggestions

```typescript
import { suggestBetterContrast } from '@/lib/color-contrast';

// Get a suggested color that meets WCAG AA (4.5:1)
const betterColor = suggestBetterContrast('#777777', '#FFFFFF');
console.log(`Try using ${betterColor} instead for better contrast`);

// Get a suggested color that meets WCAG AAA (7:1)
const aaa_color = suggestBetterContrast('#777777', '#FFFFFF', 7.0);
```

### Recommended Text Color

```typescript
import { getRecommendedTextColor } from '@/lib/color-contrast';

// Get recommended text color (black or white) based on background
const textColor = getRecommendedTextColor('#3366CC');
// Will return '#FFFFFF' since white text has better contrast on this blue
```

## Integration with Other Systems

The color contrast system integrates with:

- **Color Palette Generator**: Ensures generated palettes include accessible color combinations
- **Theme System**: Validates theme colors for accessibility
- **Component Library**: Provides contrast checking for UI components
- **Design System**: Enforces accessible color usage in the design system

## Accessibility Considerations

- **Visual Impairments**: Helps users with low vision, color blindness, and other visual impairments
- **Situational Limitations**: Improves readability in bright sunlight or on low-quality displays
- **Aging Users**: Accommodates vision changes that occur with aging
- **Cognitive Load**: Reduces cognitive effort required to read and understand content

## Best Practices

- **Test with Real Users**: While automated checks are valuable, testing with users who have visual impairments provides additional insights
- **Consider Context**: Some design elements may require higher contrast than the minimum standards
- **Balance Aesthetics and Accessibility**: Strive for designs that are both visually appealing and accessible
- **Document Exceptions**: If a design element intentionally doesn't meet contrast guidelines, document the reason and provide an accessible alternative

## Demo

A comprehensive demo is available at `/contrast-checker-demo` that showcases:
- Interactive color selection
- Real-time contrast evaluation
- Text and UI element previews
- Color suggestions for improved accessibility
- WCAG compliance indicators 
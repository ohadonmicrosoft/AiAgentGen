import { fluidSpace, convertToUnit, fluidSpaceScale } from '../fluid-spacing';

describe('Fluid Spacing Utilities', () => {
  describe('convertToUnit', () => {
    it('should convert pixel values to various units', () => {
      expect(convertToUnit(16, 'px')).toBe('16px');
      expect(convertToUnit(16, 'rem')).toBe('1rem');
      expect(convertToUnit(16, 'em')).toBe('1em');
      expect(convertToUnit(40, 'vh')).toBe('4vh');
      expect(convertToUnit(50, 'vw')).toBe('5vw');
    });
  });

  describe('fluidSpace', () => {
    it('should generate a CSS clamp function for responsive spacing', () => {
      const result = fluidSpace({
        minSize: 16,
        maxSize: 24,
        minWidth: 320,
        maxWidth: 1200,
        unit: 'px'
      });

      // Should produce something like 'clamp(16px, calc(16px + 8 * (100vw - 320px) / 880), 24px)'
      expect(result).toContain('clamp(');
      expect(result).toContain('calc(');
      expect(result).toContain('16px');
      expect(result).toContain('24px');
      expect(result).toContain('100vw');
    });

    it('should work with default values for minWidth and maxWidth', () => {
      const result = fluidSpace({
        minSize: 10,
        maxSize: 20,
        unit: 'px'
      });

      expect(result).toContain('clamp(');
      expect(result).toContain('10px');
      expect(result).toContain('20px');
    });

    it('should convert to the specified unit', () => {
      const result = fluidSpace({
        minSize: 16,
        maxSize: 32,
        unit: 'rem'
      });

      expect(result).toContain('1rem');
      expect(result).toContain('2rem');
    });
  });

  describe('fluidSpaceScale', () => {
    it('should have all the expected scale values', () => {
      expect(fluidSpaceScale).toHaveProperty('3xs');
      expect(fluidSpaceScale).toHaveProperty('2xs');
      expect(fluidSpaceScale).toHaveProperty('xs');
      expect(fluidSpaceScale).toHaveProperty('sm');
      expect(fluidSpaceScale).toHaveProperty('md');
      expect(fluidSpaceScale).toHaveProperty('lg');
      expect(fluidSpaceScale).toHaveProperty('xl');
      expect(fluidSpaceScale).toHaveProperty('2xl');
      expect(fluidSpaceScale).toHaveProperty('3xl');
      expect(fluidSpaceScale).toHaveProperty('4xl');
    });

    it('should have values that are CSS clamp functions', () => {
      Object.values(fluidSpaceScale).forEach(value => {
        expect(value).toContain('clamp(');
      });
    });
  });
}); 
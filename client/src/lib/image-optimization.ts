/**
 * Image optimization utilities for the application
 */

const BASE_CDN_URL = process.env.VITE_IMAGE_CDN_URL || '';

/**
 * Image format options
 */
export type ImageFormat = 'original' | 'webp' | 'avif' | 'jpeg';

/**
 * Image size options
 */
export type ImageSize = 'thumbnail' | 'small' | 'medium' | 'large' | 'original';

/**
 * Image loading modes
 */
export type ImageLoadingMode = 'lazy' | 'eager';

/**
 * Options for image optimization
 */
export interface ImageOptimizationOptions {
  /**
   * Size of the image
   * @default 'original'
   */
  size?: ImageSize;

  /**
   * Format of the image
   * @default 'original'
   */
  format?: ImageFormat;

  /**
   * Quality of the image (1-100)
   * @default 80
   */
  quality?: number;

  /**
   * Whether to enable blur-up effect for lazy loading
   * @default true
   */
  blurUp?: boolean;

  /**
   * Width of the image in pixels
   */
  width?: number;

  /**
   * Height of the image in pixels
   */
  height?: number;

  /**
   * Loading mode for the image
   * @default 'lazy'
   */
  loading?: ImageLoadingMode;
}

/**
 * Default image optimization options
 */
const defaultOptions: ImageOptimizationOptions = {
  size: 'original',
  format: 'original',
  quality: 80,
  blurUp: true,
  loading: 'lazy',
};

/**
 * Map of size names to dimensions
 */
const sizeDimensions: Record<ImageSize, { width: number; height?: number }> = {
  thumbnail: { width: 100 },
  small: { width: 300 },
  medium: { width: 600 },
  large: { width: 1200 },
  original: { width: 0 }, // Original size
};

/**
 * Check if the device supports a specific image format
 */
export function supportsImageFormat(format: ImageFormat): boolean {
  if (typeof document === 'undefined') return false;

  if (format === 'webp') {
    const canvas = document.createElement('canvas');
    if (canvas.getContext && canvas.getContext('2d')) {
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }
    return false;
  }

  if (format === 'avif') {
    return document.createElement('canvas').toDataURL('image/avif').startsWith('data:image/avif');
  }

  return true;
}

/**
 * Get the best supported image format for the current browser
 */
export function getBestSupportedFormat(): ImageFormat {
  if (supportsImageFormat('avif')) return 'avif';
  if (supportsImageFormat('webp')) return 'webp';
  return 'jpeg';
}

/**
 * Generate an optimized image URL
 */
export function getOptimizedImageUrl(
  src: string,
  options: Partial<ImageOptimizationOptions> = {},
): string {
  // Merge options with defaults
  const opts = { ...defaultOptions, ...options };

  // Handle data URLs, blobs, and relative URLs directly
  if (src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('/')) {
    return src;
  }

  // Handle already optimized CDN URLs
  if (src.includes('?w=') || src.includes('?format=') || src.includes('?quality=')) {
    return src;
  }

  // If we have a CDN URL, use it for optimization
  if (BASE_CDN_URL) {
    const url = new URL(`${BASE_CDN_URL}/image`);

    // Add the source URL
    url.searchParams.append('url', src);

    // Add width if specified or from size
    const width =
      opts.width || (opts.size !== 'original' ? sizeDimensions[opts.size!].width : undefined);

    if (width) {
      url.searchParams.append('w', width.toString());
    }

    // Add height if specified
    if (opts.height) {
      url.searchParams.append('h', opts.height.toString());
    }

    // Add format if specified
    if (opts.format !== 'original') {
      url.searchParams.append('format', opts.format!);
    }

    // Add quality if specified
    if (opts.quality && opts.quality !== 80) {
      url.searchParams.append('q', opts.quality.toString());
    }

    // Add fit parameter
    url.searchParams.append('fit', 'max');

    return url.toString();
  }

  // No CDN optimization available, return original URL
  return src;
}

/**
 * Preload an image
 */
export function preloadImage(
  src: string,
  options?: Partial<ImageOptimizationOptions>,
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = getOptimizedImageUrl(src, options);
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
}

/**
 * Create preload link tags for images
 */
export function createImagePreloadLinks(
  images: Array<string | { src: string; options?: Partial<ImageOptimizationOptions> }>,
): void {
  if (typeof document === 'undefined') return;

  images.forEach((image) => {
    const src = typeof image === 'string' ? image : image.src;
    const options = typeof image === 'string' ? undefined : image.options;

    const optimizedUrl = getOptimizedImageUrl(src, options);

    // Check if a preload link already exists
    const existingLink = document.querySelector(`link[rel="preload"][href="${optimizedUrl}"]`);
    if (existingLink) return;

    // Create a preload link
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = optimizedUrl;
    link.as = 'image';

    // Add the link to the head
    document.head.appendChild(link);
  });
}

/**
 * Generate a low quality image placeholder for blur-up effect
 */
export function getLowQualityImagePlaceholder(src: string): string {
  if (BASE_CDN_URL) {
    const url = new URL(`${BASE_CDN_URL}/image`);
    url.searchParams.append('url', src);
    url.searchParams.append('w', '10');
    url.searchParams.append('q', '10');
    url.searchParams.append('blur', '10');

    return url.toString();
  }

  return src;
}

/**
 * Get sizes attribute for responsive images
 */
export function getResponsiveSizeAttribute(breakpoints: Record<string, number>): string {
  return Object.entries(breakpoints)
    .map(([breakpoint, size]) => `(max-width: ${breakpoint}px) ${size}px`)
    .concat(['100vw'])
    .join(', ');
}

/**
 * Generate an array of srcset values for responsive images
 */
export function getResponsiveSrcSet(
  src: string,
  widths: number[],
  options: Partial<ImageOptimizationOptions> = {},
): string {
  return widths
    .map((width) => {
      const imageUrl = getOptimizedImageUrl(src, { ...options, width });
      return `${imageUrl} ${width}w`;
    })
    .join(', ');
}

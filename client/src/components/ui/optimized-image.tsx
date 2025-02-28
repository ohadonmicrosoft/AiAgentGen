import { useReducedMotion } from '@/hooks/animations/useReducedMotion';
import { useInView } from '@/hooks/use-in-view';
import {
  ImageLoadingMode,
  ImageOptimizationOptions,
  getBestSupportedFormat,
  getLowQualityImagePlaceholder,
  getOptimizedImageUrl,
  getResponsiveSrcSet,
  preloadImage,
} from '@/lib/image-optimization';
import { cn } from '@/lib/utils';
import React, { useState, useEffect, useRef, memo } from 'react';

export interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /**
   * Source URL of the image
   */
  src: string;

  /**
   * Alternative text for the image
   */
  alt: string;

  /**
   * Enable blur-up loading effect
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
   * Aspect ratio of the image (width/height)
   */
  aspectRatio?: number;

  /**
   * Responsive widths for srcset
   * @default [640, 750, 828, 1080, 1200, 1920, 2048, 3840]
   */
  responsiveWidths?: number[];

  /**
   * Image loading strategy
   * @default 'lazy'
   */
  loading?: ImageLoadingMode;

  /**
   * Use modern image format (webp/avif)
   * @default true
   */
  useModernFormat?: boolean;

  /**
   * Image quality (1-100)
   * @default 80
   */
  quality?: number;

  /**
   * Container class name
   */
  containerClassName?: string;

  /**
   * Fill container (sets object-fit: cover)
   * @default false
   */
  fill?: boolean;

  /**
   * Object fit style
   * @default 'cover'
   */
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';

  /**
   * Priority loading (sets loading='eager' and fetchpriority='high')
   * @default false
   */
  priority?: boolean;

  /**
   * Additional image options
   */
  imageOptions?: Partial<ImageOptimizationOptions>;

  /**
   * Threshold for intersection observer (0-1)
   * @default 0.1
   */
  threshold?: number;

  /**
   * Root margin for intersection observer
   * @default "200px"
   */
  rootMargin?: string;

  /**
   * Disable animation for blur-up effect
   * @default false
   */
  disableAnimation?: boolean;

  /**
   * Enable native lazy loading
   * @default true
   */
  nativeLazyLoading?: boolean;
}

/**
 * A responsive, optimized image component with blur-up loading effect
 */
const OptimizedImageComponent = React.forwardRef<HTMLImageElement, OptimizedImageProps>(
  (
    {
      src,
      alt,
      blurUp = true,
      width,
      height,
      aspectRatio,
      responsiveWidths = [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
      loading: initialLoading = 'lazy',
      useModernFormat = true,
      quality = 80,
      containerClassName,
      className,
      fill = false,
      objectFit = 'cover',
      priority = false,
      imageOptions = {},
      style,
      sizes,
      threshold = 0.1,
      rootMargin = '200px',
      disableAnimation = false,
      nativeLazyLoading = true,
      ...props
    },
    ref,
  ) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(false);
    const imageRef = useRef<HTMLImageElement>(null);
    const combinedRef = useCombinedRefs(ref, imageRef);
    const prefersReducedMotion = useReducedMotion();

    // Use intersection observer for better lazy loading
    const { inView, ref: inViewRef } = useInView({
      threshold,
      rootMargin,
      triggerOnce: true,
    });

    // Override loading mode if priority is set
    const loading = priority ? 'eager' : nativeLazyLoading ? initialLoading : undefined;
    const fetchPriority = priority ? 'high' : undefined;

    // Get best supported image format if enabled
    const format = useModernFormat ? getBestSupportedFormat() : 'original';

    // Combine options
    const options: Partial<ImageOptimizationOptions> = {
      ...imageOptions,
      quality,
      format,
      width,
      height,
      loading,
    };

    // Get optimized image URL
    const optimizedSrc = getOptimizedImageUrl(src, options);

    // Generate a low quality placeholder for blur-up effect
    const placeholderSrc = blurUp ? getLowQualityImagePlaceholder(src) : '';

    // Generate srcset for responsive images
    const srcSet = width
      ? getResponsiveSrcSet(
          src,
          responsiveWidths.filter((w) => w <= width * 2), // Only include widths up to 2x the displayed size
          { ...options, width: undefined },
        )
      : undefined;

    // Calculate aspect ratio styles
    const aspectRatioStyle: React.CSSProperties = {};

    if (width && height) {
      aspectRatioStyle.aspectRatio = `${width} / ${height}`;
    } else if (aspectRatio) {
      aspectRatioStyle.aspectRatio = aspectRatio.toString();
    }

    // Combine styles
    const combinedStyles: React.CSSProperties = {
      ...aspectRatioStyle,
      ...(fill
        ? {
            objectFit,
            position: 'absolute',
            width: '100%',
            height: '100%',
            inset: 0,
          }
        : {}),
      ...style,
    };

    // Handle error
    useEffect(() => {
      setError(false);
    }, [src]);

    // Preload priority images
    useEffect(() => {
      if (priority && src) {
        preloadImage(src, options).catch(() => {
          // Silently catch errors for preloading
        });
      }
    }, [priority, src, options]);

    // Start loading the image when it comes into view
    useEffect(() => {
      if (inView && imageRef.current && !nativeLazyLoading) {
        imageRef.current.src = optimizedSrc;
        if (srcSet) {
          imageRef.current.srcset = srcSet;
        }
      }
    }, [inView, optimizedSrc, srcSet, nativeLazyLoading]);

    // If there's an error loading the image, show a placeholder
    if (error) {
      return (
        <div
          className={cn(
            'bg-muted flex items-center justify-center text-muted-foreground',
            containerClassName,
          )}
          style={aspectRatioStyle}
        >
          <span>{alt || 'Image failed to load'}</span>
        </div>
      );
    }

    // Determine blur animation duration based on reduced motion preference
    const blurAnimationDuration = disableAnimation || prefersReducedMotion ? 0 : 300;

    // Determine if we need a container
    if (fill || containerClassName) {
      return (
        <div
          ref={inViewRef as React.RefObject<HTMLDivElement>}
          className={cn('relative overflow-hidden', containerClassName)}
          style={aspectRatioStyle}
          data-testid="optimized-image-container"
        >
          {blurUp && !isLoaded && (
            <img
              src={placeholderSrc}
              alt={alt}
              className={cn('transition-opacity w-full h-full', className)}
              style={{
                ...combinedStyles,
                filter: 'blur(15px)',
                objectFit,
                opacity: isLoaded ? 0 : 1,
                position: 'absolute',
                inset: 0,
                transitionDuration: `${blurAnimationDuration}ms`,
              }}
              aria-hidden="true"
            />
          )}

          <img
            ref={combinedRef}
            src={nativeLazyLoading ? optimizedSrc : priority ? optimizedSrc : undefined}
            alt={alt}
            width={width}
            height={height}
            loading={loading}
            onLoad={() => setIsLoaded(true)}
            onError={() => setError(true)}
            className={cn('transition-opacity', !isLoaded && blurUp && 'opacity-0', className)}
            style={{
              ...combinedStyles,
              transitionDuration: `${blurAnimationDuration}ms`,
            }}
            sizes={sizes}
            srcSet={nativeLazyLoading ? srcSet : undefined}
            fetchPriority={fetchPriority}
            decoding={priority ? 'sync' : 'async'}
            {...props}
          />
        </div>
      );
    }

    // Simple case - no container needed
    return (
      <>
        {blurUp && !isLoaded && (
          <img
            src={placeholderSrc}
            alt={alt}
            className={cn('transition-opacity absolute', className)}
            style={{
              ...combinedStyles,
              filter: 'blur(15px)',
              opacity: isLoaded ? 0 : 1,
              transitionDuration: `${blurAnimationDuration}ms`,
            }}
            aria-hidden="true"
          />
        )}

        <img
          ref={combinedRef}
          src={nativeLazyLoading ? optimizedSrc : priority || inView ? optimizedSrc : undefined}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          onLoad={() => setIsLoaded(true)}
          onError={() => setError(true)}
          className={cn('transition-opacity', !isLoaded && blurUp && 'opacity-0', className)}
          style={{
            ...combinedStyles,
            transitionDuration: `${blurAnimationDuration}ms`,
          }}
          sizes={sizes}
          srcSet={nativeLazyLoading ? srcSet : undefined}
          fetchPriority={fetchPriority}
          decoding={priority ? 'sync' : 'async'}
          {...props}
        />
      </>
    );
  },
);

OptimizedImageComponent.displayName = 'OptimizedImage';

// Helper to combine refs
function useCombinedRefs<T>(
  ...refs: Array<React.ForwardedRef<T> | React.RefObject<T> | null | undefined>
): React.RefCallback<T> {
  return React.useCallback(
    (element: T | null) => {
      refs.forEach((ref) => {
        if (!ref) return;

        if (typeof ref === 'function') {
          ref(element);
        } else {
          (ref as React.MutableRefObject<T | null>).current = element;
        }
      });
    },
    [refs],
  );
}

// Memoize the component to prevent unnecessary re-renders
export const OptimizedImage = memo(OptimizedImageComponent);

/**
 * Preload multiple images in advance
 * @param images Array of image URLs or objects with src and options
 */
export function preloadImages(
  images: Array<string | { src: string; options?: Partial<ImageOptimizationOptions> }>,
): void {
  images.forEach((image) => {
    const src = typeof image === 'string' ? image : image.src;
    const options = typeof image === 'string' ? undefined : image.options;

    preloadImage(src, options).catch(() => {
      // Silently catch errors for preloading
    });
  });
}

/**
 * Background image component that uses optimized images
 */
export const OptimizedBackgroundImage = React.forwardRef<
  HTMLDivElement,
  Omit<OptimizedImageProps, 'alt'> & { children?: React.ReactNode }
>(
  (
    {
      src,
      children,
      className,
      style,
      useModernFormat = true,
      quality = 80,
      imageOptions = {},
      ...props
    },
    ref,
  ) => {
    const format = useModernFormat ? getBestSupportedFormat() : 'original';

    const options: Partial<ImageOptimizationOptions> = {
      ...imageOptions,
      quality,
      format,
    };

    const optimizedSrc = getOptimizedImageUrl(src, options);

    return (
      <div
        ref={ref}
        className={cn('bg-no-repeat bg-cover bg-center', className)}
        style={{
          backgroundImage: `url(${optimizedSrc})`,
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    );
  },
);

OptimizedBackgroundImage.displayName = 'OptimizedBackgroundImage';

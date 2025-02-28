import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  getOptimizedImageUrl, 
  getLowQualityImagePlaceholder, 
  getResponsiveSrcSet,
  ImageOptimizationOptions,
  ImageLoadingMode,
  getBestSupportedFormat
} from '@/lib/image-optimization';

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
}

/**
 * A responsive, optimized image component with blur-up loading effect
 */
export const OptimizedImage = React.forwardRef<HTMLImageElement, OptimizedImageProps>(
  ({
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
    ...props
  }, ref) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(false);
    
    // Override loading mode if priority is set
    const loading = priority ? 'eager' : initialLoading;
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
      loading
    };
    
    // Get optimized image URL
    const optimizedSrc = getOptimizedImageUrl(src, options);
    
    // Generate a low quality placeholder for blur-up effect
    const placeholderSrc = blurUp ? getLowQualityImagePlaceholder(src) : '';
    
    // Generate srcset for responsive images
    const srcSet = width ? getResponsiveSrcSet(
      src,
      responsiveWidths.filter(w => w <= width * 2), // Only include widths up to 2x the displayed size
      { ...options, width: undefined }
    ) : undefined;
    
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
      ...(fill ? { objectFit, position: 'absolute', width: '100%', height: '100%', inset: 0 } : {}),
      ...style
    };
    
    // Handle error
    useEffect(() => {
      setError(false);
    }, [src]);
    
    // If there's an error loading the image, show a placeholder
    if (error) {
      return (
        <div 
          className={cn(
            'bg-muted flex items-center justify-center text-muted-foreground',
            containerClassName
          )}
          style={aspectRatioStyle}
        >
          <span>{alt || 'Image failed to load'}</span>
        </div>
      );
    }
    
    // Determine if we need a container
    if (fill || containerClassName) {
      return (
        <div 
          className={cn(
            'relative overflow-hidden',
            containerClassName
          )}
          style={aspectRatioStyle}
        >
          {blurUp && !isLoaded && (
            <img
              src={placeholderSrc}
              alt={alt}
              className={cn(
                'transition-opacity duration-300 w-full h-full',
                className
              )}
              style={{
                ...combinedStyles,
                filter: 'blur(15px)',
                objectFit,
                opacity: isLoaded ? 0 : 1,
                position: 'absolute',
                inset: 0
              }}
              aria-hidden="true"
            />
          )}
          
          <img
            ref={ref}
            src={optimizedSrc}
            alt={alt}
            width={width}
            height={height}
            loading={loading}
            onLoad={() => setIsLoaded(true)}
            onError={() => setError(true)}
            className={cn(
              'transition-opacity duration-500',
              !isLoaded && blurUp && 'opacity-0',
              className
            )}
            style={combinedStyles}
            sizes={sizes}
            srcSet={srcSet}
            fetchPriority={fetchPriority}
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
            className={cn(
              'transition-opacity duration-300',
              className
            )}
            style={{
              ...combinedStyles,
              filter: 'blur(15px)',
              position: 'absolute',
              opacity: isLoaded ? 0 : 1,
            }}
            aria-hidden="true"
          />
        )}
        
        <img
          ref={ref}
          src={optimizedSrc}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          onLoad={() => setIsLoaded(true)}
          onError={() => setError(true)}
          className={cn(
            'transition-opacity duration-500',
            !isLoaded && blurUp && 'opacity-0',
            className
          )}
          style={combinedStyles}
          sizes={sizes}
          srcSet={srcSet}
          fetchPriority={fetchPriority}
          {...props}
        />
      </>
    );
  }
);

OptimizedImage.displayName = 'OptimizedImage'; 
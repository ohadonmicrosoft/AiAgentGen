import { useEffect, useRef, useState, useCallback } from 'react';
import { useReducedMotion } from './use-reduced-motion';

export interface InfiniteScrollOptions {
  /**
   * Distance from the bottom of the container in pixels at which to trigger loading more
   */
  threshold?: number;
  
  /**
   * Whether to disable infinite scroll
   */
  disabled?: boolean;
  
  /**
   * Function to call when more items should be loaded
   */
  onLoadMore: () => Promise<any>;
  
  /**
   * Whether there are more items to load
   */
  hasMore: boolean;
  
  /**
   * Root margin for the intersection observer
   */
  rootMargin?: string;
  
  /**
   * Element to use as the scroll container; defaults to window
   */
  scrollContainer?: React.RefObject<HTMLElement>;
}

export interface InfiniteScrollResult {
  /**
   * Ref to attach to the element at the end of the list
   */
  sentinelRef: React.RefObject<HTMLDivElement>;
  
  /**
   * Whether new items are currently being loaded
   */
  isLoading: boolean;
  
  /**
   * Whether an error occurred while loading more items
   */
  error: Error | null;
  
  /**
   * Manually trigger loading more items
   */
  loadMore: () => Promise<void>;
}

/**
 * Hook for implementing infinite scroll in a component
 * 
 * @example
 * const { sentinelRef, isLoading, error } = useInfiniteScroll({
 *   hasMore: items.length < totalItems,
 *   onLoadMore: () => fetchMoreItems()
 * });
 * 
 * // At the end of your list:
 * <div ref={sentinelRef}>
 *   {isLoading && <Spinner />}
 * </div>
 */
export function useInfiniteScroll({
  threshold = 200,
  disabled = false,
  onLoadMore,
  hasMore,
  rootMargin = '0px 0px 200px 0px',
  scrollContainer,
}: InfiniteScrollOptions): InfiniteScrollResult {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const prefersReducedMotion = useReducedMotion();

  // Function to load more items
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore || disabled) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await onLoadMore();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error loading more items'));
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, disabled, onLoadMore]);

  // Set up intersection observer
  useEffect(() => {
    if (!sentinelRef.current || disabled || !hasMore) return;
    
    const options: IntersectionObserverInit = {
      rootMargin,
      threshold: 0.1,
    };
    
    if (scrollContainer?.current) {
      options.root = scrollContainer.current;
    }
    
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMore && !isLoading) {
        loadMore();
      }
    }, options);
    
    observer.observe(sentinelRef.current);
    observerRef.current = observer;
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [
    hasMore, 
    isLoading, 
    disabled, 
    loadMore, 
    rootMargin, 
    scrollContainer
  ]);
  
  // If reduced motion is preferred, we might want to adjust the threshold
  // to be more generous to avoid abrupt loading behavior
  useEffect(() => {
    if (prefersReducedMotion && observerRef.current && sentinelRef.current) {
      // Disconnect and reconnect with a more generous rootMargin
      observerRef.current.disconnect();
      
      const options: IntersectionObserverInit = {
        rootMargin: rootMargin,
        threshold: 0.3, // Higher threshold for reduced motion
      };
      
      if (scrollContainer?.current) {
        options.root = scrollContainer.current;
      }
      
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      }, options);
      
      observer.observe(sentinelRef.current);
      observerRef.current = observer;
    }
  }, [prefersReducedMotion, rootMargin, hasMore, isLoading, loadMore, scrollContainer]);

  return {
    sentinelRef,
    isLoading,
    error,
    loadMore,
  };
}
import { type MutableRefObject, useEffect, useRef, useState } from "react";

export interface UseInViewOptions {
  /**
   * The root element to use as the viewport
   * @default null (browser viewport)
   */
  root?: Element | null;

  /**
   * Margin around the root element
   * @default "0px"
   */
  rootMargin?: string;

  /**
   * Threshold(s) at which to trigger the callback
   * @default 0
   */
  threshold?: number | number[];

  /**
   * Whether to trigger only once
   * @default false
   */
  triggerOnce?: boolean;

  /**
   * Skip creating the IntersectionObserver
   * @default false
   */
  skip?: boolean;

  /**
   * Initial value for inView
   * @default false
   */
  initialInView?: boolean;
}

export interface UseInViewResult<T extends Element = Element> {
  /**
   * Whether the element is in view
   */
  inView: boolean;

  /**
   * Reference to attach to the element
   */
  ref: MutableRefObject<T | null>;

  /**
   * The IntersectionObserverEntry
   */
  entry: IntersectionObserverEntry | null;
}

/**
 * Hook to track when an element is in the viewport using IntersectionObserver
 */
export function useInView<T extends Element = Element>({
  root = null,
  rootMargin = "0px",
  threshold = 0,
  triggerOnce = false,
  skip = false,
  initialInView = false,
}: UseInViewOptions = {}): UseInViewResult<T> {
  const [inView, setInView] = useState<boolean>(initialInView);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const ref = useRef<T | null>(null);
  const frozen = useRef<boolean>(false);

  useEffect(() => {
    // Don't observe if:
    // - No element ref
    // - Skip is true
    // - We've already triggered once and frozen the state
    if (!ref.current || skip || (triggerOnce && frozen.current)) {
      return;
    }

    const node = ref.current;

    // Create the observer instance
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Update state with new entry
        setEntry(entry);

        // Update inView state
        const isInView = entry.isIntersecting;
        setInView(isInView);

        // If it's in view and we only want to trigger once, freeze it
        if (isInView && triggerOnce) {
          frozen.current = true;
          // Disconnect immediately to save resources
          observer.disconnect();
        }
      },
      { root, rootMargin, threshold },
    );

    // Start observing
    observer.observe(node);

    // Clean up
    return () => {
      observer.disconnect();
    };
  }, [root, rootMargin, threshold, triggerOnce, skip]);

  return { inView, ref, entry };
}

/**
 * Component wrapper for useInView hook
 */
export function InView<T extends Element = Element>({
  children,
  as = "div",
  onChange,
  ...options
}: UseInViewOptions & {
  children:
    | React.ReactNode
    | ((
        inView: boolean,
        entry: IntersectionObserverEntry | null,
      ) => React.ReactNode);
  as?: React.ElementType;
  onChange?: (inView: boolean, entry: IntersectionObserverEntry | null) => void;
}) {
  const { ref, inView, entry } = useInView<T>(options);

  // Call onChange when inView changes
  useEffect(() => {
    if (onChange) {
      onChange(inView, entry);
    }
  }, [inView, entry, onChange]);

  const Component = as;

  return (
    <Component ref={ref}>
      {typeof children === "function" ? children(inView, entry) : children}
    </Component>
  );
}

/**
 * Phase 4: Performance Utilities
 * 
 * Collection of utilities for optimizing performance:
 * - Debouncing
 * - Throttling
 * - Lazy loading
 * - Memoization helpers
 */

/**
 * Debounce function - delays execution until after wait milliseconds have elapsed
 * since the last time it was invoked
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function debounced(...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Throttle function - ensures a function is only called once per specified time period
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function throttled(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Memoization helper - caches function results based on arguments
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  resolver?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = resolver ? resolver(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Batch updates - collects multiple updates and applies them in a single batch
 */
export class BatchUpdater<T> {
  private updates: T[] = [];
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private callback: (updates: T[]) => void;
  private delay: number;

  constructor(callback: (updates: T[]) => void, delay: number = 100) {
    this.callback = callback;
    this.delay = delay;
  }

  add(update: T) {
    this.updates.push(update);

    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.flush();
    }, this.delay);
  }

  flush() {
    if (this.updates.length > 0) {
      this.callback([...this.updates]);
      this.updates = [];
    }

    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

/**
 * Virtual scrolling helper - calculates visible items in a list
 */
export function calculateVisibleItems<T>(
  items: T[],
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  overscan: number = 3
): {
  visibleItems: T[];
  startIndex: number;
  endIndex: number;
  offsetY: number;
} {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  return {
    visibleItems: items.slice(startIndex, endIndex + 1),
    startIndex,
    endIndex,
    offsetY: startIndex * itemHeight,
  };
}

/**
 * Image lazy loading helper
 */
export function lazyLoadImage(
  src: string,
  placeholder: string = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E"
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = reject;
    img.src = src;

    // Return placeholder immediately
    resolve(placeholder);
  });
}

/**
 * Intersection Observer helper for lazy loading
 */
export function createLazyObserver(
  callback: (entry: IntersectionObserverEntry) => void,
  options?: IntersectionObserverInit
): IntersectionObserver {
  return new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback(entry);
        }
      });
    },
    {
      rootMargin: "50px",
      threshold: 0.01,
      ...options,
    }
  );
}

/**
 * Request Animation Frame helper for smooth animations
 */
export function smoothScroll(
  element: HTMLElement,
  to: number,
  duration: number = 300
): void {
  const start = element.scrollTop;
  const change = to - start;
  const startTime = performance.now();

  function animateScroll(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing function (ease-in-out)
    const easing = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    element.scrollTop = start + change * easing;

    if (progress < 1) {
      requestAnimationFrame(animateScroll);
    }
  }

  requestAnimationFrame(animateScroll);
}

/**
 * Performance monitoring helper
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();

  start(label: string): void {
    this.marks.set(label, performance.now());
  }

  end(label: string): number | null {
    const startTime = this.marks.get(label);
    if (!startTime) return null;

    const duration = performance.now() - startTime;
    this.marks.delete(label);

    console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  measure(label: string, fn: () => void): void {
    this.start(label);
    fn();
    this.end(label);
  }

  async measureAsync(label: string, fn: () => Promise<void>): Promise<void> {
    this.start(label);
    await fn();
    this.end(label);
  }
}

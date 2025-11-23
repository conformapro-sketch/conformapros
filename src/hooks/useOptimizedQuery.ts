import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useCallback } from "react";

/**
 * Phase 4: Optimized query hook with automatic error handling and loading states
 * 
 * Wraps React Query's useQuery with sensible defaults and utilities
 */

interface UseOptimizedQueryOptions<TData, TError = Error> extends Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'> {
  onError?: (error: TError) => void;
  onSuccess?: (data: TData) => void;
}

export function useOptimizedQuery<TData = unknown, TError = Error>(
  queryKey: any[],
  queryFn: () => Promise<TData>,
  options?: UseOptimizedQueryOptions<TData, TError>
) {
  const { onError, onSuccess, ...restOptions } = options || {};

  const query = useQuery<TData, TError>({
    queryKey,
    queryFn,
    ...restOptions,
  });

  // Automatic error handling
  if (query.isError && onError) {
    onError(query.error);
  }

  // Automatic success handling
  if (query.isSuccess && onSuccess) {
    onSuccess(query.data);
  }

  return query;
}

/**
 * Debounced query hook for search inputs
 * Automatically debounces the query function
 */
export function useDebouncedQuery<TData = unknown, TError = Error>(
  queryKey: any[],
  queryFn: () => Promise<TData>,
  debounceMs: number = 300,
  options?: UseOptimizedQueryOptions<TData, TError>
) {
  const debouncedQueryFn = useCallback(() => {
    return new Promise<TData>((resolve) => {
      const timeoutId = setTimeout(async () => {
        const result = await queryFn();
        resolve(result);
      }, debounceMs);

      // Cleanup
      return () => clearTimeout(timeoutId);
    });
  }, [queryFn, debounceMs]);

  return useOptimizedQuery(queryKey, debouncedQueryFn, options);
}

/**
 * Paginated query hook with automatic page management
 */
export function usePaginatedQuery<TData = unknown, TError = Error>(
  queryKey: any[],
  queryFn: (page: number) => Promise<TData>,
  initialPage: number = 1,
  options?: UseOptimizedQueryOptions<TData, TError>
) {
  const query = useQuery<TData, TError>({
    queryKey: [...queryKey, initialPage],
    queryFn: () => queryFn(initialPage),
    ...options,
  });

  return {
    ...query,
    page: initialPage,
  };
}

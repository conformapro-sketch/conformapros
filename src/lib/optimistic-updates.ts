import { QueryClient } from "@tanstack/react-query";

/**
 * Optimistic update utilities
 * Provides instant UI feedback before server confirmation
 */

interface OptimisticContext<T> {
  previousData: T | undefined;
  queryKey: string[];
}

/**
 * Generic optimistic update function
 * Updates cache optimistically and returns rollback context
 */
export function applyOptimisticUpdate<T>(
  queryClient: QueryClient,
  queryKey: string[],
  updater: (old: T | undefined) => T
): OptimisticContext<T> {
  // Cancel any outgoing refetches
  queryClient.cancelQueries({ queryKey });

  // Snapshot the previous value
  const previousData = queryClient.getQueryData<T>(queryKey);

  // Optimistically update to the new value
  queryClient.setQueryData(queryKey, updater);

  return { previousData, queryKey };
}

/**
 * Rollback optimistic update on error
 */
export function rollbackOptimisticUpdate<T>(
  queryClient: QueryClient,
  context: OptimisticContext<T>
) {
  if (context.previousData !== undefined) {
    queryClient.setQueryData(context.queryKey, context.previousData);
  }
}

/**
 * Optimistic update for adding an item to a list
 */
export function optimisticallyAddItem<T extends { id: string }>(
  queryClient: QueryClient,
  queryKey: string[],
  newItem: T
) {
  return applyOptimisticUpdate<T[]>(queryClient, queryKey, (old = []) => [
    ...old,
    newItem,
  ]);
}

/**
 * Optimistic update for updating an item in a list
 */
export function optimisticallyUpdateItem<T extends { id: string }>(
  queryClient: QueryClient,
  queryKey: string[],
  itemId: string,
  updates: Partial<T>
) {
  return applyOptimisticUpdate<T[]>(queryClient, queryKey, (old = []) =>
    old.map((item) =>
      item.id === itemId ? { ...item, ...updates } : item
    )
  );
}

/**
 * Optimistic update for removing an item from a list
 */
export function optimisticallyRemoveItem<T extends { id: string }>(
  queryClient: QueryClient,
  queryKey: string[],
  itemId: string
) {
  return applyOptimisticUpdate<T[]>(queryClient, queryKey, (old = []) =>
    old.filter((item) => item.id !== itemId)
  );
}

/**
 * Optimistic update for toggling a boolean property
 */
export function optimisticallyToggle<T extends { id: string }>(
  queryClient: QueryClient,
  queryKey: string[],
  itemId: string,
  property: keyof T
) {
  return applyOptimisticUpdate<T[]>(queryClient, queryKey, (old = []) =>
    old.map((item) =>
      item.id === itemId
        ? { ...item, [property]: !item[property] }
        : item
    )
  );
}

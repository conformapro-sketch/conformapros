import { QueryClient } from "@tanstack/react-query";

/**
 * Phase 4: Performance Optimizations
 * 
 * Centralized React Query configuration for optimal caching and performance:
 * - 5-minute stale time for most data (reduces unnecessary refetches)
 * - 10-minute cache time (keeps data in memory longer)
 * - Automatic retry with exponential backoff
 * - Optimistic updates enabled
 */

export const queryConfig = {
  defaultOptions: {
    queries: {
      // Data considered fresh for 5 minutes (no background refetch)
      staleTime: 5 * 60 * 1000,
      
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      
      // Retry failed requests 3 times with exponential backoff
      retry: 3,
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus (but respects staleTime)
      refetchOnWindowFocus: true,
      
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
      
      // Enable suspense mode for better loading states
      suspense: false,
    },
    mutations: {
      // Automatic retry for mutations
      retry: 1,
      
      // Optimistic updates enabled
      onError: (error: any) => {
        console.error('Mutation error:', error);
      },
    },
  },
};

// Create optimized query client
export function createOptimizedQueryClient() {
  return new QueryClient(queryConfig);
}

/**
 * Query key factories for consistent cache management
 * These ensure proper cache invalidation and prevent duplicate fetches
 */
export const queryKeys = {
  // User management
  staffUsers: (filters: any) => ['staff-users', filters] as const,
  clientAdminUsers: (filters: any) => ['client-admin-users', filters] as const,
  userDetail: (userId: string) => ['user-detail', userId] as const,
  userPermissions: (userId: string, siteId: string) => ['user-permissions', userId, siteId] as const,
  userAudit: (userId: string) => ['user-audit', userId] as const,
  
  // Sites and clients
  clients: () => ['clients'] as const,
  clientDetail: (clientId: string) => ['client', clientId] as const,
  clientSites: (clientId: string) => ['client-sites', clientId] as const,
  siteModules: (siteId: string) => ['site-modules', siteId] as const,
  
  // Permissions
  sitePermissions: (userId: string, siteId: string) => ['site-permissions', userId, siteId] as const,
  roles: () => ['roles'] as const,
  
  // Audit logs
  auditLogs: (filters?: any) => ['audit-logs', filters] as const,
};

/**
 * Cache invalidation helpers
 * Centralized functions to invalidate related queries
 */
export const invalidateQueries = {
  userManagement: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ['staff-users'] });
    queryClient.invalidateQueries({ queryKey: ['client-admin-users'] });
  },
  
  userDetail: (queryClient: QueryClient, userId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.userDetail(userId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.userAudit(userId) });
  },
  
  permissions: (queryClient: QueryClient, userId: string, siteId?: string) => {
    if (siteId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.userPermissions(userId, siteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sitePermissions(userId, siteId) });
    } else {
      queryClient.invalidateQueries({ queryKey: ['user-permissions', userId] });
    }
  },
  
  sites: (queryClient: QueryClient, clientId?: string) => {
    if (clientId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.clientSites(clientId) });
    }
    queryClient.invalidateQueries({ queryKey: ['sites'] });
  },
};

/**
 * Prefetch strategies for better UX
 * Preload data that users are likely to need
 */
export const prefetchStrategies = {
  // Prefetch user details when hovering over a user card
  userDetails: async (queryClient: QueryClient, userId: string) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.userDetail(userId),
      queryFn: async () => {
        // This would be implemented in the actual component
        throw new Error('Prefetch function not implemented');
      },
      staleTime: 5 * 60 * 1000,
    });
  },
  
  // Prefetch site modules when selecting a site
  siteModules: async (queryClient: QueryClient, siteId: string) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.siteModules(siteId),
      queryFn: async () => {
        throw new Error('Prefetch function not implemented');
      },
      staleTime: 10 * 60 * 1000, // Modules change rarely
    });
  },
};

/**
 * Optimistic update helpers
 * For instant UI feedback before server confirmation
 */
export const optimisticUpdates = {
  updateUser: (queryClient: QueryClient, userId: string, updates: any) => {
    // Snapshot current data
    const previousData = queryClient.getQueryData(queryKeys.userDetail(userId));
    
    // Optimistically update
    queryClient.setQueryData(queryKeys.userDetail(userId), (old: any) => ({
      ...old,
      ...updates,
    }));
    
    return { previousData };
  },
  
  rollback: (queryClient: QueryClient, userId: string, context: any) => {
    if (context?.previousData) {
      queryClient.setQueryData(queryKeys.userDetail(userId), context.previousData);
    }
  },
};

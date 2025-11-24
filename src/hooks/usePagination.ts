import { useState, useMemo } from 'react';

/**
 * Shared pagination hook
 * Provides consistent pagination logic across tables
 */
export function usePagination<T>(items: T[], pageSize: number = 20) {
  const [page, setPage] = useState(1);

  const paginatedItems = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return items.slice(startIndex, endIndex);
  }, [items, page, pageSize]);

  const totalPages = Math.ceil(items.length / pageSize);

  const goToPage = (newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  const goToNextPage = () => goToPage(page + 1);
  const goToPrevPage = () => goToPage(page - 1);
  const resetPage = () => setPage(1);

  return {
    page,
    totalPages,
    paginatedItems,
    goToPage,
    goToNextPage,
    goToPrevPage,
    resetPage,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

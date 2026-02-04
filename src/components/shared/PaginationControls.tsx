import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  pageSizeOptions?: number[];
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 25, 50, 100];

/**
 * Reusable pagination controls component
 * Provides consistent pagination UI across tables with page size selection
 */
export function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  hasNextPage,
  hasPrevPage,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: PaginationControlsProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 px-2 py-3">
      {/* Left: Total count and range */}
      <div className="flex items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
        <span className="font-medium">
          {totalItems} élément{totalItems > 1 ? "s" : ""}
        </span>
        {totalItems > 0 && (
          <span className="hidden sm:inline">
            ({startItem} à {endItem})
          </span>
        )}
      </div>

      {/* Right: Page size selector and navigation */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Page size selector */}
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-sm text-muted-foreground whitespace-nowrap">
              Lignes :
            </span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => onPageSizeChange(parseInt(value))}
            >
              <SelectTrigger className="h-9 w-16 sm:w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((option) => (
                  <SelectItem key={option} value={option.toString()}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Page navigation */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {currentPage}/{totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={!hasPrevPage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={!hasNextPage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

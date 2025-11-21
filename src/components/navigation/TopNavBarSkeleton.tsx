import { Skeleton } from "@/components/ui/skeleton";

export function TopNavBarSkeleton() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-slate-200/60 bg-white/80 backdrop-blur dark:border-slate-700/60 dark:bg-[#0B2540]/80">
      <div className="mx-auto flex h-full w-full max-w-screen-2xl items-center gap-3 px-4 md:px-6">
        {/* Logo Section */}
        <div className="flex min-w-[170px] items-center gap-3">
          <Skeleton className="h-9 w-9 md:hidden" />
          <Skeleton className="h-8 w-32" />
        </div>

        {/* Search Bar */}
        <div className="hidden flex-1 justify-center md:flex">
          <Skeleton className="h-9 w-full max-w-xl rounded-full" />
        </div>

        {/* Right Section */}
        <div className="flex items-center justify-end gap-2 md:min-w-[170px]">
          <Skeleton className="h-9 w-9 md:hidden" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>
      </div>
    </div>
  );
}

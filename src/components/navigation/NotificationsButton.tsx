import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface NotificationsButtonProps {
  count?: number;
}

export function NotificationsButton({ count = 0 }: NotificationsButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 text-foreground transition-colors hover:text-[#2FB200]"
          aria-label="Notifications"
          disabled
        >
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>Notifications (Configuration requise)</TooltipContent>
    </Tooltip>
  );
}

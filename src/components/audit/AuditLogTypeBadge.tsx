import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { ACTION_TYPE_CONFIG } from "./AuditLogStats";

interface ActionTypeBadgeProps {
  type: string;
}

export function ActionTypeBadge({ type }: ActionTypeBadgeProps) {
  const config = ACTION_TYPE_CONFIG[type] || { label: type, icon: FileText, color: "bg-muted text-muted-foreground" };
  const Icon = config.icon;
  
  return (
    <Badge variant="outline" className={`gap-1 ${config.color}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

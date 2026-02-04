import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  variant?: "default" | "success" | "warning" | "destructive";
}

export function StatCard({ title, value, icon: Icon, trend, variant = "default" }: StatCardProps) {
  const variantStyles = {
    default: "border-l-4 border-l-primary",
    success: "border-l-4 border-l-success bg-success/5",
    warning: "border-l-4 border-l-warning bg-warning/5",
    destructive: "border-l-4 border-l-destructive bg-destructive/5",
  };

  return (
    <Card className={cn("shadow-soft hover:shadow-medium transition-shadow", variantStyles[variant])}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground leading-tight">{title}</CardTitle>
        <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
        <div className="text-xl sm:text-2xl md:text-3xl font-bold truncate">{value}</div>
        {trend && <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 truncate">{trend}</p>}
      </CardContent>
    </Card>
  );
}

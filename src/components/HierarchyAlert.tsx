import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle, Info, CheckCircle } from "lucide-react";

interface HierarchyAlertProps {
  severity: "error" | "warning" | "info" | "success";
  message: string;
}

export function HierarchyAlert({ severity, message }: HierarchyAlertProps) {
  const config = {
    error: {
      icon: AlertCircle,
      className: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      title: "Erreur de hiérarchie"
    },
    warning: {
      icon: AlertTriangle,
      className: "border-yellow-500/50 text-yellow-700 dark:text-yellow-400 [&>svg]:text-yellow-600 dark:[&>svg]:text-yellow-400",
      title: "Attention"
    },
    info: {
      icon: Info,
      className: "border-blue-500/50 text-blue-700 dark:text-blue-400 [&>svg]:text-blue-600 dark:[&>svg]:text-blue-400",
      title: "Information"
    },
    success: {
      icon: CheckCircle,
      className: "border-green-500/50 text-green-700 dark:text-green-400 [&>svg]:text-green-600 dark:[&>svg]:text-green-400",
      title: "Conforme"
    }
  };

  const { icon: Icon, className, title } = config[severity];

  return (
    <Alert className={className}>
      <Icon className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, X } from "lucide-react";
import { useState } from "react";

interface ErrorAlertProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

/**
 * Reusable error alert component
 * Provides consistent error display with optional retry/dismiss actions
 */
export function ErrorAlert({ 
  title = "Erreur", 
  message, 
  onRetry, 
  onDismiss 
}: ErrorAlertProps) {
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (dismissed) return null;

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>{title}</span>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0 hover:bg-transparent"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{message}</p>
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="mt-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

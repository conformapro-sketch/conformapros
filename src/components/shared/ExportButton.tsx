import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { useExportData } from "@/hooks/useExportData";

interface ExportButtonProps {
  data: any[];
  fileName: string;
  sheetName?: string;
  disabled?: boolean;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

/**
 * Reusable export button component
 * Handles exporting data to Excel with consistent behavior
 */
export function ExportButton({ 
  data, 
  fileName, 
  sheetName = "Data",
  disabled = false,
  variant = "outline",
  size = "default",
  className 
}: ExportButtonProps) {
  const { exportToExcel } = useExportData();

  const handleExport = () => {
    exportToExcel(data, fileName, sheetName);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={disabled || data.length === 0}
      className={className}
    >
      <FileDown className="h-4 w-4 mr-2" />
      Exporter
    </Button>
  );
}

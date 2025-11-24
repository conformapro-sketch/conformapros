import { useCallback } from 'react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

/**
 * Shared hook for exporting data to Excel
 * Provides consistent export functionality across the application
 */
export function useExportData() {
  const exportToExcel = useCallback((data: any[], fileName: string, sheetName: string = 'Data') => {
    try {
      if (!data || data.length === 0) {
        toast.error('Aucune donnée à exporter');
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      
      // Generate file with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const fullFileName = `${fileName}_${timestamp}.xlsx`;
      
      XLSX.writeFile(workbook, fullFileName);
      
      toast.success(`Export réussi: ${fullFileName}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erreur lors de l\'export');
    }
  }, []);

  return { exportToExcel };
}

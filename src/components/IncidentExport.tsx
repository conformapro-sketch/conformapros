import { Button } from "@/components/ui/button";
import { FileDown, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import { Incident, TYPE_INCIDENT_LABELS, GRAVITE_INCIDENT_LABELS } from "@/types/incidents";

interface IncidentExportProps {
  incidents: Incident[];
}

export function IncidentExport({ incidents }: IncidentExportProps) {
  const exportToExcel = () => {
    const data = incidents.map((incident) => ({
      "N° Incident": incident.numero_incident,
      "Date": new Date(incident.date_incident).toLocaleDateString("fr-FR"),
      "Type": TYPE_INCIDENT_LABELS[incident.type_incident],
      "Site": incident.sites?.nom_site || "-",
      "Gravité": GRAVITE_INCIDENT_LABELS[incident.gravite],
      "Statut": incident.statut === "en_cours" ? "En cours" : "Clôturé",
      "Description": incident.description,
      "Personne impliquée": incident.personne_impliquee_nom || "-",
      "Déclarant": incident.declarant_nom || "-",
      "Zone": incident.zone || "-",
      "Mesures correctives": incident.mesures_correctives || "-",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Incidents");

    // Auto-size columns
    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.max(
        key.length,
        ...data.map((row) => String(row[key as keyof typeof row]).length)
      ),
    }));
    ws["!cols"] = colWidths;

    XLSX.writeFile(wb, `incidents_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <div className="flex gap-2">
      <Button onClick={exportToExcel} variant="outline" size="sm">
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        Exporter Excel
      </Button>
    </div>
  );
}

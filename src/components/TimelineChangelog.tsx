import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Edit, Trash2 } from "lucide-react";

interface ChangelogEntry {
  id: string;
  type_changement: "ajout" | "modification" | "abrogation";
  description: string;
  date_changement: string;
  version?: number;
  created_at?: string;
}

interface TimelineChangelogProps {
  entries: ChangelogEntry[];
}

export function TimelineChangelog({ entries }: TimelineChangelogProps) {
  const getTypeInfo = (type: string) => {
    switch (type) {
      case "ajout":
        return { 
          label: "Ajout", 
          icon: Plus, 
          className: "bg-success/10 text-success border-success/20"
        };
      case "modification":
        return { 
          label: "Modification", 
          icon: Edit, 
          className: "bg-warning/10 text-warning border-warning/20"
        };
      case "abrogation":
        return { 
          label: "Abrogation", 
          icon: Trash2, 
          className: "bg-destructive/10 text-destructive border-destructive/20"
        };
      default:
        return { 
          label: type, 
          icon: Calendar, 
          className: "bg-muted text-muted-foreground"
        };
    }
  };

  if (!entries || entries.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-center">Aucune modification enregistrée</p>
      </Card>
    );
  }

  // Sort by date descending
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(b.date_changement).getTime() - new Date(a.date_changement).getTime()
  );

  return (
    <div className="relative space-y-4">
      {/* Timeline line */}
      <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-border" />

      {sortedEntries.map((entry) => {
        const typeInfo = getTypeInfo(entry.type_changement);
        const Icon = typeInfo.icon;

        return (
          <div key={entry.id} className="relative flex gap-4">
            {/* Timeline dot */}
            <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${typeInfo.className}`}>
              <Icon className="h-4 w-4" />
            </div>

            {/* Content */}
            <Card className="flex-1 p-4 shadow-soft">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                <Badge variant="outline" className={typeInfo.className}>
                  {typeInfo.label}
                </Badge>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(entry.date_changement).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </div>
              </div>
              <p className="text-sm leading-relaxed">{entry.description}</p>
              {entry.version && (
                <p className="text-xs text-muted-foreground mt-2">
                  Version {entry.version}
                </p>
              )}
            </Card>
          </div>
        );
      })}
    </div>
  );
}

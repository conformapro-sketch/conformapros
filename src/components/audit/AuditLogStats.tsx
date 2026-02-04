import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  UserPlus,
  UserMinus,
  Shield,
  Settings,
  MapPin,
} from "lucide-react";

interface AuditLogStatsProps {
  total: number;
  byType: Record<string, number>;
}

export const ACTION_TYPE_CONFIG: Record<string, { label: string; icon: React.ComponentType<any>; color: string }> = {
  create: { label: "Création", icon: UserPlus, color: "bg-green-500/10 text-green-600 border-green-200" },
  update: { label: "Modification", icon: Settings, color: "bg-blue-500/10 text-blue-600 border-blue-200" },
  delete: { label: "Suppression", icon: UserMinus, color: "bg-red-500/10 text-red-600 border-red-200" },
  site_assignment: { label: "Affectation site", icon: MapPin, color: "bg-purple-500/10 text-purple-600 border-purple-200" },
  permission_change: { label: "Permissions", icon: Shield, color: "bg-amber-500/10 text-amber-600 border-amber-200" },
  status_change: { label: "Statut", icon: Settings, color: "bg-slate-500/10 text-slate-600 border-slate-200" },
  role_change: { label: "Rôle", icon: Shield, color: "bg-indigo-500/10 text-indigo-600 border-indigo-200" },
};

export function AuditLogStats({ total, byType }: AuditLogStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      <Card className="col-span-1">
        <CardContent className="pt-4">
          <div className="text-2xl font-bold">{total}</div>
          <p className="text-xs text-muted-foreground">Total actions</p>
        </CardContent>
      </Card>
      {Object.entries(ACTION_TYPE_CONFIG).map(([type, config]) => (
        <Card key={type} className="col-span-1">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <config.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg font-semibold">{byType?.[type] || 0}</span>
            </div>
            <p className="text-xs text-muted-foreground">{config.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

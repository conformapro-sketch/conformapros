import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Clock, User, Building2, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ActionTypeBadge } from "./AuditLogTypeBadge";
import { AuditLogDetailsDialog } from "./AuditLogDetailsDialog";
import type { AuditLog } from "./types";

interface AuditLogTableProps {
  logs: AuditLog[];
  isLoading: boolean;
}

export function AuditLogTable({ logs, isLoading }: AuditLogTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Effectué par</TableHead>
              <TableHead>Utilisateur cible</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Site</TableHead>
              <TableHead className="text-right">Détails</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  Aucune action enregistrée
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <ActionTypeBadge type={log.action_type} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm truncate max-w-[200px]">
                        {log.performer_email || log.performed_by}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm truncate max-w-[200px]">
                      {log.target_email || log.target_user_id}
                    </span>
                  </TableCell>
                  <TableCell>
                    {log.client_name ? (
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{log.client_name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {log.site_name ? (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{log.site_name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <AuditLogDetailsDialog log={log} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

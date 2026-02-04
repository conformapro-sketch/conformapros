import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ActionTypeBadge } from "./AuditLogTypeBadge";
import type { AuditLog } from "./types";

interface AuditLogDetailsDialogProps {
  log: AuditLog;
}

export function AuditLogDetailsDialog({ log }: AuditLogDetailsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Détails de l'action
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Type d'action</p>
              <ActionTypeBadge type={log.action_type} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">
                {format(new Date(log.created_at), "PPpp", { locale: fr })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Effectué par</p>
              <p className="font-medium">{log.performer_email || log.performed_by}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Utilisateur cible</p>
              <p className="font-medium">{log.target_email || log.target_user_id}</p>
            </div>
            {log.client_name && (
              <div>
                <p className="text-sm text-muted-foreground">Client</p>
                <p className="font-medium">{log.client_name}</p>
              </div>
            )}
            {log.site_name && (
              <div>
                <p className="text-sm text-muted-foreground">Site</p>
                <p className="font-medium">{log.site_name}</p>
              </div>
            )}
          </div>
          
          {log.before_state && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">État avant</p>
              <ScrollArea className="h-32 rounded border bg-muted/50 p-3">
                <pre className="text-xs">{JSON.stringify(log.before_state, null, 2)}</pre>
              </ScrollArea>
            </div>
          )}
          
          {log.after_state && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">État après</p>
              <ScrollArea className="h-32 rounded border bg-muted/50 p-3">
                <pre className="text-xs">{JSON.stringify(log.after_state, null, 2)}</pre>
              </ScrollArea>
            </div>
          )}
          
          {log.changes && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Modifications</p>
              <ScrollArea className="h-32 rounded border bg-muted/50 p-3">
                <pre className="text-xs">{JSON.stringify(log.changes, null, 2)}</pre>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

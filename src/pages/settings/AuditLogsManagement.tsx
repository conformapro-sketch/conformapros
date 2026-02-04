import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabaseAny as supabase } from "@/lib/supabase-any";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  FileText,
  User,
  Clock,
  Building2,
  MapPin,
  Filter,
  RefreshCw,
  ChevronDown,
  UserPlus,
  UserMinus,
  Shield,
  Settings,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface AuditLog {
  id: string;
  action_type: string;
  target_user_id: string;
  performed_by: string;
  client_id: string | null;
  site_id: string | null;
  before_state: any;
  after_state: any;
  changes: any;
  created_at: string;
  performer_email?: string;
  target_email?: string;
  client_name?: string;
  site_name?: string;
}

const ACTION_TYPE_CONFIG: Record<string, { label: string; icon: React.ComponentType<any>; color: string }> = {
  create: { label: "Création", icon: UserPlus, color: "bg-green-500/10 text-green-600 border-green-200" },
  update: { label: "Modification", icon: Settings, color: "bg-blue-500/10 text-blue-600 border-blue-200" },
  delete: { label: "Suppression", icon: UserMinus, color: "bg-red-500/10 text-red-600 border-red-200" },
  site_assignment: { label: "Affectation site", icon: MapPin, color: "bg-purple-500/10 text-purple-600 border-purple-200" },
  permission_change: { label: "Permissions", icon: Shield, color: "bg-amber-500/10 text-amber-600 border-amber-200" },
  status_change: { label: "Statut", icon: Settings, color: "bg-slate-500/10 text-slate-600 border-slate-200" },
  role_change: { label: "Rôle", icon: Shield, color: "bg-indigo-500/10 text-indigo-600 border-indigo-200" },
};

function ActionTypeBadge({ type }: { type: string }) {
  const config = ACTION_TYPE_CONFIG[type] || { label: type, icon: FileText, color: "bg-muted text-muted-foreground" };
  const Icon = config.icon;
  
  return (
    <Badge variant="outline" className={`gap-1 ${config.color}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

function LogDetailsDialog({ log }: { log: AuditLog }) {
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

export default function AuditLogsManagement() {
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ["audit-logs", actionFilter, searchTerm, page],
    queryFn: async () => {
      let query = supabase
        .from("user_management_audit")
        .select(`
          *,
          performer:performed_by(email),
          target:target_user_id(email),
          client:client_id(nom),
          site:site_id(nom)
        `, { count: "exact" })
        .order("created_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (actionFilter !== "all") {
        query = query.eq("action_type", actionFilter);
      }

      const { data, error, count } = await query;
      
      if (error) throw error;
      
      return {
        logs: (data || []).map((log: any) => ({
          ...log,
          performer_email: log.performer?.email,
          target_email: log.target?.email,
          client_name: log.client?.nom,
          site_name: log.site?.nom,
        })) as AuditLog[],
        totalCount: count || 0,
      };
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["audit-logs-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_management_audit")
        .select("action_type");
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      (data || []).forEach((log: any) => {
        counts[log.action_type] = (counts[log.action_type] || 0) + 1;
      });
      
      return {
        total: data?.length || 0,
        byType: counts,
      };
    },
  });

  const totalPages = Math.ceil((logs?.totalCount || 0) / pageSize);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Journal d'audit</h1>
          <p className="text-muted-foreground">
            Historique des actions de gestion des utilisateurs
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card className="col-span-1">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">Total actions</p>
          </CardContent>
        </Card>
        {Object.entries(ACTION_TYPE_CONFIG).map(([type, config]) => (
          <Card key={type} className="col-span-1">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <config.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-lg font-semibold">{stats?.byType?.[type] || 0}</span>
              </div>
              <p className="text-xs text-muted-foreground">{config.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filtrer par:</span>
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Type d'action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les actions</SelectItem>
            {Object.entries(ACTION_TYPE_CONFIG).map(([type, config]) => (
              <SelectItem key={type} value={type}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* Table */}
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
              ) : logs?.logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    Aucune action enregistrée
                  </TableCell>
                </TableRow>
              ) : (
                logs?.logs.map((log) => (
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
                      <LogDetailsDialog log={log} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} sur {totalPages} ({logs?.totalCount} résultats)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

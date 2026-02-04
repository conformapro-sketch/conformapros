import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabaseAny as supabase } from "@/lib/supabase-any";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuditLogStats } from "@/components/audit/AuditLogStats";
import { AuditLogFilters } from "@/components/audit/AuditLogFilters";
import { AuditLogTable } from "@/components/audit/AuditLogTable";
import type { AuditLog } from "@/components/audit/types";

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
      <AuditLogStats 
        total={stats?.total || 0} 
        byType={stats?.byType || {}} 
      />

      {/* Filters */}
      <AuditLogFilters
        actionFilter={actionFilter}
        onActionFilterChange={setActionFilter}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
      />

      {/* Table */}
      <AuditLogTable 
        logs={logs?.logs || []} 
        isLoading={isLoading} 
      />

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

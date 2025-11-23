import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Calendar, User } from "lucide-react";

interface UserActivitySectionProps {
  userId: string;
}

export function UserActivitySection({ userId }: UserActivitySectionProps) {
  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ["user-audit", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_management_audit")
        .select("*")
        .eq("target_user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const getActionBadge = (actionType: string) => {
    const colors: Record<string, string> = {
      create: "bg-green-500",
      update: "bg-blue-500",
      delete: "bg-red-500",
      permission_change: "bg-purple-500",
      site_assignment: "bg-orange-500",
      role_change: "bg-yellow-500",
    };
    return colors[actionType] || "bg-gray-500";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
        <CardDescription>Recent changes and actions</CardDescription>
      </CardHeader>
      <CardContent>
        {!auditLogs || auditLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No activity recorded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 border rounded-lg"
              >
                <div className="mt-1">
                  <Badge variant="default" className={getActionBadge(log.action_type)}>
                    {log.action_type.replace("_", " ")}
                  </Badge>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="text-sm">
                    Action performed by{" "}
                    <span className="font-medium">
                      {log.performed_by === userId ? "user" : "administrator"}
                    </span>
                  </div>
                  {log.changes && (
                    <div className="text-xs text-muted-foreground">
                      {JSON.stringify(log.changes, null, 2).slice(0, 100)}...
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

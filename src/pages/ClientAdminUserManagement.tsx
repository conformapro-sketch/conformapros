import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Search, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ClientAdminUserCard } from "@/components/client-admin/ClientAdminUserCard";
import { ClientAdminUserDetailsPanel } from "@/components/client-admin/ClientAdminUserDetailsPanel";
import { ClientUserFormModal } from "@/components/ClientUserFormModal";

export default function ClientAdminUserManagement() {
  const [search, setSearch] = useState("");
  const [siteFilter, setSiteFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  // Get current client admin's client
  const { data: currentUser } = useQuery({
    queryKey: ["current-client-admin"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("client_users")
        .select("*, client:clients(*)")
        .eq("id", user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch users via edge function
  const { data: usersData, isLoading, refetch } = useQuery({
    queryKey: ["client-admin-users", search, siteFilter, statusFilter, page],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('client-user-management', {
        body: {
          action: 'list',
          search: search || undefined,
          siteId: siteFilter || undefined,
          status: statusFilter || undefined,
          page,
          pageSize: 20,
        },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!currentUser,
  });

  // Fetch sites for filter
  const { data: sites } = useQuery({
    queryKey: ["client-sites", currentUser?.client_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sites")
        .select("id, nom")
        .eq("client_id", currentUser!.client_id)
        .order("nom");
      if (error) throw error;
      return data;
    },
    enabled: !!currentUser,
  });

  const users = usersData?.users || [];
  const totalCount = users[0]?.total_count || 0;
  const totalPages = Math.ceil(totalCount / 20);

  const stats = {
    total: totalCount,
    active: users.filter((u: any) => u.actif).length,
    inactive: users.filter((u: any) => !u.actif).length,
  };

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setIsPanelOpen(true);
  };

  if (!currentUser) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              Loading...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Management</h1>
          <p className="text-muted-foreground">
            Manage users for {currentUser.client?.nom}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setIsAddUserOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Badge variant="default" className="bg-green-500">Active</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <Badge variant="secondary">Inactive</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactive}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter your team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={siteFilter} onValueChange={setSiteFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Sites" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Sites</SelectItem>
                {sites?.map((site) => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="actif">Active</SelectItem>
                <SelectItem value="inactif">Inactive</SelectItem>
              </SelectContent>
            </Select>
            {(search || siteFilter || statusFilter) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearch("");
                  setSiteFilter("");
                  setStatusFilter("");
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* User Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-40" />
            </Card>
          ))
        ) : users.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No users found</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          users.map((user: any) => (
            <ClientAdminUserCard
              key={user.id}
              user={user}
              onClick={() => handleUserClick(user.id)}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* User Details Panel */}
      <ClientAdminUserDetailsPanel
        userId={selectedUserId}
        clientId={currentUser.client_id}
        open={isPanelOpen}
        onOpenChange={setIsPanelOpen}
        onUpdate={() => refetch()}
      />

      {/* Add User Modal */}
      <ClientUserFormModal
        open={isAddUserOpen}
        onOpenChange={setIsAddUserOpen}
        clientId={currentUser.client_id}
      />
    </div>
  );
}

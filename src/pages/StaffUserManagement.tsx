import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserPlus, Search, Filter, Download, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StaffUserDetailsPanel } from "@/components/staff/StaffUserDetailsPanel";
import { StaffUserDataGrid } from "@/components/staff/StaffUserDataGrid";

export default function StaffUserManagement() {
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Fetch users via edge function
  const { data: usersData, isLoading, refetch } = useQuery({
    queryKey: ["staff-users", search, clientFilter, statusFilter, page],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('staff-user-management', {
        body: {
          action: 'list',
          search: search || undefined,
          clientId: clientFilter || undefined,
          status: statusFilter || undefined,
          page,
          pageSize: 20,
        },
      });
      if (error) throw error;
      return data;
    },
  });

  // Fetch clients for filter
  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, nom")
        .order("nom");
      if (error) throw error;
      return data;
    },
  });

  const users = usersData?.users || [];
  const totalCount = users[0]?.total_count || 0;
  const totalPages = Math.ceil(totalCount / 20);

  const stats = {
    total: totalCount,
    active: users.filter((u: any) => u.actif).length,
    inactive: users.filter((u: any) => !u.actif).length,
    admins: users.filter((u: any) => u.is_client_admin).length,
  };

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setIsPanelOpen(true);
  };

  const handleExport = async () => {
    toast.info("Export feature coming soon");
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage all client users across the platform</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
              <Badge variant="default">Admin</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.admins}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Search and filter users</CardDescription>
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
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Clients</SelectItem>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.nom}
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
              {(search || clientFilter || statusFilter) && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearch("");
                    setClientFilter("");
                    setStatusFilter("");
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* User Data Grid */}
        <StaffUserDataGrid
          users={users}
          isLoading={isLoading}
          onUserClick={handleUserClick}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />

        {/* User Details Panel */}
        <StaffUserDetailsPanel
          userId={selectedUserId}
          open={isPanelOpen}
          onOpenChange={setIsPanelOpen}
          onUpdate={() => refetch()}
        />
      </div>
    );
  }

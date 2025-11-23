import { useQuery } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientAdminUserProfile } from "./ClientAdminUserProfile";
import { ClientAdminUserSites } from "./ClientAdminUserSites";
import { ClientAdminUserPermissions } from "./ClientAdminUserPermissions";

interface ClientAdminUserDetailsPanelProps {
  userId: string | null;
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function ClientAdminUserDetailsPanel({
  userId,
  clientId,
  open,
  onOpenChange,
  onUpdate,
}: ClientAdminUserDetailsPanelProps) {
  const { data: userData, isLoading } = useQuery({
    queryKey: ["client-admin-user-detail", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase.functions.invoke('client-user-management', {
        body: { action: 'get', userId },
      });
      if (error) throw error;
      return data.user;
    },
    enabled: !!userId && open,
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>User Details</SheetTitle>
          <SheetDescription>
            View and manage user information
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-4 mt-6">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : userData ? (
          <div className="mt-6">
            <Tabs defaultValue="profile">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="sites">Sites</TabsTrigger>
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4">
                <ClientAdminUserProfile user={userData} onUpdate={onUpdate} />
              </TabsContent>

              <TabsContent value="sites" className="space-y-4">
                <ClientAdminUserSites
                  user={userData}
                  clientId={clientId}
                  onUpdate={onUpdate}
                />
              </TabsContent>

              <TabsContent value="permissions" className="space-y-4">
                <ClientAdminUserPermissions
                  user={userData}
                  clientId={clientId}
                  onUpdate={onUpdate}
                />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="mt-6 text-center text-muted-foreground">
            No user data available
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import { rolesQueries } from "@/lib/roles-queries";
import { PermissionMatrix } from "./PermissionMatrix";
import { UserAssignmentDialog } from "./UserAssignmentDialog";
import type { Role, PermissionScope } from "@/types/roles";

const roleSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100),
  description: z.string().optional(),
});

type RoleFormData = z.infer<typeof roleSchema>;

interface RoleFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: Role;
  type: 'team' | 'client';
  tenantId?: string;
}

export function RoleFormDrawer({
  open,
  onOpenChange,
  role,
  type,
  tenantId,
}: RoleFormDrawerProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('details');
  const [permissions, setPermissions] = useState<Array<{
    module: string;
    action: string;
    decision: 'allow' | 'deny' | 'inherit';
  }>>([]);
  const [scope, setScope] = useState<PermissionScope>('tenant');

  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // Load existing permissions if editing
  const { data: existingPermissions } = useQuery({
    queryKey: ['role-permissions', role?.id],
    queryFn: () => rolesQueries.getPermissions(role!.id),
    enabled: !!role?.id && open,
  });

  useEffect(() => {
    if (role) {
      form.reset({
        name: role.name,
        description: role.description || '',
      });
    } else {
      form.reset({
        name: '',
        description: '',
      });
    }
  }, [role, form]);

  useEffect(() => {
    if (existingPermissions && existingPermissions.length > 0) {
      setPermissions(existingPermissions.map(p => ({
        module: p.module,
        action: p.action,
        decision: p.decision,
      })));
      setScope(existingPermissions[0].scope);
    } else {
      setPermissions([]);
      setScope('tenant');
    }
  }, [existingPermissions]);

  const createMutation = useMutation({
    mutationFn: async (data: RoleFormData) => {
      const newRole = await rolesQueries.create({
        type,
        name: data.name,
        description: data.description,
        tenant_id: type === 'client' ? tenantId : undefined,
      });

      // Save permissions
      if (permissions.length > 0) {
        await rolesQueries.updatePermissions(
          newRole.id,
          permissions.map(p => ({ ...p, scope }))
        );
      }

      return newRole;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', type] });
      toast.success("Rôle créé avec succès");
      onOpenChange(false);
      form.reset();
      setPermissions([]);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la création du rôle");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: RoleFormData) => {
      if (!role) return;

      await rolesQueries.update(role.id, {
        name: data.name,
        description: data.description,
      });

      // Update permissions
      await rolesQueries.updatePermissions(
        role.id,
        permissions.map(p => ({ ...p, scope }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', type] });
      queryClient.invalidateQueries({ queryKey: ['role-permissions', role?.id] });
      toast.success("Rôle modifié avec succès");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la modification du rôle");
    },
  });

  const onSubmit = (data: RoleFormData) => {
    if (role) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-4xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {role ? 'Modifier le rôle' : 'Nouveau rôle'}
          </SheetTitle>
          <SheetDescription>
            {type === 'team'
              ? 'Configurez un rôle pour votre équipe interne'
              : 'Configurez un rôle pour vos utilisateurs clients'}
          </SheetDescription>
        </SheetHeader>

        {role?.name === 'Super Admin' && (
          <Alert className="mt-4 border-primary/50 bg-primary/10">
            <Shield className="h-4 w-4 text-primary" />
            <AlertDescription>
              <strong>Rôle Super Admin protégé</strong> - Ce rôle ne peut pas être modifié, renommé, archivé ou supprimé. 
              Il dispose de tous les privilèges système et est essentiel au fonctionnement de l'application.
            </AlertDescription>
          </Alert>
        )}
        
        {role?.is_system && role?.name !== 'Super Admin' && (
          <Alert className="mt-4">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Ce rôle système dispose de privilèges étendus.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Détails</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            {role && <TabsTrigger value="users">Utilisateurs</TabsTrigger>}
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du rôle</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Ex: Gestionnaire de site" 
                          disabled={role?.name === 'Super Admin'}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Décrivez les responsabilités et permissions de ce rôle..."
                          rows={4}
                        />
                      </FormControl>
                      <FormDescription>
                        Optionnel - Aide les administrateurs à comprendre ce rôle
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {role ? 'Enregistrer' : 'Créer le rôle'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="permissions" className="mt-6">
            <PermissionMatrix
              permissions={permissions}
              scope={scope}
              onPermissionsChange={setPermissions}
              onScopeChange={setScope}
              roleType={type}
              readOnly={role?.is_system}
            />

            <div className="flex gap-3 pt-4">
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {role ? 'Enregistrer' : 'Créer le rôle'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
            </div>
          </TabsContent>

          {role && (
            <TabsContent value="users" className="mt-6">
              <UserAssignmentDialog
                roleId={role.id}
                roleType={type}
                tenantId={tenantId}
              />
            </TabsContent>
          )}
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

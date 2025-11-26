import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { staffRolesQueries, StaffRole } from "@/lib/staff-roles-queries";
import { STAFF_PERMISSIONS } from "@/lib/staff-permission-middleware";
import { Separator } from "@/components/ui/separator";

interface StaffRoleFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: StaffRole | null;
  onSuccess: () => void;
}

const PERMISSION_DESCRIPTIONS: Record<string, { label: string; description: string; category: string }> = {
  [STAFF_PERMISSIONS.MANAGE_TEXTES]: {
    label: "Gérer les textes réglementaires",
    description: "Créer, éditer, supprimer les textes",
    category: "Contenu réglementaire"
  },
  [STAFF_PERMISSIONS.MANAGE_ARTICLES]: {
    label: "Gérer les articles",
    description: "Créer, éditer, supprimer les articles",
    category: "Contenu réglementaire"
  },
  [STAFF_PERMISSIONS.MANAGE_VERSIONS]: {
    label: "Gérer les versions",
    description: "Créer, éditer les versions d'articles",
    category: "Contenu réglementaire"
  },
  [STAFF_PERMISSIONS.EDIT_DOMAINS]: {
    label: "Éditer les domaines",
    description: "Modifier les domaines et sous-domaines",
    category: "Contenu réglementaire"
  },
  [STAFF_PERMISSIONS.MANAGE_AUTORITES]: {
    label: "Gérer les autorités",
    description: "Gérer les autorités émettrices",
    category: "Contenu réglementaire"
  },
  [STAFF_PERMISSIONS.MANAGE_CODES]: {
    label: "Gérer les codes juridiques",
    description: "Gérer les codes juridiques",
    category: "Contenu réglementaire"
  },
  [STAFF_PERMISSIONS.MANAGE_TAGS]: {
    label: "Gérer les tags",
    description: "Créer, éditer les tags réglementaires",
    category: "Contenu réglementaire"
  },
  [STAFF_PERMISSIONS.MANAGE_CLIENTS]: {
    label: "Gérer les clients",
    description: "Créer, éditer, supprimer les clients",
    category: "Gestion clients"
  },
  [STAFF_PERMISSIONS.MANAGE_SITES]: {
    label: "Gérer les sites",
    description: "Créer, éditer les sites clients",
    category: "Gestion clients"
  },
  [STAFF_PERMISSIONS.MANAGE_USERS]: {
    label: "Gérer les utilisateurs",
    description: "Créer, éditer les utilisateurs clients",
    category: "Gestion clients"
  },
  [STAFF_PERMISSIONS.VIEW_ALL_SITES]: {
    label: "Voir tous les sites",
    description: "Accès en lecture à tous les sites",
    category: "Gestion clients"
  },
  [STAFF_PERMISSIONS.MANAGE_MODULES]: {
    label: "Gérer les modules",
    description: "Configurer les modules systèmes",
    category: "Administration"
  },
  [STAFF_PERMISSIONS.MANAGE_STAFF]: {
    label: "Gérer le staff",
    description: "Gérer les utilisateurs et rôles staff",
    category: "Administration"
  }
};

export function StaffRoleFormModal({ open, onOpenChange, role, onSuccess }: StaffRoleFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      nom_role: role?.nom_role || '',
      description: role?.description || ''
    }
  });

  useEffect(() => {
    if (role) {
      reset({
        nom_role: role.nom_role,
        description: role.description || ''
      });
      loadPermissions();
    } else {
      reset({
        nom_role: '',
        description: ''
      });
      setPermissions({});
    }
  }, [role, reset]);

  const loadPermissions = async () => {
    if (!role) return;
    
    try {
      const perms = await staffRolesQueries.getPermissions(role.id);
      const permMap: Record<string, boolean> = {};
      perms.forEach(p => {
        permMap[p.permission_key] = p.autorise;
      });
      setPermissions(permMap);
    } catch (error) {
      console.error('Failed to load permissions:', error);
    }
  };

  const onSubmit = async (data: { nom_role: string; description: string }) => {
    setLoading(true);
    try {
      let roleId: string;

      if (role) {
        // Update existing role
        await staffRolesQueries.update(role.id, {
          nom_role: data.nom_role,
          description: data.description
        });
        roleId = role.id;
        toast.success('Rôle mis à jour avec succès');
      } else {
        // Create new role
        const newRole = await staffRolesQueries.create({
          nom_role: data.nom_role,
          description: data.description
        });
        roleId = newRole.id;
        toast.success('Rôle créé avec succès');
      }

      // Save permissions
      const permissionsArray = Object.entries(permissions).map(([key, value]) => ({
        permission_key: key,
        autorise: value
      }));
      await staffRolesQueries.setPermissions(roleId, permissionsArray);

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to save role:', error);
      toast.error('Erreur', {
        description: error.message || 'Impossible de sauvegarder le rôle'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (permissionKey: string, checked: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [permissionKey]: checked
    }));
  };

  // Group permissions by category
  const permissionsByCategory = Object.entries(PERMISSION_DESCRIPTIONS).reduce((acc, [key, value]) => {
    if (!acc[value.category]) {
      acc[value.category] = [];
    }
    acc[value.category].push({ key, ...value });
    return acc;
  }, {} as Record<string, Array<{ key: string; label: string; description: string }>>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {role ? 'Modifier le rôle' : 'Créer un rôle'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nom_role">Nom du rôle *</Label>
              <Input
                id="nom_role"
                {...register('nom_role', { required: 'Le nom du rôle est requis' })}
                placeholder="Ex: RegulatoryManager"
              />
              {errors.nom_role && (
                <p className="text-sm text-destructive">{errors.nom_role.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Description du rôle et de ses responsabilités"
                rows={3}
              />
            </div>
          </div>

          <Separator />

          {/* Permissions */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Permissions</h3>
              <p className="text-sm text-muted-foreground">
                Sélectionnez les permissions associées à ce rôle
              </p>
            </div>

            {Object.entries(permissionsByCategory).map(([category, perms]) => (
              <div key={category} className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">{category}</h4>
                <div className="space-y-2 pl-4">
                  {perms.map(perm => (
                    <div key={perm.key} className="flex items-start space-x-3">
                      <Checkbox
                        id={perm.key}
                        checked={permissions[perm.key] || false}
                        onCheckedChange={(checked) => handlePermissionChange(perm.key, checked as boolean)}
                      />
                      <div className="flex-1">
                        <Label htmlFor={perm.key} className="cursor-pointer font-normal">
                          {perm.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">{perm.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enregistrement...' : role ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

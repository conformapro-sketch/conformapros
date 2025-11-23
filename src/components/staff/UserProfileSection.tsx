import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Phone, Calendar, Shield } from "lucide-react";

interface UserProfileSectionProps {
  user: any;
  onUpdate: () => void;
}

export function UserProfileSection({ user, onUpdate }: UserProfileSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nom: user.nom || "",
    prenom: user.prenom || "",
    telephone: user.telephone || "",
    actif: user.actif,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: result, error } = await supabase.functions.invoke('staff-user-management', {
        body: {
          action: 'update',
          userId: user.id,
          userData: data,
        },
      });
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast.success("User updated successfully");
      setIsEditing(false);
      onUpdate();
    },
    onError: (error: any) => {
      toast.error(`Failed to update user: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar and Basic Info */}
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback className="text-2xl">
              {user.nom?.[0]}{user.prenom?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-xl font-semibold">
              {user.nom} {user.prenom}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{user.email}</span>
            </div>
            {user.is_client_admin && (
              <Badge variant="default" className="mt-2 bg-orange-500">
                <Shield className="h-3 w-3 mr-1" />
                Client Admin
              </Badge>
            )}
          </div>
        </div>

        {/* Client Info */}
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Client</div>
              <div className="font-medium">{user.client?.nom}</div>
            </div>
            {user.client?.logo_url && (
              <img src={user.client.logo_url} alt="" className="h-10 w-10 rounded" />
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Last Name</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prenom">First Name</Label>
              <Input
                id="prenom"
                value={formData.prenom}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telephone">Phone</Label>
            <Input
              id="telephone"
              value={formData.telephone}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              disabled={!isEditing}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label>Account Status</Label>
              <div className="text-sm text-muted-foreground">
                {formData.actif ? "Account is active" : "Account is suspended"}
              </div>
            </div>
            <Switch
              checked={formData.actif}
              onCheckedChange={(checked) => setFormData({ ...formData, actif: checked })}
              disabled={!isEditing}
            />
          </div>

          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      nom: user.nom || "",
                      prenom: user.prenom || "",
                      telephone: user.telephone || "",
                      actif: user.actif,
                    });
                  }}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button type="button" onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
          </div>
        </form>

        {/* Meta Info */}
        <div className="pt-4 border-t space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Created: {new Date(user.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Updated: {new Date(user.updated_at).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

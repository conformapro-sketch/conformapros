import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseAny as supabase } from "@/lib/supabase-any";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, FolderTree } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const domaineSchema = z.object({
  code: z.string().trim().min(1, "Le code est requis").max(50, "50 caractères maximum"),
  libelle: z.string().trim().min(1, "Le libellé est requis").max(255, "255 caractères maximum"),
  actif: z.boolean().default(true),
});

const sousDomaineSchema = z.object({
  domaine_id: z.string().uuid("Domaine requis"),
  code: z.string().trim().min(1, "Le code est requis").max(50, "50 caractères maximum"),
  libelle: z.string().trim().min(1, "Le libellé est requis").max(255, "255 caractères maximum"),
  ordre: z.number().int().min(0).default(0),
  actif: z.boolean().default(true),
});

type DomaineFormData = z.infer<typeof domaineSchema>;
type SousDomaineFormData = z.infer<typeof sousDomaineSchema>;

const GestionDomaines = () => {
  const queryClient = useQueryClient();
  const [domaineDialogOpen, setDomaineDialogOpen] = useState(false);
  const [sousDomaineDialogOpen, setSousDomaineDialogOpen] = useState(false);
  const [editingDomaine, setEditingDomaine] = useState<any>(null);
  const [editingSousDomaine, setEditingSousDomaine] = useState<any>(null);
  const [selectedDomaineId, setSelectedDomaineId] = useState<string | null>(null);

  const [domaineForm, setDomaineForm] = useState<DomaineFormData>({
    code: "",
    libelle: "",
    actif: true,
  });

  const [sousDomaineForm, setSousDomaineForm] = useState<SousDomaineFormData>({
    domaine_id: "",
    code: "",
    libelle: "",
    ordre: 0,
    actif: true,
  });

  // Fetch domaines
  const { data: domaines, isLoading: loadingDomaines } = useQuery({
    queryKey: ["domaines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("domaines_application")
        .select("*")
        .is("deleted_at", null)
        .order("libelle");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch sous-domaines
  const { data: sousDomaines, isLoading: loadingSousDomaines } = useQuery({
    queryKey: ["sous-domaines", selectedDomaineId],
    queryFn: async () => {
      let query = supabase
        .from("sous_domaines_application")
        .select("*, domaines_application(libelle)")
        .is("deleted_at", null)
        .order("ordre");

      if (selectedDomaineId) {
        query = query.eq("domaine_id", selectedDomaineId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Create domaine
  const createDomaine = useMutation({
    mutationFn: async (data: DomaineFormData) => {
      const validated = domaineSchema.parse(data);
      const { error } = await supabase
        .from("domaines_application")
        .insert([validated as any]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domaines"] });
      toast.success("Domaine créé avec succès");
      setDomaineDialogOpen(false);
      resetDomaineForm();
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Update domaine
  const updateDomaine = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: DomaineFormData }) => {
      const validated = domaineSchema.parse(data);
      const { error } = await supabase
        .from("domaines_application")
        .update(validated)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domaines"] });
      toast.success("Domaine modifié avec succès");
      setDomaineDialogOpen(false);
      setEditingDomaine(null);
      resetDomaineForm();
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Soft delete domaine
  const deleteDomaine = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("domaines_application")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domaines"] });
      toast.success("Domaine supprimé avec succès");
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Create sous-domaine
  const createSousDomaine = useMutation({
    mutationFn: async (data: SousDomaineFormData) => {
      const validated = sousDomaineSchema.parse(data);
      const { error } = await supabase
        .from("sous_domaines_application")
        .insert([validated as any]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sous-domaines"] });
      toast.success("Sous-domaine créé avec succès");
      setSousDomaineDialogOpen(false);
      resetSousDomaineForm();
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Update sous-domaine
  const updateSousDomaine = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: SousDomaineFormData }) => {
      const validated = sousDomaineSchema.parse(data);
      const { error } = await supabase
        .from("sous_domaines_application")
        .update(validated)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sous-domaines"] });
      toast.success("Sous-domaine modifié avec succès");
      setSousDomaineDialogOpen(false);
      setEditingSousDomaine(null);
      resetSousDomaineForm();
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Soft delete sous-domaine
  const deleteSousDomaine = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("sous_domaines_application")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sous-domaines"] });
      toast.success("Sous-domaine supprimé avec succès");
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const resetDomaineForm = () => {
    setDomaineForm({ code: "", libelle: "", actif: true });
    setEditingDomaine(null);
  };

  const resetSousDomaineForm = () => {
    setSousDomaineForm({ domaine_id: "", code: "", libelle: "", ordre: 0, actif: true });
    setEditingSousDomaine(null);
  };

  const handleDomaineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDomaine) {
      updateDomaine.mutate({ id: editingDomaine.id, data: domaineForm });
    } else {
      createDomaine.mutate(domaineForm);
    }
  };

  const handleSousDomaineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSousDomaine) {
      updateSousDomaine.mutate({ id: editingSousDomaine.id, data: sousDomaineForm });
    } else {
      createSousDomaine.mutate(sousDomaineForm);
    }
  };

  const handleEditDomaine = (domaine: any) => {
    setEditingDomaine(domaine);
    setDomaineForm({
      code: domaine.code,
      libelle: domaine.libelle,
      actif: domaine.actif,
    });
    setDomaineDialogOpen(true);
  };

  const handleEditSousDomaine = (sousDomaine: any) => {
    setEditingSousDomaine(sousDomaine);
    setSousDomaineForm({
      domaine_id: sousDomaine.domaine_id,
      code: sousDomaine.code,
      libelle: sousDomaine.libelle,
      ordre: sousDomaine.ordre || 0,
      actif: sousDomaine.actif,
    });
    setSousDomaineDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestion des domaines d'application</h1>
        <p className="text-muted-foreground">
          Gérez les domaines et sous-domaines d'application des textes réglementaires
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Domaines */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FolderTree className="h-5 w-5" />
              Domaines
            </CardTitle>
            <Dialog open={domaineDialogOpen} onOpenChange={setDomaineDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={resetDomaineForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau domaine
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingDomaine ? "Modifier le domaine" : "Créer un domaine"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingDomaine
                      ? "Modifiez les informations du domaine"
                      : "Ajoutez un nouveau domaine d'application"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleDomaineSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="domaine-code">Code *</Label>
                    <Input
                      id="domaine-code"
                      value={domaineForm.code}
                      onChange={(e) =>
                        setDomaineForm({ ...domaineForm, code: e.target.value })
                      }
                      placeholder="EX: HSE"
                      maxLength={50}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="domaine-libelle">Libellé *</Label>
                    <Input
                      id="domaine-libelle"
                      value={domaineForm.libelle}
                      onChange={(e) =>
                        setDomaineForm({ ...domaineForm, libelle: e.target.value })
                      }
                      placeholder="Hygiène, Santé et Environnement"
                      maxLength={255}
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="domaine-actif"
                      checked={domaineForm.actif}
                      onCheckedChange={(checked) =>
                        setDomaineForm({ ...domaineForm, actif: checked })
                      }
                    />
                    <Label htmlFor="domaine-actif">Actif</Label>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setDomaineDialogOpen(false);
                        resetDomaineForm();
                      }}
                    >
                      Annuler
                    </Button>
                    <Button type="submit">
                      {editingDomaine ? "Modifier" : "Créer"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {loadingDomaines ? (
              <p className="text-muted-foreground text-center py-4">Chargement...</p>
            ) : domaines && domaines.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {domaines.map((domaine: any) => (
                    <TableRow key={domaine.id}>
                      <TableCell className="font-medium">{domaine.code}</TableCell>
                      <TableCell>{domaine.libelle}</TableCell>
                      <TableCell>
                        {domaine.actif ? (
                          <Badge variant="default">Actif</Badge>
                        ) : (
                          <Badge variant="outline">Inactif</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedDomaineId(domaine.id)}
                        >
                          Voir sous-domaines
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditDomaine(domaine)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm("Confirmer la suppression ?")) {
                              deleteDomaine.mutate(domaine.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-4">Aucun domaine</p>
            )}
          </CardContent>
        </Card>

        {/* Sous-domaines */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FolderTree className="h-5 w-5" />
              Sous-domaines
              {selectedDomaineId && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedDomaineId(null)}
                >
                  (Tous)
                </Button>
              )}
            </CardTitle>
            <Dialog open={sousDomaineDialogOpen} onOpenChange={setSousDomaineDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={resetSousDomaineForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau sous-domaine
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingSousDomaine ? "Modifier le sous-domaine" : "Créer un sous-domaine"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingSousDomaine
                      ? "Modifiez les informations du sous-domaine"
                      : "Ajoutez un nouveau sous-domaine d'application"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSousDomaineSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="sousdomaine-domaine">Domaine parent *</Label>
                    <select
                      id="sousdomaine-domaine"
                      className="w-full border rounded-md p-2"
                      value={sousDomaineForm.domaine_id}
                      onChange={(e) =>
                        setSousDomaineForm({ ...sousDomaineForm, domaine_id: e.target.value })
                      }
                      required
                    >
                      <option value="">Sélectionner un domaine</option>
                      {domaines?.map((d: any) => (
                        <option key={d.id} value={d.id}>
                          {d.libelle}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="sousdomaine-code">Code *</Label>
                    <Input
                      id="sousdomaine-code"
                      value={sousDomaineForm.code}
                      onChange={(e) =>
                        setSousDomaineForm({ ...sousDomaineForm, code: e.target.value })
                      }
                      placeholder="EX: INCENDIE"
                      maxLength={50}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="sousdomaine-libelle">Libellé *</Label>
                    <Input
                      id="sousdomaine-libelle"
                      value={sousDomaineForm.libelle}
                      onChange={(e) =>
                        setSousDomaineForm({ ...sousDomaineForm, libelle: e.target.value })
                      }
                      placeholder="Protection contre l'incendie"
                      maxLength={255}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="sousdomaine-ordre">Ordre d'affichage</Label>
                    <Input
                      id="sousdomaine-ordre"
                      type="number"
                      min="0"
                      value={sousDomaineForm.ordre}
                      onChange={(e) =>
                        setSousDomaineForm({ ...sousDomaineForm, ordre: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="sousdomaine-actif"
                      checked={sousDomaineForm.actif}
                      onCheckedChange={(checked) =>
                        setSousDomaineForm({ ...sousDomaineForm, actif: checked })
                      }
                    />
                    <Label htmlFor="sousdomaine-actif">Actif</Label>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSousDomaineDialogOpen(false);
                        resetSousDomaineForm();
                      }}
                    >
                      Annuler
                    </Button>
                    <Button type="submit">
                      {editingSousDomaine ? "Modifier" : "Créer"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {loadingSousDomaines ? (
              <p className="text-muted-foreground text-center py-4">Chargement...</p>
            ) : sousDomaines && sousDomaines.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead>Domaine</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sousDomaines.map((sd: any) => (
                    <TableRow key={sd.id}>
                      <TableCell className="font-medium">{sd.code}</TableCell>
                      <TableCell>{sd.libelle}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {sd.domaines_application?.libelle}
                      </TableCell>
                      <TableCell>
                        {sd.actif ? (
                          <Badge variant="default">Actif</Badge>
                        ) : (
                          <Badge variant="outline">Inactif</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditSousDomaine(sd)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm("Confirmer la suppression ?")) {
                              deleteSousDomaine.mutate(sd.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-4">Aucun sous-domaine</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GestionDomaines;

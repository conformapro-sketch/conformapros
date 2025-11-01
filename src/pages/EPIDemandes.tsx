import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Check, X } from "lucide-react";
import { format } from "date-fns";

const STATUT_LABELS: Record<string, { label: string; variant: any }> = {
  en_attente: { label: "En attente", variant: "secondary" },
  approuvee: { label: "Approuvée", variant: "default" },
  rejetee: { label: "Rejetée", variant: "destructive" },
  livree: { label: "Livrée", variant: "outline" },
};

export default function EPIDemandes() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type_id: "",
    employe_id: "",
    site_id: "",
    quantite: 1,
    taille: "",
    motif: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: demandes = [] } = useQuery({
    queryKey: ["epi-demandes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("epi_demandes")
        .select(`
          *,
          type:epi_types(id, libelle, categorie),
          employe:employes(id, nom, prenom, matricule),
          site:sites(id, nom_site)
        `)
        .order("date_demande", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: types = [] } = useQuery({
    queryKey: ["epi-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("epi_types")
        .select("*")
        .eq("actif", true)
        .order("libelle");
      if (error) throw error;
      return data;
    },
  });

  const { data: employes = [] } = useQuery({
    queryKey: ["employes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employes")
        .select("*")
        .order("nom");
      if (error) throw error;
      return data;
    },
  });

  const { data: sites = [] } = useQuery({
    queryKey: ["sites"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sites").select("*").order("nom_site");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("epi_demandes").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Demande créée avec succès" });
      queryClient.invalidateQueries({ queryKey: ["epi-demandes"] });
      setIsModalOpen(false);
      setFormData({ type_id: "", employe_id: "", site_id: "", quantite: 1, taille: "", motif: "" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la création", variant: "destructive" });
    },
  });

  const updateStatutMutation = useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: string }) => {
      const { error } = await supabase
        .from("epi_demandes")
        .update({ statut, date_traitement: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Statut mis à jour" });
      queryClient.invalidateQueries({ queryKey: ["epi-demandes"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Demandes d'EPI</h1>
            <p className="text-muted-foreground mt-1">
              Gestion des demandes et des attributions d'équipements
            </p>
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle demande
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nouvelle demande d'EPI</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type d'EPI *</Label>
                    <Select
                      value={formData.type_id}
                      onValueChange={(value) => setFormData({ ...formData, type_id: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                      <SelectContent>
                        {types.map((type: any) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.libelle}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="employe">Employé *</Label>
                    <Select
                      value={formData.employe_id}
                      onValueChange={(value) => setFormData({ ...formData, employe_id: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un employé" />
                      </SelectTrigger>
                      <SelectContent>
                        {employes.map((emp: any) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.nom} {emp.prenom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="site">Site *</Label>
                    <Select
                      value={formData.site_id}
                      onValueChange={(value) => setFormData({ ...formData, site_id: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un site" />
                      </SelectTrigger>
                      <SelectContent>
                        {sites.map((site: any) => (
                          <SelectItem key={site.id} value={site.id}>
                            {site.nom_site}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantite">Quantité</Label>
                    <Input
                      id="quantite"
                      type="number"
                      min="1"
                      value={formData.quantite}
                      onChange={(e) => setFormData({ ...formData, quantite: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taille">Taille</Label>
                    <Input
                      id="taille"
                      value={formData.taille}
                      onChange={(e) => setFormData({ ...formData, taille: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motif">Motif de la demande</Label>
                  <Textarea
                    id="motif"
                    value={formData.motif}
                    onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">Créer la demande</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des demandes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type EPI</TableHead>
                  <TableHead>Employé</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {demandes.map((demande: any) => (
                  <TableRow key={demande.id}>
                    <TableCell>
                      {format(new Date(demande.date_demande), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>{demande.type?.libelle}</TableCell>
                    <TableCell>
                      {demande.employe?.nom} {demande.employe?.prenom}
                    </TableCell>
                    <TableCell>{demande.site?.nom_site}</TableCell>
                    <TableCell>{demande.quantite}</TableCell>
                    <TableCell>
                      <Badge variant={STATUT_LABELS[demande.statut]?.variant}>
                        {STATUT_LABELS[demande.statut]?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {demande.statut === "en_attente" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateStatutMutation.mutate({ id: demande.id, statut: "approuvee" })
                            }
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              updateStatutMutation.mutate({ id: demande.id, statut: "rejetee" })
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
  );
}

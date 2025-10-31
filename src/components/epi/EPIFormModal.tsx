import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createEPIArticle, updateEPIArticle, fetchEPITypes } from "@/lib/epi-queries";
import { fetchSites } from "@/lib/multi-tenant-queries";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface EPIFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article?: any;
  defaultSiteId?: string;
}

export default function EPIFormModal({ open, onOpenChange, article, defaultSiteId }: EPIFormModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    site_id: defaultSiteId || "",
    type_id: "",
    code: "",
    taille: "",
    statut: "en_stock" as const,
    employe_id: "",
    date_attribution: null as Date | null,
    observations: "",
  });

  const { data: sites } = useQuery({
    queryKey: ["sites"],
    queryFn: fetchSites,
  });

  const { data: types } = useQuery({
    queryKey: ["epi_types"],
    queryFn: fetchEPITypes,
  });

  const { data: employes } = useQuery({
    queryKey: ["employes"],
    queryFn: async () => {
      const { data } = await supabase.from("employes").select("*").order("nom");
      return data;
    },
  });

  useEffect(() => {
    if (article) {
      setFormData({
        site_id: article.site_id || "",
        type_id: article.type_id || "",
        code: article.code || "",
        taille: article.taille || "",
        statut: article.statut || "en_stock",
        employe_id: article.employe_id || "",
        date_attribution: article.date_attribution ? new Date(article.date_attribution) : null,
        observations: article.observations || "",
      });
    } else {
      setFormData({
        site_id: defaultSiteId || "",
        type_id: "",
        code: "",
        taille: "",
        statut: "en_stock",
        employe_id: "",
        date_attribution: null,
        observations: "",
      });
    }
  }, [article, open, defaultSiteId]);

  const createMutation = useMutation({
    mutationFn: createEPIArticle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["epi_articles"] });
      queryClient.invalidateQueries({ queryKey: ["epi_stats"] });
      toast({
        title: "EPI créé",
        description: "L'article EPI a été ajouté avec succès.",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => updateEPIArticle(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["epi_articles"] });
      queryClient.invalidateQueries({ queryKey: ["epi_stats"] });
      toast({
        title: "EPI modifié",
        description: "L'article EPI a été mis à jour avec succès.",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData: any = {
      ...formData,
      date_attribution: formData.date_attribution?.toISOString().split('T')[0] || null,
      employe_id: formData.employe_id || null,
    };

    if (article) {
      updateMutation.mutate({ id: article.id, updates: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{article ? "Modifier l'article EPI" : "Nouvel article EPI"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Site */}
            <div className="space-y-2">
              <Label htmlFor="site_id">Site *</Label>
              <Select
                value={formData.site_id}
                onValueChange={(value) => setFormData({ ...formData, site_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un site" />
                </SelectTrigger>
                <SelectContent>
                  {sites?.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.nom_site}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type_id">Type d'EPI *</Label>
              <Select
                value={formData.type_id}
                onValueChange={(value) => setFormData({ ...formData, type_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {types?.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Code */}
            <div className="space-y-2">
              <Label htmlFor="code">Code / Référence *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Ex: EPI-2025-001"
                required
              />
            </div>

            {/* Taille */}
            <div className="space-y-2">
              <Label htmlFor="taille">Taille</Label>
              <Input
                id="taille"
                value={formData.taille}
                onChange={(e) => setFormData({ ...formData, taille: e.target.value })}
                placeholder="Ex: M, L, 42, ..."
              />
            </div>

            {/* Statut */}
            <div className="space-y-2">
              <Label htmlFor="statut">Statut *</Label>
              <Select
                value={formData.statut}
                onValueChange={(value: any) => setFormData({ ...formData, statut: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en_stock">En stock</SelectItem>
                  <SelectItem value="attribue">Attribué</SelectItem>
                  <SelectItem value="mis_au_rebut">Mis au rebut</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Employé (si attribué) */}
            {(formData.statut as string) === "attribue" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="employe_id">Attribué à</Label>
                  <Select
                    value={formData.employe_id}
                    onValueChange={(value) => setFormData({ ...formData, employe_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un employé" />
                    </SelectTrigger>
                    <SelectContent>
                      {employes?.map((emp: any) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.nom} {emp.prenom} {emp.matricule ? `(${emp.matricule})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date d'attribution</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.date_attribution && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.date_attribution
                          ? format(formData.date_attribution, "dd/MM/yyyy", { locale: fr })
                          : "Sélectionner"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.date_attribution || undefined}
                        onSelect={(date) => setFormData({ ...formData, date_attribution: date || null })}
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}

            {/* Observations */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="observations">Observations</Label>
              <Textarea
                id="observations"
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">
              {article ? "Modifier" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

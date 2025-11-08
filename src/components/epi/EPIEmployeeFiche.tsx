import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseAny as supabase } from "@/lib/supabase-any";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FileDown, AlertCircle, Package } from "lucide-react";
import { toast } from "sonner";
import EPIFormModal from "./EPIFormModal";

interface EPIEmployeeFicheProps {
  employeId: string;
}

const STATUT_LABELS = {
  en_stock: { label: "En stock", variant: "secondary" as const },
  attribue: { label: "Attribué", variant: "default" as const },
  en_maintenance: { label: "En maintenance", variant: "outline" as const },
  mis_au_rebut: { label: "Mis au rebut", variant: "destructive" as const },
};

export function EPIEmployeeFiche({ employeId }: EPIEmployeeFicheProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: employe } = useQuery({
    queryKey: ["employe", employeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employes")
        .select("*, site:sites(nom_site)")
        .eq("id", employeId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const { data: epiArticles = [] } = useQuery({
    queryKey: ["epi-employe", employeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("epi_articles")
        .select(`
          *,
          type:epi_types(libelle, code, categorie, duree_vie_moyenne_mois)
        `)
        .eq("employe_id", employeId)
        .order("date_attribution", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const unassignMutation = useMutation({
    mutationFn: async (articleId: string) => {
      const { error } = await supabase
        .from("epi_articles")
        .update({
          employe_id: null,
          date_attribution: null,
          statut: "en_stock",
        })
        .eq("id", articleId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["epi-employe", employeId] });
      toast.success("EPI retourné avec succès");
    },
    onError: () => {
      toast.error("Erreur lors du retour de l'EPI");
    },
  });

  const calculateReplacementDate = (dateAttribution: string, dureeVieMois?: number) => {
    if (!dureeVieMois) return null;
    const date = new Date(dateAttribution);
    date.setMonth(date.getMonth() + dureeVieMois);
    return date;
  };

  const isNearReplacement = (replacementDate: Date | null) => {
    if (!replacementDate) return false;
    const today = new Date();
    const diffDays = Math.floor((replacementDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
  };

  const exportPDF = () => {
    toast.info("Fonctionnalité d'export PDF en cours de développement");
  };

  if (!employe) return null;

  const epiAttribues = epiArticles.filter((a: any) => a.statut === "attribue");
  const epiAlerts = epiAttribues.filter((a: any) => {
    const replacementDate = calculateReplacementDate(
      a.date_attribution, 
      a.type?.duree_vie_moyenne_mois
    );
    return replacementDate && isNearReplacement(replacementDate);
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Fiche EPI - {employe.prenom} {employe.nom}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {employe.site?.nom_site} • Matricule: {employe.matricule || 'N/A'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsModalOpen(true)}>
              <Package className="h-4 w-4 mr-2" />
              Attribuer EPI
            </Button>
            <Button variant="outline" onClick={exportPDF}>
              <FileDown className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Total EPI</p>
              <p className="text-2xl font-bold">{epiAttribues.length}</p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">À remplacer</p>
              <p className="text-2xl font-bold text-orange-600">{epiAlerts.length}</p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Historique</p>
              <p className="text-2xl font-bold">{epiArticles.length}</p>
            </div>
          </div>

          {epiAlerts.length > 0 && (
            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <p className="font-medium text-orange-900 dark:text-orange-100">
                  {epiAlerts.length} EPI à remplacer prochainement
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>EPI attribués</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Date attribution</TableHead>
                <TableHead>À remplacer le</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {epiAttribues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Aucun EPI attribué
                  </TableCell>
                </TableRow>
              ) : (
                epiAttribues.map((article: any) => {
                  const replacementDate = calculateReplacementDate(
                    article.date_attribution,
                    article.type?.duree_vie_moyenne_mois
                  );
                  const needsReplacement = replacementDate && isNearReplacement(replacementDate);

                  return (
                    <TableRow key={article.id}>
                      <TableCell className="font-medium">{article.code_article}</TableCell>
                      <TableCell>{article.type?.libelle}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{article.type?.categorie}</Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(article.date_attribution), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        {replacementDate ? (
                          <span className={needsReplacement ? "text-orange-600 font-medium" : ""}>
                            {format(replacementDate, "dd/MM/yyyy", { locale: fr })}
                            {needsReplacement && " ⚠️"}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUT_LABELS[article.statut as keyof typeof STATUT_LABELS]?.variant}>
                          {STATUT_LABELS[article.statut as keyof typeof STATUT_LABELS]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => unassignMutation.mutate(article.id)}
                        >
                          Retourner
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EPIFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}

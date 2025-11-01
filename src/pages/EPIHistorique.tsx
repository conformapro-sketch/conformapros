import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileDown } from "lucide-react";
import { EPIHistoryTimeline } from "@/components/epi/EPIHistoryTimeline";

const STATUT_LABELS = {
  en_stock: { label: "En stock", variant: "secondary" as const },
  attribue: { label: "Attribué", variant: "default" as const },
  en_maintenance: { label: "En maintenance", variant: "outline" as const },
  mis_au_rebut: { label: "Mis au rebut", variant: "destructive" as const },
};

export default function EPIHistorique() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: article, isLoading } = useQuery({
    queryKey: ["epi-article", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("epi_articles")
        .select(`
          *,
          type:epi_types(*),
          site:sites(nom_site),
          employe:employes(nom, prenom, matricule)
        `)
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="p-6">Chargement...</div>;
  }

  if (!article) {
    return <div className="p-6">Article non trouvé</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Historique EPI</h1>
            <p className="text-muted-foreground">
              {article.code_article} - {article.type?.libelle}
            </p>
          </div>
        </div>
        <Button variant="outline">
          <FileDown className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de l'article</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Code article</p>
              <p className="font-medium">{article.code_article}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="font-medium">{article.type?.libelle}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Catégorie</p>
              <Badge variant="outline">{article.type?.categorie}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Statut</p>
              <Badge variant={STATUT_LABELS[article.statut as keyof typeof STATUT_LABELS]?.variant}>
                {STATUT_LABELS[article.statut as keyof typeof STATUT_LABELS]?.label}
              </Badge>
            </div>
            {article.marque && (
              <div>
                <p className="text-sm text-muted-foreground">Marque</p>
                <p className="font-medium">{article.marque}</p>
              </div>
            )}
            {article.modele && (
              <div>
                <p className="text-sm text-muted-foreground">Modèle</p>
                <p className="font-medium">{article.modele}</p>
              </div>
            )}
            {article.taille && (
              <div>
                <p className="text-sm text-muted-foreground">Taille</p>
                <p className="font-medium">{article.taille}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Site</p>
              <p className="font-medium">{article.site?.nom_site}</p>
            </div>
            {article.employe && (
              <div>
                <p className="text-sm text-muted-foreground">Attribué à</p>
                <p className="font-medium">
                  {article.employe.prenom} {article.employe.nom}
                </p>
              </div>
            )}
          </div>

          {article.observations && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Observations</p>
              <p className="text-sm mt-1">{article.observations}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <EPIHistoryTimeline articleId={id!} />
    </div>
  );
}

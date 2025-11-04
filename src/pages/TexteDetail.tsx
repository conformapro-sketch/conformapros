import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, FileText, Download, Edit, ExternalLink, GitBranch } from "lucide-react";
import { actesQueries, articlesQueries } from "@/lib/actes-queries";
import { ArticlesTab } from "@/components/ArticlesTab";
import { ChangelogManager } from "@/components/ChangelogManager";
import { AnnexesTab } from "@/components/AnnexesTab";
import { TexteVersionDrawer } from "@/components/TexteVersionDrawer";
import { ExportTextePDF } from "@/components/ExportTextePDF";

export default function TexteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [versionDrawerOpen, setVersionDrawerOpen] = useState(false);

  const { data: texte, isLoading } = useQuery({
    queryKey: ["acte", id],
    queryFn: () => actesQueries.getById(id!),
  });

  const { data: articles } = useQuery({
    queryKey: ["articles", id],
    queryFn: () => articlesQueries.getByActeId(id!),
    enabled: !!id,
  });

  const getStatutBadgeColor = (statut: string) => {
    switch (statut) {
      case "en_vigueur":
        return "bg-success text-success-foreground";
      case "modifie":
        return "bg-warning text-warning-foreground";
      case "abroge":
        return "bg-destructive text-destructive-foreground";
      case "suspendu":
        return "bg-muted text-muted-foreground";
      default:
        return "";
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case "en_vigueur":
        return "En vigueur";
      case "modifie":
        return "Modifié";
      case "abroge":
        return "Abrogé";
      case "suspendu":
        return "Suspendu";
      default:
        return statut;
    }
  };

  const getRelationLabel = (relation: string) => {
    switch (relation) {
      case "modifie":
        return "Modifie";
      case "abroge":
        return "Abroge";
      case "complete":
        return "Complète";
      case "rend_applicable":
        return "Rend applicable";
      case "rectifie":
        return "Rectifie";
      case "renvoi":
        return "Renvoi à";
      default:
        return relation;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!texte) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="text-muted-foreground">Texte non trouvé</div>
        <Button onClick={() => navigate("/actes")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/actes")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              {texte.numero_officiel}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {texte.intitule}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setVersionDrawerOpen(true)}>
            <GitBranch className="h-4 w-4 mr-2" />
            Versions
          </Button>
          <ExportTextePDF texteId={id!} texteTitle={texte.intitule} variant="outline" size="sm" />
          <Button variant="outline" size="sm" onClick={() => navigate(`/actes/${id}/editer`)}>
            <Edit className="h-4 w-4 mr-2" />
            Éditer
          </Button>
        </div>
      </div>

      {/* Métadonnées principales */}
      <Card className="shadow-medium">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Informations générales
            </CardTitle>
            <Badge className={getStatutBadgeColor(texte.statut_vigueur)}>
              {getStatutLabel(texte.statut_vigueur)}
            </Badge>
            <Badge variant="outline">{texte.types_acte?.libelle}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Bloc JORT */}
          {texte.jort_numero && (
            <div className="bg-muted/50 p-4 rounded-lg border border-border">
              <h3 className="font-semibold mb-3 text-foreground">Publication au JORT</h3>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Numéro JORT:</span>
                  <span className="font-medium">n° {texte.jort_numero}</span>
                </div>
                {texte.date_publication_jort && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date de publication:</span>
                    <span className="font-medium">
                      {new Date(texte.date_publication_jort).toLocaleDateString("fr-TN")}
                    </span>
                  </div>
                )}
                {(texte.jort_page_debut || texte.jort_page_fin) && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pages:</span>
                    <span className="font-medium">
                      {texte.jort_page_debut}
                      {texte.jort_page_fin && ` - ${texte.jort_page_fin}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Autres informations */}
          <div className="grid gap-4 sm:grid-cols-2">
            {texte.date_signature && (
              <div>
                <div className="text-sm text-muted-foreground">Date de signature</div>
                <div className="font-medium">
                  {new Date(texte.date_signature).toLocaleDateString("fr-TN")}
                </div>
              </div>
            )}
            {texte.annee && (
              <div>
                <div className="text-sm text-muted-foreground">Année</div>
                <div className="font-medium">{texte.annee}</div>
              </div>
            )}
            {texte.autorite_emettrice && (
              <div className="sm:col-span-2">
                <div className="text-sm text-muted-foreground">Autorité émettrice</div>
                <div className="font-medium">{texte.autorite_emettrice}</div>
              </div>
            )}
          </div>

          {/* Objet */}
          {texte.objet_resume && (
            <div>
              <div className="text-sm text-muted-foreground mb-2">Objet / Résumé</div>
              <div className="text-foreground">{texte.objet_resume}</div>
            </div>
          )}

          {/* Domaines et mots-clés */}
          {(texte.domaines?.length > 0 || texte.mots_cles?.length > 0) && (
            <div className="space-y-3">
              {texte.domaines?.length > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Domaines</div>
                  <div className="flex flex-wrap gap-2">
                    {texte.domaines.map((domaine: string, idx: number) => (
                      <Badge key={idx} variant="secondary">
                        {domaine}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {texte.mots_cles?.length > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Mots-clés</div>
                  <div className="flex flex-wrap gap-2">
                    {texte.mots_cles.map((mot: string, idx: number) => (
                      <Badge key={idx} variant="outline">
                        {mot}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fichiers PDF */}
          <div>
            <div className="text-sm text-muted-foreground mb-3">Documents disponibles</div>
            <div className="flex flex-wrap gap-3">
              {texte.url_pdf_ar && (
                <Button variant="outline" size="sm" asChild>
                  <a href={texte.url_pdf_ar} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    PDF Arabe (Officiel)
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </a>
                </Button>
              )}
              {texte.url_pdf_fr && (
                <Button variant="outline" size="sm" asChild>
                  <a href={texte.url_pdf_fr} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    PDF Français (Informatif)
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </a>
                </Button>
              )}
            </div>
            {!texte.url_pdf_fr && texte.url_pdf_ar && (
              <p className="text-xs text-muted-foreground mt-2">
                <strong>Note:</strong> Traduction informative — seul l'arabe fait foi
              </p>
            )}
          </div>

          {/* Notes éditoriales */}
          {texte.notes_editoriales && (
            <div>
              <div className="text-sm text-muted-foreground mb-2">Notes éditoriales</div>
              <div className="text-sm text-muted-foreground italic bg-muted/30 p-3 rounded">
                {texte.notes_editoriales}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Onglets: Articles, Annexes & Historique */}
      <Tabs defaultValue="articles" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="articles">
            Articles ({articles?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="annexes">
            Annexes
          </TabsTrigger>
          <TabsTrigger value="historique">
            Historique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="articles">
          <ArticlesTab acteId={id!} articles={articles || []} />
        </TabsContent>

        <TabsContent value="annexes">
          <AnnexesTab acteId={id!} />
        </TabsContent>

        <TabsContent value="historique">
          <ChangelogManager acteId={id!} />
        </TabsContent>
      </Tabs>

      {/* Version History Drawer */}
      <TexteVersionDrawer
        open={versionDrawerOpen}
        onOpenChange={setVersionDrawerOpen}
        acteId={id!}
        currentVersion={texte.version || 1}
      />
    </div>
  );
}

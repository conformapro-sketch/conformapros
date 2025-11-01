import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Package, UserCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { fetchEPIArticles, deleteEPIArticle, fetchEPIStats } from "@/lib/epi-queries";
import EPIFormModal from "./EPIFormModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const STATUT_EPI_LABELS = {
  en_stock: { label: "En stock", color: "bg-blue-500" },
  attribue: { label: "Attribué", color: "bg-green-500" },
  mis_au_rebut: { label: "Mis au rebut", color: "bg-gray-500" },
};

interface EPITableProps {
  siteId?: string;
  statusFilter?: string;
}

export default function EPITable({ siteId, statusFilter }: EPITableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<string | null>(null);

  const { data: articles, isLoading } = useQuery({
    queryKey: ["epi_articles", siteId, statusFilter],
    queryFn: async () => {
      const data = await fetchEPIArticles(siteId);
      if (statusFilter) {
        return data.filter((article: any) => article.statut === statusFilter);
      }
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["epi_stats", siteId],
    queryFn: () => fetchEPIStats(siteId),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEPIArticle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["epi_articles"] });
      queryClient.invalidateQueries({ queryKey: ["epi_stats"] });
      toast({ title: "Article EPI supprimé avec succès" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-3xl">{stats?.total || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardDescription>En stock</CardDescription>
            <CardTitle className="text-3xl text-blue-600 flex items-center gap-2">
              <Package className="h-6 w-6" />
              {stats?.enStock || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardDescription>Attribués</CardDescription>
            <CardTitle className="text-3xl text-green-600 flex items-center gap-2">
              <UserCheck className="h-6 w-6" />
              {stats?.attribue || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-gray-200 bg-gray-50">
          <CardHeader className="pb-2">
            <CardDescription>Mis au rebut</CardDescription>
            <CardTitle className="text-3xl text-gray-600">{stats?.misAuRebut || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Articles EPI ({articles?.length || 0})</h3>
        <Button
          onClick={() => {
            setSelectedArticle(null);
            setIsFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvel article EPI
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : articles && articles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Taille</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Attribué à</TableHead>
                  <TableHead>Date attribution</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map((article: any) => {
                  const statutInfo = STATUT_EPI_LABELS[article.statut as keyof typeof STATUT_EPI_LABELS];
                  return (
                    <TableRow key={article.id}>
                      <TableCell className="font-medium">{article.code}</TableCell>
                      <TableCell>{article.type?.libelle}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{article.type?.categorie || "-"}</Badge>
                      </TableCell>
                      <TableCell>{article.taille || "-"}</TableCell>
                      <TableCell>{article.site?.nom_site}</TableCell>
                      <TableCell>
                        <Badge className={`${statutInfo.color} text-white`}>
                          {statutInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {article.employe
                          ? `${article.employe.nom} ${article.employe.prenom}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {article.date_attribution
                          ? format(new Date(article.date_attribution), "dd/MM/yyyy", { locale: fr })
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedArticle(article);
                              setIsFormOpen(true);
                            }}
                          >
                            Modifier
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setArticleToDelete(article.id);
                              setDeleteConfirmOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">Aucun article EPI trouvé</div>
          )}
        </CardContent>
      </Card>

      <EPIFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        article={selectedArticle}
        defaultSiteId={siteId}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera définitivement cet article EPI.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (articleToDelete) {
                  deleteMutation.mutate(articleToDelete);
                  setDeleteConfirmOpen(false);
                }
              }}
              className="bg-destructive"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Edit, FileText, Calendar, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CodeFormModal } from "@/components/CodeFormModal";
import { codesQueries } from "@/lib/codes-queries";
import { TYPE_RELATION_LABELS } from "@/types/codes";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function CodeDetail() {
  const { id } = useParams<{ id: string }>();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: code, isLoading } = useQuery({
    queryKey: ["code", id],
    queryFn: () => codesQueries.getById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">Chargement...</div>
      </div>
    );
  }

  if (!code) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">Code juridique introuvable</div>
      </div>
    );
  }

  const getRelationBadgeVariant = (relation: string) => {
    switch (relation) {
      case "appartient_a":
        return "default";
      case "modifie":
        return "secondary";
      case "abroge_partiellement":
        return "destructive";
      case "complete":
        return "outline";
      default:
        return "default";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/codes-juridiques">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="font-mono text-lg px-3 py-1">
              {code.abreviation}
            </Badge>
            <h1 className="text-3xl font-bold">{code.nom_officiel}</h1>
          </div>
          {code.domaines_reglementaires && (
            <p className="text-muted-foreground">
              Domaine: {code.domaines_reglementaires.libelle}
            </p>
          )}
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Edit className="w-4 h-4 mr-2" />
          Modifier
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Informations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Référence JORT
              </p>
              <p className="text-sm">
                {code.reference_jort || (
                  <span className="text-muted-foreground">Non renseignée</span>
                )}
              </p>
            </div>
            {code.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Description
                </p>
                <p className="text-sm whitespace-pre-wrap">{code.description}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Date de création
              </p>
              <p className="text-sm">
                {format(new Date(code.created_at), "d MMMM yyyy", {
                  locale: fr,
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Statistiques
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Nombre de textes
              </span>
              <Badge variant="secondary">{code.textes?.length || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Textes constitutifs
              </span>
              <Badge>
                {code.textes?.filter((t) => t.type_relation === "appartient_a")
                  .length || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Modifications
              </span>
              <Badge variant="secondary">
                {code.textes?.filter((t) => t.type_relation === "modifie")
                  .length || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Textes associés</CardTitle>
          <CardDescription>
            Liste des textes réglementaires liés à ce code juridique
          </CardDescription>
        </CardHeader>
        <CardContent>
          {code.textes && code.textes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Intitulé</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Relation</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {code.textes.map((item) => (
                  <TableRow key={item.texte_code_id}>
                    <TableCell className="font-mono text-sm">
                      {item.texte.reference_officielle}
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/veille/bibliotheque/texte/${item.texte.id}`}
                        className="hover:underline"
                      >
                        {item.texte.intitule}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.texte.type_acte}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRelationBadgeVariant(item.type_relation)}>
                        {TYPE_RELATION_LABELS[item.type_relation]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.texte.date_publication ? (
                        <span className="text-sm flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(
                            new Date(item.texte.date_publication),
                            "dd/MM/yyyy"
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Aucun texte associé à ce code pour le moment
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <CodeFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        code={code}
      />
    </div>
  );
}

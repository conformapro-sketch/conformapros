import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertBadge } from "@/components/AlertBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Upload, Search, Filter, Eye } from "lucide-react";

export default function DossierReglementaire() {
  const [searchTerm, setSearchTerm] = useState("");

  const documents = [
    {
      id: 1,
      nom: "Autorisation ONPC",
      categorie: "Autorisation administrative",
      dateExpiration: "15/12/2025",
      statut: "conforme" as const,
      site: "Site Tunis",
    },
    {
      id: 2,
      nom: "Certificat d'assurance RC",
      categorie: "Assurance",
      dateExpiration: "10/01/2025",
      statut: "expire" as const,
      site: "Tous sites",
    },
    {
      id: 3,
      nom: "Rapport de vérification SSI",
      categorie: "Contrôle technique",
      dateExpiration: "28/02/2025",
      statut: "expire-bientot" as const,
      site: "Site Sfax",
    },
    {
      id: 4,
      nom: "Attestation de prévention incendie",
      categorie: "Sécurité incendie",
      dateExpiration: "05/06/2025",
      statut: "conforme" as const,
      site: "Site Tunis",
    },
    {
      id: 5,
      nom: "Rapport audit ISO 45001",
      categorie: "Certification",
      dateExpiration: "22/03/2025",
      statut: "conforme" as const,
      site: "Tous sites",
    },
  ];

  const filteredDocuments = documents.filter((doc) =>
    doc.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.categorie.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">Dossier réglementaire</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">Gestion centralisée des documents de conformité</p>
        </div>
        <Button className="bg-gradient-primary shadow-medium w-full sm:w-auto">
          <Upload className="h-4 w-4 mr-2" />
          Ajouter
        </Button>
      </div>

      {/* Statistiques rapides */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-soft border-l-4 border-l-success">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-success">124</div>
            <p className="text-sm text-muted-foreground mt-1">Documents conformes</p>
          </CardContent>
        </Card>
        <Card className="shadow-soft border-l-4 border-l-warning">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-warning">8</div>
            <p className="text-sm text-muted-foreground mt-1">Expirent bientôt</p>
          </CardContent>
        </Card>
        <Card className="shadow-soft border-l-4 border-l-destructive">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-destructive">3</div>
            <p className="text-sm text-muted-foreground mt-1">Documents expirés</p>
          </CardContent>
        </Card>
        <Card className="shadow-soft border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-primary">87%</div>
            <p className="text-sm text-muted-foreground mt-1">Taux de conformité</p>
          </CardContent>
        </Card>
      </div>

      {/* Barre de recherche et filtres */}
      <Card className="shadow-soft">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un document..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtrer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des documents */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Liste des documents
          </CardTitle>
          <CardDescription>{filteredDocuments.length} documents trouvés</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Date d'expiration</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((doc) => (
                <TableRow key={doc.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{doc.nom}</TableCell>
                  <TableCell className="text-muted-foreground">{doc.categorie}</TableCell>
                  <TableCell className="text-muted-foreground">{doc.site}</TableCell>
                  <TableCell className="text-muted-foreground">{doc.dateExpiration}</TableCell>
                  <TableCell>
                    <AlertBadge status={doc.statut}>
                      {doc.statut === "conforme" && "Conforme"}
                      {doc.statut === "expire-bientot" && "Expire bientôt"}
                      {doc.statut === "expire" && "Expiré"}
                    </AlertBadge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
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

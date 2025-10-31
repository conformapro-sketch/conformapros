import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchFormationDocuments } from "@/lib/formations-queries";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, FileText, Download, Upload, Filter } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const DOCUMENT_TYPE_LABELS = {
  feuille_emargement: "Feuille d'émargement",
  rapport: "Rapport de formation",
  certificat_global: "Certificat global",
  support_formation: "Support de formation",
  autre: "Autre",
};

export default function FormationsDocuments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

  const { data: documents, isLoading } = useQuery({
    queryKey: ["formation-documents"],
    queryFn: () => fetchFormationDocuments(""),
  });

  const filteredDocuments = documents?.filter((doc) => {
    const matchesSearch = doc.file_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || doc.type_document === selectedType;
    return matchesSearch && matchesType;
  }) || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Certificats & Documents</h1>
          <p className="text-muted-foreground">
            Bibliothèque de certificats et supports de formation
          </p>
        </div>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Téléverser un document
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un document..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-64">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type de document" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="feuille_emargement">Feuille d'émargement</SelectItem>
                <SelectItem value="rapport">Rapport de formation</SelectItem>
                <SelectItem value="certificat_global">Certificat global</SelectItem>
                <SelectItem value="support_formation">Support de formation</SelectItem>
                <SelectItem value="autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement...
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun document disponible</p>
              <p className="text-sm mt-2">
                Téléversez vos premiers certificats et supports de formation
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom du fichier</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Formation</TableHead>
                  <TableHead>Date d'ajout</TableHead>
                  <TableHead>Taille</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {doc.file_name || "Document sans nom"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {DOCUMENT_TYPE_LABELS[doc.type_document as keyof typeof DOCUMENT_TYPE_LABELS] || doc.type_document}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">-</TableCell>
                    <TableCell>
                      {doc.created_at
                        ? format(new Date(doc.created_at), "dd MMM yyyy", { locale: fr })
                        : "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">-</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

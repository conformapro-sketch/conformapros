import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpen,
  ChevronRight,
  ChevronDown,
  FileText,
  Search,
  Plus,
  Upload,
  Download,
  Eye,
  Calendar,
  Filter,
  BarChart3
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { textesReglementairesQueries, domainesQueries, sousDomainesQueries } from "@/lib/textes-queries";
import { TexteFormModal } from "@/components/TexteFormModal";

const TYPE_LABELS: Record<string, string> = {
  LOI: "Loi",
  ARRETE: "Arrêté",
  DECRET: "Décret",
  CIRCULAIRE: "Circulaire"
};

const TYPE_GROUPS: Record<string, string[]> = {
  "LOIS": ["LOI"],
  "DÉCRETS": ["DECRET"],
  "ARRÊTÉS": ["ARRETE"],
  "CIRCULAIRES": ["CIRCULAIRE"]
};

export default function BibliothequeNavigationTree() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["LOIS"]);
  const [expandedTextes, setExpandedTextes] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatut, setSelectedStatut] = useState<string>("all");
  const [selectedDomaine, setSelectedDomaine] = useState<string>("all");
  const [showFormModal, setShowFormModal] = useState(false);

  const { data: domainesList } = useQuery({
    queryKey: ["domaines"],
    queryFn: () => domainesQueries.getActive(),
  });

  const { data: textesResult, isLoading } = useQuery({
    queryKey: ["bibliotheque-navigation-tree", searchTerm, selectedType, selectedStatut, selectedDomaine],
    queryFn: () =>
      textesReglementairesQueries.getAll({
        searchTerm,
        typeFilter: selectedType !== "all" ? selectedType : undefined,
        statutFilter: selectedStatut !== "all" ? selectedStatut : undefined,
        domaineFilter: selectedDomaine !== "all" ? selectedDomaine : undefined,
        pageSize: 1000, // Get all for tree view
      }),
  });

  const textes = textesResult?.data || [];

  // Group texts by type category
  const textsByGroup = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    Object.keys(TYPE_GROUPS).forEach(group => {
      grouped[group] = textes.filter(t => TYPE_GROUPS[group].includes(t.type));
    });
    return grouped;
  }, [textes]);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev =>
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
  };

  const toggleTexte = (texteId: string) => {
    setExpandedTextes(prev =>
      prev.includes(texteId) ? prev.filter(id => id !== texteId) : [...prev, texteId]
    );
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "en_vigueur":
        return { label: "En vigueur", variant: "success" as const };
      case "modifie":
        return { label: "Modifié", variant: "warning" as const };
      case "abroge":
        return { label: "Abrogé", variant: "destructive" as const };
      case "suspendu":
        return { label: "Suspendu", variant: "secondary" as const };
      default:
        return { label: statut, variant: "secondary" as const };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            📚 Bibliothèque réglementaire
          </h1>
          <p className="text-muted-foreground mt-2">
            Navigation par type, texte et articles
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/bibliotheque/recherche")}>
            <Search className="h-4 w-4 mr-2" />
            Recherche avancée
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/bibliotheque/dashbord")}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Tableau de bord
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Importer
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button size="sm" onClick={() => setShowFormModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau texte
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Sidebar - Navigation Tree */}
        <div className="lg:col-span-4">
          <Card className="shadow-medium sticky top-4">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtres et navigation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filters */}
              <div className="space-y-3">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type de texte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <Separator className="my-1" />
                    {Object.entries(TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedStatut} onValueChange={setSelectedStatut}>
                  <SelectTrigger>
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="en_vigueur">En vigueur</SelectItem>
                    <SelectItem value="modifie">Modifié</SelectItem>
                    <SelectItem value="abroge">Abrogé</SelectItem>
                    <SelectItem value="suspendu">Suspendu</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedDomaine} onValueChange={setSelectedDomaine}>
                  <SelectTrigger>
                    <SelectValue placeholder="Domaine" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les domaines</SelectItem>
                    {domainesList?.map((domaine) => (
                      <SelectItem key={domaine.id} value={domaine.id}>
                        {domaine.libelle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Tree Navigation */}
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-2">
                  {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      Chargement...
                    </div>
                  ) : (
                    Object.entries(TYPE_GROUPS).map(([groupName, _types]) => {
                      const groupTextes = textsByGroup[groupName] || [];
                      const isExpanded = expandedGroups.includes(groupName);
                      
                      return (
                        <div key={groupName} className="space-y-1">
                          {/* Group Header */}
                          <button
                            onClick={() => toggleGroup(groupName)}
                            className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors text-left group"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="font-medium">{groupName}</span>
                            <Badge variant="secondary" className="ml-auto">
                              {groupTextes.length}
                            </Badge>
                          </button>

                          {/* Group Content */}
                          {isExpanded && (
                            <div className="ml-6 space-y-1">
                              {groupTextes.map((texte) => {
                                const isTexteExpanded = expandedTextes.includes(texte.id);
                                const articleCount = texte.articles?.[0]?.count || 0;

                                return (
                                  <div key={texte.id} className="space-y-1">
                                    {/* Texte */}
                                    <div className="flex items-start gap-2 group">
                                      <button
                                        onClick={() => toggleTexte(texte.id)}
                                        className="p-1 hover:bg-accent rounded"
                                      >
                                        {isTexteExpanded ? (
                                          <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                        ) : (
                                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                        )}
                                      </button>
                                      <div className="flex-1 min-w-0">
                                        <button
                                          onClick={() => navigate(`/bibliotheque/textes/${texte.id}`)}
                                          className="text-sm hover:underline text-left w-full group-hover:text-primary"
                                        >
                                          <div className="font-medium truncate">
                                            {texte.reference_officielle}
                                          </div>
                                          <div className="text-xs text-muted-foreground truncate">
                                            {texte.titre}
                                          </div>
                                        </button>
                                      </div>
                                      <Badge variant="outline" className="text-xs shrink-0">
                                        {articleCount}
                                      </Badge>
                                    </div>

                                    {/* Articles */}
                                    {isTexteExpanded && texte.articles && (
                                      <div className="ml-4 pl-2 border-l-2 border-border space-y-1">
                                        {articleCount > 0 ? (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full justify-start text-xs h-7"
                                            onClick={() => navigate(`/bibliotheque/textes/${texte.id}#articles`)}
                                          >
                                            <FileText className="h-3 w-3 mr-2" />
                                            Voir les {articleCount} articles
                                          </Button>
                                        ) : (
                                          <div className="text-xs text-muted-foreground px-2 py-1">
                                            Aucun article
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Content View */}
        <div className="lg:col-span-8">
          <Card className="shadow-medium">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Résultats ({textes.length} texte{textes.length > 1 ? 's' : ''})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
                  Chargement...
                </div>
              ) : textes.length > 0 ? (
                <div className="space-y-3">
                  {textes.map((texte) => {
                    const statutInfo = getStatutBadge(texte.statut_vigueur);
                    const articleCount = texte.articles?.[0]?.count || 0;

                      return (
                        <div
                          key={texte.id}
                          className="p-4 rounded-lg border border-border hover:border-primary/50 transition-all cursor-pointer hover:shadow-soft"
                          onClick={() => navigate(`/bibliotheque/textes/${texte.id}`)}
                        >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {TYPE_LABELS[texte.type] || texte.type}
                                </Badge>
                                <Badge
                                  className={
                                    statutInfo.variant === "success"
                                      ? "bg-success text-success-foreground"
                                      : statutInfo.variant === "warning"
                                      ? "bg-warning text-warning-foreground"
                                      : statutInfo.variant === "destructive"
                                      ? "bg-destructive text-destructive-foreground"
                                      : ""
                                  }
                                >
                                  {statutInfo.label}
                                </Badge>
                              </div>
                              <h3 className="font-medium text-foreground line-clamp-1">
                                {texte.reference_officielle}
                              </h3>
                              <p className="text-sm text-foreground/80 line-clamp-2 mt-1">
                                {texte.titre}
                              </p>
                              {texte.resume && (
                                <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                  {texte.resume}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/bibliotheque/textes/${texte.id}`);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {texte.autorite && (
                              <span className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {texte.autorite}
                              </span>
                            )}
                            {texte.date_publication && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(texte.date_publication).toLocaleDateString("fr-TN")}
                              </span>
                            )}
                            <Badge variant="secondary" className="text-xs">
                              {articleCount} article{articleCount > 1 ? 's' : ''}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Aucun texte trouvé
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedType("all");
                      setSelectedStatut("all");
                      setSelectedDomaine("all");
                    }}
                  >
                    Réinitialiser les filtres
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Form Modal */}
      <TexteFormModal
        open={showFormModal}
        onOpenChange={setShowFormModal}
        onSuccess={() => {
          // Refresh data after successful creation
        }}
      />
    </div>
  );
}

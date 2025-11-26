import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { codesQueries, codesStructuresQueries } from "@/lib/codes-queries";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ChevronDown, ChevronRight, BookOpen, FileText, Home, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface StructureNode {
  id: string;
  code_id: string;
  parent_id: string | null;
  label: string;
  niveau: string;
  ordre: number;
  children?: StructureNode[];
}

export default function ClientCodesJuridiques() {
  const navigate = useNavigate();
  const [selectedCodeId, setSelectedCodeId] = useState<string | null>(null);
  const [selectedStructureId, setSelectedStructureId] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Fetch all codes
  const { data: codes, isLoading: codesLoading } = useQuery({
    queryKey: ["codes-juridiques"],
    queryFn: () => codesQueries.getAll(),
  });

  // Fetch structure for selected code
  const { data: structures, isLoading: structuresLoading } = useQuery({
    queryKey: ["code-structures", selectedCodeId],
    queryFn: () => codesStructuresQueries.getByCodeId(selectedCodeId!),
    enabled: !!selectedCodeId,
  });

  // Fetch articles for selected structure node
  const { data: articles, isLoading: articlesLoading } = useQuery({
    queryKey: ["structure-articles", selectedStructureId],
    queryFn: () => codesStructuresQueries.getArticlesByStructureId(selectedStructureId!),
    enabled: !!selectedStructureId,
  });

  // Build tree structure from flat list
  const buildTree = (flatList: any[]): StructureNode[] => {
    const map = new Map<string, StructureNode>();
    const roots: StructureNode[] = [];

    flatList.forEach((item) => {
      map.set(item.id, { ...item, children: [] });
    });

    flatList.forEach((item) => {
      const node = map.get(item.id)!;
      if (item.parent_id === null) {
        roots.push(node);
      } else {
        const parent = map.get(item.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        }
      }
    });

    return roots;
  };

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderTreeNode = (node: StructureNode, depth: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedStructureId === node.id;

    return (
      <div key={node.id} style={{ marginLeft: `${depth * 1.5}rem` }}>
        <Collapsible open={isExpanded} onOpenChange={() => toggleNode(node.id)}>
          <div className="flex items-center gap-2 py-1">
            {hasChildren && (
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            )}
            {!hasChildren && <div className="w-6" />}
            <Button
              variant={isSelected ? "secondary" : "ghost"}
              size="sm"
              className="justify-start flex-1 h-auto py-1"
              onClick={() => setSelectedStructureId(node.id)}
            >
              <span className="text-sm">{node.label}</span>
              <Badge variant="outline" className="ml-2 text-xs">
                {node.niveau}
              </Badge>
            </Button>
          </div>
          {hasChildren && (
            <CollapsibleContent>
              {node.children!.map((child) => renderTreeNode(child, depth + 1))}
            </CollapsibleContent>
          )}
        </Collapsible>
      </div>
    );
  };

  const treeData = structures ? buildTree(structures) : [];
  const selectedCode = codes?.find((c) => c.id === selectedCodeId);

  if (codesLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">
              <Home className="h-4 w-4" />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Codes juridiques</BreadcrumbPage>
          </BreadcrumbItem>
          {selectedCode && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{selectedCode.nom_officiel || selectedCode.titre}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Codes juridiques</h1>
          <p className="text-muted-foreground mt-1">
            Naviguez par structure juridique (livres, titres, chapitres, sections)
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/client-bibliotheque")} variant="outline">
            <BookOpen className="h-4 w-4 mr-2" />
            Bibliothèque
          </Button>
          <Button onClick={() => navigate("/client/recherche-avancee")} variant="outline">
            <Search className="h-4 w-4 mr-2" />
            Recherche avancée
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des codes */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Codes disponibles
          </h2>
          <div className="space-y-2">
            {codes?.map((code) => (
              <Button
                key={code.id}
                variant={selectedCodeId === code.id ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => {
                  setSelectedCodeId(code.id);
                  setSelectedStructureId(null);
                  setExpandedNodes(new Set());
                }}
              >
                <div className="text-left">
                  <div className="font-medium">{code.nom_officiel || code.titre}</div>
                  {code.abreviation && (
                    <div className="text-xs text-muted-foreground">{code.abreviation}</div>
                  )}
                </div>
              </Button>
            ))}
          </div>
        </Card>

        {/* Arborescence du code sélectionné */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Structure hiérarchique</h2>
          {!selectedCodeId && (
            <p className="text-sm text-muted-foreground">
              Sélectionnez un code pour voir sa structure
            </p>
          )}
          {structuresLoading && <Skeleton className="h-[400px] w-full" />}
          {selectedCodeId && !structuresLoading && treeData.length === 0 && (
            <Alert>
              <AlertDescription>
                Aucune structure définie pour ce code
              </AlertDescription>
            </Alert>
          )}
          {selectedCodeId && !structuresLoading && treeData.length > 0 && (
            <div className="space-y-1 max-h-[600px] overflow-y-auto">
              {treeData.map((node) => renderTreeNode(node))}
            </div>
          )}
        </Card>

        {/* Articles liés */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Articles
          </h2>
          {!selectedStructureId && (
            <p className="text-sm text-muted-foreground">
              Sélectionnez un élément de la structure pour voir les articles
            </p>
          )}
          {articlesLoading && <Skeleton className="h-[400px] w-full" />}
          {selectedStructureId && !articlesLoading && articles?.length === 0 && (
            <Alert>
              <AlertDescription>
                Aucun article lié à cette section
              </AlertDescription>
            </Alert>
          )}
          {selectedStructureId && !articlesLoading && articles && articles.length > 0 && (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {articles.map((article: any) => (
                <Card key={article.id} className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium">Article {article.numero}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {article.titre}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {article.porte_exigence && (
                          <Badge variant="destructive">Exigence réglementaire</Badge>
                        )}
                        {!article.porte_exigence && article.est_introductif && (
                          <Badge variant="secondary">Introductif</Badge>
                        )}
                      </div>
                    </div>
                    {article.resume && (
                      <p className="text-sm text-muted-foreground">{article.resume}</p>
                    )}
                    {article.active_version && (
                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        <div>Version {article.active_version.numero_version} en vigueur</div>
                        <div>
                          Depuis le{" "}
                          {new Date(article.active_version.date_effet).toLocaleDateString("fr-FR")}
                        </div>
                        {article.active_version.textes_reglementaires && (
                          <div className="mt-1">
                            Source: {article.active_version.textes_reglementaires.reference}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

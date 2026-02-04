import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Eye, History, ExternalLink, MoreVertical } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ArticleWithDetails } from "@/lib/articles-queries";

interface ArticlesDataGridProps {
  articles: ArticleWithDetails[];
  isLoading?: boolean;
  onViewArticle?: (article: ArticleWithDetails) => void;
}

function getTypeBadge(porte_exigence: boolean, est_introductif: boolean) {
  if (porte_exigence) {
    return { label: "Exigence", variant: "default" as const, className: "bg-orange-500 hover:bg-orange-600" };
  }
  if (est_introductif) {
    return { label: "Introductif", variant: "secondary" as const, className: "" };
  }
  return null;
}

function getStatutBadge(statut?: string) {
  switch (statut) {
    case "en_vigueur":
      return { label: "En vigueur", variant: "default" as const, className: "bg-green-500 hover:bg-green-600" };
    case "remplacee":
      return { label: "Remplacé", variant: "outline" as const, className: "text-amber-600 border-amber-600" };
    case "abrogee":
      return { label: "Abrogé", variant: "outline" as const, className: "text-red-600 border-red-600" };
    default:
      return { label: "—", variant: "outline" as const, className: "" };
  }
}

function getTypeTexteBadge(type?: string) {
  const types: Record<string, { label: string; className: string }> = {
    loi: { label: "Loi", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
    decret: { label: "Décret", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
    arrete: { label: "Arrêté", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
    circulaire: { label: "Circulaire", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  };
  return types[type || ""] || { label: type || "—", className: "" };
}

// Mobile card component
function MobileArticleCard({ 
  article, 
  onView, 
  onNavigate 
}: { 
  article: ArticleWithDetails; 
  onView: () => void;
  onNavigate: (path: string) => void;
}) {
  const typeBadge = getTypeBadge(article.porte_exigence, article.est_introductif);
  const statutBadge = getStatutBadge(article.version_active?.statut);
  const typeTexteBadge = getTypeTexteBadge(article.texte?.type);

  return (
    <div 
      className="p-3.5 sm:p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer active:bg-muted/70"
      onClick={onView}
    >
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <span className="font-semibold text-sm">Art. {article.numero}</span>
        <div className="flex flex-wrap gap-1.5 justify-end">
          {typeBadge && (
            <Badge variant={typeBadge.variant} className={`${typeBadge.className} text-xs px-2.5 py-1`}>
              {typeBadge.label}
            </Badge>
          )}
          <Badge variant={statutBadge.variant} className={`${statutBadge.className} text-xs px-2.5 py-1`}>
            {statutBadge.label}
          </Badge>
        </div>
      </div>
      
      <p className="text-sm font-medium line-clamp-2 mb-2">{article.titre}</p>
      
      {article.texte && (
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className={`${typeTexteBadge.className} text-xs`}>
            {typeTexteBadge.label}
          </Badge>
          <p className="text-xs text-muted-foreground truncate flex-1">
            {article.texte.reference}
          </p>
        </div>
      )}

      <div className="flex justify-end mt-2" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onView}>
              <Eye className="h-4 w-4 mr-2" />
              Voir l'article
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onNavigate(`/bibliotheque/articles/${article.id}/versions`)}>
              <History className="h-4 w-4 mr-2" />
              Historique versions
            </DropdownMenuItem>
            {article.texte && (
              <DropdownMenuItem onClick={() => onNavigate(`/bibliotheque/textes/${article.texte?.id}`)}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Voir le texte
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function ArticlesDataGrid({ articles, isLoading, onViewArticle }: ArticlesDataGridProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <>
        {/* Desktop/Tablet Skeleton */}
        <div className="hidden md:block rounded-md border overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Numéro</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead className="w-[200px]">Texte parent</TableHead>
                <TableHead className="w-[150px]">Domaines</TableHead>
                <TableHead className="w-[100px]">Type</TableHead>
                <TableHead className="w-[100px]">Statut</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Mobile Skeleton */}
        <div className="block md:hidden space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-3 rounded-lg border">
              <div className="flex justify-between mb-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md bg-muted/30">
        <p className="text-muted-foreground">Aucun article trouvé</p>
        <p className="text-sm text-muted-foreground mt-1">
          Modifiez vos critères de recherche ou filtres
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop/Tablet: Table with horizontal scroll */}
      <div className="hidden md:block rounded-md border overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Numéro</TableHead>
              <TableHead>Titre</TableHead>
              <TableHead className="w-[200px]">Texte parent</TableHead>
              <TableHead className="w-[150px]">Domaines</TableHead>
              <TableHead className="w-[100px]">Type</TableHead>
              <TableHead className="w-[100px]">Statut</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.map((article) => {
              const typeBadge = getTypeBadge(article.porte_exigence, article.est_introductif);
              const statutBadge = getStatutBadge(article.version_active?.statut);
              const typeTexteBadge = getTypeTexteBadge(article.texte?.type);

              // Get unique domaines from sous_domaines
              const domaines = [...new Set(
                article.sous_domaines
                  ?.map(sd => sd.sous_domaine?.domaine?.libelle)
                  .filter(Boolean) || []
              )];

              return (
                <TableRow key={article.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    Art. {article.numero}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-md">
                      <p className="font-medium truncate">{article.titre}</p>
                      {article.resume && (
                        <p className="text-sm text-muted-foreground truncate mt-0.5">
                          {article.resume}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {article.texte && (
                      <div className="space-y-1">
                        <Badge variant="outline" className={typeTexteBadge.className}>
                          {typeTexteBadge.label}
                        </Badge>
                        <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                          {article.texte.reference}
                        </p>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {domaines.slice(0, 2).map((d, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {d}
                        </Badge>
                      ))}
                      {domaines.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{domaines.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {typeBadge && (
                      <Badge variant={typeBadge.variant} className={typeBadge.className}>
                        {typeBadge.label}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statutBadge.variant} className={statutBadge.className}>
                      {statutBadge.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onViewArticle?.(article)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Voir l'article</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => navigate(`/bibliotheque/articles/${article.id}/versions`)}
                          >
                            <History className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Historique versions</TooltipContent>
                      </Tooltip>

                      {article.texte && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => navigate(`/bibliotheque/textes/${article.texte?.id}`)}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Voir le texte</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: Card view */}
      <div className="block md:hidden space-y-3">
        {articles.map((article) => (
          <MobileArticleCard 
            key={article.id} 
            article={article}
            onView={() => onViewArticle?.(article)}
            onNavigate={navigate}
          />
        ))}
      </div>
    </>
  );
}

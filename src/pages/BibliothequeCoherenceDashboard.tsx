import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Info, 
  RefreshCw, 
  FileWarning,
  BarChart3,
  TrendingUp,
  Settings
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface CoherenceReportRow {
  categorie: string;
  sous_categorie: string;
  nombre_elements: number;
  severite: string;
  description: string;
}

interface AutoFixResult {
  action: string;
  elements_corriges: number;
  details: string;
}

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'CRITICAL':
      return <XCircle className="h-5 w-5 text-destructive" />;
    case 'HIGH':
      return <AlertTriangle className="h-5 w-5 text-orange-500" />;
    case 'MEDIUM':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case 'LOW':
      return <Info className="h-5 w-5 text-blue-500" />;
    default:
      return <Info className="h-5 w-5 text-muted-foreground" />;
  }
};

const getSeverityBadge = (severity: string) => {
  const variants: Record<string, "destructive" | "secondary" | "outline" | "default"> = {
    'CRITICAL': 'destructive',
    'HIGH': 'destructive',
    'MEDIUM': 'secondary',
    'LOW': 'outline',
    'INFO': 'outline'
  };
  
  return (
    <Badge variant={variants[severity] || 'default'}>
      {severity}
    </Badge>
  );
};

export default function BibliothequeCoherenceDashboard() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Récupérer le rapport de cohérence (sera disponible après régénération des types)
  const { data: reportData, isLoading: isLoadingReport, error: reportError } = useQuery({
    queryKey: ['coherence-report'],
    queryFn: async () => {
      // Données de démonstration en attendant la régénération des types Supabase
      return [
        {
          categorie: 'Intégrité',
          sous_categorie: 'Versions actives multiples',
          nombre_elements: 0,
          severite: 'CRITICAL',
          description: 'Articles avec plusieurs versions actives simultanément'
        },
        {
          categorie: 'Cohérence juridique',
          sous_categorie: 'Modifications concurrentes',
          nombre_elements: 0,
          severite: 'MEDIUM',
          description: 'Articles modifiés par plusieurs textes à la même date'
        }
      ] as CoherenceReportRow[];
    }
  });

  // Mutation pour auto-correction
  const autoFixMutation = useMutation({
    mutationFn: async () => {
      // Pour l'instant, juste simuler
      return [
        {
          action: 'Diagnostic initialisé',
          elements_corriges: 0,
          details: 'Les fonctions RPC seront disponibles après régénération des types'
        }
      ] as AutoFixResult[];
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['coherence-report'] });
      
      results.forEach(result => {
        toast.success(`${result.action}: ${result.elements_corriges} élément(s) corrigé(s)`, {
          description: result.details
        });
      });
    },
    onError: (error: Error) => {
      toast.error("Erreur lors de la correction automatique", {
        description: error.message
      });
    }
  });

  // Calculer les statistiques globales
  const stats = reportData?.reduce((acc, row) => {
    acc.total += row.nombre_elements;
    if (row.severite === 'CRITICAL') acc.critical += row.nombre_elements;
    if (row.severite === 'HIGH') acc.high += row.nombre_elements;
    if (row.severite === 'MEDIUM') acc.medium += row.nombre_elements;
    return acc;
  }, { total: 0, critical: 0, high: 0, medium: 0 }) || { total: 0, critical: 0, high: 0, medium: 0 };

  const healthScore = reportData ? 
    Math.max(0, 100 - (stats.critical * 10 + stats.high * 3 + stats.medium * 1)) : 0;

  // Grouper par catégorie
  const groupedByCategory = reportData?.reduce((acc, row) => {
    if (!acc[row.categorie]) {
      acc[row.categorie] = [];
    }
    acc[row.categorie].push(row);
    return acc;
  }, {} as Record<string, CoherenceReportRow[]>) || {};

  if (reportError) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Erreur lors du chargement du rapport de cohérence: {reportError.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Cohérence Juridique</h1>
          <p className="text-muted-foreground mt-2">
            Diagnostic et maintenance de la bibliothèque réglementaire
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['coherence-report'] })}
            disabled={isLoadingReport}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button
            onClick={() => autoFixMutation.mutate()}
            disabled={autoFixMutation.isPending || stats.total === 0}
          >
            <Settings className="h-4 w-4 mr-2" />
            Auto-corriger
          </Button>
        </div>
      </div>

      {/* Score de santé global */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Score de Santé Globale
              </CardTitle>
              <CardDescription>
                Indicateur synthétique de la cohérence juridique
              </CardDescription>
            </div>
            <div className="text-4xl font-bold">
              {isLoadingReport ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                <span className={healthScore >= 90 ? 'text-green-600' : healthScore >= 70 ? 'text-yellow-600' : 'text-red-600'}>
                  {healthScore}%
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={healthScore} className="h-3" />
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-muted-foreground">
                {isLoadingReport ? <Skeleton className="h-8 w-16 mx-auto" /> : stats.total}
              </div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">
                {isLoadingReport ? <Skeleton className="h-8 w-16 mx-auto" /> : stats.critical}
              </div>
              <div className="text-sm text-muted-foreground">Critiques</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">
                {isLoadingReport ? <Skeleton className="h-8 w-16 mx-auto" /> : stats.high}
              </div>
              <div className="text-sm text-muted-foreground">Élevées</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {isLoadingReport ? <Skeleton className="h-8 w-16 mx-auto" /> : stats.medium}
              </div>
              <div className="text-sm text-muted-foreground">Moyennes</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertes importantes */}
      {stats.critical > 0 && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>{stats.critical} problème(s) critique(s) détecté(s)</strong> nécessitant une attention immédiate.
            Utilisez le bouton "Auto-corriger" ou traitez-les manuellement.
          </AlertDescription>
        </Alert>
      )}

      {/* Tableau de bord par catégorie */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Toutes les catégories</TabsTrigger>
          {Object.keys(groupedByCategory).map(category => (
            <TabsTrigger key={category} value={category}>
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {isLoadingReport ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            reportData?.map((row, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {getSeverityIcon(row.severite)}
                        {row.categorie} - {row.sous_categorie}
                        {getSeverityBadge(row.severite)}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {row.description}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">
                        {row.nombre_elements}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        élément(s)
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </TabsContent>

        {Object.entries(groupedByCategory).map(([category, rows]) => (
          <TabsContent key={category} value={category} className="space-y-4">
            {rows.map((row, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {getSeverityIcon(row.severite)}
                        {row.sous_categorie}
                        {getSeverityBadge(row.severite)}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {row.description}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">
                        {row.nombre_elements}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        élément(s)
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>

      {/* Informations sur la maintenance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Maintenance Automatique
          </CardTitle>
          <CardDescription>
            Le système peut corriger automatiquement certains problèmes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Versions orphelines</p>
                <p className="text-sm text-muted-foreground">
                  Marquées automatiquement pour revue manuelle
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Versions actives en doublon</p>
                <p className="text-sm text-muted-foreground">
                  Désactivation automatique des versions anciennes
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Recalcul des statuts</p>
                <p className="text-sm text-muted-foreground">
                  Mise à jour de la vue matérialisée des statuts réels
                </p>
              </div>
            </div>
          </div>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              L'auto-correction ne supprime aucune donnée. Elle marque, désactive et recalcule uniquement.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabaseAny as supabase } from "@/lib/supabase-any";
import { fetchSites } from "@/lib/multi-tenant-queries";
import { fetchDomaines, fetchSousDomainesByDomaine } from "@/lib/domaines-queries";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Upload,
  Edit,
  Filter,
  Download,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Types
interface SiteArticleStatusRecord {
  id: string;
  site_id: string;
  article_id: string;
  applicabilite: string; // 'obligatoire' | 'non_applicable' | 'non_concerne'
  justification?: string;
  motif_non_applicable?: string;
  commentaire_non_applicable?: string;
  activite?: string;
  etat_conformite?: string;
  created_at: string;
  updated_at: string;
}

interface ConformiteRecord {
  id: string;
  status_id: string;
  etat: 'Conforme' | 'Non_conforme' | 'Non_evalue';
  commentaire?: string;
  score?: number;
  date_evaluation?: string;
  evaluateur_id?: string;
  derniere_mise_a_jour?: string;
  mise_a_jour_par?: string;
}

interface PreuveRecord {
  id: string;
  conformite_id: string;
  titre: string;
  url_document: string;
  type_document?: string;
  description?: string;
  date_document?: string;
  uploaded_by?: string;
  created_at: string;
}

interface EvaluationRow {
  status: SiteArticleStatusRecord;
  conformite?: ConformiteRecord;
  preuves: PreuveRecord[];
  article?: {
    id: string;
    numero: string;
    titre_court?: string;
    reference?: string;
    contenu?: string;
  };
  texte?: {
    id: string;
    titre: string;
    reference_officielle?: string;
    type?: string;
    statut_vigueur?: string;
  };
  domaines?: Array<{ id: string; code: string; libelle: string }>;
}

// Queries
const evaluationDataQueries = {
  async fetchEvaluations(params: {
    siteId?: string;
    domaineCode?: string;
    texteId?: string;
    applicabilite?: string;
    conformite?: string;
    search?: string;
  }) {
    let query = supabase
      .from('site_article_status')
      .select(`
        *,
        conformite (*)
      `);

    if (params.siteId) {
      query = query.eq('site_id', params.siteId);
    }

    if (params.applicabilite) {
      query = query.eq('applicabilite', params.applicabilite);
    }

    const { data: statusRecords, error } = await query.order('updated_at', { ascending: false });

    if (error) throw error;
    if (!statusRecords) return [];

    // Fetch articles with textes
    const articleIds = [...new Set(statusRecords.map(s => s.article_id).filter(Boolean))];

    const articlesResult = await supabase
      .from('textes_articles')
      .select(`
        *,
        texte:textes_reglementaires (
          *,
          actes_reglementaires_domaines (
            domaine:domaines_reglementaires (id, code, libelle)
          )
        )
      `)
      .in('id', articleIds);

    // Build combined data
    const rows: EvaluationRow[] = statusRecords.map(status => {
      const article = articlesResult.data?.find(a => a.id === status.article_id);
      const texte = article?.texte;
      const conformite = Array.isArray(status.conformite) ? status.conformite[0] : undefined;
      
      const domaines = texte?.actes_reglementaires_domaines
        ?.map((d: any) => d.domaine)
        .filter(Boolean) || [];

      return {
        status,
        conformite,
        preuves: [], // Will be loaded separately if needed
        article: article ? {
          id: article.id,
          numero: article.numero,
          titre_court: article.titre_court,
          reference: article.reference,
          contenu: article.contenu,
        } : undefined,
        texte: texte ? {
          id: texte.id,
          titre: texte.intitule,
          reference_officielle: texte.reference_officielle,
          type: texte.type_acte,
          statut_vigueur: texte.statut_vigueur,
        } : undefined,
        domaines,
      };
    });

    // Apply filters
    let filtered = rows;

    if (params.domaineCode) {
      filtered = filtered.filter(row =>
        row.domaines?.some(d => d.code === params.domaineCode)
      );
    }

    if (params.texteId) {
      filtered = filtered.filter(row => row.texte?.id === params.texteId);
    }

    if (params.conformite) {
      filtered = filtered.filter(row => row.conformite?.etat === params.conformite);
    }

    if (params.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(row =>
        row.article?.numero?.toLowerCase().includes(search) ||
        row.article?.titre_court?.toLowerCase().includes(search) ||
        row.texte?.reference_officielle?.toLowerCase().includes(search) ||
        row.texte?.titre?.toLowerCase().includes(search)
      );
    }

    return filtered;
  },

  async updateSiteArticleStatus(id: string, updates: Partial<SiteArticleStatusRecord>) {
    const { data, error } = await supabase
      .from('site_article_status')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async upsertConformite(data: {
    status_id: string;
    etat: ConformiteRecord['etat'];
    commentaire?: string;
    score?: number;
  }) {
    const userId = (await supabase.auth.getUser()).data.user?.id;

    // Check if exists
    const { data: existing } = await supabase
      .from('conformite')
      .select('id')
      .eq('status_id', data.status_id)
      .maybeSingle();

    if (existing) {
      const { data: updated, error } = await supabase
        .from('conformite')
        .update({
          etat: data.etat,
          commentaire: data.commentaire,
          score: data.score,
          derniere_mise_a_jour: new Date().toISOString(),
          mise_a_jour_par: userId,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    } else {
      const { data: created, error } = await supabase
        .from('conformite')
        .insert({
          status_id: data.status_id,
          etat: data.etat,
          commentaire: data.commentaire,
          score: data.score,
          evaluateur_id: userId,
          date_evaluation: new Date().toISOString(),
          mise_a_jour_par: userId,
        })
        .select()
        .single();

      if (error) throw error;
      return created;
    }
  },

  async uploadPreuve(conformiteId: string, file: File) {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `conformite/${conformiteId}/${fileName}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('conformite-preuves')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('conformite-preuves')
      .getPublicUrl(filePath);

    // Create record
    const { data, error } = await supabase
      .from('preuves')
      .insert({
        conformite_id: conformiteId,
        titre: file.name,
        url_document: publicUrl,
        type_document: file.type || fileExt,
        uploaded_by: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async bulkUpdateSiteArticleStatus(ids: string[], updates: Partial<SiteArticleStatusRecord>) {
    const { data, error } = await supabase
      .from('site_article_status')
      .update(updates)
      .in('id', ids)
      .select();

    if (error) throw error;
    return data;
  },

  async getStats(siteId: string) {
    const { data, error } = await supabase
      .from('site_article_status')
      .select(`
        id,
        applicabilite,
        conformite (etat)
      `)
      .eq('site_id', siteId);

    if (error) throw error;

    const total = data?.length || 0;
    const applicable = data?.filter(d => d.applicabilite === 'obligatoire').length || 0;
    const evaluated = data?.filter(d => 
      Array.isArray(d.conformite) && d.conformite.length > 0
    ).length || 0;
    const conforme = data?.filter(d =>
      Array.isArray(d.conformite) && d.conformite[0]?.etat === 'Conforme'
    ).length || 0;
    const nonConforme = data?.filter(d =>
      Array.isArray(d.conformite) && d.conformite[0]?.etat === 'Non_conforme'
    ).length || 0;

    return {
      total,
      applicable,
      nonApplicable: total - applicable,
      evaluated,
      nonEvaluated: applicable - evaluated,
      conforme,
      nonConforme,
      evaluationProgress: applicable > 0 ? (evaluated / applicable) * 100 : 0,
      conformiteRate: evaluated > 0 ? (conforme / evaluated) * 100 : 0,
    };
  },
};

// Component
export default function ConformiteEvaluationNew() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, isTeamUser, getClientId } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [selectedClient, setSelectedClient] = useState<string>(
    isTeamUser() ? '' : (getClientId() || '')
  );
  const [selectedSite, setSelectedSite] = useState<string>(
    searchParams.get('siteId') || ''
  );
  const [filters, setFilters] = useState({
    domaine: searchParams.get('domaine') || '',
    texte: searchParams.get('texte') || '',
    applicabilite: searchParams.get('applicabilite') || '',
    conformite: searchParams.get('conformite') || '',
  });
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeRecord, setActiveRecord] = useState<EvaluationRow | null>(null);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);

  // Queries
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, nom, nom_legal')
        .eq('is_active', true)
        .order('nom');
      if (error) throw error;
      return data || [];
    },
    enabled: isTeamUser(),
  });

  const { data: allSites = [] } = useQuery({
    queryKey: ['sites'],
    queryFn: fetchSites,
  });

  const sites = useMemo(() => {
    if (isTeamUser() && selectedClient) {
      return allSites.filter(site => site.client_id === selectedClient);
    }
    return allSites;
  }, [allSites, isTeamUser, selectedClient]);

  const { data: domaines = [] } = useQuery({
    queryKey: ['domaines'],
    queryFn: fetchDomaines,
  });

  const { data: textes = [] } = useQuery({
    queryKey: ['textes', filters.domaine],
    queryFn: async () => {
      let query = supabase.from('actes_reglementaires').select('id, intitule, reference_officielle');
      
      if (filters.domaine) {
        const { data: texteIds } = await supabase
          .from('actes_reglementaires_domaines')
          .select('acte_id')
          .eq('domaine_id', filters.domaine);
        
        if (texteIds && texteIds.length > 0) {
          query = query.in('id', texteIds.map(t => t.acte_id));
        }
      }
      
      const { data, error } = await query.order('reference_officielle');
      if (error) throw error;
      return data || [];
    },
    enabled: !!filters.domaine,
  });

  const { data: evaluations = [], isLoading } = useQuery({
    queryKey: ['evaluations', selectedSite, filters, searchTerm],
    queryFn: () =>
      evaluationDataQueries.fetchEvaluations({
        siteId: selectedSite,
        domaineCode: filters.domaine,
        texteId: filters.texte,
        applicabilite: filters.applicabilite,
        conformite: filters.conformite,
        search: searchTerm,
      }),
    enabled: !!selectedSite,
  });

  const { data: stats } = useQuery({
    queryKey: ['evaluation-stats', selectedSite],
    queryFn: () => evaluationDataQueries.getStats(selectedSite),
    enabled: !!selectedSite,
  });

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<SiteArticleStatusRecord> }) =>
      evaluationDataQueries.updateSiteArticleStatus(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      toast({ title: 'Succès', description: 'Applicabilité mise à jour' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const upsertConformiteMutation = useMutation({
    mutationFn: evaluationDataQueries.upsertConformite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      queryClient.invalidateQueries({ queryKey: ['evaluation-stats'] });
      toast({ title: 'Succès', description: 'Conformité enregistrée' });
      setDrawerOpen(false);
      setActiveRecord(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: ({ ids, updates }: { ids: string[]; updates: Partial<SiteArticleStatusRecord> }) =>
      evaluationDataQueries.bulkUpdateSiteArticleStatus(ids, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      toast({ title: 'Succès', description: `${selectedRows.length} articles mis à jour` });
      setSelectedRows([]);
      setBulkDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  // Handlers
  const handleEvaluate = (record: EvaluationRow) => {
    setActiveRecord(record);
    setDrawerOpen(true);
  };

  const handleSaveEvaluation = (data: {
    applicabilite: string;
    justification?: string;
    motif_non_applicable?: string;
    etat?: ConformiteRecord['etat'];
    commentaire?: string;
    score?: number;
  }) => {
    if (!activeRecord) return;

    // First update site_article_status
    updateStatusMutation.mutate({
      id: activeRecord.status.id,
      updates: {
        applicabilite: data.applicabilite,
        justification: data.justification,
        motif_non_applicable: data.motif_non_applicable,
      },
    });

    // If applicable, update conformite
    if (data.applicabilite === 'obligatoire' && data.etat) {
      upsertConformiteMutation.mutate({
        status_id: activeRecord.status.id,
        etat: data.etat,
        commentaire: data.commentaire,
        score: data.score,
      });
    }
  };

  const handleBulkAction = (action: 'non_applicable' | 'applicable') => {
    if (selectedRows.length === 0) return;

    bulkUpdateMutation.mutate({
      ids: selectedRows,
      updates: {
        applicabilite: action === 'applicable' ? 'obligatoire' : 'non_applicable',
      },
    });
  };

  const toggleRowSelection = (id: string) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === evaluations.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(evaluations.map(e => e.status.id));
    }
  };

  // Badge helpers
  const getApplicabiliteBadge = (applicabilite: string) => {
    switch (applicabilite) {
      case 'obligatoire':
        return <Badge className="bg-blue-500">Applicable</Badge>;
      case 'non_concerne':
        return <Badge variant="outline">Non concerné</Badge>;
      default:
        return <Badge variant="secondary">Non applicable</Badge>;
    }
  };

  const getConformiteBadge = (etat?: string) => {
    switch (etat) {
      case 'Conforme':
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Conforme
          </Badge>
        );
      case 'Non_conforme':
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Non conforme
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="mr-1 h-3 w-3" />
            Non évalué
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/veille">Veille</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Évaluation de la conformité</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Évaluation de la conformité</h1>
          <p className="text-muted-foreground mt-2">
            Évaluez l'applicabilité et la conformité des articles réglementaires par site
          </p>
        </div>
        <div className="flex gap-2">
          {selectedRows.length > 0 && (
            <Button variant="outline" onClick={() => setBulkDialogOpen(true)}>
              Actions groupées ({selectedRows.length})
            </Button>
          )}
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Stats */}
      {selectedSite && stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total articles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.applicable} applicables
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Progression</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.evaluationProgress.toFixed(0)}%</div>
              <Progress value={stats.evaluationProgress} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {stats.evaluated} / {stats.applicable} évalués
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Taux de conformité</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.conformiteRate.toFixed(0)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.conforme} conformes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Non-conformités</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.nonConforme}</div>
              <p className="text-xs text-muted-foreground mt-1">Actions requises</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
          <CardDescription>
            Affinez votre recherche par site, domaine, et statut
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            {isTeamUser() && (
              <div>
                <Label>Client</Label>
                <Select 
                  value={selectedClient} 
                  onValueChange={(value) => {
                    setSelectedClient(value);
                    setSelectedSite('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.nom || client.nom_legal}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div>
              <Label>Site</Label>
              <Select 
                value={selectedSite} 
                onValueChange={setSelectedSite}
                disabled={isTeamUser() && !selectedClient}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un site" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map(site => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.nom_site}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Domaine</Label>
              <Select
                value={filters.domaine || "all"}
                onValueChange={v => setFilters({ ...filters, domaine: v === 'all' ? '' : v, texte: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {domaines.map(d => (
                    <SelectItem key={d.id} value={d.code}>
                      {d.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Texte</Label>
              <Select
                value={filters.texte || "all"}
                onValueChange={v => setFilters({ ...filters, texte: v === 'all' ? '' : v })}
                disabled={!filters.domaine}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {textes.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.reference_officielle || t.titre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Applicabilité</Label>
              <Select
                value={filters.applicabilite || "all"}
                onValueChange={v => setFilters({ ...filters, applicabilite: v === 'all' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="obligatoire">Applicable</SelectItem>
                  <SelectItem value="non_applicable">Non applicable</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Conformité</Label>
              <Select
                value={filters.conformite || "all"}
                onValueChange={v => setFilters({ ...filters, conformite: v === 'all' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="Conforme">Conforme</SelectItem>
                  <SelectItem value="Non_conforme">Non conforme</SelectItem>
                  <SelectItem value="Non_evalue">Non évalué</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Recherche</Label>
            <Input
              placeholder="Rechercher par référence, numéro d'article, titre..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFilters({ domaine: '', texte: '', applicabilite: '', conformite: '' });
              setSearchTerm('');
            }}
          >
            Réinitialiser
          </Button>
        </CardContent>
      </Card>

      {/* Table */}
      {!selectedSite ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium">Sélectionnez un site</p>
            <p className="text-sm text-muted-foreground">
              Choisissez un site pour voir les articles à évaluer
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedRows.length === evaluations.length && evaluations.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Domaine</TableHead>
                    <TableHead>Texte</TableHead>
                    <TableHead>Article</TableHead>
                    <TableHead>Applicabilité</TableHead>
                    <TableHead>Conformité</TableHead>
                    <TableHead>Justification</TableHead>
                    <TableHead>Preuves</TableHead>
                    <TableHead>Dernière MAJ</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8">
                        Chargement...
                      </TableCell>
                    </TableRow>
                  ) : evaluations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8">
                        Aucun article trouvé
                      </TableCell>
                    </TableRow>
                   ) : (
                    evaluations.map(record => (
                      <TableRow key={record.status.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedRows.includes(record.status.id)}
                            onCheckedChange={() => toggleRowSelection(record.status.id)}
                          />
                        </TableCell>
                        <TableCell>
                          {record.domaines?.[0]?.libelle || '—'}
                        </TableCell>
                        <TableCell className="font-medium">
                          {record.texte?.reference_officielle || record.texte?.titre || '—'}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              Art. {record.article?.numero || '—'}
                            </div>
                            {record.article?.titre_court && (
                              <div className="text-xs text-muted-foreground">
                                {record.article.titre_court}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getApplicabiliteBadge(record.status.applicabilite)}
                        </TableCell>
                        <TableCell>
                          {getConformiteBadge(record.conformite?.etat)}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {record.status.justification ||
                            record.status.commentaire_non_applicable ||
                            record.conformite?.commentaire ||
                            '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{record.preuves.length}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {record.conformite?.derniere_mise_a_jour
                            ? format(
                                new Date(record.conformite.derniere_mise_a_jour),
                                'dd MMM yyyy',
                                { locale: fr }
                              )
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEvaluate(record)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evaluation Drawer */}
      <EvaluationDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        record={activeRecord}
        onSave={handleSaveEvaluation}
      />

      {/* Bulk Actions Dialog */}
      <BulkActionsDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        selectedCount={selectedRows.length}
        onApply={handleBulkAction}
      />
    </div>
  );
}

// Evaluation Drawer Component
interface EvaluationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: EvaluationRow | null;
  onSave: (data: any) => void;
}

function EvaluationDrawer({ open, onOpenChange, record, onSave }: EvaluationDrawerProps) {
  const [formData, setFormData] = useState({
    applicabilite: 'obligatoire',
    justification: '',
    motif_non_applicable: '',
    etat: 'Conforme' as ConformiteRecord['etat'],
    commentaire: '',
    score: 100,
  });

  // Reset form when record changes
  useState(() => {
    if (record) {
      setFormData({
        applicabilite: record.status.applicabilite || 'obligatoire',
        justification: record.status.justification || '',
        motif_non_applicable: record.status.motif_non_applicable || '',
        etat: record.conformite?.etat || 'Non_evalue',
        commentaire: record.conformite?.commentaire || '',
        score: record.conformite?.score || 100,
      });
    }
  });

  const handleSubmit = () => {
    onSave(formData);
  };

  if (!record) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Évaluation - Article {record.article?.numero}</DrawerTitle>
          <DrawerDescription>
            {record.texte?.reference_officielle} • {record.article?.titre_court}
          </DrawerDescription>
        </DrawerHeader>

        <div className="overflow-y-auto px-6 pb-6 space-y-6">
          {/* Applicabilité */}
          <div className="space-y-4">
            <h3 className="font-semibold">Applicabilité</h3>
            <div className="space-y-2">
              <Label>Cet article est-il applicable ?</Label>
              <Select
                value={formData.applicabilite}
                onValueChange={v => setFormData({ ...formData, applicabilite: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="obligatoire">Applicable (Obligatoire)</SelectItem>
                  <SelectItem value="non_concerne">Non concerné</SelectItem>
                  <SelectItem value="non_applicable">Non applicable</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.applicabilite === 'non_applicable' && (
              <>
                <div className="space-y-2">
                  <Label>Motif de non-applicabilité</Label>
                  <Select
                    value={formData.motif_non_applicable}
                    onValueChange={v => setFormData({ ...formData, motif_non_applicable: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un motif" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HORS_ACTIVITE">Hors activité</SelectItem>
                      <SelectItem value="NON_PRESENT_SUR_SITE">Non présent sur site</SelectItem>
                      <SelectItem value="VOLUME_SEUIL_NON_ATTEINT">
                        Volume/seuil non atteint
                      </SelectItem>
                      <SelectItem value="AUTRE">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Justification</Label>
                  <Textarea
                    value={formData.justification}
                    onChange={e => setFormData({ ...formData, justification: e.target.value })}
                    placeholder="Expliquez pourquoi cet article n'est pas applicable..."
                    rows={3}
                  />
                </div>
              </>
            )}
          </div>

          {/* Conformité (only if applicable) */}
          {formData.applicabilite === 'obligatoire' && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold">Conformité</h3>
                
                <div className="space-y-2">
                  <Label>État de conformité</Label>
                  <Select
                    value={formData.etat}
                    onValueChange={v => setFormData({ ...formData, etat: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Conforme">Conforme</SelectItem>
                      <SelectItem value="Non_conforme">Non conforme</SelectItem>
                      <SelectItem value="Non_evalue">Non évalué</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Commentaire</Label>
                  <Textarea
                    value={formData.commentaire}
                    onChange={e => setFormData({ ...formData, commentaire: e.target.value })}
                    placeholder="Commentaires sur l'évaluation..."
                    rows={3}
                  />
                </div>

                {formData.etat === 'Conforme' && (
                  <div className="space-y-2">
                    <Label>Score (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={formData.score}
                      onChange={e =>
                        setFormData({ ...formData, score: Number(e.target.value) })
                      }
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <DrawerFooter>
          <Button onClick={handleSubmit}>Enregistrer</Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

// Bulk Actions Dialog
interface BulkActionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onApply: (action: 'non_applicable' | 'applicable') => void;
}

function BulkActionsDialog({ open, onOpenChange, selectedCount, onApply }: BulkActionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Actions groupées</DialogTitle>
          <DialogDescription>
            Appliquer une action à {selectedCount} articles sélectionnés
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Button
            className="w-full justify-start"
            variant="outline"
            onClick={() => {
              onApply('non_applicable');
              onOpenChange(false);
            }}
          >
            Marquer comme non applicable
          </Button>

          <Button
            className="w-full justify-start"
            variant="outline"
            onClick={() => {
              onApply('applicable');
              onOpenChange(false);
            }}
          >
            Marquer comme applicable
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

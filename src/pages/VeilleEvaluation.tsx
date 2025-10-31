import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { fetchSites } from "@/lib/multi-tenant-queries";
import { fetchDomaines, fetchSousDomainesByDomaine } from "@/lib/domaines-queries";
import { evaluationQueries, type EvaluationRecord, type EvaluationArticleMeta } from "@/lib/evaluation-queries";
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
  DialogTrigger,
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Edit2,
  Filter,
  Layers,
  Link as LinkIcon,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { format, formatDistanceToNowStrict } from "date-fns";
import { fr } from "date-fns/locale";
import type { Database, Json } from "@/integrations/supabase/types";
import type { RegulatoryApplicability, ConformityState } from "@/lib/evaluation-queries";
import type { RegulatoryNonApplicableReason as NonApplicableReason } from "@/lib/evaluation-queries";

type SiteArticleStatusUpdate = Database["public"]["Tables"]["site_article_status"]["Update"];
type SiteArticleStatusRow = Database["public"]["Tables"]["site_article_status"]["Row"];
type SiteArticleProofRow = Database["public"]["Tables"]["site_article_proofs"]["Row"];
type SavedViewRow = Database["public"]["Tables"]["site_article_saved_views"]["Row"];
const ProofType = {
  File: "FILE",
  External: "EXTERNAL_LINK",
} as const;

interface FilterState {
  domaine?: string;
  sousDomaine?: string;
  applicability?: RegulatoryApplicability;
  motif?: NonApplicableReason;
  state?: ConformityState;
  proof?: "with" | "without";
  source?: string;
  updatedWithinDays?: number;
  impactLevel?: string;
}

interface DrawerState {
  open: boolean;
  record?: EvaluationRecord;
}

type SuggestionStatus = "pending" | "applied" | "ignored";

interface ApplicabilitySuggestion {
  value: RegulatoryApplicability;
  motif?: NonApplicableReason;
  commentaire?: string | null;
  label?: string;
  reason?: string;
  confidence?: number;
  status?: SuggestionStatus;
  updatedAt?: string;
  sources?: string[];
}

interface StateSuggestion {
  value: ConformityState;
  label?: string;
  reason?: string;
  confidence?: number;
  status?: SuggestionStatus;
  updatedAt?: string;
  sources?: string[];
}

interface SuggestionPayload {
  applicability?: ApplicabilitySuggestion;
  state?: StateSuggestion;
}

type SuggestionKind = keyof SuggestionPayload;

function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handle);
  }, [value, delay]);

  return debounced;
}

const APPLICABILITY_OPTIONS: { label: string; value: RegulatoryApplicability }[] = [
  { label: "Applicable", value: "APPLICABLE" },
  { label: "Non applicable", value: "NON_APPLICABLE" },
];

const STATE_OPTIONS: { label: string; value: ConformityState }[] = [
  { label: "Conforme", value: "Conforme" },
  { label: "Non conforme", value: "Non_conforme" },
  { label: "Non évalué", value: "Non_evalue" },
];

const MOTIF_OPTIONS: { label: string; value: NonApplicableReason }[] = [
  { label: "Hors activité", value: "HORS_ACTIVITE" },
  { label: "Non présent sur site", value: "NON_PRESENT_SUR_SITE" },
  { label: "Volume / seuil non atteint", value: "VOLUME_SEUIL_NON_ATTEINT" },
  { label: "Non classé", value: "NON_CLASSE" },
  { label: "Projet / chantier", value: "PROJET" },
  { label: "Autre", value: "AUTRE" },
];

const PROOF_OPTIONS = [
  { label: "Avec preuve", value: "with" as const },
  { label: "Sans preuve", value: "without" as const },
];

const UPDATED_WITHIN_OPTIONS = [
  { label: "30 derniers jours", value: 30 },
  { label: "90 derniers jours", value: 90 },
  { label: "365 derniers jours", value: 365 },
];

const PAGE_SIZE = 25;

function formatDate(value?: string | null) {
  if (!value) return "—";
  try {
    return format(new Date(value), "dd MMM yyyy", { locale: fr });
  } catch {
    return value;
  }
}

function getApplicabilityBadge(applicability: RegulatoryApplicability) {
  if (applicability === "APPLICABLE") {
    return <Badge className="bg-emerald-500/80 text-white">Applicable</Badge>;
  }
  return <Badge variant="destructive">Non applicable</Badge>;
}

function getStateBadge(state: ConformityState | null) {
  switch (state) {
    case "Conforme":
      return (
        <Badge className="bg-emerald-500/80 text-white">
          <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
          Conforme
        </Badge>
      );
    case "Non_conforme":
      return (
        <Badge variant="destructive">
          <AlertCircle className="mr-1 h-3.5 w-3.5" />
          Non conforme
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary">
          <Clock className="mr-1 h-3.5 w-3.5" />
          Non évalué
        </Badge>
      );
  }
}

function describeArticle(article: EvaluationArticleMeta | null) {
  if (!article) return "—";
  const parts = [
    article.numero ? `Article ${article.numero}` : null,
    article.titreCourt,
    article.reference ? `(${article.reference})` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return parts.length > 0 ? parts : article.id;
}

const DEFAULT_FILTERS: FilterState = {};

function parseNumberParam(value: string | null) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseApplicabilitySuggestion(input: any): ApplicabilitySuggestion | undefined {
  if (!input || typeof input !== "object") return undefined;
  const suggestion: ApplicabilitySuggestion = {
    value: input.value === "NON_APPLICABLE" ? "NON_APPLICABLE" : "APPLICABLE",
    motif: typeof input.motif === "string" ? input.motif : undefined,
    commentaire: typeof input.commentaire === "string" ? input.commentaire : null,
    label: typeof input.label === "string" ? input.label : undefined,
    reason: typeof input.reason === "string" ? input.reason : undefined,
    confidence: typeof input.confidence === "number" ? input.confidence : undefined,
    status: input.status as SuggestionStatus,
    updatedAt: typeof input.updatedAt === "string" ? input.updatedAt : undefined,
    sources: Array.isArray(input.sources) ? input.sources.filter((item: unknown) => typeof item === "string") : undefined,
  };

  if (suggestion.value === "NON_APPLICABLE" && suggestion.motif === undefined) {
    suggestion.motif = undefined;
  }

  if (!["pending", "applied", "ignored"].includes(suggestion.status ?? "")) {
    suggestion.status = "pending";
  }

  return suggestion;
}

function parseStateSuggestion(input: any): StateSuggestion | undefined {
  if (!input || typeof input !== "object") return undefined;
  const suggestion: StateSuggestion = {
    value:
      input.value === "Non_conforme"
        ? "Non_conforme"
        : input.value === "Non_evalue"
          ? "Non_evalue"
          : "Conforme",
    label: typeof input.label === "string" ? input.label : undefined,
    reason: typeof input.reason === "string" ? input.reason : undefined,
    confidence: typeof input.confidence === "number" ? input.confidence : undefined,
    status: input.status as SuggestionStatus,
    updatedAt: typeof input.updatedAt === "string" ? input.updatedAt : undefined,
    sources: Array.isArray(input.sources) ? input.sources.filter((item: unknown) => typeof item === "string") : undefined,
  };

  if (!["pending", "applied", "ignored"].includes(suggestion.status ?? "")) {
    suggestion.status = "pending";
  }

  return suggestion;
}

function parseSuggestionPayload(raw: unknown): SuggestionPayload {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const payload = raw as Record<string, unknown>;
  const result: SuggestionPayload = {};

  if (payload.applicability) {
    const parsed = parseApplicabilitySuggestion(payload.applicability);
    if (parsed) {
      result.applicability = parsed;
    }
  }

  if (payload.state) {
    const parsed = parseStateSuggestion(payload.state);
    if (parsed) {
      result.state = parsed;
    }
  }

  return result;
}

function serializeSuggestionPayload(payload: SuggestionPayload): Record<string, unknown> {
  const serialized: Record<string, unknown> = {};
  if (payload.applicability) {
    serialized.applicability = payload.applicability;
  }
  if (payload.state) {
    serialized.state = payload.state;
  }
  return serialized;
}

function markSuggestionStatus(
  status: SiteArticleStatusRow,
  kind: SuggestionKind,
  nextStatus: SuggestionStatus
): Record<string, unknown> | null {
  const current = parseSuggestionPayload(status.suggestion_payload);
  const suggestion = current[kind];
  if (!suggestion) {
    return null;
  }

  const updated: SuggestionPayload = {
    ...current,
    [kind]: {
      ...suggestion,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    },
  };

  return serializeSuggestionPayload(updated);
}

export default function VeilleEvaluation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedSite, setSelectedSite] = useState<string | undefined>(
    searchParams.get("siteId") ?? undefined
  );
  const [page, setPage] = useState(() => {
    const param = searchParams.get("page");
    return param ? Math.max(Number(param), 1) : 1;
  });
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") ?? "");
  const debouncedSearch = useDebouncedValue(searchTerm, 300);
  const [drawer, setDrawer] = useState<DrawerState>({ open: false });
  const [activeRecordId, setActiveRecordId] = useState<string | undefined>(undefined);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selectedViewId, setSelectedViewId] = useState<string | undefined>(undefined);
  const [isSaveViewOpen, setIsSaveViewOpen] = useState(false);
  const [savedViewName, setSavedViewName] = useState("");
  const [editingView, setEditingView] = useState<SavedViewRow | null>(null);
  const [viewToDelete, setViewToDelete] = useState<SavedViewRow | null>(null);

  const [filters, setFilters] = useState<FilterState>(() => ({
    domaine: searchParams.get("domaine") ?? undefined,
    sousDomaine: searchParams.get("sousDomaine") ?? undefined,
    applicability: (searchParams.get("applicabilite") as RegulatoryApplicability) ?? undefined,
    motif: (searchParams.get("motif") as NonApplicableReason) ?? undefined,
    state: (searchParams.get("etat") as ConformityState) ?? undefined,
    proof: (searchParams.get("preuve") as "with" | "without") ?? undefined,
    source: searchParams.get("source") ?? undefined,
    updatedWithinDays: parseNumberParam(searchParams.get("updatedWithinDays")),
    impactLevel: searchParams.get("impact") ?? undefined,
  }));

  useEffect(() => {
    const params: Record<string, string> = {};
    if (selectedSite) params.siteId = selectedSite;
    if (debouncedSearch) params.q = debouncedSearch;
    if (page > 1) params.page = String(page);
    if (filters.domaine) params.domaine = filters.domaine;
    if (filters.sousDomaine) params.sousDomaine = filters.sousDomaine;
    if (filters.applicability) params.applicabilite = filters.applicability;
    if (filters.motif) params.motif = filters.motif;
    if (filters.state) params.etat = filters.state;
    if (filters.proof) params.preuve = filters.proof;
    if (filters.source) params.source = filters.source;
    if (filters.updatedWithinDays) params.updatedWithinDays = String(filters.updatedWithinDays);
    if (filters.impactLevel) params.impact = filters.impactLevel;

    setSearchParams(params, { replace: true });
  }, [debouncedSearch, filters, page, selectedSite, setSearchParams]);

  const { data: sites = [], isLoading: sitesLoading } = useQuery({
    queryKey: ["sites-available"],
    queryFn: fetchSites,
  });

  const { data: domaines = [], isLoading: domainesLoading } = useQuery({
    queryKey: ["domaines"],
    queryFn: fetchDomaines,
  });

  const { data: sousDomaines = [] } = useQuery({
    queryKey: ["sous-domaines", filters.domaine],
    queryFn: () => (filters.domaine ? fetchSousDomainesByDomaine(filters.domaine) : Promise.resolve([])),
    enabled: Boolean(filters.domaine),
  });

  const { data: savedViews = [], isLoading: savedViewsLoading } = useQuery({
    queryKey: ["evaluation-saved-views", selectedSite],
    queryFn: () => evaluationQueries.listSavedViews(selectedSite ?? undefined),
    enabled: Boolean(selectedSite),
  });

  const { data: canBulkEdit = false } = useQuery({
    queryKey: ["evaluation-bulk-permission"],
    queryFn: () => evaluationQueries.hasBulkEditPermission(),
  });

  const evaluationQuery = useQuery({
    queryKey: [
      "evaluation-list",
      selectedSite,
      page,
      debouncedSearch,
      filters,
    ],
    queryFn: () =>
      evaluationQueries.list({
        siteId: selectedSite!,
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch,
        filters: {
          domaineCode: filters.domaine,
          sousDomaineCode: filters.sousDomaine,
          applicability: filters.applicability,
          motif: filters.motif,
          state: filters.state,
          hasProof: filters.proof,
          sourceType: filters.source,
          updatedWithinDays: filters.updatedWithinDays,
          impactLevel: filters.impactLevel,
        },
      }),
    enabled: Boolean(selectedSite),
    keepPreviousData: true,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: Partial<SiteArticleStatusUpdate> }) =>
      evaluationQueries.updateStatus(id, changes),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["evaluation-list"],
      });
      toast({ title: "Décision enregistrée", description: "Le statut de l'article a été mis à jour." });
    },
    onError: (error: Error) => {
      toast({
        title: "Échec de la mise à jour",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: ({ ids, changes }: { ids: string[]; changes: Partial<SiteArticleStatusUpdate> }) =>
      evaluationQueries.bulkUpdate(ids, changes),
    onSuccess: () => {
      setSelectedRows([]);
      queryClient.invalidateQueries({ queryKey: ["evaluation-list"] });
      toast({ title: "Actions en masse appliquées" });
    },
    onError: (error: Error) => {
      toast({
        title: "Impossible d'appliquer les actions en masse",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const uploadProofMutation = useMutation({
    mutationFn: ({ statusId, files }: { statusId: string; files: File[] }) =>
      evaluationQueries.uploadProofFiles(statusId, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluation-list"] });
      toast({ title: "Preuve ajoutée", description: "Les documents ont été téléversés." });
    },
    onError: (error: Error) =>
      toast({
        title: "Échec du téléversement",
        description: error.message,
        variant: "destructive",
      }),
  });

  const addExternalProofMutation = useMutation({
    mutationFn: ({ statusId, url, commentaire }: { statusId: string; url: string; commentaire?: string }) =>
      evaluationQueries.addExternalProof(statusId, url, commentaire),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluation-list"] });
      toast({ title: "Preuve enregistrée" });
    },
    onError: (error: Error) =>
      toast({
        title: "Impossible d'ajouter la preuve",
        description: error.message,
        variant: "destructive",
      }),
  });

  const deleteProofMutation = useMutation({
    mutationFn: (proofId: string) => evaluationQueries.deleteProof(proofId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluation-list"] });
      toast({ title: "Preuve supprimée" });
    },
    onError: (error: Error) =>
      toast({
        title: "Suppression impossible",
        description: error.message,
        variant: "destructive",
      }),
  });

  const createActionMutation = useMutation({
    mutationFn: evaluationQueries.createAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluation-list"] });
      toast({ title: "Plan d'action créé" });
    },
    onError: (error: Error) =>
      toast({
        title: "Impossible de créer le plan d'action",
      description: error.message,
      variant: "destructive",
    }),
  });

  const createSavedViewMutation = useMutation({
    mutationFn: (payload: Database["public"]["Tables"]["site_article_saved_views"]["Insert"]) =>
      evaluationQueries.createSavedView(payload),
    onSuccess: (view) => {
      queryClient.invalidateQueries({ queryKey: ["evaluation-saved-views", selectedSite] });
      setSelectedViewId(view?.id ?? undefined);
      toast({ title: "Vue enregistrée" });
      setSavedViewName("");
      setEditingView(null);
      setIsSaveViewOpen(false);
    },
    onError: (error: Error) =>
      toast({
        title: "Impossible d'enregistrer la vue",
        description: error.message,
        variant: "destructive",
      }),
  });

  const exportCsv = useCallback(async () => {
    if (!selectedSite) return;
    try {
      const rows: EvaluationRecord[] = [];
      // fetch pages until we get all
      let p = 1;
      let total = 0;
      do {
        const res = await evaluationQueries.list({
          siteId: selectedSite,
          page: p,
          pageSize: 200,
          search: debouncedSearch,
          filters: {
            domaineCode: filters.domaine,
            sousDomaineCode: filters.sousDomaine,
            applicability: filters.applicability,
            motif: filters.motif,
            state: filters.state,
            hasProof: filters.proof,
            sourceType: filters.source,
            updatedWithinDays: filters.updatedWithinDays,
            impactLevel: filters.impactLevel,
          },
        });
        rows.push(...res.data);
        total = res.count;
        p += 1;
      } while (rows.length < total && p < 50);

      // build CSV
      const header = ["article_id","numero","titre","reference","domaine","applicabilite","motif","etat","preuves","updated_at","impact_level"];
      const lines = [header.join(",")];
      for (const r of rows) {
        const article = r.article;
        const status = r.status;
        const domaines = (article?.texte?.domaines ?? []).map((d) => d.code).join(";");
        const proofs = (r.proofs ?? []).map((p) => p.resource_url || p.storage_path || p.file_name || p.url).join(";");
        const cols = [
          JSON.stringify(article?.id ?? ""),
          JSON.stringify(article?.numero ?? ""),
          JSON.stringify(article?.titreCourt ?? ""),
          JSON.stringify(article?.reference ?? ""),
          JSON.stringify(domaines),
          JSON.stringify(status?.applicabilite ?? ""),
          JSON.stringify(status?.motif_non_applicable ?? ""),
          JSON.stringify(status?.etat ?? ""),
          JSON.stringify(proofs),
          JSON.stringify(status?.updated_at ?? ""),
          JSON.stringify(status?.impact_level ?? ""),
        ];
        lines.push(cols.join(","));
      }

      const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `veille_evaluation_${selectedSite}_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast({ title: "Export impossible", description: e?.message ?? String(e), variant: "destructive" });
    }
  }, [selectedSite, debouncedSearch, filters, toast]);

  const updateSavedViewMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Database["public"]["Tables"]["site_article_saved_views"]["Update"];
    }) => evaluationQueries.updateSavedView(id, payload),
    onSuccess: (view) => {
      queryClient.invalidateQueries({ queryKey: ["evaluation-saved-views", selectedSite] });
      setSelectedViewId(view?.id ?? undefined);
      toast({ title: "Vue mise à jour" });
      setEditingView(null);
      setIsSaveViewOpen(false);
    },
    onError: (error: Error) =>
      toast({
        title: "Impossible de mettre à jour la vue",
        description: error.message,
        variant: "destructive",
      }),
  });

  const deleteSavedViewMutation = useMutation({
    mutationFn: (id: string) => evaluationQueries.deleteSavedView(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluation-saved-views", selectedSite] });
      toast({ title: "Vue supprimée" });
      if (selectedViewId && viewToDelete && viewToDelete.id === selectedViewId) {
        setSelectedViewId(undefined);
      }
      setViewToDelete(null);
    },
    onError: (error: Error) =>
      toast({
        title: "Impossible de supprimer la vue",
        description: error.message,
        variant: "destructive",
      }),
  });

  const refreshSuggestionMutation = useMutation({
    mutationFn: ({
      statusId,
      payload,
    }: {
      statusId: string;
      payload: Record<string, unknown>;
    }) => evaluationQueries.refreshSuggestions(statusId, payload as Json),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluation-list"] });
    },
    onError: (error: Error) =>
      toast({
        title: "Impossible de mettre à jour la suggestion",
        description: error.message,
        variant: "destructive",
      }),
  });

  const records = evaluationQuery.data?.data ?? [];
  const total = evaluationQuery.data?.count ?? 0;
  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
  const recordsById = useMemo(() => {
    const map = new Map<string, EvaluationRecord>();
    for (const record of records) {
      map.set(record.status.id, record);
    }
    return map;
  }, [records]);
  const currentRecordIndex = useMemo(() => {
    if (!activeRecordId) {
      return -1;
    }
    return records.findIndex((item) => item.status.id === activeRecordId);
  }, [records, activeRecordId]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    if (!drawer.record) {
      return;
    }
    const refreshed = recordsById.get(drawer.record.status.id);
    if (!refreshed) {
      setDrawer({ open: false });
      setActiveRecordId(undefined);
      return;
    }
    if (refreshed !== drawer.record) {
      setDrawer((current) => ({
        ...current,
        record: refreshed,
      }));
    }
  }, [drawer.record, recordsById]);

  useEffect(() => {
    if (drawer.record) {
      setActiveRecordId(drawer.record.status.id);
    } else {
      setActiveRecordId(undefined);
    }
  }, [drawer.record]);

  useEffect(() => {
    setSelectedRows([]);
  }, [filters, debouncedSearch, selectedSite]);

  const onToggleRow = useCallback((id: string, checked: boolean) => {
    setSelectedRows((current) =>
      checked ? [...current, id] : current.filter((rowId) => rowId !== id)
    );
  }, []);

  const onToggleAllRows = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedRows(records.map((record) => record.status.id));
    } else {
      setSelectedRows([]);
    }
  }, [records]);

  const handleApplicabilityChange = useCallback(
    async (record: EvaluationRecord, value: RegulatoryApplicability) => {
      const changes: Partial<SiteArticleStatusUpdate> = { applicabilite: value };
      if (value === "APPLICABLE") {
        changes.motif_non_applicable = null;
        changes.motif_commentaire = null;
      }
      await updateStatusMutation.mutateAsync({
        id: record.status.id,
        changes,
      });
    },
    [updateStatusMutation]
  );

  const handleMotifChange = useCallback(
    async (
      record: EvaluationRecord,
      payload: { motif?: NonApplicableReason; comment?: string | null }
    ) => {
      const changes: Partial<SiteArticleStatusUpdate> = {
        motif_non_applicable: payload.motif ?? null,
      };

      if (typeof payload.comment !== "undefined") {
        const trimmed = payload.comment ? payload.comment.trim() : "";
        changes.motif_commentaire = trimmed.length > 0 ? trimmed : null;
      } else if (payload.motif !== "AUTRE") {
        changes.motif_commentaire = null;
      }

      await updateStatusMutation.mutateAsync({
        id: record.status.id,
        changes,
      });
    },
    [updateStatusMutation]
  );

  const handleStateChange = useCallback(
    async (record: EvaluationRecord, value: ConformityState) => {
      await updateStatusMutation.mutateAsync({
        id: record.status.id,
        changes: { etat: value },
      });
    },
    [updateStatusMutation]
  );

  const handleSaveComment = useCallback(
    async (record: EvaluationRecord, comment: string) => {
      await updateStatusMutation.mutateAsync({
        id: record.status.id,
        changes: { commentaire: comment },
      });
    },
    [updateStatusMutation]
  );

  const applyLocalSuggestionStatus = useCallback(
    (statusId: string, payload: Record<string, unknown>) => {
      setDrawer((current) => {
        if (!current.record || current.record.status.id !== statusId) {
          return current;
        }
        return {
          ...current,
          record: {
            ...current.record,
            status: {
              ...current.record.status,
              suggestion_payload: payload as Json,
            },
          },
        };
      });
    },
    []
  );

  const handleApplySuggestion = useCallback(
    async (record: EvaluationRecord, kind: SuggestionKind) => {
      const suggestions = parseSuggestionPayload(record.status.suggestion_payload);
      const suggestion = suggestions[kind];
      if (!suggestion || suggestion.status === "applied") {
        return;
      }

      try {
        if (kind === "applicability") {
          const changes: Partial<SiteArticleStatusUpdate> = {
            applicabilite: suggestion.value,
          };

          if (suggestion.value === "NON_APPLICABLE") {
            const motif = suggestion.motif ?? record.status.motif_non_applicable ?? null;
            if (!motif) {
              toast({
                title: "Suggestion incomplète",
                description: "La proposition d'applicabilité nécessite un motif pour être appliquée.",
                variant: "destructive",
              });
              return;
            }
            changes.motif_non_applicable = motif;

            const commentSource =
              suggestion.commentaire ?? record.status.motif_commentaire ?? "";
            const trimmedComment = commentSource?.trim?.() ?? "";
            if (motif === "AUTRE" && trimmedComment.length === 0) {
              toast({
                title: "Commentaire requis",
                description:
                  "Le motif « Autre » nécessite un commentaire pour être appliqué.",
                variant: "destructive",
              });
              return;
            }
            changes.motif_commentaire = trimmedComment.length > 0 ? trimmedComment : null;
          } else {
            changes.motif_non_applicable = null;
            changes.motif_commentaire = null;
          }

          await updateStatusMutation.mutateAsync({
            id: record.status.id,
            changes,
          });
        } else if (kind === "state") {
          await updateStatusMutation.mutateAsync({
            id: record.status.id,
            changes: {
              etat: suggestion.value,
            },
          });
        }

        const updatedPayload = markSuggestionStatus(record.status, kind, "applied");
        if (updatedPayload) {
          applyLocalSuggestionStatus(record.status.id, updatedPayload);
          await refreshSuggestionMutation.mutateAsync({
            statusId: record.status.id,
            payload: updatedPayload,
          });
        }
      } catch (error) {
        // Erreurs déjà gérées dans les mutations associées
      }
    },
    [applyLocalSuggestionStatus, refreshSuggestionMutation, toast, updateStatusMutation]
  );

  const handleIgnoreSuggestion = useCallback(
    async (record: EvaluationRecord, kind: SuggestionKind) => {
      const updatedPayload = markSuggestionStatus(record.status, kind, "ignored");
      if (!updatedPayload) {
        return;
      }
      try {
        applyLocalSuggestionStatus(record.status.id, updatedPayload);
        await refreshSuggestionMutation.mutateAsync({
          statusId: record.status.id,
          payload: updatedPayload,
        });
        toast({ title: "Suggestion ignorée" });
      } catch (error) {
        // handled by mutation error toast
      }
    },
    [applyLocalSuggestionStatus, refreshSuggestionMutation, toast]
  );

  const bulkMarkApplicable = (value: RegulatoryApplicability) =>
    bulkUpdateMutation.mutate({ ids: selectedRows, changes: { applicabilite: value } });

  const bulkSetState = (value: ConformityState) =>
    bulkUpdateMutation.mutate({ ids: selectedRows, changes: { etat: value } });

  const allowBulkActions = selectedRows.length > 0 && !bulkUpdateMutation.isPending && Boolean(canBulkEdit);

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const currentSite = sites.find((site) => site.id === selectedSite);

  const handleUploadProof = (statusId: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const filesArray = Array.from(files);
    uploadProofMutation.mutate({ statusId, files: filesArray });
    event.target.value = "";
  };

  const handleCreateAction = async (
    record: EvaluationRecord,
    payload: {
      titre: string;
      description?: string;
      responsableId?: string;
      responsableNom?: string;
      echeance?: string;
      priorite?: Database["public"]["Enums"]["priorite"];
    }
  ) => {
    await createActionMutation.mutateAsync({
      statusId: record.status.id,
      titre: payload.titre,
      description: payload.description,
      responsableId: payload.responsableId,
      responsableNom: payload.responsableNom,
      echeance: payload.echeance,
      priorite: payload.priorite,
    });
  };

  const savedViewsList = savedViews ?? [];

  const handleApplySavedView = (viewId: string) => {
    const view = savedViewsList.find((item) => item.id === viewId);
    if (!view) {
      return;
    }

    setSelectedViewId(viewId);
    setEditingView(null);
    setSavedViewName("");

    const payload = (view.filters ?? {}) as { filters?: FilterState; search?: string };
    if (payload.filters) {
      setFilters({
        ...DEFAULT_FILTERS,
        ...payload.filters,
      });
    } else {
      setFilters(DEFAULT_FILTERS);
    }

    if (typeof payload.search === "string") {
      setSearchTerm(payload.search);
    } else {
      setSearchTerm("");
    }

    setPage(1);
    setDrawer({ open: false });
  };

  const handleSaveCurrentView = () => {
    if (!selectedSite) {
      toast({
        title: "Sélectionnez un site",
        description: "Choisissez un site avant d'enregistrer une vue.",
        variant: "destructive",
      });
      return;
    }
    if (!user?.id) {
      toast({
        title: "Session requise",
        description: "Vous devez être connecté pour enregistrer une vue personnalisée.",
        variant: "destructive",
      });
      return;
    }

    const trimmedName = savedViewName.trim();
    if (trimmedName.length === 0) {
      return;
    }

    const filtersPayload = JSON.parse(
      JSON.stringify({
        filters,
        search: debouncedSearch,
      })
    ) as Json;

    if (editingView) {
      updateSavedViewMutation.mutate({
        id: editingView.id,
        payload: {
          name: trimmedName,
          filters: filtersPayload,
          site_id: selectedSite,
          owner_id: editingView.owner_id ?? user.id,
          scope: editingView.scope,
        },
      });
    } else {
      createSavedViewMutation.mutate({
        name: trimmedName,
        site_id: selectedSite,
        owner_id: user.id,
        scope: "user",
        filters: filtersPayload,
        is_default: false,
      });
    }
  };

  const openCreateViewDialog = () => {
    setEditingView(null);
    setSavedViewName("");
    setIsSaveViewOpen(true);
  };

  const openEditViewDialog = (view: SavedViewRow) => {
    setEditingView(view);
    setSavedViewName(view.name);
    setIsSaveViewOpen(true);
  };

  const confirmDeleteView = () => {
    if (!viewToDelete) {
      return;
    }
    deleteSavedViewMutation.mutate(viewToDelete.id);
  };

  useEffect(() => {
    if (!drawer.open || !drawer.record) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName;
        if (["INPUT", "TEXTAREA", "SELECT"].includes(tagName)) {
          return;
        }
        if (tagName === "BUTTON" && (target as HTMLButtonElement).type !== "button") {
          return;
        }
      }

      const key = event.key.toLowerCase();
      if (key === "j" || key === "arrowdown") {
        event.preventDefault();
        const nextIndex =
          currentRecordIndex >= 0 ? Math.min(currentRecordIndex + 1, records.length - 1) : 0;
        if (records[nextIndex]) {
          setDrawer({ open: true, record: records[nextIndex] });
        }
      } else if (key === "k" || key === "arrowup") {
        event.preventDefault();
        const previousIndex =
          currentRecordIndex >= 0
            ? Math.max(currentRecordIndex - 1, 0)
            : Math.max(records.length - 1, 0);
        if (records[previousIndex]) {
          setDrawer({ open: true, record: records[previousIndex] });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentRecordIndex, drawer.open, drawer.record, records]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/veille">Veille réglementaire</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Évaluation de la conformité</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">Évaluation de la conformité</h1>
          <p className="mt-1 text-muted-foreground">
            Affectez l'applicabilité des articles et pilotez la conformité de vos sites avec preuves à l'appui.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select
            value={selectedSite ?? ""}
            onValueChange={(value) => {
              const next = value === "" ? undefined : value;
              setSelectedSite(next);
              setPage(1);
              setSelectedViewId(undefined);
            }}
            disabled={sitesLoading || sites.length === 0}
          >
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Sélectionner un site" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tous les sites</SelectItem>
              {sites.map((site) => (
                <SelectItem key={site.id} value={site.id}>
                  {site.nom_site}
                  {site.clients?.nom_legal ? ` · ${site.clients.nom_legal}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Rechercher par référence, mot-clé, domaine..."
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setPage(1);
            }}
            className="w-full sm:w-[320px]"
            aria-label="Rechercher un article"
          />
        </div>
        {selectedSite && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select
              value={selectedViewId ?? ""}
              onValueChange={(value) => {
                if (value === "") {
                  setSelectedViewId(undefined);
                  return;
                }
                handleApplySavedView(value);
              }}
              disabled={savedViewsLoading || savedViewsList.length === 0}
            >
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Vues enregistrees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Pas de vue</SelectItem>
                {savedViewsList.map((view) => (
                  <SelectItem key={view.id} value={view.id}>
                    {view.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={isSaveViewOpen} onOpenChange={setIsSaveViewOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Enregistrer la vue
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Enregistrer cette vue</DialogTitle>
                  <DialogDescription>
                    Stockez la combinaison actuelle de filtres pour la reutiliser plus tard.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="saved-view-name">Nom de la vue</Label>
                    <Input
                      id="saved-view-name"
                      value={savedViewName}
                      onChange={(event) => setSavedViewName(event.target.value)}
                      placeholder="Ex: Articles critiques avec preuves manquantes"
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="ghost" onClick={() => setIsSaveViewOpen(false)}>
                    Annuler
                  </Button>
                  <Button
                    onClick={handleSaveCurrentView}
                    disabled={
                      createSavedViewMutation.isLoading || savedViewName.trim().length === 0
                    }
                  >
                    {createSavedViewMutation.isLoading ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-xl">Filtres</CardTitle>
            <CardDescription>
              Affinez la liste par domaine, statut, présence de preuves ou période de mise à jour.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="font-medium">
                {activeFiltersCount} filtre{activeFiltersCount > 1 ? "s" : ""} actif
                {activeFiltersCount > 1 ? "s" : ""}
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters} disabled={activeFiltersCount === 0}>
              Réinitialiser
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Select
              value={filters.domaine ?? ""}
              onValueChange={(value) => {
                setFilters((current) => ({
                  ...current,
                  domaine: value || undefined,
                  sousDomaine: undefined,
                }));
                setPage(1);
              }}
              disabled={domainesLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Domaine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les domaines</SelectItem>
                {domaines.map((domaine) => (
                  <SelectItem key={domaine.id} value={domaine.id}>
                    {domaine.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.sousDomaine ?? ""}
              onValueChange={(value) => {
                setFilters((current) => ({
                  ...current,
                  sousDomaine: value || undefined,
                }));
                setPage(1);
              }}
              disabled={!filters.domaine || sousDomaines.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sous-domaine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les sous-domaines</SelectItem>
                {sousDomaines.map((sousDomaine) => (
                  <SelectItem key={sousDomaine.id} value={sousDomaine.id}>
                    {sousDomaine.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.applicability ?? ""}
              onValueChange={(value) => {
                setFilters((current) => ({
                  ...current,
                  applicability: (value || undefined) as RegulatoryApplicability | undefined,
                }));
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Applicabilité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes</SelectItem>
                {APPLICABILITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.state ?? ""}
              onValueChange={(value) => {
                setFilters((current) => ({
                  ...current,
                  state: (value || undefined) as ConformityState | undefined,
                }));
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="État de conformité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les états</SelectItem>
                {STATE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Accordion type="multiple" className="w-full">
            <AccordionItem value="advanced">
              <AccordionTrigger className="text-sm font-medium">
                <Filter className="mr-2 h-4 w-4" />
                Filtres avancés
              </AccordionTrigger>
              <AccordionContent>
                <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Select
                    value={filters.motif ?? ""}
                    onValueChange={(value) => {
                      setFilters((current) => ({
                        ...current,
                        motif: (value || undefined) as NonApplicableReason | undefined,
                      }));
                      setPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Motif (Non applicable)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tous les motifs</SelectItem>
                      {MOTIF_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.proof ?? ""}
                    onValueChange={(value) => {
                      setFilters((current) => ({
                        ...current,
                        proof: (value || undefined) as "with" | "without" | undefined,
                      }));
                      setPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Présence de preuve" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Toutes</SelectItem>
                      {PROOF_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.source ?? ""}
                    onValueChange={(value) => {
                      setFilters((current) => ({
                        ...current,
                        source: value || undefined,
                      }));
                      setPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Source du texte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Toutes les sources</SelectItem>
                      <SelectItem value="LOI">Loi</SelectItem>
                      <SelectItem value="DECRET">Décret</SelectItem>
                      <SelectItem value="ARRETE">Arrêté</SelectItem>
                      <SelectItem value="CIRCULAIRE">Circulaire</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.updatedWithinDays ? String(filters.updatedWithinDays) : ""}
                    onValueChange={(value) => {
                      setFilters((current) => ({
                        ...current,
                        updatedWithinDays: value ? Number(value) : undefined,
                      }));
                      setPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Mise à jour" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Toute période</SelectItem>
                      {UPDATED_WITHIN_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={String(option.value)}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {!selectedSite ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Sélectionnez un site pour démarrer</CardTitle>
            <CardDescription>
              Choisissez un site pour obtenir la liste des articles applicables et les évaluer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Les filtres, vues enregistrées et actions de conformité seront disponibles dès qu'un site aura été
              sélectionné.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-col gap-2 space-y-0 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-xl">
                Articles applicables — {currentSite?.nom_site ?? "Site sélectionné"}
              </CardTitle>
              <CardDescription>
                {total} article{total > 1 ? "s" : ""} trouvé{total > 1 ? "s" : ""} · page {page} sur {totalPages}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!allowBulkActions}
                onClick={() => bulkMarkApplicable("APPLICABLE")}
              >
                Marquer Applicable
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!allowBulkActions}
                onClick={() => bulkMarkApplicable("NON_APPLICABLE")}
              >
                Marquer Non applicable
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!allowBulkActions}
                onClick={() => bulkSetState("Conforme")}
              >
                Marquer Conforme
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!allowBulkActions}
                onClick={() => bulkSetState("Non_conforme")}
              >
                Marquer Non conforme
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!allowBulkActions}
                onClick={() => bulkSetState("Non_evalue")}
              >
                Réinitialiser évaluation
              </Button>
              <Button variant="outline" size="sm" onClick={exportCsv}>
                <Download className="h-4 w-4 mr-2" />
                Exporter CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">
                      <Checkbox
                        checked={selectedRows.length === records.length && records.length > 0}
                        onCheckedChange={(checked) => onToggleAllRows(Boolean(checked))}
                        aria-label="Sélectionner toutes les lignes"
                      />
                    </TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead>Domaine</TableHead>
                    <TableHead>Applicabilité</TableHead>
                    <TableHead>Motif</TableHead>
                    <TableHead>État</TableHead>
                    <TableHead>Preuves</TableHead>
                    <TableHead>Dernière mise à jour</TableHead>
                    <TableHead>Impact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evaluationQuery.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                        Chargement des articles...
                      </TableCell>
                    </TableRow>
                  ) : records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                        Aucun article ne correspond à la recherche actuelle.
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.map((record) => {
                      const status = record.status;
                      const domaineBadges =
                        record.article?.texte?.domaines?.map((domaine) => (
                          <Badge key={domaine.id} variant="secondary" className="mr-1">
                            {domaine.code}
                          </Badge>
                        )) ?? [];

                      return (
                        <TableRow
                          key={status.id}
                          className="cursor-pointer hover:bg-muted/40"
                          onClick={() => setDrawer({ open: true, record })}
                        >
                          <TableCell onClick={(event) => event.stopPropagation()}>
                            <Checkbox
                              checked={selectedRows.includes(status.id)}
                              onCheckedChange={(checked) => onToggleRow(status.id, Boolean(checked))}
                              aria-label="Sélectionner la ligne"
                            />
                          </TableCell>
                          <TableCell className="max-w-[260px]">
                            <div className="font-medium text-foreground">
                              {describeArticle(record.article)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {record.article?.texte?.titre ?? "Référence réglementaire non renseignée"}
                            </div>
                          </TableCell>
                          <TableCell>
                            {domaineBadges.length > 0 ? domaineBadges : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell>{getApplicabilityBadge(status.applicabilite)}</TableCell>
                          <TableCell>
                            {status.motif_non_applicable
                              ? MOTIF_OPTIONS.find((m) => m.value === status.motif_non_applicable)?.label ?? "—"
                              : "—"}
                          </TableCell>
                          <TableCell>{getStateBadge(status.etat)}</TableCell>
                          <TableCell>
                            {status.preuve_urls?.length ? (
                              <Badge variant="outline" className="font-medium">
                                {status.preuve_urls.length} preuve{status.preuve_urls.length > 1 ? "s" : ""}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Aucune</Badge>
                            )}
                          </TableCell>
                          <TableCell>{formatDate(status.updated_at)}</TableCell>
                          <TableCell>{status.impact_level ?? "—"}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div className="text-sm text-muted-foreground">
                {selectedRows.length} sélectionné{selectedRows.length > 1 ? "s" : ""} / {total} article
                {total > 1 ? "s" : ""}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(current - 1, 1))}
                >
                  Page précédente
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                >
                  Page suivante
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <EvaluationDrawer
        open={drawer.open}
        onOpenChange={(open) => setDrawer((current) => ({ ...current, open }))}
        record={drawer.record}
        onApplicabilityChange={handleApplicabilityChange}
        onMotifChange={handleMotifChange}
        onStateChange={handleStateChange}
        onSaveComment={handleSaveComment}
        onUploadProof={handleUploadProof}
        onAddExternalProof={(statusId, url, commentaire) =>
          addExternalProofMutation.mutate({ statusId, url, commentaire })
        }
        onDeleteProof={(proofId) => deleteProofMutation.mutate(proofId)}
        onCreateAction={handleCreateAction}
      />
    </div>
  );
}

interface DrawerProps {
  open: boolean;
  record?: EvaluationRecord;
  onOpenChange: (open: boolean) => void;
  onApplicabilityChange: (record: EvaluationRecord, value: RegulatoryApplicability) => void;
  onMotifChange: (
    record: EvaluationRecord,
    payload: { motif?: NonApplicableReason; comment?: string | null }
  ) => void;
  onStateChange: (record: EvaluationRecord, value: ConformityState) => void;
  onSaveComment: (record: EvaluationRecord, comment: string) => void;
  onApplySuggestion: (record: EvaluationRecord, kind: SuggestionKind) => void;
  onIgnoreSuggestion: (record: EvaluationRecord, kind: SuggestionKind) => void;
  suggestions?: SuggestionPayload;
  onUploadProof: (statusId: string) => (event: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenProof: (proof: SiteArticleProofRow) => void;
  onAddExternalProof: (statusId: string, url: string, commentaire?: string) => void;
  onDeleteProof: (proofId: string) => void;
  onCreateAction: (
    record: EvaluationRecord,
    payload: {
      titre: string;
      description?: string;
      responsableId?: string;
      responsableNom?: string;
      echeance?: string;
      priorite?: Database["public"]["Enums"]["priorite"];
    }
  ) => void;
  isCreatingAction: boolean;
  isUploadingProof: boolean;
}

function EvaluationDrawer({
  open,
  record,
  onOpenChange,
  onApplicabilityChange,
  onMotifChange,
  onStateChange,
  onSaveComment,
  onApplySuggestion,
  onIgnoreSuggestion,
  suggestions,
  onUploadProof,
  onOpenProof,
  onDeleteProof,
  onCreateAction,
  onAddExternalProof,
  isCreatingAction,
  isUploadingProof,
}: DrawerProps) {
  const [commentDraft, setCommentDraft] = useState("");
  const [motifCommentDraft, setMotifCommentDraft] = useState("");
  const [externalProofUrl, setExternalProofUrl] = useState("");
  const [externalProofComment, setExternalProofComment] = useState("");
  const [actionTitre, setActionTitre] = useState("");
  const [actionDescription, setActionDescription] = useState("");
  const [actionResponsable, setActionResponsable] = useState("");
  const [actionEcheance, setActionEcheance] = useState("");
  const [actionPriorite, setActionPriorite] = useState<Database["public"]["Enums"]["priorite"] | undefined>();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (record) {
      setCommentDraft(record.status.commentaire ?? "");
      setMotifCommentDraft(record.status.motif_commentaire ?? "");
    } else {
      setCommentDraft("");
      setMotifCommentDraft("");
      setExternalProofUrl("");
      setExternalProofComment("");
      setActionTitre("");
      setActionDescription("");
      setActionResponsable("");
      setActionEcheance("");
      setActionPriorite(undefined);
    }
  }, [record]);

  // autosave drafts (debounced)
  const debouncedComment = useDebouncedValue(commentDraft, 800);
  const debouncedMotifComment = useDebouncedValue(motifCommentDraft, 800);

  useEffect(() => {
    if (!record) return;
    const current = record.status.commentaire ?? "";
    if (debouncedComment !== current) {
      onSaveComment(record, debouncedComment);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedComment]);

  useEffect(() => {
    if (!record) return;
    const current = record.status.motif_commentaire ?? "";
    if (debouncedMotifComment !== current) {
      onMotifChange(record, { motif: record.status.motif_non_applicable ?? undefined, comment: debouncedMotifComment });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedMotifComment]);

  const handleSaveCommentClick = () => {
    if (record) {
      onSaveComment(record, commentDraft.trim());
    }
  };

  const handleSaveMotifComment = () => {
    if (!record) return;
    onMotifChange(record, {
      motif: record.status.motif_non_applicable ?? undefined,
      comment: motifCommentDraft,
    });
  };

const handleAddExternalProofClick = () => {
    if (!record) return;
    const url = externalProofUrl.trim();
    if (url.length === 0) return;
    onAddExternalProof(record.status.id, url, externalProofComment.trim() || undefined);
    setExternalProofUrl("");
    setExternalProofComment("");
  };

  useEffect(() => {
    if (!open || !record) {
      return;
    }

    const handler = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === "a") {
        event.preventDefault();
        onApplicabilityChange(record, "APPLICABLE");
      } else if (key === "e") {
        event.preventDefault();
        onApplicabilityChange(record, "NON_APPLICABLE");
      } else if (key === "c") {
        event.preventDefault();
        onStateChange(record, "Conforme");
      } else if (key === "n") {
        event.preventDefault();
        onStateChange(record, "Non_conforme");
      } else if (key === "u") {
        event.preventDefault();
        fileInputRef.current?.click();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, record, onApplicabilityChange, onStateChange]);

  const handleCreateActionClick = () => {
    if (!record || actionTitre.trim().length === 0 || isCreatingAction) return;
    onCreateAction(record, {
      titre: actionTitre.trim(),
      description: actionDescription.trim() || undefined,
      responsableNom: actionResponsable.trim() || undefined,
      echeance: actionEcheance || undefined,
      priorite: actionPriorite,
    });
    setActionTitre("");
    setActionDescription("");
    setActionResponsable("");
    setActionEcheance("");
    setActionPriorite(undefined);
  };

  const status = record?.status;
  const article = record?.article;
  const applicabilitySuggestion = suggestions?.applicability;
  const stateSuggestion = suggestions?.state;
  const motifRequiresComment = status?.motif_non_applicable === "AUTRE";
  const motifLabel =
    status?.motif_non_applicable &&
    MOTIF_OPTIONS.find((option) => option.value === status.motif_non_applicable)?.label;
  const proofs = record?.proofs ?? [];
  const actions = record?.actions ?? [];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] overflow-y-auto">
        <DrawerHeader>
          <DrawerTitle>{describeArticle(article ?? null)}</DrawerTitle>
          <DrawerDescription>
            Gérez l'applicabilité, l'évaluation de conformité et les preuves rattachées à cet article.
          </DrawerDescription>
        </DrawerHeader>

        {record ? (
          <div className="space-y-8 px-6 pb-8">
            {(applicabilitySuggestion || stateSuggestion) && (
              <section className="space-y-3">
                {[{ kind: "applicability" as const, suggestion: applicabilitySuggestion }, { kind: "state" as const, suggestion: stateSuggestion }]
                  .filter((entry) => entry.suggestion)
                  .map((entry) => {
                    const suggestion = entry.suggestion!;
                    const title =
                      entry.kind === "applicability"
                        ? (() => {
                            const base =
                              suggestion.label ??
                              (suggestion.value === "NON_APPLICABLE"
                                ? "Probablement non applicable"
                                : "Probablement applicable");
                            const motif =
                              (suggestion as ApplicabilitySuggestion).motif &&
                              MOTIF_OPTIONS.find(
                                (option) => option.value === (suggestion as ApplicabilitySuggestion).motif
                              )?.label;
                            return motif ? `${base} — ${motif}` : base;
                          })()
                        : suggestion.label ??
                          (suggestion.value === "Non_conforme"
                            ? "Probablement non conforme"
                            : suggestion.value === "Non_evalue"
                              ? "À réévaluer"
                              : "Probablement conforme");
                    const updatedStamp = suggestion.updatedAt
                      ? formatDistanceToNowStrict(new Date(suggestion.updatedAt), { locale: fr })
                      : null;
                    return (
                      <div key={entry.kind} className="rounded-lg border border-dashed bg-muted/40 p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-2">
                            <Badge variant="outline" className="w-fit gap-1">
                              <Sparkles className="h-3.5 w-3.5" />
                              Suggestion
                            </Badge>
                            <p className="font-medium leading-5">{title}</p>
                            {"reason" in suggestion && suggestion.reason && (
                              <p className="text-sm text-muted-foreground">{suggestion.reason}</p>
                            )}
                            {"sources" in suggestion &&
                              suggestion.sources &&
                              suggestion.sources.length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  Sources : {suggestion.sources.join(", ")}
                                </p>
                              )}
                          </div>
                          <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
                            {suggestion.status && suggestion.status !== "pending" && (
                              <Badge variant={suggestion.status === "applied" ? "secondary" : "outline"}>
                                {suggestion.status === "applied" ? "Appliquée" : "Ignorée"}
                                {updatedStamp ? " · " + updatedStamp : ""}
                              </Badge>
                            )}
                            {(!suggestion.status || suggestion.status === "pending") && (
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => onApplySuggestion(record, entry.kind)}>
                                  Appliquer
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => onIgnoreSuggestion(record, entry.kind)}
                                >
                                  Ignorer
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </section>
            )}
            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground">Informations générales</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {article?.texte?.titre ?? "Référence réglementaire indisponible"}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <span>
                    Source :{" "}
                    <strong>{article?.texte?.type ?? record.article?.texte?.type ?? "N/A"}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" />
                    {article?.texte?.domaines?.map((domaine) => domaine.code).join(", ") || "—"}
                  </span>
                  <span>Dernière mise à jour : {formatDate(status?.updated_at)}</span>
                </div>
              </div>

              <Separator />

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2 rounded-lg border p-4">
                  <Label className="text-sm font-semibold">Applicabilité</Label>
                  <div className="flex gap-2">
                    {APPLICABILITY_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        type="button"
                        variant={status?.applicabilite === option.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => onApplicabilityChange(record, option.value)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                  {status?.applicabilite === "NON_APPLICABLE" && (
                    <Select
                      value={status.motif_non_applicable ?? ""}
                      onValueChange={(value) =>
                        onMotifChange(record, (value || undefined) as NonApplicableReason | undefined)
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Motif de non-applicabilité" />
                      </SelectTrigger>
                      <SelectContent>
                        {MOTIF_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2 rounded-lg border p-4">
                  <Label className="text-sm font-semibold">État de conformité</Label>
                  <div className="flex flex-wrap gap-2">
                    {STATE_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        type="button"
                        variant={status?.etat === option.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => onStateChange(record, option.value)}
                        disabled={status?.applicabilite === "NON_APPLICABLE"}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <Label className="text-sm font-semibold">Commentaire</Label>
              <Textarea
                value={commentDraft}
                onChange={(event) => setCommentDraft(event.target.value)}
                placeholder="Ajoutez des précisions sur l'évaluation ou les actions à entreprendre..."
                rows={4}
              />
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={handleSaveCommentClick}>
                  Enregistrer le commentaire
                </Button>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground">Preuves & pièces jointes</h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <label className="flex cursor-pointer items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Ajouter une preuve
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={onUploadProof(record.status.id)}
                      />
                    </label>
                  </Button>
                </div>
              </div>

              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:gap-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="external-proof-url">Lien externe</Label>
                    <Input
                      id="external-proof-url"
                      placeholder="https://exemple.com/preuve.pdf"
                      value={externalProofUrl}
                      onChange={(event) => setExternalProofUrl(event.target.value)}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="external-proof-comment">Commentaire</Label>
                    <Input
                      id="external-proof-comment"
                      placeholder="Description de la preuve"
                      value={externalProofComment}
                      onChange={(event) => setExternalProofComment(event.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!externalProofUrl.trim()) return;
                      onAddExternalProof(record.status.id, externalProofUrl.trim(), externalProofComment.trim() || undefined);
                      setExternalProofUrl("");
                      setExternalProofComment("");
                    }}
                  >
                    Ajouter le lien
                  </Button>
                </div>

                <div className="space-y-2">
                  {record.status.preuves_metadata && record.status.preuves_metadata.length > 0 ? (
                    record.status.preuves_metadata.map((proof: any) => (
                      <div
                        key={proof.id}
                        className="flex items-center justify-between rounded border bg-muted/40 px-3 py-2 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          {proof.type === ProofType.File ? <Upload className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
                          <div className="flex flex-col">
                            <span className="font-medium">{proof.fileName ?? proof.url}</span>
                            {proof.commentaire && (
                              <span className="text-xs text-muted-foreground">{proof.commentaire}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {proof.type === ProofType.File && proof.storage_path ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={async () => {
                                const signedUrl = await evaluationQueries.getSignedProofUrl(proof.storage_path);
                                if (signedUrl) {
                                  window.open(signedUrl, "_blank");
                                }
                              }}
                            >
                              <LinkIcon className="h-4 w-4" />
                            </Button>
                          ) : proof.url ? (
                            <Button variant="ghost" size="icon" onClick={() => window.open(proof.url, "_blank")}>
                              <LinkIcon className="h-4 w-4" />
                            </Button>
                          ) : null}
                          <Button variant="ghost" size="sm" onClick={() => onDeleteProof(proof.id)}>
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucune preuve enregistrée pour cet article.</p>
                  )}
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground">Plan d'action</h3>
                {record.status.etat === "Non_conforme" ? (
                  <Badge variant="destructive">Non conformité détectée</Badge>
                ) : (
                  <Badge variant="secondary">Aucune non conformité</Badge>
                )}
              </div>

              {record.status.etat === "Non_conforme" ? (
                <div className="space-y-3 rounded-lg border p-4">
                  <Input
                    placeholder="Titre de l'action"
                    value={actionTitre}
                    onChange={(event) => setActionTitre(event.target.value)}
                  />
                  <Textarea
                    placeholder="Description détaillée"
                    value={actionDescription}
                    onChange={(event) => setActionDescription(event.target.value)}
                    rows={3}
                  />
                  <div className="grid gap-3 md:grid-cols-3">
                    <Input
                      placeholder="Responsable"
                      value={actionResponsable}
                      onChange={(event) => setActionResponsable(event.target.value)}
                    />
                    <Input
                      type="date"
                      placeholder="Échéance"
                      value={actionEcheance}
                      onChange={(event) => setActionEcheance(event.target.value)}
                    />
                    <Select
                      value={actionPriorite ?? ""}
                      onValueChange={(value) =>
                        setActionPriorite((value || undefined) as Database["public"]["Enums"]["priorite"] | undefined)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Priorité" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Basse">Basse</SelectItem>
                        <SelectItem value="Moyenne">Moyenne</SelectItem>
                        <SelectItem value="Haute">Haute</SelectItem>
                        <SelectItem value="Critique">Critique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleCreateActionClick}>Créer le plan d'action</Button>
                  </div>

                  {record.actions.length > 0 && (
                    <div className="space-y-2">
                      {record.actions.map((action) => (
                        <div key={action.id} className="rounded border bg-muted/30 p-3 text-sm">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">{action.titre}</h4>
                            <Badge variant="outline">{action.priorite ?? "Moyenne"}</Badge>
                          </div>
                          {action.description && (
                            <p className="mt-2 text-muted-foreground">{action.description}</p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                            {action.responsable_nom && <span>Responsable : {action.responsable_nom}</span>}
                            {action.echeance && <span>Échéance : {formatDate(action.echeance)}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Aucun plan d'action n'est requis tant que l'article est conforme.
                </p>
              )}
            </section>
          </div>
        ) : (
          <div className="px-6 pb-8">
            <p className="text-sm text-muted-foreground">Sélectionnez un article pour consulter ses détails.</p>
          </div>
        )}

        <DrawerFooter className="border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}






import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, AlertCircle, CheckCircle, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { fetchEquipementsInventory, deleteEquipementInventory, fetchEquipements, fetchEquipementStats, deleteEquipement, fetchTypesEquipement } from "@/lib/controles-queries";
import { fetchSites } from "@/lib/multi-tenant-queries";
import EquipementFormModal from "@/components/EquipementFormModal";
import ControleHistoryModal from "@/components/ControleHistoryModal";
import EPITable from "@/components/epi/EPITable";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const STATUT_CONFORMITE_LABELS = {
  conforme: { label: "Conforme", color: "bg-green-500", icon: CheckCircle },
  non_conforme: { label: "Non conforme", color: "bg-red-500", icon: AlertCircle },
  a_controler: { label: "À contrôler", color: "bg-yellow-500", icon: Clock },
};

export default function ControlesTechniques() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("equipements");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSite, setFilterSite] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatut, setFilterStatut] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedEquipement, setSelectedEquipement] = useState<any>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [equipementToDelete, setEquipementToDelete] = useState<string | null>(null);

  const { data: equipementsInventory, isLoading: isLoadingInventory } = useQuery({
    queryKey: ["equipements_inventory"],
    queryFn: fetchEquipementsInventory,
  });

  const { data: equipements, isLoading } = useQuery({
    queryKey: ["equipements_controle"],
    queryFn: fetchEquipements,
  });

  const { data: stats } = useQuery({
    queryKey: ["equipement_stats"],
    queryFn: fetchEquipementStats,
  });

  const { data: sites } = useQuery({
    queryKey: ["sites"],
    queryFn: fetchSites,
  });

  const { data: types } = useQuery({
    queryKey: ["types_equipement"],
    queryFn: fetchTypesEquipement,
  });

  const deleteInventoryMutation = useMutation({
    mutationFn: deleteEquipementInventory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipements_inventory"] });
      toast({ title: "Équipement supprimé avec succès" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEquipement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipements_controle"] });
      queryClient.invalidateQueries({ queryKey: ["equipement_stats"] });
      toast({ title: "Équipement supprimé avec succès" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const getUrgencyBadge = (prochaine_echeance: string | null) => {
    if (!prochaine_echeance) return null;
    const daysUntil = differenceInDays(new Date(prochaine_echeance), new Date());
    if (daysUntil < 0) return <Badge variant="destructive">Retard: {Math.abs(daysUntil)}j</Badge>;
    if (daysUntil <= 30) return <Badge className="bg-orange-500">Dans {daysUntil}j</Badge>;
    return null;
  };

  const filteredEquipementsInventory = equipementsInventory?.filter((eq) => {
    const matchesSearch = eq.nom.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSite = filterSite === "all" || eq.site_id === filterSite;
    const matchesType = filterType === "all" || eq.type_equipement === filterType;
    return matchesSearch && matchesSite && matchesType;
  });

  const filteredEquipements = equipements?.filter((eq) => {
    const matchesSearch = eq.code_identification.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSite = filterSite === "all" || eq.site_id === filterSite;
    const matchesType = filterType === "all" || eq.type_equipement_id === filterType;
    const matchesStatut = filterStatut === "all" || eq.statut_conformite === filterStatut;
    return matchesSearch && matchesSite && matchesType && matchesStatut;
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Équipements & EPI</h1>
          <p className="text-muted-foreground">Gestion des équipements réglementaires et EPI</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card><CardHeader className="pb-2"><CardDescription>Total</CardDescription><CardTitle className="text-3xl">{stats?.total || 0}</CardTitle></CardHeader></Card>
        <Card className="border-green-200 bg-green-50"><CardHeader className="pb-2"><CardDescription>Conformes</CardDescription><CardTitle className="text-3xl text-green-600 flex items-center gap-2"><CheckCircle className="h-6 w-6" />{stats?.conforme || 0}</CardTitle></CardHeader></Card>
        <Card className="border-red-200 bg-red-50"><CardHeader className="pb-2"><CardDescription>Non Conformes</CardDescription><CardTitle className="text-3xl text-red-600 flex items-center gap-2"><AlertCircle className="h-6 w-6" />{stats?.nonConforme || 0}</CardTitle></CardHeader></Card>
        <Card className="border-orange-200 bg-orange-50"><CardHeader className="pb-2"><CardDescription>En Retard</CardDescription><CardTitle className="text-3xl text-orange-600">{stats?.enRetard || 0}</CardTitle></CardHeader></Card>
        <Card className="border-yellow-200 bg-yellow-50"><CardHeader className="pb-2"><CardDescription>Proche Échéance</CardDescription><CardTitle className="text-3xl text-yellow-600">{stats?.procheEcheance || 0}</CardTitle></CardHeader></Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="equipements">Équipements Réglementaires</TabsTrigger>
          <TabsTrigger value="controles">Contrôles</TabsTrigger>
          <TabsTrigger value="epi">EPI</TabsTrigger>
        </TabsList>

        {/* Équipements Tab - Inventory */}
        <TabsContent value="equipements" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Inventaire des équipements</h2>
            <Button onClick={() => { setSelectedEquipement(null); setIsFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />Nouvel Équipement
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                </div>
                <Select value={filterSite} onValueChange={setFilterSite}>
                  <SelectTrigger className="w-full md:w-[200px]"><SelectValue placeholder="Site" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les sites</SelectItem>
                    {sites?.map((site) => <SelectItem key={site.id} value={site.id}>{site.nom_site}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full md:w-[200px]"><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {types?.map((type) => <SelectItem key={type.id} value={type.id}>{type.libelle}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {isLoadingInventory ? (
                <div className="text-center py-8">Chargement...</div>
              ) : filteredEquipementsInventory && filteredEquipementsInventory.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Site</TableHead>
                      <TableHead>Marque</TableHead>
                      <TableHead>N° Série</TableHead>
                      <TableHead>Localisation</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEquipementsInventory.map((eq: any) => (
                      <TableRow key={eq.id}>
                        <TableCell className="font-medium">{eq.nom}</TableCell>
                        <TableCell>{eq.type_equipement}</TableCell>
                        <TableCell>{eq.site?.nom_site}</TableCell>
                        <TableCell>{eq.marque || "-"}</TableCell>
                        <TableCell>{eq.numero_serie || "-"}</TableCell>
                        <TableCell>{eq.localisation || "-"}</TableCell>
                        <TableCell><Badge>{eq.statut || "en_service"}</Badge></TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => { setSelectedEquipement(eq); setIsFormOpen(true); }}>Modifier</Button>
                            <Button variant="destructive" size="sm" onClick={() => { setEquipementToDelete(eq.id); setDeleteConfirmOpen(true); }}>Supprimer</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">Aucun équipement trouvé</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Controles Tab */}
        <TabsContent value="controles" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card><CardHeader className="pb-2"><CardDescription>Total</CardDescription><CardTitle className="text-3xl">{stats?.total || 0}</CardTitle></CardHeader></Card>
            <Card className="border-green-200 bg-green-50"><CardHeader className="pb-2"><CardDescription>Conformes</CardDescription><CardTitle className="text-3xl text-green-600 flex items-center gap-2"><CheckCircle className="h-6 w-6" />{stats?.conforme || 0}</CardTitle></CardHeader></Card>
            <Card className="border-red-200 bg-red-50"><CardHeader className="pb-2"><CardDescription>Non Conformes</CardDescription><CardTitle className="text-3xl text-red-600 flex items-center gap-2"><AlertCircle className="h-6 w-6" />{stats?.nonConforme || 0}</CardTitle></CardHeader></Card>
            <Card className="border-orange-200 bg-orange-50"><CardHeader className="pb-2"><CardDescription>En Retard</CardDescription><CardTitle className="text-3xl text-orange-600">{stats?.enRetard || 0}</CardTitle></CardHeader></Card>
            <Card className="border-yellow-200 bg-yellow-50"><CardHeader className="pb-2"><CardDescription>Proche Échéance</CardDescription><CardTitle className="text-3xl text-yellow-600">{stats?.procheEcheance || 0}</CardTitle></CardHeader></Card>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                </div>
                <Select value={filterSite} onValueChange={setFilterSite}>
                  <SelectTrigger className="w-full md:w-[200px]"><SelectValue placeholder="Site" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les sites</SelectItem>
                    {sites?.map((site) => <SelectItem key={site.id} value={site.id}>{site.nom_site}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full md:w-[200px]"><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {types?.map((type) => <SelectItem key={type.id} value={type.id}>{type.libelle}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {isLoading ? (
                <div className="text-center py-8">Chargement...</div>
              ) : filteredEquipements && filteredEquipements.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Site</TableHead>
                      <TableHead>Dernier Contrôle</TableHead>
                      <TableHead>Prochaine Échéance</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEquipements.map((eq: any) => {
                      const statutInfo = STATUT_CONFORMITE_LABELS[eq.statut_conformite as keyof typeof STATUT_CONFORMITE_LABELS];
                      const StatutIcon = statutInfo.icon;
                      return (
                        <TableRow key={eq.id}>
                          <TableCell className="font-medium">{eq.code_identification}</TableCell>
                          <TableCell>{eq.type_equipement?.libelle}</TableCell>
                          <TableCell>{eq.site?.nom_site}</TableCell>
                          <TableCell>{eq.date_dernier_controle ? format(new Date(eq.date_dernier_controle), "dd/MM/yyyy", { locale: fr }) : "Jamais"}</TableCell>
                          <TableCell><div className="flex items-center gap-2">{eq.prochaine_echeance ? format(new Date(eq.prochaine_echeance), "dd/MM/yyyy", { locale: fr }) : "-"}{getUrgencyBadge(eq.prochaine_echeance)}</div></TableCell>
                          <TableCell><Badge className={`${statutInfo.color} text-white gap-1`}><StatutIcon className="h-3 w-3" />{statutInfo.label}</Badge></TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => { setSelectedEquipement(eq); setIsHistoryOpen(true); }}><FileText className="h-4 w-4" /></Button>
                              <Button variant="outline" size="sm" onClick={() => { setSelectedEquipement(eq); setIsFormOpen(true); }}>Modifier</Button>
                              <Button variant="destructive" size="sm" onClick={() => { setEquipementToDelete(eq.id); setDeleteConfirmOpen(true); }}>Supprimer</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">Aucun équipement trouvé</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* EPI Tab */}
        <TabsContent value="epi">
          <EPITable />
        </TabsContent>
      </Tabs>

      <EquipementFormModal open={isFormOpen} onOpenChange={setIsFormOpen} equipement={selectedEquipement} />
      <ControleHistoryModal open={isHistoryOpen} onOpenChange={setIsHistoryOpen} equipement={selectedEquipement} />
      
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>Cette action supprimera l'équipement{activeTab === "equipements" ? "" : " et son historique"}.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { 
              if (equipementToDelete) { 
                if (activeTab === "equipements") {
                  deleteInventoryMutation.mutate(equipementToDelete);
                } else {
                  deleteMutation.mutate(equipementToDelete);
                }
                setDeleteConfirmOpen(false); 
              } 
            }} className="bg-destructive">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

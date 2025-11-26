import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Search, Edit, Building2, Eye, Power } from "lucide-react";
import { ClientFormModal } from "@/components/clients/ClientFormModal";

interface ClientWithStats {
  id: string;
  nom: string;
  nom_legal: string | null;
  secteur: string | null;
  email: string | null;
  telephone: string | null;
  actif: boolean;
  sites_count: number;
  created_at: string;
}

export default function ClientsManagement() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientWithStats | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients, isLoading } = useQuery({
    queryKey: ["settings-clients"],
    queryFn: async () => {
      const { data: clientsData, error } = await supabase
        .from('clients')
        .select('*')
        .order('nom');

      if (error) throw error;

      // Get site counts for each client
      const clientsWithStats = await Promise.all(
        (clientsData || []).map(async (client) => {
          const { count } = await supabase
            .from('sites')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', client.id);

          return {
            ...client,
            sites_count: count || 0,
          };
        })
      );

      return clientsWithStats as ClientWithStats[];
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, actif }: { id: string; actif: boolean }) => {
      const { error } = await supabase
        .from('clients')
        .update({ actif })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-clients"] });
      toast({ description: "Statut du client mis à jour avec succès" });
    },
    onError: () => {
      toast({ variant: "destructive", description: "Erreur lors de la mise à jour du statut" });
    },
  });

  const filteredClients = clients?.filter((client) => {
    const matchesSearch = [client.nom, client.nom_legal, client.email].some((field) =>
      field?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const matchesStatus = 
      filterStatus === "all" || 
      (filterStatus === "active" && client.actif) || 
      (filterStatus === "archived" && !client.actif);
    
    return matchesSearch && matchesStatus;
  });

  const handleCreate = () => {
    setSelectedClient(null);
    setShowFormModal(true);
  };

  const handleEdit = (client: ClientWithStats) => {
    setSelectedClient(client);
    setShowFormModal(true);
  };

  const handleToggleActive = (client: ClientWithStats) => {
    toggleActiveMutation.mutate({ id: client.id, actif: !client.actif });
  };

  const handleViewSites = (clientId: string) => {
    navigate(`/settings/sites?client_id=${clientId}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground mt-1">
            Gestion des organisations clientes ConformaPro
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau client
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="active">Actifs</SelectItem>
            <SelectItem value="archived">Archivés</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom du client</TableHead>
              <TableHead>Secteur</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-center">Sites</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Aucun client trouvé
                </TableCell>
              </TableRow>
            ) : (
              filteredClients?.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{client.nom}</div>
                      {client.nom_legal && (
                        <div className="text-sm text-muted-foreground">{client.nom_legal}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {client.secteur ? (
                      <Badge variant="outline">{client.secteur}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {client.email && <div>{client.email}</div>}
                      {client.telephone && (
                        <div className="text-muted-foreground">{client.telephone}</div>
                      )}
                      {!client.email && !client.telephone && (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{client.sites_count}</Badge>
                  </TableCell>
                  <TableCell>
                    {client.actif ? (
                      <Badge variant="default" className="bg-green-600">
                        Actif
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Archivé</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewSites(client.id)}
                        title="Voir les sites"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(client)}
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleActive(client)}
                        title={client.actif ? "Archiver" : "Activer"}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ClientFormModal
        open={showFormModal}
        onOpenChange={setShowFormModal}
        client={selectedClient}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["settings-clients"] });
          setShowFormModal(false);
        }}
      />
    </div>
  );
}

import { useState, useEffect } from "react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save, Plus, Pencil, Trash2 } from "lucide-react";
import { createEmployee, updateEmployee, deleteEmployee, fetchEmployees } from "@/lib/medical-queries";
import { useQuery as useSitesQuery } from "@tanstack/react-query";
import { supabaseAny as supabase } from "@/lib/supabase-any";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ClientAutocomplete } from "@/components/shared/ClientAutocomplete";

const employeeSchema = z.object({
  matricule: z.string().min(1, "Matricule requis"),
  nom: z.string().min(1, "Nom requis"),
  prenom: z.string().min(1, "Prénom requis"),
  date_naissance: z.string().optional(),
  poste: z.string().optional(),
  date_embauche: z.string().optional(),
  client_id: z.string().min(1, "Client requis"),
  site_id: z.string().optional(),
  statut_emploi: z.enum(["ACTIF", "SUSPENDU", "DEMISSIONNAIRE", "LICENCIE", "RETRAITE"]).default("ACTIF"),
  risques_exposition: z.array(z.string()).optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId?: string | null;
}

export const EmployeeFormModal = ({ open, onOpenChange, employeeId }: EmployeeFormModalProps) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: fetchEmployees,
    enabled: open,
  });


  const { data: sites } = useQuery({
    queryKey: ["sites"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sites").select("id, nom_site, client_id");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      matricule: "",
      nom: "",
      prenom: "",
      statut_emploi: "ACTIF",
      risques_exposition: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast({ title: "Employé créé avec succès" });
      setShowForm(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer l'employé",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast({ title: "Employé mis à jour avec succès" });
      setShowForm(false);
      setSelectedEmployeeId(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'employé",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast({ title: "Employé supprimé avec succès" });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'employé",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  const onSubmit = async (data: EmployeeFormData) => {
    const submitData = {
      matricule: data.matricule,
      nom: data.nom,
      prenom: data.prenom,
      client_id: data.client_id,
      date_naissance: data.date_naissance || undefined,
      poste: data.poste || undefined,
      date_embauche: data.date_embauche || undefined,
      site_id: data.site_id || undefined,
      statut_emploi: data.statut_emploi,
      risques_exposition: data.risques_exposition || [],
    };

    if (selectedEmployeeId) {
      updateMutation.mutate({ id: selectedEmployeeId, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (employee: any) => {
    setSelectedEmployeeId(employee.id);
    form.reset({
      matricule: employee.matricule,
      nom: employee.nom,
      prenom: employee.prenom,
      date_naissance: employee.date_naissance || "",
      poste: employee.poste || "",
      date_embauche: employee.date_embauche || "",
      client_id: employee.client_id,
      site_id: employee.site_id || "",
      statut_emploi: employee.statut_emploi,
      risques_exposition: employee.risques_exposition || [],
    });
    setShowForm(true);
  };

  const handleDelete = (employeeId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet employé ?")) {
      deleteMutation.mutate(employeeId);
    }
  };

  const handleNewEmployee = () => {
    setSelectedEmployeeId(null);
    form.reset({
      matricule: "",
      nom: "",
      prenom: "",
      statut_emploi: "ACTIF",
      risques_exposition: [],
    });
    setShowForm(true);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const getStatutBadge = (statut: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      ACTIF: "default",
      SUSPENDU: "outline",
      DEMISSIONNAIRE: "secondary",
      LICENCIE: "destructive",
      RETRAITE: "secondary",
    };
    return <Badge variant={variants[statut] || "default"}>{statut}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestion des employés</DialogTitle>
          <DialogDescription>
            Gérez les employés de votre entreprise
          </DialogDescription>
        </DialogHeader>

        {!showForm ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={handleNewEmployee}>
                <Plus className="mr-2 h-4 w-4" />
                Nouvel employé
              </Button>
            </div>

            {employeesLoading ? (
              <div className="text-center py-8">Chargement...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matricule</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Prénom</TableHead>
                    <TableHead>Poste</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees && employees.length > 0 ? (
                    employees.map((emp) => (
                      <TableRow key={emp.id}>
                        <TableCell>{emp.matricule}</TableCell>
                        <TableCell>{emp.nom}</TableCell>
                        <TableCell>{emp.prenom}</TableCell>
                        <TableCell>{emp.poste || "-"}</TableCell>
                        <TableCell>{getStatutBadge(emp.statut_emploi)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(emp)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(emp.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Aucun employé trouvé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="matricule"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Matricule *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="statut_emploi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statut *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ACTIF">Actif</SelectItem>
                          <SelectItem value="SUSPENDU">Suspendu</SelectItem>
                          <SelectItem value="DEMISSIONNAIRE">Démissionnaire</SelectItem>
                          <SelectItem value="LICENCIE">Licencié</SelectItem>
                          <SelectItem value="RETRAITE">Retraité</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="prenom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date_naissance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de naissance</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date_embauche"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date d'embauche</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="poste"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Poste</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client *</FormLabel>
                      <FormControl>
                        <ClientAutocomplete
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Sélectionner un client"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="site_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un site" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sites
                            ?.filter((s) => s.client_id === form.watch("client_id"))
                            .map((site) => (
                              <SelectItem key={site.id} value={site.id}>
                                {site.nom_site}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setSelectedEmployeeId(null);
                    form.reset();
                  }}
                  disabled={isLoading}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

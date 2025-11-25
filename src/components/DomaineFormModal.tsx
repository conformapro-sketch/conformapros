import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createDomaine, updateDomaine } from "@/lib/domaines-queries";
import { 
  Shield, Users, Leaf, CheckCircle, Zap, Utensils, Lock, ShieldCheck,
  AlertTriangle, FileText, Package, BookOpen, Search, Bell, LucideIcon
} from "lucide-react";
import type { Database } from "@/types/db";

type DomaineRow = Database["public"]["Tables"]["domaines_application"]["Row"];

const domaineSchema = z.object({
  code: z.string().min(1, "Le code est requis").max(10, "Maximum 10 caractères"),
  libelle: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  actif: z.boolean(),
  couleur: z.string().optional(),
  icone: z.string().optional(),
});

const AVAILABLE_ICONS: { name: string; icon: LucideIcon; label: string }[] = [
  { name: "shield", icon: Shield, label: "Bouclier" },
  { name: "users", icon: Users, label: "Utilisateurs" },
  { name: "leaf", icon: Leaf, label: "Feuille" },
  { name: "check-circle", icon: CheckCircle, label: "Vérification" },
  { name: "zap", icon: Zap, label: "Éclair" },
  { name: "utensils", icon: Utensils, label: "Couverts" },
  { name: "lock", icon: Lock, label: "Cadenas" },
  { name: "shield-check", icon: ShieldCheck, label: "Bouclier vérifié" },
  { name: "alert-triangle", icon: AlertTriangle, label: "Alerte" },
  { name: "file-text", icon: FileText, label: "Document" },
  { name: "package", icon: Package, label: "Paquet" },
  { name: "book-open", icon: BookOpen, label: "Livre" },
  { name: "search", icon: Search, label: "Recherche" },
  { name: "bell", icon: Bell, label: "Cloche" },
];

const PRESET_COLORS = [
  { label: "Rouge", value: "hsl(0, 70%, 50%)" },
  { label: "Orange", value: "hsl(30, 80%, 50%)" },
  { label: "Jaune", value: "hsl(45, 90%, 50%)" },
  { label: "Vert", value: "hsl(120, 70%, 40%)" },
  { label: "Cyan", value: "hsl(180, 70%, 45%)" },
  { label: "Bleu", value: "hsl(200, 70%, 50%)" },
  { label: "Bleu foncé", value: "hsl(220, 60%, 50%)" },
  { label: "Violet", value: "hsl(260, 70%, 50%)" },
  { label: "Violet clair", value: "hsl(280, 70%, 50%)" },
  { label: "Rose", value: "hsl(320, 70%, 50%)" },
];

type DomaineFormData = z.infer<typeof domaineSchema>;

interface DomaineFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domaine?: DomaineRow;
}

export function DomaineFormModal({ open, onOpenChange, domaine }: DomaineFormModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<DomaineFormData>({
    resolver: zodResolver(domaineSchema),
    defaultValues: {
      code: "",
      libelle: "",
      description: "",
      actif: true,
      couleur: "hsl(200, 70%, 50%)",
      icone: "shield",
    },
  });

  const actif = watch("actif");
  const couleur = watch("couleur");
  const icone = watch("icone");

  // Mettre à jour le formulaire quand le domaine change
  useEffect(() => {
    if (open) {
      if (domaine) {
        reset({
          code: domaine.code,
          libelle: domaine.libelle,
          description: domaine.description || "",
          actif: domaine.actif ?? true,
          couleur: domaine.couleur || "hsl(200, 70%, 50%)",
          icone: domaine.icone || "shield",
        });
      } else {
        reset({
          code: "",
          libelle: "",
          description: "",
          actif: true,
          couleur: "hsl(200, 70%, 50%)",
          icone: "shield",
        });
      }
    }
  }, [domaine, open, reset]);

  const selectedIcon = AVAILABLE_ICONS.find(i => i.name === icone);
  const SelectedIconComponent = selectedIcon?.icon || Shield;

  const createMutation = useMutation({
    mutationFn: createDomaine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domaines-reglementaires"] });
      toast({ title: "Domaine créé avec succès" });
      reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur lors de la création",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateDomaine(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domaines-reglementaires"] });
      toast({ title: "Domaine modifié avec succès" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur lors de la modification",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DomaineFormData) => {
    if (domaine) {
      updateMutation.mutate({ id: domaine.id, data });
    } else {
      createMutation.mutate(data as any);
    }
  };

  return (
    <Dialog 
      open={open} onOpenChange={(newOpen) => {
        if (!newOpen) {
          reset();
        }
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="max-w-lg" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{domaine ? "Modifier le domaine" : "Nouveau domaine"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="code">Code *</Label>
            <Input 
              id="code" 
              {...register("code")} 
              placeholder="Ex: QUA"
              className="uppercase"
              maxLength={10}
            />
            {errors.code && (
              <p className="text-sm text-destructive mt-1">{errors.code.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="libelle">Nom *</Label>
            <Input id="libelle" {...register("libelle")} placeholder="Ex: Qualité" />
            {errors.libelle && (
              <p className="text-sm text-destructive mt-1">{errors.libelle.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              {...register("description")} 
              rows={3}
              placeholder="Description du domaine d'application..."
            />
          </div>

          {/* Color Picker */}
          <div>
            <Label>Couleur</Label>
            <Popover open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-3"
                  type="button"
                >
                  <div 
                    className="h-5 w-5 rounded border border-border" 
                    style={{ backgroundColor: couleur || "hsl(200, 70%, 50%)" }}
                  />
                  <span className="flex-1 text-left font-mono text-xs">
                    {couleur || "hsl(200, 70%, 50%)"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-3">
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className="h-10 w-full rounded border-2 border-border hover:border-primary transition-colors"
                      style={{ backgroundColor: color.value }}
                      onClick={() => {
                        setValue("couleur", color.value);
                        setColorPickerOpen(false);
                      }}
                      title={color.label}
                    />
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t">
                  <Label className="text-xs mb-2 block">Couleur personnalisée (HSL)</Label>
                  <Input
                    type="text"
                    placeholder="hsl(200, 70%, 50%)"
                    value={couleur || ""}
                    onChange={(e) => setValue("couleur", e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Icon Picker */}
          <div>
            <Label>Icône</Label>
            <Popover open={iconPickerOpen} onOpenChange={setIconPickerOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-3"
                  type="button"
                >
                  <SelectedIconComponent className="h-5 w-5" />
                  <span className="flex-1 text-left">
                    {selectedIcon?.label || "Sélectionner une icône"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-3">
                <div className="grid grid-cols-4 gap-2">
                  {AVAILABLE_ICONS.map((iconData) => {
                    const IconComponent = iconData.icon;
                    return (
                      <button
                        key={iconData.name}
                        type="button"
                        className={`p-3 rounded border-2 transition-all hover:border-primary hover:bg-accent ${
                          icone === iconData.name ? "border-primary bg-accent" : "border-border"
                        }`}
                        onClick={() => {
                          setValue("icone", iconData.name);
                          setIconPickerOpen(false);
                        }}
                        title={iconData.label}
                      >
                        <IconComponent className="h-5 w-5 mx-auto" />
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="actif">Domaine actif</Label>
            <Switch
              id="actif"
              checked={actif}
              onCheckedChange={(checked) => setValue("actif", checked)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {domaine ? "Modifier" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

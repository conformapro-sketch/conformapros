import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Download, Upload, Loader2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { annexesQueries } from "@/lib/bibliotheque-queries";
import type { ActeAnnexe } from "@/types/textes";

interface AnnexesTabProps {
  acteId: string;
}

export function AnnexesTab({ acteId }: AnnexesTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [label, setLabel] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const { data: annexes = [], isLoading } = useQuery({
    queryKey: ["annexes", acteId],
    queryFn: () => annexesQueries.getByActeId(acteId),
  });

  const createMutation = useMutation({
    mutationFn: async ({ file, label }: { file: File; label: string }) => {
      setIsUploading(true);
      try {
        // Upload file first
        const fileUrl = await annexesQueries.uploadFile(file);
        
        // Create annexe record
        return await annexesQueries.create({
          acte_id: acteId,
          label,
          file_url: fileUrl,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: null, // Will be set by trigger if auth is available
        });
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["annexes", acteId] });
      toast({ title: "Annexe ajoutée", description: "Le fichier a été téléversé avec succès" });
      resetForm();
      setDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'ajouter l'annexe",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (annexe: ActeAnnexe) => {
      // Delete file from storage first
      await annexesQueries.deleteFile(annexe.file_url);
      // Then delete record
      await annexesQueries.delete(annexe.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["annexes", acteId] });
      toast({ title: "Annexe supprimée", description: "Le fichier a été supprimé avec succès" });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer l'annexe",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedFile(null);
    setLabel("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "La taille maximale est de 50 MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      // Auto-generate label from filename if empty
      if (!label) {
        setLabel(file.name.split('.').slice(0, -1).join('.'));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !label.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fichier et saisir un libellé",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({ file: selectedFile, label: label.trim() });
  };

  const handleDelete = (annexe: ActeAnnexe) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${annexe.label}" ?`)) {
      deleteMutation.mutate(annexe);
    }
  };

  const handleDownload = (annexe: ActeAnnexe) => {
    window.open(annexe.file_url, '_blank');
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Annexes ({annexes.length})</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une annexe
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter une annexe</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="label">Libellé *</Label>
                  <Input
                    id="label"
                    placeholder="Ex: Annexe technique A"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="file">Fichier *</Label>
                  <div className="mt-2">
                    <input
                      id="file"
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    />
                    <label
                      htmlFor="file"
                      className="flex items-center justify-center gap-2 border-2 border-dashed rounded-md p-6 cursor-pointer hover:border-primary transition-colors"
                    >
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {selectedFile ? selectedFile.name : "Cliquer pour sélectionner un fichier"}
                      </span>
                    </label>
                    {selectedFile && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Taille: {formatFileSize(selectedFile.size)}
                      </p>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isUploading || !selectedFile || !label.trim()}>
                    {isUploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {isUploading ? "Téléversement..." : "Ajouter"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : annexes.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Libellé</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Taille</TableHead>
                  <TableHead>Date d'ajout</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {annexes.map((annexe) => (
                  <TableRow key={annexe.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {annexe.label}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {annexe.file_type || "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatFileSize(annexe.file_size)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {annexe.created_at
                        ? new Date(annexe.created_at).toLocaleDateString("fr-FR")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(annexe)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(annexe)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Aucune annexe. Cliquez sur "Ajouter une annexe" pour commencer.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

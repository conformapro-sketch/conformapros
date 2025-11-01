import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCheck, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FactureAvoir() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Factures d'avoir</h1>
          <p className="text-muted-foreground">
            Gestion des factures d'avoir (notes de crédit)
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle facture d'avoir
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Liste des factures d'avoir
          </CardTitle>
          <CardDescription>
            Consultez et gérez vos factures d'avoir (remboursements clients)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Aucune facture d'avoir pour le moment</p>
            <p className="text-sm text-muted-foreground mt-2">
              Créez votre première facture d'avoir en cliquant sur le bouton ci-dessus
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

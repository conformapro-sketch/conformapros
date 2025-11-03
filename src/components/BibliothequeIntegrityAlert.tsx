import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, Info, Shield, Database } from "lucide-react";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

/**
 * Composant d'alerte pour informer les utilisateurs des améliorations
 * de cohérence et d'intégrité du module bibliothèque réglementaire
 */
export function BibliothequeIntegrityAlert() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              ✅ Module Bibliothèque Amélioré
              <Badge variant="outline" className="bg-success/10 text-success">
                Phase 1 Complète
              </Badge>
            </CardTitle>
            <CardDescription>
              Corrections critiques appliquées pour garantir la cohérence juridique
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Résumé des corrections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-start gap-2 p-3 rounded-lg border bg-card">
            <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-sm">Hiérarchie validée</div>
              <div className="text-xs text-muted-foreground">
                Validation côté serveur
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-2 p-3 rounded-lg border bg-card">
            <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-sm">Versions uniques</div>
              <div className="text-xs text-muted-foreground">
                1 seule version active
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-2 p-3 rounded-lg border bg-card">
            <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-sm">Cascade abrogation</div>
              <div className="text-xs text-muted-foreground">
                Propagation automatique
              </div>
            </div>
          </div>
        </div>

        {/* Section détails */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              {isOpen ? "Masquer" : "Voir"} les détails techniques
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="mt-4 space-y-3">
            {/* Correction 1 */}
            <Alert>
              <Database className="h-4 w-4" />
              <AlertTitle className="text-sm font-medium">
                1. Type "Décret-loi" ajouté
              </AlertTitle>
              <AlertDescription className="text-xs">
                La hiérarchie des normes tunisiennes est désormais complète : 
                Loi (5) → Décret-loi (4) → Décret (3) → Arrêté (2) → Circulaire (1)
              </AlertDescription>
            </Alert>

            {/* Correction 2 */}
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle className="text-sm font-medium">
                2. Validation de la hiérarchie (serveur)
              </AlertTitle>
              <AlertDescription className="text-xs">
                Un texte ne peut plus modifier un texte de niveau supérieur. 
                Exemple : Un arrêté ne peut pas abroger une loi.
              </AlertDescription>
            </Alert>

            {/* Correction 3 */}
            <Alert>
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertTitle className="text-sm font-medium">
                3. Détection de références circulaires
              </AlertTitle>
              <AlertDescription className="text-xs">
                Les cycles sont automatiquement détectés et bloqués 
                (ex: Texte A modifie B qui modifie A).
              </AlertDescription>
            </Alert>

            {/* Correction 4 */}
            <Alert>
              <Info className="h-4 w-4 text-info" />
              <AlertTitle className="text-sm font-medium">
                4. Versions actives uniques
              </AlertTitle>
              <AlertDescription className="text-xs">
                Contrainte de base de données : un article ne peut avoir qu'une seule version active à la fois.
              </AlertDescription>
            </Alert>

            {/* Correction 5 */}
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertTitle className="text-sm font-medium">
                5. Cascade d'abrogation
              </AlertTitle>
              <AlertDescription className="text-xs">
                Quand un texte est abrogé, tous ses articles sont automatiquement abrogés 
                avec création de versions d'abrogation horodatées.
              </AlertDescription>
            </Alert>

            {/* Correction 6 */}
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle className="text-sm font-medium">
                6. Protection des textes abrogés
              </AlertTitle>
              <AlertDescription className="text-xs">
                Impossible de créer des effets juridiques sur des textes ou articles déjà abrogés.
              </AlertDescription>
            </Alert>

            {/* Performance */}
            <Alert className="border-primary/30 bg-primary/5">
              <Database className="h-4 w-4" />
              <AlertTitle className="text-sm font-medium">
                ⚡ Bonus: Amélioration des performances
              </AlertTitle>
              <AlertDescription className="text-xs">
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Index full-text (GIN) sur le contenu des articles</li>
                  <li>Index sur les dates de versions pour recherches temporelles</li>
                  <li>Vues utilitaires pour détection d'anomalies</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Documentation */}
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                📚 Documentation complète disponible dans{" "}
                <code className="bg-muted px-1 py-0.5 rounded text-xs">
                  BIBLIOTHEQUE_CORRECTIONS.md
                </code>
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open('https://docs.lovable.dev', '_blank')}
            className="flex-1"
          >
            <Info className="h-4 w-4 mr-2" />
            En savoir plus
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Settings, Bell, FileText, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function IncidentsConfiguration() {
  const handleSave = () => {
    toast.success("Configuration enregistrée avec succès");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuration Incidents HSE</h1>
        <p className="text-muted-foreground mt-1">
          Paramètres et préférences du module incidents
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-2" />
            Général
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="categories">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Catégories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Paramètres généraux</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Délai d'alerte avant échéance (jours)</Label>
                  <Input type="number" defaultValue={7} />
                  <p className="text-xs text-muted-foreground mt-1">
                    Nombre de jours avant l'échéance pour envoyer une alerte
                  </p>
                </div>
                <div>
                  <Label>Délai "en retard" (jours)</Label>
                  <Input type="number" defaultValue={30} />
                  <p className="text-xs text-muted-foreground mt-1">
                    Un incident est considéré en retard après ce délai
                  </p>
                </div>
              </div>
              
              <div>
                <Label>Format de numérotation</Label>
                <Input defaultValue="HSE-{YEAR}-{SEQ}" />
                <p className="text-xs text-muted-foreground mt-1">
                  Variables : {"{YEAR}"}, {"{MONTH}"}, {"{SEQ}"}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Mode brouillon automatique</Label>
                  <p className="text-xs text-muted-foreground">
                    Sauvegarder automatiquement les déclarations en cours
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Validation obligatoire pour clôture</Label>
                  <p className="text-xs text-muted-foreground">
                    Un responsable HSE doit valider avant clôture
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Notifications et alertes</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notifications email</Label>
                  <p className="text-xs text-muted-foreground">
                    Activer les notifications par email
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Notifications SMS</Label>
                  <p className="text-xs text-muted-foreground">
                    Activer les notifications par SMS (incidents majeurs uniquement)
                  </p>
                </div>
                <Switch />
              </div>

              <div className="space-y-2">
                <Label>Destinataires incidents majeurs</Label>
                <Input placeholder="email1@example.com, email2@example.com" />
                <p className="text-xs text-muted-foreground">
                  Séparer les emails par des virgules
                </p>
              </div>

              <div className="space-y-2">
                <Label>Destinataires incidents en retard</Label>
                <Input placeholder="email1@example.com, email2@example.com" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Escalade automatique</Label>
                  <p className="text-xs text-muted-foreground">
                    Notifier la hiérarchie si pas de réponse sous 48h
                  </p>
                </div>
                <Switch />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Templates et modèles</h3>
            <div className="space-y-4">
              <div>
                <Label>Questions d'analyse (5 Pourquoi)</Label>
                <div className="space-y-2 mt-2">
                  <Input placeholder="Pourquoi cet incident s'est-il produit ?" />
                  <Input placeholder="Pourquoi cette cause est-elle apparue ?" />
                  <Input placeholder="Pourquoi ce facteur était-il présent ?" />
                  <Button variant="outline" size="sm">
                    + Ajouter une question
                  </Button>
                </div>
              </div>

              <div>
                <Label>Mesures correctives types par type d'incident</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex gap-2">
                    <Input placeholder="Type d'incident" className="flex-1" />
                    <Input placeholder="Mesure corrective suggérée" className="flex-[2]" />
                    <Button variant="outline" size="sm">
                      Ajouter
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <Label>Checklist d'investigation</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center gap-2">
                    <Switch defaultChecked />
                    <span className="text-sm">Photos du lieu prises</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch defaultChecked />
                    <span className="text-sm">Témoins interrogés</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch defaultChecked />
                    <span className="text-sm">Équipements vérifiés</span>
                  </div>
                  <Button variant="outline" size="sm">
                    + Ajouter un élément
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Catégories personnalisées</h3>
            <div className="space-y-4">
              <div>
                <Label>Types d'incidents personnalisés</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex gap-2">
                    <Input placeholder="Code (ex: CHUTE)" className="w-32" />
                    <Input placeholder="Libellé" className="flex-1" />
                    <Button variant="outline" size="sm">
                      Ajouter
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <Label>Zones pré-configurées par site</Label>
                <div className="space-y-2 mt-2">
                  <Input placeholder="Zone / Bâtiment / Atelier" />
                  <Button variant="outline" size="sm">
                    + Ajouter une zone
                  </Button>
                </div>
              </div>

              <div>
                <Label>Catégories de gravité personnalisées</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Définir des critères spécifiques pour chaque niveau de gravité
                </p>
                <div className="space-y-2">
                  <div className="p-3 border rounded">
                    <div className="font-medium">Mineure</div>
                    <Input
                      placeholder="Critères (ex: Aucun arrêt, soins sur place)"
                      className="mt-2"
                    />
                  </div>
                  <div className="p-3 border rounded">
                    <div className="font-medium">Moyenne</div>
                    <Input
                      placeholder="Critères (ex: Arrêt < 3 jours)"
                      className="mt-2"
                    />
                  </div>
                  <div className="p-3 border rounded">
                    <div className="font-medium">Majeure</div>
                    <Input
                      placeholder="Critères (ex: Arrêt > 3 jours, hospitalisation)"
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button variant="outline">Annuler</Button>
        <Button onClick={handleSave}>Enregistrer la configuration</Button>
      </div>
    </div>
  );
}

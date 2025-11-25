import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Landmark, FolderTree, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function BibliothequeParametres() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const isStaff = hasRole('Super Admin') || hasRole('Admin Global');

  if (!isStaff) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Accès refusé</CardTitle>
            <CardDescription>
              Vous n'avez pas les permissions nécessaires pour accéder aux paramètres.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const parametres = [
    {
      icon: Landmark,
      title: "Autorités émettrices",
      description: "Gérer les organismes émetteurs de textes réglementaires (ministères, agences, etc.)",
      route: "/bibliotheque/autorites",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: FolderTree,
      title: "Domaines réglementaires",
      description: "Gérer les domaines et sous-domaines d'application réglementaire",
      route: "/bibliotheque/domain",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  ];

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Paramètres Bibliothèque</h1>
          <p className="text-muted-foreground">
            Configuration et gestion des données de référence
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {parametres.map((param) => {
          const Icon = param.icon;
          return (
            <Card key={param.route} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(param.route)}>
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${param.bgColor} flex items-center justify-center mb-3`}>
                  <Icon className={`h-6 w-6 ${param.color}`} />
                </div>
                <CardTitle className="text-xl">{param.title}</CardTitle>
                <CardDescription className="text-sm">
                  {param.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={() => navigate(param.route)}>
                  Gérer
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabaseAny as supabase } from "@/lib/supabase-any";
import { Search, Shield, FileText, Award } from "lucide-react";

const CATEGORIES = [
  { id: "tete", label: "Protection de la tête", icon: Shield },
  { id: "mains", label: "Protection des mains", icon: Shield },
  { id: "pieds", label: "Protection des pieds", icon: Shield },
  { id: "yeux", label: "Protection des yeux", icon: Shield },
  { id: "corps", label: "Protection du corps", icon: Shield },
  { id: "respiratoire", label: "Protection respiratoire", icon: Shield },
  { id: "auditive", label: "Protection auditive", icon: Shield },
  { id: "chute", label: "Protection contre les chutes", icon: Shield },
];

export default function EPIBibliotheque() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: types = [] } = useQuery({
    queryKey: ["epi-types-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("epi_types")
        .select("*")
        .eq("actif", true)
        .order("categorie", { ascending: true })
        .order("libelle");
      if (error) throw error;
      return data;
    },
  });

  const filteredTypes = types.filter((type: any) => {
    const matchesSearch = type.libelle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      type.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || type.categorie === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Base documentaire EPI</h1>
        <p className="text-muted-foreground mt-1">
          Normes, certifications et spécifications techniques des EPI
        </p>
      </div>

      {/* Barre de recherche */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un type d'EPI, une norme..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Filtres par catégorie */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="all">Tous</TabsTrigger>
          {CATEGORIES.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id} className="text-xs">
              {cat.label.split(" ")[1] || cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-4 mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTypes.map((type: any) => (
              <Card key={type.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{type.libelle}</CardTitle>
                      <CardDescription className="mt-1">
                        <Badge variant="outline">{type.categorie}</Badge>
                      </CardDescription>
                    </div>
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {type.description && (
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  )}

                  {/* Normes */}
                  {type.normes_certifications?.normes?.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <FileText className="h-4 w-4" />
                        Normes applicables
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {type.normes_certifications.normes.map((norme: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {norme}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certifications */}
                  {type.normes_certifications?.certifications?.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Award className="h-4 w-4" />
                        Certifications
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {type.normes_certifications.certifications.map((cert: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Durée de vie */}
                  {type.duree_vie_moyenne_mois && (
                    <div className="text-sm">
                      <span className="font-medium">Durée de vie moyenne :</span>{" "}
                      {type.duree_vie_moyenne_mois} mois
                    </div>
                  )}

                  {/* Spécifications techniques */}
                  {type.specifications_techniques &&
                    Object.keys(type.specifications_techniques).length > 0 && (
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Spécifications techniques</div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          {Object.entries(type.specifications_techniques).map(([key, value]) => (
                            <div key={key}>
                              <span className="font-medium">{key}:</span> {String(value)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTypes.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  Aucun type d'EPI trouvé pour ces critères
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabaseAny as supabase } from "@/lib/supabase-any";
import { Plus, Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function EquipementsPrestataires() {
  const { data: prestataires = [] } = useQuery({
    queryKey: ["prestataires"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prestataires")
        .select("*")
        .eq("actif", true)
        .order("nom");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestion des prestataires</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau prestataire
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {prestataires.map((p: any) => (
          <Card key={p.id}>
            <CardHeader>
              <CardTitle>{p.nom}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {p.type_prestation && <Badge>{p.type_prestation}</Badge>}
              {p.contact_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4" />
                  {p.contact_email}
                </div>
              )}
              {p.contact_telephone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4" />
                  {p.contact_telephone}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

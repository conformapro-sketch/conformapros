import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Package, User, Wrench, Trash2, ArrowLeftRight } from "lucide-react";

interface EPIHistoryTimelineProps {
  articleId: string;
}

const MOVEMENT_ICONS = {
  reception: Package,
  attribution: User,
  retour: ArrowLeftRight,
  remplacement: ArrowLeftRight,
  reforme: Trash2,
  maintenance: Wrench,
  autre: Package,
};

const MOVEMENT_COLORS = {
  reception: "bg-blue-500",
  attribution: "bg-green-500",
  retour: "bg-orange-500",
  remplacement: "bg-purple-500",
  reforme: "bg-red-500",
  maintenance: "bg-yellow-500",
  autre: "bg-gray-500",
};

export function EPIHistoryTimeline({ articleId }: EPIHistoryTimelineProps) {
  const { data: mouvements = [], isLoading } = useQuery({
    queryKey: ["epi-mouvements", articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("epi_mouvements")
        .select(`
          *,
          employe:employes(id, nom, prenom),
          effectue_par_user:profiles!epi_mouvements_effectue_par_fkey(nom, prenom)
        `)
        .eq("article_id", articleId)
        .order("date_mouvement", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div>Chargement de l'historique...</div>;
  }

  if (mouvements.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Aucun mouvement enregistré</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique des mouvements</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4 pl-6">
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />
          
          {mouvements.map((mouvement: any) => {
            const Icon = MOVEMENT_ICONS[mouvement.type_mouvement as keyof typeof MOVEMENT_ICONS] || Package;
            const colorClass = MOVEMENT_COLORS[mouvement.type_mouvement as keyof typeof MOVEMENT_COLORS];
            
            return (
              <div key={mouvement.id} className="relative">
                <div className={`absolute left-[-1.4rem] w-8 h-8 rounded-full ${colorClass} flex items-center justify-center`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                
                <div className="bg-muted p-4 rounded-lg ml-6">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">
                      {mouvement.type_mouvement}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(mouvement.date_mouvement), "dd MMMM yyyy", { locale: fr })}
                    </span>
                  </div>
                  
                  {mouvement.employe && (
                    <p className="text-sm mb-1">
                      <span className="font-medium">Employé:</span> {mouvement.employe.prenom} {mouvement.employe.nom}
                    </p>
                  )}
                  
                  {mouvement.motif && (
                    <p className="text-sm mb-1">
                      <span className="font-medium">Motif:</span> {mouvement.motif}
                    </p>
                  )}
                  
                  {mouvement.effectue_par_user && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Effectué par: {mouvement.effectue_par_user.prenom} {mouvement.effectue_par_user.nom}
                    </p>
                  )}
                  
                  {mouvement.signature_url && (
                    <div className="mt-2">
                      <img 
                        src={mouvement.signature_url} 
                        alt="Signature"
                        className="max-w-[200px] border rounded"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Signé le {format(new Date(mouvement.signature_date), "dd/MM/yyyy HH:mm")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

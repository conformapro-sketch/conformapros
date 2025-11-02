import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { textesCodesQueries } from "@/lib/codes-queries";
import { TYPE_RELATION_LABELS } from "@/types/codes";
import type { TypeRelationCode } from "@/types/codes";

interface TexteCodesDisplayProps {
  texteId: string;
}

export function TexteCodesDisplay({ texteId }: TexteCodesDisplayProps) {
  const { data: codes } = useQuery({
    queryKey: ["texte-codes", texteId],
    queryFn: () => textesCodesQueries.getCodesByTexteId(texteId),
  });

  if (!codes || codes.length === 0) return null;

  const getRelationBadgeVariant = (relation: TypeRelationCode) => {
    switch (relation) {
      case "appartient_a": return "default";
      case "modifie": return "secondary";
      case "abroge_partiellement": return "destructive";
      case "complete": return "outline";
      default: return "default";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Codes juridiques associés
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {codes.map((item: any) => (
            <Link
              key={item.id}
              to={`/codes-juridiques/${item.codes_juridiques.id}`}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="font-mono">
                  {item.codes_juridiques.abreviation}
                </Badge>
                <span className="font-medium">{item.codes_juridiques.nom_officiel}</span>
              </div>
              <Badge variant={getRelationBadgeVariant(item.type_relation)}>
                {TYPE_RELATION_LABELS[item.type_relation]}
              </Badge>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

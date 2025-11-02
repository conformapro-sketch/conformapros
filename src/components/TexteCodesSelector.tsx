import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { codesQueries } from "@/lib/codes-queries";
import { TYPE_RELATION_LABELS } from "@/types/codes";
import type { TypeRelationCode } from "@/types/codes";

interface SelectedCode {
  codeId: string;
  typeRelation: TypeRelationCode;
}

interface TexteCodesSelectorProps {
  selectedCodes: SelectedCode[];
  onCodesChange: (codes: SelectedCode[]) => void;
}

export function TexteCodesSelector({
  selectedCodes,
  onCodesChange,
}: TexteCodesSelectorProps) {
  const { data: codes } = useQuery({
    queryKey: ["codes-juridiques"],
    queryFn: () => codesQueries.getAll(),
  });

  const availableCodes = codes?.filter(
    (code) => !selectedCodes.some((sc) => sc.codeId === code.id)
  );

  const handleAddCode = (codeId: string) => {
    if (codeId && !selectedCodes.find((c) => c.codeId === codeId)) {
      onCodesChange([
        ...selectedCodes,
        { codeId, typeRelation: "appartient_a" },
      ]);
    }
  };

  const handleRemoveCode = (codeId: string) => {
    onCodesChange(selectedCodes.filter((c) => c.codeId !== codeId));
  };

  const handleChangeRelation = (codeId: string, typeRelation: TypeRelationCode) => {
    onCodesChange(
      selectedCodes.map((c) =>
        c.codeId === codeId ? { ...c, typeRelation } : c
      )
    );
  };

  const getCodeName = (codeId: string) => {
    const code = codes?.find((c) => c.id === codeId);
    return code ? `${code.abreviation} - ${code.nom_officiel}` : "";
  };

  const getRelationBadgeVariant = (relation: TypeRelationCode) => {
    switch (relation) {
      case "appartient_a":
        return "default";
      case "modifie":
        return "secondary";
      case "abroge_partiellement":
        return "destructive";
      case "complete":
        return "outline";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Codes juridiques associés</Label>
        <p className="text-sm text-muted-foreground mb-2">
          Associez ce texte à un ou plusieurs codes juridiques tunisiens
        </p>
      </div>

      {selectedCodes.length > 0 && (
        <div className="space-y-2">
          {selectedCodes.map((selectedCode) => (
            <div
              key={selectedCode.codeId}
              className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50"
            >
              <div className="flex-1">
                <p className="font-medium text-sm">
                  {getCodeName(selectedCode.codeId)}
                </p>
              </div>

              <Select
                value={selectedCode.typeRelation}
                onValueChange={(value) =>
                  handleChangeRelation(
                    selectedCode.codeId,
                    value as TypeRelationCode
                  )
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_RELATION_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      <Badge
                        variant={getRelationBadgeVariant(key as TypeRelationCode)}
                        className="mr-2"
                      >
                        {label}
                      </Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveCode(selectedCode.codeId)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {availableCodes && availableCodes.length > 0 && (
        <Select onValueChange={handleAddCode}>
          <SelectTrigger>
            <SelectValue placeholder="Ajouter un code juridique..." />
          </SelectTrigger>
          <SelectContent>
            {availableCodes.map((code) => (
              <SelectItem key={code.id} value={code.id}>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono">
                    {code.abreviation}
                  </Badge>
                  <span>{code.nom_officiel}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {selectedCodes.length === 0 && (
        <p className="text-sm text-muted-foreground italic">
          Aucun code juridique associé pour le moment
        </p>
      )}
    </div>
  );
}

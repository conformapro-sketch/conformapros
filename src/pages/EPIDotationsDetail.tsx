import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { EPIEmployeeFiche } from "@/components/epi/EPIEmployeeFiche";

export default function EPIDotationsDetail() {
  const { employeId } = useParams();
  const navigate = useNavigate();

  if (!employeId) {
    return <div className="p-6">Employé non trouvé</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/epi/dotations")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Fiche de dotation EPI</h1>
      </div>

      <EPIEmployeeFiche employeId={employeId} />
    </div>
  );
}

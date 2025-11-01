import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import QRCode from "qrcode";

interface EquipementQRCodeProps {
  equipementId: string;
  equipementName: string;
}

export function EquipementQRCode({ equipementId, equipementName }: EquipementQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const url = `${window.location.origin}/equipement/${equipementId}/qr`;
      QRCode.toCanvas(canvasRef.current, url, {
        width: 256,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
    }
  }, [equipementId]);

  const downloadQRCode = () => {
    if (canvasRef.current) {
      const url = canvasRef.current.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `qr-code-${equipementName.replace(/\s+/g, "-")}.png`;
      link.href = url;
      link.click();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>QR Code de l'équipement</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <canvas ref={canvasRef} />
        <p className="text-sm text-muted-foreground text-center">
          Scannez ce code pour accéder aux informations de l'équipement
        </p>
        <Button onClick={downloadQRCode} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Télécharger le QR Code
        </Button>
      </CardContent>
    </Card>
  );
}

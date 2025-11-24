import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, X, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoUploadProps {
  currentUrl?: string | null;
  fallbackUrl?: string | null;
  onFileSelect: (file: File | null) => void;
  label?: string;
  description?: string;
  showFallbackOption?: boolean;
  useFallback?: boolean;
  onUseFallbackChange?: (use: boolean) => void;
  className?: string;
}

export function LogoUpload({
  currentUrl,
  fallbackUrl,
  onFileSelect,
  label = "Logo",
  description = "PNG, JPG jusqu'à 2MB",
  showFallbackOption = false,
  useFallback = false,
  onUseFallbackChange,
  className,
}: LogoUploadProps) {
  const [preview, setPreview] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        return;
      }
      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onFileSelect(file);
    }
  };

  const handleRemove = () => {
    setPreview("");
    onFileSelect(null);
  };

  const displayUrl = preview || (useFallback && fallbackUrl) || currentUrl;

  return (
    <div className={cn("space-y-3", className)}>
      <Label>{label}</Label>
      
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20 rounded-lg border-2 border-border">
          <AvatarImage src={displayUrl || undefined} alt={label} />
          <AvatarFallback className="rounded-lg bg-muted">
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById(`logo-upload-${label}`)?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Choisir une image
            </Button>
            
            {(preview || currentUrl) && !useFallback && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
              >
                <X className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">{description}</p>

          {showFallbackOption && fallbackUrl && onUseFallbackChange && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={useFallback}
                onChange={(e) => {
                  onUseFallbackChange(e.target.checked);
                  if (e.target.checked) {
                    setPreview("");
                    onFileSelect(null);
                  }
                }}
                className="rounded border-border"
              />
              <span className="text-muted-foreground">Utiliser le logo du client</span>
            </label>
          )}
        </div>
      </div>

      <input
        id={`logo-upload-${label}`}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

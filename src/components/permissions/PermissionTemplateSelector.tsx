import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { permissionTemplates, applyTemplate } from "@/lib/permission-templates";
import { Shield, UserCog, Eye, Wrench, Leaf, Users, Check } from "lucide-react";

const iconMap: Record<string, any> = {
  ShieldCheck: Shield,
  UserCog: UserCog,
  Eye: Eye,
  Shield: Shield,
  Wrench: Wrench,
  Leaf: Leaf,
  Users: Users,
};

interface PermissionTemplateSelectorProps {
  enabledModules: string[];
  onSelectTemplate: (permissions: any[]) => void;
  selectedTemplateId?: string;
}

export function PermissionTemplateSelector({
  enabledModules,
  onSelectTemplate,
  selectedTemplateId,
}: PermissionTemplateSelectorProps) {
  const handleSelectTemplate = (templateId: string) => {
    const permissions = applyTemplate(templateId, enabledModules);
    onSelectTemplate(permissions);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Quick Templates</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Select a pre-configured permission set for common roles
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {permissionTemplates.map((template) => {
          const Icon = iconMap[template.icon] || Shield;
          const isSelected = selectedTemplateId === template.id;
          
          // Calculate how many permissions apply to enabled modules
          const applicablePerms = applyTemplate(template.id, enabledModules);
          const permissionCount = applicablePerms.length;

          return (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => handleSelectTemplate(template.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </div>
                <CardDescription className="mt-2">
                  {template.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">
                    {permissionCount} permissions
                  </Badge>
                  <Button
                    size="sm"
                    variant={isSelected ? "default" : "outline"}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectTemplate(template.id);
                    }}
                  >
                    {isSelected ? "Applied" : "Apply"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
        <strong>Note:</strong> Templates only apply permissions for modules that are
        currently enabled for this site. You can customize any template after applying it.
      </div>
    </div>
  );
}

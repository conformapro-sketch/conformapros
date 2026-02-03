import { Fragment } from "react";
import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Scale } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BibliothequeHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export function BibliothequeHeader({
  title,
  subtitle,
  breadcrumbs,
  icon,
  actions,
}: BibliothequeHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Breadcrumb Navigation */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/bibliotheque/dashboard">Bibliothèque</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {breadcrumbs.map((crumb, i) => (
              <Fragment key={i}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {crumb.href ? (
                    <BreadcrumbLink asChild>
                      <Link to={crumb.href}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      {/* Header Content */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-primary shadow-elegant">
            {icon || <Scale className="h-6 w-6 text-white" />}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
            {subtitle && (
              <p className="text-muted-foreground text-sm">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}

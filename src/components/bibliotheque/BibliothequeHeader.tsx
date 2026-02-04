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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-2 sm:p-3 rounded-xl bg-gradient-primary shadow-elegant shrink-0">
            {icon || <Scale className="h-5 w-5 sm:h-6 sm:w-6 text-white" />}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">{title}</h1>
            {subtitle && (
              <p className="text-muted-foreground text-xs sm:text-sm truncate">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">{actions}</div>}
      </div>
    </div>
  );
}

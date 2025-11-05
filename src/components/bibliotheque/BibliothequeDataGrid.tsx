import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { BibliothequeRowActionsMenu } from "./BibliothequeRowActionsMenu";
import { ArrowUp, ArrowDown, FileText, Scale, FileCheck, Scroll } from "lucide-react";

interface BibliothequeDataGridProps {
  data: any[];
  onView: (texte: any) => void;
  onEdit: (texte: any) => void;
  onDelete: (texte: any) => void;
  onViewPdf?: (texte: any) => void;
  onToggleFavorite?: (texte: any) => void;
}

const TYPE_ICONS: Record<string, any> = {
  loi: Scale,
  decret: FileText,
  arrete: FileCheck,
  circulaire: Scroll,
  decision: FileCheck,
};

const TYPE_LABELS: Record<string, string> = {
  loi: "Loi",
  decret: "Décret",
  arrete: "Arrêté",
  circulaire: "Circulaire",
  decision: "Décision",
};

function getStatutBadge(statut: string) {
  const statuts: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    en_vigueur: { label: "En vigueur", variant: "default" },
    modifie: { label: "Modifié", variant: "secondary" },
    abroge: { label: "Abrogé", variant: "destructive" },
  };
  return statuts[statut] || { label: statut, variant: "outline" };
}

export function BibliothequeDataGrid({
  data,
  onView,
  onEdit,
  onDelete,
  onViewPdf,
  onToggleFavorite,
}: BibliothequeDataGridProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "type_acte",
      header: "Type",
      size: 120,
      cell: ({ row }) => {
        const type = row.original.type_acte;
        const Icon = TYPE_ICONS[type] || FileText;
        return (
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{TYPE_LABELS[type] || type}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "reference_officielle",
      header: "Référence",
      size: 300,
      cell: ({ row }) => (
        <HoverCard openDelay={200}>
          <HoverCardTrigger asChild>
            <span className="font-semibold text-primary cursor-pointer hover:underline line-clamp-3 leading-tight block whitespace-normal break-words">
              {row.original.reference_officielle}
            </span>
          </HoverCardTrigger>
          <HoverCardContent className="w-80" side="right">
            <div className="space-y-2">
              <p className="text-sm font-semibold">{row.original.reference_officielle}</p>
              <p className="text-xs text-muted-foreground">
                {row.original.intitule}
              </p>
            </div>
          </HoverCardContent>
        </HoverCard>
      ),
    },
    {
      accessorKey: "intitule",
      header: "Titre",
      size: 300,
      cell: ({ row }) => (
        <HoverCard openDelay={200}>
          <HoverCardTrigger asChild>
            <div className="cursor-pointer">
              <p className="line-clamp-2 text-sm whitespace-normal break-words">{row.original.intitule}</p>
            </div>
          </HoverCardTrigger>
          <HoverCardContent className="w-96" side="right">
            <div className="space-y-2">
              <p className="text-sm font-semibold">{row.original.intitule}</p>
              {row.original.resume && (
                <p className="text-xs text-muted-foreground">{row.original.resume}</p>
              )}
            </div>
          </HoverCardContent>
        </HoverCard>
      ),
    },
    {
      id: "statut_articles",
      header: "Statut & Articles",
      size: 180,
      cell: ({ row }) => {
        const statut = getStatutBadge(row.original.statut_vigueur);
        const articlesCount = row.original.articles?.[0]?.count || 0;
        return (
          <div className="flex flex-col gap-1.5">
            <Badge variant={statut.variant} className="w-fit">
              {statut.label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {articlesCount} article{articlesCount > 1 ? "s" : ""}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "date_publication",
      header: "Date",
      size: 120,
      cell: ({ row }) => {
        const date = row.original.date_publication;
        if (!date) return "-";
        return (
          <span className="text-sm whitespace-nowrap">
            {new Date(date).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        );
      },
    },
    {
      id: "actions",
      size: 100,
      cell: ({ row }) => (
        <BibliothequeRowActionsMenu
          texte={row.original}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewPdf={onViewPdf}
          onToggleFavorite={onToggleFavorite}
          isFavorite={false}
        />
      ),
      enableSorting: false,
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  return (
    <div className="rounded-md border bg-card w-full">
      <div className="overflow-x-auto">
        <Table className="table-fixed w-full">
          <TableHeader className="sticky top-0 bg-card z-10 border-b">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  
                  return (
                    <TableHead
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className={cn(
                        "relative",
                        canSort && "cursor-pointer select-none hover:bg-muted/50"
                      )}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    >
                      <div className="flex items-center gap-2">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {canSort && (
                          <span className="ml-auto">
                            {sorted === "asc" && <ArrowUp className="h-4 w-4" />}
                            {sorted === "desc" && <ArrowDown className="h-4 w-4" />}
                          </span>
                      )}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="transition-colors hover:bg-muted/70 cursor-pointer"
                  onClick={() => onView(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                      className="px-4 py-3"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Aucun résultat trouvé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

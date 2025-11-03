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
      size: 100,
      minSize: 80,
      maxSize: 150,
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
      size: 150,
      minSize: 120,
      maxSize: 200,
      cell: ({ row }) => (
        <HoverCard openDelay={300}>
          <HoverCardTrigger asChild>
            <span className="font-semibold text-primary cursor-pointer hover:underline truncate block">
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
      minSize: 200,
      maxSize: 500,
      cell: ({ row }) => (
        <HoverCard openDelay={300}>
          <HoverCardTrigger asChild>
            <div className="cursor-pointer">
              <p className="line-clamp-2 text-sm">{row.original.intitule}</p>
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
      size: 160,
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
      size: 110,
      minSize: 100,
      maxSize: 130,
      cell: ({ row }) => {
        const date = row.original.date_publication;
        if (!date) return "-";
        return (
          <span className="text-sm">
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
      size: 80,
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
      enableResizing: false,
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
    enableColumnResizing: true,
    columnResizeMode: "onChange",
  });

  return (
    <div className="rounded-md border bg-card">
      <div className="overflow-x-auto">
        <Table>
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
                      
                      {header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-border opacity-0 hover:opacity-100 transition-opacity"
                        />
                      )}
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
                  className={cn(
                    "transition-colors hover:bg-muted/50",
                    index % 2 === 0 && "bg-muted/30"
                  )}
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

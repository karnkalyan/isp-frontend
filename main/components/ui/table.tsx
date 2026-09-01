// table.tsx

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Core table components
const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
));
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
));
TableCell.displayName = "TableCell";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from "lucide-react";

// Reusable Pagination component
export interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  showItemCount?: boolean;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = [10, 20, 50, 100],
  showPageSizeSelector = false,
  showItemCount = true,
  className,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / (itemsPerPage || 10)));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  if (totalItems <= 0) return null;

  const startItem = (safeCurrentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(safeCurrentPage * itemsPerPage, totalItems);

  // Generate page numbers with ellipsis
  const getPageNumbers = (): (number | 'ellipsis-left' | 'ellipsis-right')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (safeCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, 'ellipsis-right', totalPages];
    }

    if (safeCurrentPage >= totalPages - 3) {
      return [1, 'ellipsis-left', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, 'ellipsis-left', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, 'ellipsis-right', totalPages];
  };

  const pages = getPageNumbers();

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 select-none", className)}>
      {showItemCount && (
        <div className="text-xs text-muted-foreground order-2 sm:order-1">
          Showing <span className="font-semibold text-foreground">{startItem}</span> to{" "}
          <span className="font-semibold text-foreground">{endItem}</span> of{" "}
          <span className="font-semibold text-foreground">{totalItems}</span> entries
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-1.5 order-1 sm:order-2 sm:ml-auto">
        {showPageSizeSelector && onItemsPerPageChange && (
          <div className="flex items-center gap-1.5 mr-3 text-xs text-muted-foreground">
            <span>Rows:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                onItemsPerPageChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* First Page Button */}
        {totalPages > 7 && (
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 hidden sm:inline-flex"
            disabled={safeCurrentPage === 1}
            onClick={() => onPageChange(1)}
            title="First Page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Previous Button */}
        <Button
          size="sm"
          variant="outline"
          className="h-8 px-2.5 gap-1 text-xs font-medium"
          disabled={safeCurrentPage === 1}
          onClick={() => onPageChange(safeCurrentPage - 1)}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        {/* Numbered Page Buttons with Ellipsis */}
        {pages.map((p, idx) => {
          if (p === 'ellipsis-left' || p === 'ellipsis-right') {
            const jumpTarget = p === 'ellipsis-left' ? Math.max(1, safeCurrentPage - 5) : Math.min(totalPages, safeCurrentPage + 5);
            return (
              <Button
                key={`${p}-${idx}`}
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => onPageChange(jumpTarget)}
                title={`Jump to page ${jumpTarget}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            );
          }

          const isCurrent = p === safeCurrentPage;
          return (
            <Button
              key={p}
              size="sm"
              variant={isCurrent ? "default" : "outline"}
              className={cn(
                "h-8 min-w-[32px] px-2.5 text-xs font-medium transition-colors",
                isCurrent && "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
              )}
              onClick={() => onPageChange(p)}
            >
              {p}
            </Button>
          );
        })}

        {/* Next Button */}
        <Button
          size="sm"
          variant="outline"
          className="h-8 px-2.5 gap-1 text-xs font-medium"
          disabled={safeCurrentPage === totalPages}
          onClick={() => onPageChange(safeCurrentPage + 1)}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>

        {/* Last Page Button */}
        {totalPages > 7 && (
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 hidden sm:inline-flex"
            disabled={safeCurrentPage === totalPages}
            onClick={() => onPageChange(totalPages)}
            title="Last Page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };

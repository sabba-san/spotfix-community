import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/design-revamp/components/ui/button';
import { cn } from '@/design-revamp/lib/utils';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  className?: string;
}

export function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  itemLabel = 'reports',
  className,
}: PaginationControlsProps) {
  if (totalItems <= pageSize || totalPages <= 1) {
    return null;
  }

  const safePage = Math.max(1, Math.min(currentPage, totalPages));
  const startItem = (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalItems);

  // Generate page numbers to display (up to 5 buttons with ellipses)
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (safePage <= 3) {
      return [1, 2, 3, 'ellipsis', totalPages];
    }
    if (safePage >= totalPages - 2) {
      return [1, 'ellipsis', totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, 'ellipsis', safePage, 'ellipsis', totalPages];
  };

  const pages = getPageNumbers();

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border/40 text-xs text-muted-foreground',
        className,
      )}
    >
      <div>
        Showing <span className="font-medium text-foreground">{startItem}–{endItem}</span> of{' '}
        <span className="font-medium text-foreground">{totalItems}</span> {itemLabel}
      </div>

      <nav aria-label="Pagination" className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 min-w-[36px] px-2.5 gap-1 text-xs"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Prev</span>
        </Button>

        <div className="flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === 'ellipsis') {
              return (
                <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground select-none">
                  …
                </span>
              );
            }
            const isCurrent = p === safePage;
            return (
              <Button
                key={p}
                type="button"
                variant={isCurrent ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'h-8 min-w-[36px] px-2.5 text-xs font-medium',
                  isCurrent && 'pointer-events-none shadow-xs',
                )}
                aria-current={isCurrent ? 'page' : undefined}
                onClick={() => onPageChange(p)}
              >
                {p}
              </Button>
            );
          })}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 min-w-[36px] px-2.5 gap-1 text-xs"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </nav>
    </div>
  );
}

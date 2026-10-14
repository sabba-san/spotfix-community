import { cn } from '@/design-revamp/lib/utils';
import { Badge } from '@/design-revamp/components/ui/badge';

export type ReportStatus = 'Reported' | 'Assigned' | 'In Progress' | 'Resolved';

interface Report {
  id?: string;
  _id?: string;
  category?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  location?: string;
  details?: string;
  status?: ReportStatus;
  timestamp?: string;
  createdAt?: string;
  updatedAt?: string;
  evidencePhoto?: string;
  photos?: string[];
  resolutionPhoto?: string;
  assignedTo?: string;
}

const statusStyles: Record<ReportStatus, string> = {
  Reported: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  Assigned: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  'In Progress': 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  Resolved: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
};

const priorityStyles: Record<string, string> = {
  Low: 'text-muted-foreground',
  Medium: 'text-blue-600 dark:text-blue-400',
  High: 'text-orange-600 dark:text-orange-400',
  Critical: 'text-red-600 dark:text-red-400',
};

function collectImages(report: Report): string[] {
  return [
    ...(report.evidencePhoto ? [report.evidencePhoto] : []),
    ...(Array.isArray(report.photos) ? report.photos : []),
    ...(report.resolutionPhoto ? [report.resolutionPhoto] : []),
  ].filter((entry, index, all) => typeof entry === 'string' && entry && all.indexOf(entry) === index);
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'Not recorded';
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Invalid date';
  }
}

interface ReportRowProps {
  report: Report;
  onClick?: () => void;
  selected?: boolean;
  showAssignee?: boolean;
}

export function ReportRow({ report, onClick, selected, showAssignee }: ReportRowProps) {
  const id = report.id || report._id || '';
  const status = report.status || 'Reported';
  const images = collectImages(report);
  const previewImages = images.slice(0, 3);

  return (
    <article
      className={cn(
        'rounded-lg border p-4 transition-colors',
        onClick && 'cursor-pointer hover:border-primary/50',
        selected && 'border-primary ring-2 ring-primary/20',
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-primary">{id}</h3>
          <p className={cn('text-sm', priorityStyles[report.priority || 'Medium'])}>
            {report.category || 'General'} · {report.priority || 'Medium'}
          </p>
        </div>
        <Badge className={cn('shrink-0', statusStyles[status as ReportStatus] || statusStyles.Reported)}>
          {status}
        </Badge>
      </div>

      <p className="mt-2 text-sm text-muted-foreground">{report.location || 'Location not specified'}</p>
      <p className="mt-1 line-clamp-2 text-sm">{report.details || 'No details provided.'}</p>

      {previewImages.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {previewImages.map((src, i) => (
            <img
              key={`${id}-photo-${i}`}
              src={src}
              alt={`Evidence ${i + 1}`}
              className="h-16 w-16 shrink-0 rounded-md border object-cover"
              loading="lazy"
            />
          ))}
          {images.length > previewImages.length && (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-dashed text-xs font-medium text-muted-foreground">
              +{images.length - previewImages.length}
            </div>
          )}

          {report.evidencePhoto && report.resolutionPhoto && (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2" aria-label="Before and after">
              <figure className="overflow-hidden rounded-lg border bg-muted/20">
                <img
                  src={report.evidencePhoto}
                  alt="Before cleaning"
                  className="h-36 w-full object-cover"
                  loading="lazy"
                />
                <figcaption className="px-3 py-2 text-xs font-semibold text-muted-foreground">Before</figcaption>
              </figure>
              <figure className="overflow-hidden rounded-lg border bg-muted/20">
                <img
                  src={report.resolutionPhoto}
                  alt="After cleaning"
                  className="h-36 w-full object-cover"
                  loading="lazy"
                />
                <figcaption className="px-3 py-2 text-xs font-semibold text-muted-foreground">After</figcaption>
              </figure>
            </div>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <time>{formatDate(report.timestamp || report.createdAt || report.updatedAt)}</time>
        {showAssignee && report.assignedTo && (
          <span>Assigned to: {report.assignedTo}</span>
        )}
      </div>
    </article>
  );
}

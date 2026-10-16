import { MapPin, User, Zap, Droplets, Sparkles, AlertTriangle, Wrench, FileText } from 'lucide-react';
import { cn } from '@/design-revamp/lib/utils';
import { Badge } from '@/design-revamp/components/ui/badge';

export type ReportStatus = 'Reported' | 'Assigned' | 'In Progress' | 'Resolved' | 'Awaiting Endorsement' | string;

interface Report {
  id?: string;
  _id?: string;
  publicId?: string;
  public_id?: string;
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

const statusStyles: Record<string, string> = {
  Reported: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950 dark:text-red-300',
  Pending: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950 dark:text-red-300',
  Submitted: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950 dark:text-red-300',
  Assigned: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950 dark:text-blue-300',
  'In Progress': 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950 dark:text-amber-300',
  'Awaiting Endorsement': 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900/60 dark:bg-purple-950 dark:text-purple-300',
  Resolved: 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950 dark:text-green-300',
  'Resolved By Cleaner': 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900/60 dark:bg-purple-950 dark:text-purple-300',
};

const priorityDotStyles: Record<string, string> = {
  Low: 'bg-muted-foreground/60',
  Medium: 'bg-blue-500',
  High: 'bg-orange-500',
  Critical: 'bg-red-500 animate-pulse',
};

function collectImages(report: Report): string[] {
  return [
    ...(report.evidencePhoto ? [report.evidencePhoto] : []),
    ...(Array.isArray(report.photos) ? report.photos : []),
    ...(report.resolutionPhoto ? [report.resolutionPhoto] : []),
  ].filter((entry, index, all) => typeof entry === 'string' && entry && all.indexOf(entry) === index);
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'Recently';
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Recently';
  }
}

function getCategoryIcon(category?: string) {
  const cat = (category || '').toLowerCase();
  if (cat.includes('electr')) return Zap;
  if (cat.includes('plumb') || cat.includes('water') || cat.includes('leak')) return Droplets;
  if (cat.includes('clean') || cat.includes('litter') || cat.includes('trash')) return Sparkles;
  if (cat.includes('safe') || cat.includes('hazard') || cat.includes('secur')) return AlertTriangle;
  if (cat.includes('facilit') || cat.includes('maint') || cat.includes('build')) return Wrench;
  return FileText;
}

function formatStatusLabel(statusStr?: string): string {
  if (!statusStr) return 'Reported';
  if (statusStr.includes('_')) {
    return statusStr
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }
  return statusStr.charAt(0).toUpperCase() + statusStr.slice(1);
}

interface ReportRowProps {
  report: Report;
  onClick?: () => void;
  selected?: boolean;
  showAssignee?: boolean;
}

export function ReportRow({ report, onClick, selected, showAssignee = true }: ReportRowProps) {
  const rawId = report.publicId || report.public_id || report.id || report._id || 'RPT-UNKNOWN';
  const id = rawId.startsWith('RPT-')
    ? rawId
    : rawId.startsWith('cmv') || rawId.length > 15
      ? `RPT-${rawId.slice(-5).toUpperCase()}`
      : rawId;

  const rawStatus = report.status || 'Reported';
  const displayStatus = formatStatusLabel(rawStatus);
  const statusBadgeStyle = statusStyles[displayStatus] || statusStyles[rawStatus] || statusStyles.Reported;

  const priority = report.priority || 'Medium';
  const category = report.category || 'General';
  const images = collectImages(report);
  const thumbnail = images[0];
  const CategoryIcon = getCategoryIcon(category);

  return (
    <article
      className={cn(
        'group flex items-start gap-3 rounded-xl border border-border/80 bg-card p-3 transition-all hover:border-primary/40 hover:shadow-xs active:scale-[0.99]',
        onClick && 'cursor-pointer',
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
      {/* 1. Picture: 64x64 fixed thumbnail or category placeholder */}
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted/30">
        {thumbnail ? (
          <>
            <img
              src={thumbnail}
              alt={`Photo for ${id}`}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
            {images.length > 1 && (
              <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1 py-0.5 text-[9px] font-semibold text-white backdrop-blur-xs">
                +{images.length - 1}
              </span>
            )}
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground/60">
            <CategoryIcon className="h-5 w-5" />
            <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/50">
              No photo
            </span>
          </div>
        )}
      </div>

      {/* 2. Content Body */}
      <div className="min-w-0 flex-1 space-y-1">
        {/* Top Line: Ticket ID + Category/Priority + Status Badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <h4 className="font-mono text-xs sm:text-sm font-bold text-primary tracking-tight truncate">
              {id}
            </h4>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground truncate">
              <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', priorityDotStyles[priority] || priorityDotStyles.Medium)} />
              {category} · {priority}
            </span>
          </div>
          <Badge
            variant="outline"
            className={cn('shrink-0 text-[10px] sm:text-xs font-semibold px-2 py-0.5', statusBadgeStyle)}
          >
            {displayStatus}
          </Badge>
        </div>

        {/* Location Line */}
        <div className="flex items-center gap-1 text-xs font-medium text-foreground truncate">
          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="truncate">{report.location || 'Location not specified'}</span>
        </div>

        {/* Short Description Snippet (1-line truncated) */}
        <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
          {report.details || 'No details provided.'}
        </p>

        {/* Bottom Line: Assignee + Date */}
        <div className="flex items-center justify-between gap-2 pt-1 text-[11px] text-muted-foreground border-t border-border/30">
          <div className="flex items-center gap-1 truncate">
            {showAssignee && (
              <>
                <User className="h-3 w-3 shrink-0 text-muted-foreground/80" />
                {report.assignedTo ? (
                  <span className="font-medium text-foreground/90 truncate">
                    {report.assignedTo}
                  </span>
                ) : (
                  <span className="italic text-muted-foreground/70">Unassigned</span>
                )}
              </>
            )}
          </div>
          <time className="shrink-0 text-muted-foreground/70 text-[10px] sm:text-[11px]">
            {formatDate(report.timestamp || report.createdAt || report.updatedAt)}
          </time>
        </div>
      </div>
    </article>
  );
}

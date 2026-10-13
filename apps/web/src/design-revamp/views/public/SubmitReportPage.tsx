import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, MapPin, Navigation, Send, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/design-revamp/hooks/useAuth';
import { useSubmitReport } from '@/design-revamp/hooks/useReports';
import { Button } from '@/design-revamp/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/design-revamp/components/ui/card';
import { Label } from '@/design-revamp/components/ui/label';
import { Textarea } from '@/design-revamp/components/ui/textarea';
import { PhotoUploader } from '@/design-revamp/components/composites/PhotoUploader';

const CATEGORIES = ['Litter', 'Spill', 'Restroom', 'Floor', 'Damage', 'General'] as const;
const PRIORITIES = [
  { level: 'Low', desc: 'Routine cleanup' },
  { level: 'Medium', desc: 'Standard attention' },
  { level: 'High', desc: 'Urgent hazard' },
  { level: 'Critical', desc: 'Immediate response' },
] as const;

export default function SubmitReportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const submitReport = useSubmitReport();

  const [category, setCategory] = useState<string>('Litter');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [location, setLocation] = useState('');
  const [details, setDetails] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | undefined>();
  const [errorMessage, setErrorMessage] = useState('');

  const handleUseLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoordinates({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        });
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim() || !details.trim()) return;

    setErrorMessage('');
    try {
      await submitReport.mutateAsync({
        category,
        priority,
        location: location.trim(),
        details: details.trim(),
        coordinates,
        reporterPhone: user?.phone || '',
        evidencePhoto: photos[0] || '',
        photos,
        photoTimestamp: photos.length > 0 ? new Date().toISOString() : undefined,
      });
      navigate('/my-reports');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to submit report. Please try again.');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Submit Incident Report</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Help maintain our community. Submit verified infrastructure issues for immediate cleaning response.
        </p>
      </div>

      <Card className="border border-border/80 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Incident Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMessage && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Category Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Category
              </Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      className={`min-h-[44px] rounded-lg border px-4 py-2 text-xs font-medium transition-all active:scale-[0.98] ${
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                          : 'border-border bg-card text-foreground hover:border-primary/40'
                      }`}
                      onClick={() => setCategory(cat)}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Urgency Priority
              </Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {PRIORITIES.map((p) => {
                  const isSelected = priority === p.level;
                  return (
                    <button
                      key={p.level}
                      type="button"
                      className={`min-h-[52px] rounded-lg border p-2 text-left transition-all active:scale-[0.98] ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                          : 'border-border bg-card text-foreground hover:border-primary/40'
                      }`}
                      onClick={() => setPriority(p.level)}
                    >
                      <p className="font-semibold text-xs">{p.level}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{p.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Location Input */}
            <div className="space-y-2">
              <Label htmlFor="location" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Location or Facility
              </Label>
              <div className="flex gap-2">
                <input
                  id="location"
                  type="text"
                  className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  placeholder="e.g. Block C, Level 2, Restroom 204"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 shrink-0 active:scale-[0.98]"
                  onClick={handleUseLocation}
                  disabled={isLocating}
                  title="Detect GPS location"
                >
                  {isLocating ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <Navigation className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {coordinates && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  Coordinates recorded: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                </p>
              )}
            </div>

            {/* Description Textarea */}
            <div className="space-y-2">
              <Label htmlFor="details" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Problem Description
              </Label>
              <Textarea
                id="details"
                placeholder="Provide specific details so our cleaning crew can respond effectively..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                required
                rows={4}
                className="min-h-[100px] text-sm resize-y"
              />
            </div>

            {/* Evidence Photos */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Photo Evidence
              </Label>
              <PhotoUploader photos={photos} onChange={setPhotos} disabled={submitReport.isPending} />
            </div>

            {/* Submit Action */}
            <Button
              type="submit"
              className="w-full h-12 gradient-bg shadow-accent hover:brightness-110 active:scale-[0.98] text-sm font-semibold"
              disabled={submitReport.isPending || !location.trim() || !details.trim()}
            >
              {submitReport.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting report...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Dispatch Incident Report
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

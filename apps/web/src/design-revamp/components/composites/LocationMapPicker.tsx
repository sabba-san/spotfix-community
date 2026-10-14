import { useEffect, useMemo, useState } from 'react';
import Map, { Marker, NavigationControl, type MapLayerMouseEvent } from 'react-map-gl/maplibre';
import { AlertTriangle, Crosshair, Loader2, MapPin } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Button } from '@/design-revamp/components/ui/button';
import { getGeoConfig, resolveGeoLocation } from '@/design-revamp/lib/api';

export interface Coordinates {
  lat: number;
  lng: number;
}

interface LocationMapPickerProps {
  coordinates?: Coordinates;
  onChange: (coordinates: Coordinates, suggestedAddress?: string) => void;
  disabled?: boolean;
}

interface GeoConfig {
  configured?: boolean;
  campus?: {
    display_name: string;
    center_lat: number;
    center_lng: number;
    default_zoom: number;
  } | null;
}

const FALLBACK_VIEW = { latitude: 0, longitude: 0, zoom: 1 };
const MAP_STYLE =
  import.meta.env.VITE_MAP_STYLE_URL || 'https://demotiles.maplibre.org/style.json';

export function LocationMapPicker({ coordinates, onChange, disabled }: LocationMapPickerProps) {
  const [config, setConfig] = useState<GeoConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;
    getGeoConfig()
      .then((nextConfig) => {
        if (active) setConfig(nextConfig);
      })
      .catch((error: Error) => {
        if (active) setErrorMessage(error.message);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const initialView = useMemo(() => {
    if (coordinates) {
      return { latitude: coordinates.lat, longitude: coordinates.lng, zoom: 16 };
    }
    if (config?.campus) {
      return {
        latitude: config.campus.center_lat,
        longitude: config.campus.center_lng,
        zoom: config.campus.default_zoom,
      };
    }
    return FALLBACK_VIEW;
  }, [config, coordinates]);

  const selectPoint = async (nextCoordinates: Coordinates) => {
    onChange(nextCoordinates);
    try {
      const resolved = await resolveGeoLocation(nextCoordinates.lat, nextCoordinates.lng);
      if (resolved?.suggested_address) onChange(nextCoordinates, resolved.suggested_address);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not resolve this location.');
    }
  };

  const handleMapClick = (event: MapLayerMouseEvent) => {
    if (disabled) return;
    void selectPoint({ lat: event.lngLat.lat, lng: event.lngLat.lng });
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Location services are not available in this browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void selectPoint({
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
        }).finally(() => setIsLocating(false));
      },
      (error) => {
        setErrorMessage(error.message || 'Could not access your current location.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="space-y-2">
      <div className="relative h-64 overflow-hidden rounded-lg border border-border bg-muted sm:h-72">
        {isLoading ? (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading map...
          </div>
        ) : (
          <Map
            initialViewState={initialView}
            mapStyle={MAP_STYLE}
            onClick={handleMapClick}
            reuseMaps
            attributionControl
          >
            <NavigationControl position="top-right" showCompass={false} />
            {coordinates && (
              <Marker longitude={coordinates.lng} latitude={coordinates.lat} anchor="bottom">
                <MapPin className="h-8 w-8 fill-primary text-primary drop-shadow-md" />
              </Marker>
            )}
          </Map>
        )}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="absolute bottom-3 left-3 gap-2 shadow-md"
          onClick={handleUseLocation}
          disabled={disabled || isLocating}
        >
          {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
          Use current location
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Click the map to place the incident marker, or use your current location.
        {config?.campus?.display_name ? ` Map area: ${config.campus.display_name}.` : ''}
      </p>
      {errorMessage && (
        <p className="flex items-start gap-1.5 text-xs text-destructive" role="alert">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {errorMessage}
        </p>
      )}
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { toast } from 'sonner';

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationMapProps {
  latitude: number;
  longitude: number;
  centerName?: string;
  centerSlug: string;
  onPositionChange?: (lat: number, lng: number) => void;
}

function MapUpdater({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView([latitude, longitude], 13);
  }, [latitude, longitude, map]);
  
  return null;
}

export function LocationMap({ latitude, longitude, centerName, centerSlug, onPositionChange }: LocationMapProps) {
  // Default to center of France if no coordinates
  const lat = latitude || 46.603354;
  const lng = longitude || 1.888334;
  const [position, setPosition] = useState<[number, number]>([lat, lng]);
  const [isSaving, setIsSaving] = useState(false);
  const markerRef = useRef<L.Marker>(null);

  useEffect(() => {
    setPosition([lat, lng]);
  }, [lat, lng]);

  const handleDragEnd = async () => {
    const marker = markerRef.current;
    if (marker != null) {
      const newPos = marker.getLatLng();
      setPosition([newPos.lat, newPos.lng]);
      
      setIsSaving(true);
      try {
        // Save new position to API
        const response = await fetch(`/api/centers/${centerSlug}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: newPos.lat,
            longitude: newPos.lng,
          }),
        });

        if (response.ok) {
          toast.success(`Position mise à jour: ${newPos.lat.toFixed(6)}, ${newPos.lng.toFixed(6)}`);
          if (onPositionChange) {
            onPositionChange(newPos.lat, newPos.lng);
          }
        } else {
          throw new Error('Failed to update position');
        }
      } catch (error) {
        console.error('Error updating position:', error);
        toast.error('Erreur lors de la mise à jour de la position');
        // Revert to original position
        setPosition([lat, lng]);
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="relative">
      <div className="h-[300px] w-full rounded-xl overflow-hidden border border-white/10">
        <MapContainer
          center={position}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker 
            position={position}
            draggable={true}
            ref={markerRef}
            eventHandlers={{
              dragend: handleDragEnd,
            }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{centerName || 'Centre de plongée'}</p>
                <p className="text-xs text-gray-600 mt-1">
                  Glissez-déposez pour ajuster la position
                </p>
              </div>
            </Popup>
          </Marker>
          <MapUpdater latitude={position[0]} longitude={position[1]} />
        </MapContainer>
      </div>
      {isSaving && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-cyan-500 text-white px-4 py-2 rounded-lg text-sm shadow-lg">
          💾 Sauvegarde en cours...
        </div>
      )}
      <div className="mt-2 text-xs text-white/60 text-center">
        💡 Astuce: Glissez le marqueur 📍 pour ajuster la position exacte
      </div>
    </div>
  );
}

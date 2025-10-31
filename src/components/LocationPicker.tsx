import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, MapPin } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface LocationPickerProps {
  lat?: number | null;
  lng?: number | null;
  onLocationChange: (lat: number, lng: number) => void;
}

function MapClickHandler({ onLocationChange }: { onLocationChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function LocationPicker({ lat, lng, onLocationChange }: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number] | null>(
    lat && lng ? [lat, lng] : null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (lat && lng) {
      setPosition([lat, lng]);
    }
  }, [lat, lng]);

  const handleLocationChange = (newLat: number, newLng: number) => {
    setPosition([newLat, newLng]);
    onLocationChange(newLat, newLng);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const newLat = parseFloat(data[0].lat);
        const newLng = parseFloat(data[0].lon);
        handleLocationChange(newLat, newLng);
      }
    } catch (error) {
      console.error("Erreur lors de la recherche:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const defaultCenter: [number, number] = [36.8, 10.2]; // Tunisia center
  const defaultZoom = 7;

  return (
    <div className="space-y-4">
      <div className="border-t pt-4">
        <Label className="text-sm font-medium mb-2 block flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Localisation (optionnel)
        </Label>
        
        {/* Search box */}
        <div className="flex gap-2 mb-3">
          <Input
            placeholder="Rechercher une adresse en Tunisie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleSearch}
            disabled={isSearching}
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Interactive Map */}
        <div className="h-[300px] rounded-md overflow-hidden border mb-3">
          <MapContainer
            center={position || defaultCenter}
            zoom={position ? 12 : defaultZoom}
            style={{ height: "100%", width: "100%" }}
            key={position ? `${position[0]}-${position[1]}` : 'default'}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onLocationChange={handleLocationChange} />
            {position && (
              <Marker
                position={position}
                draggable={true}
                eventHandlers={{
                  dragend: (e) => {
                    const marker = e.target;
                    const pos = marker.getLatLng();
                    handleLocationChange(pos.lat, pos.lng);
                  },
                }}
              />
            )}
          </MapContainer>
        </div>

        {/* Coordinates display */}
        {position && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Latitude</Label>
              <p className="text-sm font-medium">{position[0].toFixed(6)}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Longitude</Label>
              <p className="text-sm font-medium">{position[1].toFixed(6)}</p>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-2">
          Cliquez sur la carte pour placer un marqueur ou faites-le glisser pour ajuster la position
        </p>
      </div>
    </div>
  );
}

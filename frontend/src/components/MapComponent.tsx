import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { mockVillages, Village, getRiskColor } from '@/lib/mockData';

// Fix for default icon issue with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface MapComponentProps {
  onVillageSelect: (village: Village) => void;
  selectedVillage?: Village;
}

// Custom hook to recenter map
const RecenterAutomatically = ({ village }: { village: Village | undefined }) => {
  const map = useMap();
  useEffect(() => {
    if (village && village.latitude && village.longitude) {
      map.setView([village.latitude, village.longitude], 10);
    }
  }, [village]);
  return null;
}

const MapComponent: React.FC<MapComponentProps> = ({ onVillageSelect, selectedVillage }) => {
  const center: [number, number] = [25.5, 93.5]; // Centered on Northeast India

  const createCustomIcon = (riskLevel: 'low' | 'moderate' | 'high') => {
    const color = getRiskColor(riskLevel);
    const markerHtml = `
      <div style="background-color: ${color};" class="w-6 h-6 rounded-full border-2 border-white shadow-lg"></div>
    `;
    return L.divIcon({
      html: markerHtml,
      className: 'custom-leaflet-icon',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };

  return (
    <div className="relative w-full h-96 rounded-lg border-2 border-gray-200 overflow-hidden">
      <MapContainer center={center} zoom={7} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mockVillages.map((village) => (
          village.latitude && village.longitude && (
            <Marker
              key={village.village_id}
              position={[village.latitude, village.longitude]}
              icon={createCustomIcon(village.risk_level)}
              eventHandlers={{
                click: () => {
                  onVillageSelect(village);
                },
              }}
            >
              <Popup>
                <b>{village.village_name}</b><br />
                {village.district}, {village.state}<br />
                Risk: {village.risk_level}<br />
                Cases: {village.total_cases}
              </Popup>
            </Marker>
          )
        ))}
        <RecenterAutomatically village={selectedVillage} />
      </MapContainer>
    </div>
  );
};

export default MapComponent;
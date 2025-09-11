import React, { useState } from 'react';
import { mockVillages, Village, getRiskColor } from '@/lib/mockData';

interface MapComponentProps {
  onVillageSelect: (village: Village) => void;
  selectedVillage?: Village;
}

const MapComponent: React.FC<MapComponentProps> = ({ onVillageSelect, selectedVillage }) => {
  const [hoveredVillage, setHoveredVillage] = useState<Village | null>(null);

  // Simple map representation using a grid layout
  const getVillagePosition = (village: Village) => {
    // Position villages based on their approximate geographical locations
    const positions: { [key: number]: { top: string; left: string } } = {
      1: { top: '45%', left: '75%' }, // Kohima, Nagaland
      2: { top: '50%', left: '70%' }, // Dimapur, Nagaland
      3: { top: '25%', left: '65%' }, // Itanagar, Arunachal Pradesh
      4: { top: '55%', left: '50%' }, // Guwahati, Assam
      5: { top: '65%', left: '65%' }, // Imphal, Manipur
      6: { top: '60%', left: '45%' }, // Shillong, Meghalaya
      7: { top: '75%', left: '60%' }, // Aizawl, Mizoram
      8: { top: '35%', left: '40%' }, // Gangtok, Sikkim
      9: { top: '80%', left: '55%' }  // Agartala, Tripura
    };
    return positions[village.village_id] || { top: '50%', left: '50%' };
  };

  return (
    <div className="relative w-full h-96 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg border-2 border-gray-200 overflow-hidden">
      {/* Map Background */}
      <div className="absolute inset-0 opacity-20">
        <svg viewBox="0 0 400 300" className="w-full h-full">
          {/* Simplified Northeast India outline */}
          <path
            d="M50 150 Q100 100 150 120 Q200 110 250 130 Q300 140 350 160 Q340 200 300 220 Q250 240 200 230 Q150 220 100 200 Q70 180 50 150"
            fill="currentColor"
            className="text-green-200"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* State Labels */}
      <div className="absolute top-4 left-4 text-sm font-semibold text-gray-600">
        Northeast India - Health Surveillance Map
      </div>

      {/* Village Pins */}
      {mockVillages.map((village) => {
        const position = getVillagePosition(village);
        const isSelected = selectedVillage?.village_id === village.village_id;
        const isHovered = hoveredVillage?.village_id === village.village_id;

        return (
          <div
            key={village.village_id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
            style={{ top: position.top, left: position.left }}
            onClick={() => onVillageSelect(village)}
            onMouseEnter={() => setHoveredVillage(village)}
            onMouseLeave={() => setHoveredVillage(null)}
          >
            {/* Pin */}
            <div
              className={`w-6 h-6 rounded-full border-2 border-white shadow-lg transition-all duration-200 ${isSelected ? 'scale-150 ring-4 ring-blue-300' :
                  isHovered ? 'scale-125' : ''
                }`}
              style={{ backgroundColor: getRiskColor(village.risk_level) }}
            />

            {/* Village Name Label */}
            <div className={`absolute top-8 left-1/2 transform -translate-x-1/2 text-xs font-medium px-2 py-1 rounded shadow-md transition-opacity duration-200 ${isHovered || isSelected ? 'opacity-100 bg-white border' : 'opacity-0'
              }`}>
              {village.village_name}
              <div className="text-xs text-gray-500">
                {village.total_cases} cases
              </div>
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg border">
        <h4 className="text-sm font-semibold mb-2">Risk Levels</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getRiskColor('low') }}></div>
            <span>Low (≤10 cases)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getRiskColor('moderate') }}></div>
            <span>Moderate (11-20)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getRiskColor('high') }}></div>
            <span>High (&gt;20 cases)</span>
          </div>
        </div>
      </div>

      {/* Hover Tooltip */}
      {hoveredVillage && (
        <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg border max-w-xs">
          <h4 className="font-semibold">{hoveredVillage.village_name}</h4>
          <p className="text-sm text-gray-600">{hoveredVillage.district}, {hoveredVillage.state}</p>
          <p className="text-sm">
            <span className={`inline-block w-2 h-2 rounded-full mr-1`}
              style={{ backgroundColor: getRiskColor(hoveredVillage.risk_level) }}></span>
            {hoveredVillage.total_cases} cases ({hoveredVillage.risk_level} risk)
          </p>
        </div>
      )}
    </div>
  );
};

export default MapComponent;

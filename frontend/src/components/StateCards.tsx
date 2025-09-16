
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  PawPrint, // Mithun
  Box, // Xorai
  Ghost, // Kanglasha (placeholder for mythical creature)
  Cloud, // Meghalaya Emblem (mountains and clouds)
  Palette, // Puan (fabric)
  Bird, // Hornbill
  Leaf, // Red Panda (placeholder for nature/animal)
  LandPlot, // Temple (placeholder for structure)
  ExternalLink,
  Mountain, // Arunachal Pradesh
  Coffee, // Assam
  Swords, // Manipur
  CloudRain, // Meghalaya
  Bamboo, // Mizoram
  Feather, // Nagaland
  Snowflake, // Sikkim
  Building, // Tripura
  SquareStack // Mizoram (Puan)
} from 'lucide-react';

interface StateData {
  name: string;
  icon: React.ReactNode;
  statistic: string;
  healthPortalUrl: string;
  backgroundClass: string;
}

const statesData: StateData[] = [
  {
    name: "Arunachal Pradesh",
    icon: <Mountain className="w-8 h-8 text-blue-600" />,
    statistic: "Infant mortality rate: 13 per 1,000 live births",
    healthPortalUrl: "https://arunachalhealth.com/",
    backgroundClass: "bg-gradient-to-br from-blue-100 to-blue-200",
  },
  {
    name: "Assam",
    icon: <Coffee className="w-8 h-8 text-green-600" />,
    statistic: "Total Fertility Rate (TFR): 2.2",
    healthPortalUrl: "https://health.assam.gov.in/",
    backgroundClass: "bg-gradient-to-br from-green-100 to-green-200",
  },
  {
    name: "Manipur",
    icon: <Swords className="w-8 h-8 text-purple-600" />,
    statistic: "Infant Mortality Rate (IMR): 10 per 1,000 live births",
    healthPortalUrl: "https://mn.gov.in/",
    backgroundClass: "bg-gradient-to-br from-purple-100 to-purple-200",
  },
  {
    name: "Meghalaya",
    icon: <CloudRain className="w-8 h-8 text-gray-600" />,
    statistic: "Institutional Deliveries: 59.7%",
    healthPortalUrl: "https://meghealth.gov.in/",
    backgroundClass: "bg-gradient-to-br from-gray-100 to-gray-200",
  },
  {
    name: "Mizoram",
    icon: <SquareStack className="w-8 h-8 text-pink-600" />,
    statistic: "Infant Mortality Rate (IMR): 21.3 per 1,000 live births",
    healthPortalUrl: "https://health.mizoram.gov.in/",
    backgroundClass: "bg-gradient-to-br from-pink-100 to-pink-200",
  },
  {
    name: "Nagaland",
    icon: <Feather className="w-8 h-8 text-yellow-600" />,
    statistic: "No deaths from Malaria, Dengue, or Kala Azar (FY 2019-20)",
    healthPortalUrl: "https://health.nagaland.gov.in/",
    backgroundClass: "bg-gradient-to-br from-yellow-100 to-yellow-200",
  },
  {
    name: "Sikkim",
    icon: <Snowflake className="w-8 h-8 text-red-600" />,
    statistic: "Institutional Deliveries: 99.4%",
    healthPortalUrl: "http://health.sikkim.gov.in/",
    backgroundClass: "bg-gradient-to-br from-red-100 to-red-200",
  },
  {
    name: "Tripura",
    icon: <Building className="w-8 h-8 text-orange-600" />,
    statistic: "Localized outbreak of acute diarrheal disease (ADD) affected 130 individuals (2022-2023).",
    healthPortalUrl: "https://health.tripura.gov.in/",
    backgroundClass: "bg-gradient-to-br from-orange-100 to-orange-200",
  },
];

const StateCards: React.FC = () => {
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  return (
    <TooltipProvider>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mx-auto">
        {statesData.map((state) => (
          <Tooltip key={state.name}>
            <TooltipTrigger asChild>
              <motion.div
                className={`relative flex flex-col items-center justify-center p-4 rounded-lg shadow-md cursor-pointer overflow-hidden ${state.backgroundClass}`}
                onHoverStart={() => setHoveredState(state.name)}
                onHoverEnd={() => setHoveredState(null)}
                whileHover={{ scale: 1.05, boxShadow: "0 8px 16px rgba(0,0,0,0.2)" }}
                transition={{ duration: 0.2 }}
              >
                <div className="relative z-10 flex flex-col items-center">
                  {state.icon}
                  <h3 className="mt-2 text-lg font-semibold text-gray-800 text-center">{state.name}</h3>
                </div>
                {hoveredState === state.name && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 bg-blue-500/90 text-white flex flex-col items-center justify-center p-4 rounded-lg text-center z-20"
                  >
                    <p className="text-sm font-medium">{state.statistic}</p>
                    <a 
                      href={state.healthPortalUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="mt-2 text-xs underline flex items-center"
                      onClick={(e) => e.stopPropagation()} // Prevent triggering parent hover
                    >
                      Visit Portal <ExternalLink className="ml-1 w-3 h-3" />
                    </a>
                  </motion.div>
                )}
              </motion.div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{state.statistic}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};

export default StateCards;

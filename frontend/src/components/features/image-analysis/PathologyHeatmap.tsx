import React, { useState } from 'react';
import { Pathology } from '../../types/medical.types';
import { X } from 'lucide-react';
import { Badge } from '../../ui/Badge';

interface PathologyHeatmapProps {
  pathologies: Pathology[];
  showHeatmap: boolean;
  onPathologySelect: (pathologyId: string | null) => void;
}

export const PathologyHeatmap: React.FC<PathologyHeatmapProps> = ({
  pathologies,
  showHeatmap,
  onPathologySelect,
}) => {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  if (!showHeatmap) return null;

  // Simulated heatmap regions (in a real app, these would be calculated from Grad-CAM)
  const regions = [
    { id: 'upper-left', top: '10%', left: '20%', pathologyId: '1' },
    { id: 'upper-right', top: '15%', left: '60%', pathologyId: '3' },
    { id: 'middle', top: '40%', left: '40%', pathologyId: '5' },
    { id: 'lower-left', top: '70%', left: '30%', pathologyId: '8' },
    { id: 'lower-right', top: '65%', left: '65%', pathologyId: '10' },
  ];

  const handleRegionClick = (regionId: string, pathologyId: string) => {
    setSelectedRegion(regionId === selectedRegion ? null : regionId);
    onPathologySelect(regionId === selectedRegion ? null : pathologyId);
  };

  const getSelectedPathology = () => {
    if (!selectedRegion) return null;
    const region = regions.find(r => r.id === selectedRegion);
    if (!region) return null;
    return pathologies.find(p => p.id === region.pathologyId);
  };

  const selectedPathology = getSelectedPathology();

  return (
    <>
      {/* Heatmap Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {regions.map((region) => {
          const pathology = pathologies.find(p => p.id === region.pathologyId);
          const isSelected = region.id === selectedRegion;
          
          return (
            <div
              key={region.id}
              className="absolute w-16 h-16 rounded-full cursor-pointer pointer-events-auto transition-all duration-300"
              style={{
                top: region.top,
                left: region.left,
                transform: isSelected ? 'scale(1.5)' : 'scale(1)',
                backgroundColor: isSelected 
                  ? 'rgba(220, 38, 38, 0.6)' 
                  : pathology?.severity === 'critical' 
                    ? 'rgba(220, 38, 38, 0.4)'
                    : pathology?.severity === 'high'
                      ? 'rgba(234, 88, 12, 0.4)'
                      : pathology?.severity === 'medium'
                        ? 'rgba(217, 119, 6, 0.4)'
                        : 'rgba(101, 163, 13, 0.4)',
                boxShadow: isSelected 
                  ? '0 0 0 3px rgba(220, 38, 38, 0.8)' 
                  : '0 0 0 2px rgba(255, 255, 255, 0.5)',
              }}
              onClick={() => handleRegionClick(region.id, region.pathologyId)}
              title={pathology?.name}
            >
              {isSelected && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <X className="w-4 h-4 text-red-600" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pathology Detail Popup */}
      {selectedPathology && (
        <div className="absolute bottom-4 left-4 right-4 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 p-4 animate-fade-in">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-bold text-lg text-neutral-900 dark:text-white">
                {selectedPathology.name}
              </h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {selectedPathology.description}
              </p>
            </div>
            <Badge
              className={
                selectedPathology.severity === 'critical' ? 'bg-clinical-critical text-white' :
                selectedPathology.severity === 'high' ? 'bg-clinical-high text-white' :
                selectedPathology.severity === 'medium' ? 'bg-clinical-moderate text-white' :
                'bg-clinical-low text-white'
              }
            >
              {selectedPathology.severity.toUpperCase()}
            </Badge>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-neutral-500">Confidence</div>
              <div className="text-lg font-bold text-neutral-900 dark:text-white">
                {(selectedPathology.confidence * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Prevalence</div>
              <div className="text-lg font-medium text-neutral-900 dark:text-white">
                {selectedPathology.prevalence}
              </div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Region</div>
              <div className="text-lg font-medium text-neutral-900 dark:text-white">
                {selectedRegion?.replace('-', ' ').toUpperCase()}
              </div>
            </div>
          </div>

          <div className="mt-3">
            <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  selectedPathology.severity === 'critical' ? 'bg-clinical-critical' :
                  selectedPathology.severity === 'high' ? 'bg-clinical-high' :
                  selectedPathology.severity === 'medium' ? 'bg-clinical-moderate' :
                  'bg-clinical-low'
                }`}
                style={{ width: `${selectedPathology.confidence * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
import React from 'react';
import { Heart, Activity, Brain } from 'lucide-react';

interface OrganSelectorProps {
  selected: 'heart' | 'lungs' | 'brain';
  onSelect: (organ: 'heart' | 'lungs' | 'brain') => void;
}

export const OrganSelector: React.FC<OrganSelectorProps> = ({ selected, onSelect }) => {
  const organs = [
    { id: 'heart', label: 'Heart', icon: Heart, color: 'from-red-500 to-pink-500' },
    { id: 'lungs', label: 'Lungs', icon: Activity, color: 'from-blue-500 to-cyan-500' },
    { id: 'brain', label: 'Brain', icon: Brain, color: 'from-purple-500 to-indigo-500' },
  ] as const;

  return (
    <div className="flex gap-2 p-1.5 bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/40">
      {organs.map((organ) => {
        const Icon = organ.icon;
        const isSelected = selected === organ.id;
        
        return (
          <button
            key={organ.id}
            onClick={() => onSelect(organ.id)}
            className={`
              relative flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300
              ${isSelected 
                ? `bg-gradient-to-r ${organ.color} text-white shadow-md scale-105` 
                : 'text-primary-700 hover:bg-white/50'
              }
            `}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium">{organ.label}</span>
          </button>
        );
      })}
    </div>
  );
};

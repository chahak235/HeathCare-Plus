import React from 'react';
import { GlassCard } from '../layout/GlassCard';
import { Search } from 'lucide-react';

interface FiltersBarProps {
  specialties: string[];
  selectedSpecialty: string;
  onSpecialtyChange: (specialty: string) => void;
}

export const FiltersBar: React.FC<FiltersBarProps> = ({ 
  specialties, 
  selectedSpecialty, 
  onSpecialtyChange 
}) => {
  return (
    <GlassCard className="p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search doctors by name, specialty..."
            className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-cyan"
          />
        </div>

        {/* Specialty Filter */}
        <select
          value={selectedSpecialty}
          onChange={(e) => onSpecialtyChange(e.target.value)}
          className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-cyan min-w-[200px]"
        >
          <option value="all">All Specialties</option>
          {specialties.map((specialty) => (
            <option key={specialty} value={specialty}>
              {specialty}
            </option>
          ))}
        </select>
      </div>
    </GlassCard>
  );
};

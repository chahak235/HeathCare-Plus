import React from 'react';
import { Input } from '../../components/ui/Input';
import { Toggle } from '../../components/ui/Toggle';
import { Filter, Search } from 'lucide-react';

interface FiltersBarProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  selectedSpecialty: string;
  setSelectedSpecialty: (v: string) => void;
  specialties: string[];
  sortBy: string;
  setSortBy: (v: string) => void;
  showOnlineOnly: boolean;
  setShowOnlineOnly: (v: boolean) => void;
  showEmergency: boolean;
  setShowEmergency: (v: boolean) => void;
  count: number;
}

export const FiltersBar: React.FC<FiltersBarProps> = ({
  searchTerm,
  setSearchTerm,
  selectedSpecialty,
  setSelectedSpecialty,
  specialties,
  sortBy,
  setSortBy,
  showOnlineOnly,
  setShowOnlineOnly,
  showEmergency,
  setShowEmergency,
  count
}) => (
  <div>
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-2">
        <Input
          placeholder="Search doctors, specialties, hospitals..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
        />
      </div>
      <div>
        <select
          value={selectedSpecialty}
          onChange={(e) => setSelectedSpecialty(e.target.value)}
          className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg px-4 py-2 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {specialties.map((specialty) => (
            <option key={specialty} value={specialty === 'All Specialties' ? 'all' : specialty}>
              {specialty}
            </option>
          ))}
        </select>
      </div>
      <div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg px-4 py-2 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="rating">Highest Rated</option>
          <option value="experience">Most Experienced</option>
          <option value="fee">Lowest Fee</option>
        </select>
      </div>
    </div>
    <div className="flex flex-wrap gap-4 mt-6">
      <Toggle enabled={showOnlineOnly} onChange={setShowOnlineOnly} label="Online Consultations Only" />
      <Toggle enabled={showEmergency} onChange={setShowEmergency} label="Emergency Available" />
      <div className="ml-auto flex items-center space-x-2">
        <Filter className="w-4 h-4 text-neutral-500" />
        <span className="text-sm text-neutral-600 dark:text-neutral-400">{count} doctors found</span>
      </div>
    </div>
  </div>
);
export default FiltersBar;


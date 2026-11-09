/**
 * LiveBedBoard Component
 * Grid display of all beds with filtering
 */

import React, { useState, useMemo } from 'react';
import { Search, Filter, LayoutGrid, List } from 'lucide-react';
import type { Bed } from '../../../types/bed.types';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { BedStatusCard } from './BedStatusCard';

interface LiveBedBoardProps {
  beds: Bed[];
  filterSpecialty: string | null;
  onFilterSpecialty: (specialty: string | null) => void;
}

type ViewMode = 'grid' | 'list';

export const LiveBedBoard: React.FC<LiveBedBoardProps> = ({
  beds,
  filterSpecialty,
  onFilterSpecialty,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const specialties = useMemo(() => {
    const unique = new Set(beds.map((b) => b.specialty));
    return Array.from(unique);
  }, [beds]);

  const filteredBeds = useMemo(() => {
    return beds.filter((bed) => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matches =
          bed.bedNumber.toLowerCase().includes(search) ||
          bed.ward.toLowerCase().includes(search) ||
          (bed.currentPatientName?.toLowerCase().includes(search) ?? false);
        if (!matches) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && bed.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [beds, searchTerm, statusFilter]);

  const stats = {
    total: beds.length,
    available: beds.filter((b) => b.status === 'available').length,
    occupied: beds.filter((b) => b.status === 'occupied').length,
    cleaning: beds.filter((b) => b.status === 'cleaning').length,
  };

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="flex items-center gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center gap-1">
          <span className="text-sm text-neutral-500">Total:</span>
          <span className="font-bold text-neutral-900 dark:text-white">{stats.total}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm text-medical-green">Available:</span>
          <span className="font-bold text-medical-green">{stats.available}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm text-medical-red">Occupied:</span>
          <span className="font-bold text-medical-red">{stats.occupied}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm text-medical-yellow">Cleaning:</span>
          <span className="font-bold text-medical-yellow">{stats.cleaning}</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search beds, patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-neutral-400" />}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
        >
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="cleaning">Cleaning</option>
          <option value="maintenance">Maintenance</option>
          <option value="reserved">Reserved</option>
        </select>

        <div className="flex items-center gap-1 border-l border-neutral-200 dark:border-neutral-700 pl-3">
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            leftIcon={<LayoutGrid className="w-4 h-4" />}
          >
            Grid
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            leftIcon={<List className="w-4 h-4" />}
          >
            List
          </Button>
        </div>
      </div>

      {/* Specialty Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => onFilterSpecialty(null)}
          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
            filterSpecialty === null
              ? 'bg-medical-cyan text-white'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
        >
          All
        </button>
        {specialties.map((specialty) => (
          <button
            key={specialty}
            onClick={() => onFilterSpecialty(specialty)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              filterSpecialty === specialty
                ? 'bg-medical-cyan text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            {specialty}
            <Badge variant="outline" size="sm" className="ml-2">
              {beds.filter((b) => b.specialty === specialty).length}
            </Badge>
          </button>
        ))}
      </div>

      {/* Bed Grid/List */}
      {filteredBeds.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-neutral-500">No beds match your filters</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBeds.map((bed) => (
            <BedStatusCard key={bed.id} bed={bed} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredBeds.map((bed) => (
            <div
              key={bed.id}
              className="flex items-center p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <div className="flex-1 grid grid-cols-12 gap-4 text-sm">
                <div className="col-span-2 font-medium">{bed.bedNumber}</div>
                <div className="col-span-2">{bed.ward}</div>
                <div className="col-span-2">{bed.specialty}</div>
                <div className="col-span-2">
                  <Badge
                    variant={
                      bed.status === 'available'
                        ? 'success'
                        : bed.status === 'occupied'
                        ? 'error'
                        : bed.status === 'cleaning'
                        ? 'warning'
                        : 'default'
                    }
                  >
                    {bed.status}
                  </Badge>
                </div>
                <div className="col-span-4">
                  {bed.currentPatientName || '—'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
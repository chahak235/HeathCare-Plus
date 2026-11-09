import React from 'react';
import { GlassCard } from '../layout/GlassCard';
import { Users, Stethoscope, IndianRupee } from 'lucide-react';

interface StatsBarProps {
  totalDoctors: number;
  totalSpecialties: number;
  averageFee: number;
}

export const StatsBar: React.FC<StatsBarProps> = ({ 
  totalDoctors, 
  totalSpecialties, 
  averageFee 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <GlassCard className="p-4 flex items-center gap-4">
        <div className="p-3 bg-medical-cyan/10 rounded-lg">
          <Users className="w-6 h-6 text-medical-cyan" />
        </div>
        <div>
          <p className="text-sm text-neutral-500">Total Doctors</p>
          <p className="text-2xl font-bold">{totalDoctors}</p>
        </div>
      </GlassCard>

      <GlassCard className="p-4 flex items-center gap-4">
        <div className="p-3 bg-medical-green/10 rounded-lg">
          <Stethoscope className="w-6 h-6 text-medical-green" />
        </div>
        <div>
          <p className="text-sm text-neutral-500">Specialties</p>
          <p className="text-2xl font-bold">{totalSpecialties}</p>
        </div>
      </GlassCard>

      <GlassCard className="p-4 flex items-center gap-4">
        <div className="p-3 bg-medical-orange/10 rounded-lg">
          <IndianRupee className="w-6 h-6 text-medical-orange" />
        </div>
        <div>
          <p className="text-sm text-neutral-500">Avg. Consultation Fee</p>
          <p className="text-2xl font-bold">₹{averageFee.toFixed(0)}</p>
        </div>
      </GlassCard>
    </div>
  );
};

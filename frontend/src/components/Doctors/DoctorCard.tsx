import React from 'react';
import { GlassCard } from '../layout/GlassCard';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Calendar, Phone, Star } from 'lucide-react';

interface DoctorCardProps {
  doctor: {
    id: number;
    name: string;
    specialty: string;
    qualification: string[];
    experienceYears: number;
    consultationFee: number;
    languages: string[];
    rating: number;
    profileImageUrl?: string;
    phone?: string;
    email?: string;
    bio?: string;
  };
}

export const DoctorCard: React.FC<DoctorCardProps> = ({ doctor }) => {
  return (
    <GlassCard className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        {/* Profile Image */}
        <div className="w-20 h-20 rounded-full bg-medical-cyan/10 flex items-center justify-center overflow-hidden">
          {doctor.profileImageUrl ? (
            <img 
              src={doctor.profileImageUrl} 
              alt={doctor.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-medical-cyan">
              {doctor.name.charAt(0)}
            </span>
          )}
        </div>

        {/* Doctor Info */}
        <div className="flex-1">
          <h3 className="text-xl font-bold text-neutral-900">{doctor.name}</h3>
          <p className="text-medical-cyan font-medium">{doctor.specialty}</p>
          
          {/* Rating */}
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{doctor.rating}</span>
            <span className="text-xs text-neutral-500 ml-2">
              {doctor.experienceYears}+ years
            </span>
          </div>
        </div>
      </div>

      {/* Qualifications */}
      <div className="mt-4">
        <p className="text-sm text-neutral-600">
          {doctor.qualification?.join(', ')}
        </p>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div>
          <p className="text-xs text-neutral-500">Consultation Fee</p>
          <p className="font-semibold text-lg">₹{doctor.consultationFee}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-500">Languages</p>
          <p className="font-medium">{doctor.languages?.slice(0, 2).join(', ')}</p>
          {doctor.languages && doctor.languages.length > 2 && (
            <p className="text-xs text-neutral-400">+{doctor.languages.length - 2} more</p>
          )}
        </div>
      </div>

      {/* Bio */}
      {doctor.bio && (
        <p className="text-sm text-neutral-600 mt-3 line-clamp-2">
          {doctor.bio}
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 mt-4">
        <Button 
          variant="primary" 
          size="sm" 
          fullWidth
          leftIcon={<Calendar className="w-4 h-4" />}
        >
          Book Appointment
        </Button>
        <Button 
          variant="secondary" 
          size="sm" 
          fullWidth
          leftIcon={<Phone className="w-4 h-4" />}
        >
          Contact
        </Button>
      </div>
    </GlassCard>
  );
};
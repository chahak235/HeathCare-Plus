import { Doctor } from '../types/doctor.types';

// Transform API Doctor to UI Doctor
type ApiDoctor = any; // Should be strongly typed if available

export function transformDoctor(doc: ApiDoctor): Doctor {
  return {
    id: doc.id.toString(),
    name: doc.name,
    specialization: doc.specialty,
    qualifications: doc.qualification || [],
    experience: doc.experience_years,
    rating: doc.rating,
    totalRatings: doc.review_count || 0,
    consultationFee: doc.consultation_fee,
    languages: doc.languages || ['English', 'Hindi'],
    availability: {
      online: true, // Assume all doctors have online consultation
      inPerson: true,
      emergency: doc.specialty === 'Emergency Medicine' || Math.random() > 0.5
    },
    hospital: {
      name: doc.hospital_name || 'Multiple Hospitals',
      city: doc.hospital_city || 'Multiple Cities',
      distance: Math.floor(Math.random() * 20 + 1) + ' miles'
    },
    schedule: {
      days: doc.available_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      hours: doc.available_hours || '9:00 AM - 5:00 PM'
    },
    successRate: Math.floor(Math.random() * 10) + 90,
    responseTime: 'Under ' + Math.floor(Math.random() * 4 + 1) + ' hours',
    verified: doc.is_verified,
    photoUrl: doc.profile_image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${doc.name}`,
    bio: doc.bio || 'Experienced healthcare professional providing quality medical care.',
    patientReviews: [],
    experience_years: doc.experience_years,
    consultation_fee: doc.consultation_fee,
    hospital_name: doc.hospital_name,
    hospital_city: doc.hospital_city,
    hospital_state: doc.hospital_state,
    available_days: doc.available_days,
    available_hours: doc.available_hours,
    is_verified: doc.is_verified
  };
}

// Filtering logic extracted
export function doctorMatchesFilters(
  doctor: Doctor,
  searchTerm: string,
  selectedSpecialty: string,
  showOnlineOnly: boolean,
  showEmergency: boolean
): boolean {
  const matchesSearch =
    searchTerm === '' ||
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.hospital.name.toLowerCase().includes(searchTerm.toLowerCase());
  const matchesSpecialty =
    selectedSpecialty === 'all' || doctor.specialization === selectedSpecialty;
  const matchesOnline = !showOnlineOnly || doctor.availability.online;
  const matchesEmergency = !showEmergency || doctor.availability.emergency;
  return matchesSearch && matchesSpecialty && matchesOnline && matchesEmergency;
}

// Sorting logic
export function sortDoctors(
  a: Doctor,
  b: Doctor,
  sortBy: 'rating' | 'experience' | 'fee'
) {
  if (sortBy === 'rating') return b.rating - a.rating;
  if (sortBy === 'experience') return b.experience - a.experience;
  return a.consultationFee - b.consultationFee;
}


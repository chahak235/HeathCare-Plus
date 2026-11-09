export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  subSpecialty?: string;
  qualifications: string[];
  experience: number;
  rating: number;
  totalRatings: number;
  consultationFee: number;
  languages: string[];
  availability: {
    online: boolean;
    inPerson: boolean;
    emergency: boolean;
  };
  hospital: {
    name: string;
    city: string;
    distance?: string;
  };
  schedule: {
    days: string[];
    hours: string;
  };
  successRate: number;
  responseTime: string;
  verified: boolean;
  photoUrl: string;
  bio: string;
  patientReviews: Review[];
  // Database fields
  experience_years: number;
  consultation_fee: number;
  hospital_name?: string;
  hospital_city?: string;
  hospital_state?: string;
  available_days: string[];
  available_hours: string;
  is_verified: boolean;
}

export interface Review {
  id: string;
  patientName: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
}

export interface DoctorAPIResponse {
  id: number;
  name: string;
  specialty: string;
  qualification: string[];
  experience_years: number;
  rating: number;
  review_count: number;
  consultation_fee: number;
  languages: string[];
  hospital_name?: string;
  hospital_city?: string;
  hospital_state?: string;
  available_days: string[];
  available_hours: string;
  is_verified: boolean;
  profile_image_url: string;
  bio: string;
}
export interface Hospital {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    pincode?: string;
    latitude: number;
    longitude: number;
    type: 'Government' | 'Private' | 'Trust' | 'Clinic';
    beds: number;
    availableBeds?: number;
    phone: string;
    rating?: number;
    ayushmanBharat: boolean;
    specialties?: string[];
    emergencyServices: boolean;
    website?: string;
    email?: string;
  }
  
  export interface HealthAdvisory {
    id: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    affectedAreas: string[];
    recommendations: string[];
  }
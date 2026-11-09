export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'patient' | 'doctor' | 'admin' | 'hospital';
  isVerified: boolean;
  verificationToken?: string;
  resetToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: 'patient' | 'doctor' | 'admin' | 'hospital';

  // role === 'doctor': explicitly claim an existing unclaimed Doctor profile
  // by id (from GET /doctors/unclaimed), or omit both to create a fresh one.
  claimDoctorId?: number;
  specialty?: string; // used only when claimDoctorId is omitted

  // role === 'hospital': onboarding details for a brand-new hospital profile.
  hospitalName?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  hospitalType?: 'government' | 'private' | 'trust';
  totalBeds?: number;
  icuBeds?: number;
  operationTheatres?: number;
  ambulancesTotal?: number;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: Omit<User, 'password'>;
  message?: string;
  error?: string;
}

export interface JwtPayload {
  id: number;
  email: string;
  role: string;
}

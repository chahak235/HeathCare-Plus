import { AppDataSource } from '../config/database.config';
import { User } from '../entities/User.entity';
import { Patient } from '../entities/Patient.entity';
import { Doctor } from '../entities/Doctor.entity';
import { Hospital } from '../entities/Hospital.entity';
import { CreateUserDto, LoginDto, AuthResponse, JwtPayload, User as UserType } from '../types/auth.types';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);
  private patientRepository = AppDataSource.getRepository(Patient);
  private doctorRepository = AppDataSource.getRepository(Doctor);
  private hospitalRepository = AppDataSource.getRepository(Hospital);

  async signup(userData: CreateUserDto): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: userData.email }
      });

      if (existingUser) {
        return {
          success: false,
          error: 'User with this email already exists'
        };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create user
      const user = this.userRepository.create({
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        password: hashedPassword,
        role: userData.role || 'patient',
        isVerified: true // Auto-verify for now (add email verification later)
      });

      await this.userRepository.save(user);

      // If role is patient, create patient record
      if (user.role === 'patient') {
        const patient = this.patientRepository.create({
          userId: user.id,
          dateOfBirth: new Date(),
          allergies: [],
          chronicConditions: [],
          currentMedications: []
        });
        await this.patientRepository.save(patient);
      }

      // If role is doctor, link this account to a Doctor profile. The
      // signup form lets the user explicitly pick an unclaimed existing
      // profile (claimDoctorId, from GET /doctors/unclaimed) rather than
      // guessing via email matching, which broke silently on any typo.
      if (user.role === 'doctor') {
        if (userData.claimDoctorId) {
          const doctor = await this.doctorRepository.findOne({ where: { id: userData.claimDoctorId } });
          if (!doctor) {
            throw new Error('Selected doctor profile does not exist');
          }
          if (doctor.userId) {
            throw new Error('This doctor profile has already been claimed by another account');
          }
          doctor.userId = user.id;
          doctor.email = user.email;
          doctor.phone = user.phone;
          await this.doctorRepository.save(doctor);
        } else {
          const doctor = this.doctorRepository.create({
            userId: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            specialty: userData.specialty || 'General Physician',
            experienceYears: 0,
            isVerified: false,
            qualification: [],
            languages: [],
          });
          await this.doctorRepository.save(doctor);
        }
      }

      // If role is hospital, create a real Hospital profile from the
      // onboarding form data — this is the hospital's own real inventory
      // (beds, ICU beds, OTs, ambulances), not the seeded directory data.
      if (user.role === 'hospital') {
        if (!userData.hospitalName) {
          throw new Error('Hospital name is required');
        }
        const hospital = this.hospitalRepository.create({
          userId: user.id,
          name: userData.hospitalName,
          address: userData.address,
          city: userData.city,
          state: userData.state,
          pincode: userData.pincode,
          phone: user.phone,
          email: user.email,
          type: userData.hospitalType || 'private',
          totalBeds: userData.totalBeds || 0,
          icuBeds: userData.icuBeds || 0,
          operationTheatres: userData.operationTheatres || 0,
          ambulancesTotal: userData.ambulancesTotal || 0,
          ambulancesAvailable: userData.ambulancesTotal || 0,
        });
        await this.hospitalRepository.save(hospital);
      }

      // Generate JWT token
      const token = this.generateToken(user);

      // Return user object conforming to Omit<User, 'password'>
      // Fields must match backend/src/types/auth.types.ts:User roles and types
      return {
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          // explicit role type narrowing:
          role: (user.role as 'patient' | 'doctor' | 'admin' | 'hospital'),
          isVerified: user.isVerified,
          verificationToken: user.verificationToken ?? undefined,
          resetToken: user.resetToken ?? undefined,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        message: 'User created successfully'
      };
    } catch (error: any) {
      console.error('Signup error:', error);
      return {
        success: false,
        // Surface our own validation messages (bad claimDoctorId, missing
        // hospital name, etc.) instead of hiding them behind a generic error.
        error: error?.message || 'Failed to create user'
      };
    }
  }

  async login(credentials: LoginDto): Promise<AuthResponse> {
    try {
      // Find user by email
      const user = await this.userRepository.findOne({
        where: { email: credentials.email }
      });

      if (!user) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(credentials.password, user.password);

      if (!isValidPassword) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Generate JWT token
      const token = this.generateToken(user);

      // Construct the user response as Omit<User, "password">
      const userWithoutPassword: Omit<UserType, 'password'> = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: (user.role as 'patient' | 'doctor' | 'admin' | 'hospital'),
        isVerified: user.isVerified,
        verificationToken: user.verificationToken ?? undefined,
        resetToken: user.resetToken ?? undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      return {
        success: true,
        token,
        user: userWithoutPassword,
        message: 'Login successful'
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Failed to login'
      };
    }
  }

  async getCurrentUser(userId: number): Promise<AuthResponse> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId }
      });

      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Construct the user response as Omit<User, "password">
      const userWithoutPassword: Omit<UserType, 'password'> = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: (user.role as 'patient' | 'doctor' | 'admin' | 'hospital'),
        isVerified: user.isVerified,
        verificationToken: user.verificationToken ?? undefined,
        resetToken: user.resetToken ?? undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      return {
        success: true,
        user: userWithoutPassword
      };
    } catch (error) {
      console.error('Get user error:', error);
      return {
        success: false,
        error: 'Failed to get user'
      };
    }
  }

  private generateToken(user: User): string {
    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const secret = process.env.JWT_SECRET || 'your-secret-key-change-this';
    return jwt.sign(payload, secret, { expiresIn: '7d' });
  }

  verifyToken(token: string): JwtPayload | null {
    try {
      const secret = process.env.JWT_SECRET || 'your-secret-key-change-this';
      return jwt.verify(token, secret) as JwtPayload;
    } catch (error) {
      return null;
    }
  }
}

import { AppDataSource } from '../config/database.config';
import { Doctor } from '../entities/Doctor.entity';
import { DoctorHospital } from '../entities/DoctorHospital.entity';
import { Hospital } from '../entities/Hospital.entity';
import { In, ILike } from 'typeorm';  

export class DoctorsService {
  private doctorRepository = AppDataSource.getRepository(Doctor);
  private doctorHospitalRepository = AppDataSource.getRepository(DoctorHospital);
  private hospitalRepository = AppDataSource.getRepository(Hospital);

  async getAllDoctors(filters: {
    specialty?: string;
    hospitalId?: number;
    minRating?: number;
    maxFee?: number;
    language?: string;
    available?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const query = this.doctorRepository
      .createQueryBuilder('doctor')
      .leftJoinAndSelect('doctor.hospitalLinks', 'hospitalLink')
      .leftJoinAndSelect('hospitalLink.hospital', 'hospital');

    if (filters.specialty) {
      query.andWhere('doctor.specialty = :specialty', { specialty: filters.specialty });
    }

    if (filters.hospitalId) {
      query.andWhere('hospital.id = :hospitalId', { hospitalId: filters.hospitalId });
    }

    if (filters.minRating) {
      query.andWhere('doctor.rating >= :minRating', { minRating: filters.minRating });
    }

    if (filters.maxFee) {
      query.andWhere('(hospitalLink.consultation_fee <= :maxFee OR doctor.consultation_fee <= :maxFee)', 
        { maxFee: filters.maxFee });
    }

    if (filters.language) {
      query.andWhere(':language = ANY(doctor.languages)', { language: filters.language });
    }

    if (filters.available) {
      query.andWhere('hospitalLink.is_available = true');
      query.andWhere('hospitalLink.current_patients < hospitalLink.max_patients');
    }

    if (filters.search) {
      query.andWhere(
        '(doctor.name ILIKE :search OR doctor.specialty ILIKE :search OR doctor.bio ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    const [doctors, total] = await query
      .skip(filters.offset || 0)
      .take(filters.limit || 20)
      .orderBy('doctor.rating', 'DESC')
      .getManyAndCount();

    return { doctors, total };
  }

  async getDoctorById(id: number) {
    return this.doctorRepository.findOne({
      where: { id },
      relations: ['hospitalLinks', 'hospitalLinks.hospital', 'appointments']
    });
  }

  async getAvailableDoctors(specialty?: string) {
    const query = this.doctorHospitalRepository
      .createQueryBuilder('dh')
      .leftJoinAndSelect('dh.doctor', 'doctor')
      .leftJoinAndSelect('dh.hospital', 'hospital')
      .where('dh.is_available = true')
      .andWhere('dh.current_patients < dh.max_patients');

    if (specialty) {
      query.andWhere('doctor.specialty = :specialty', { specialty });
    }

    return query.getMany();
  }

  async updateAvailability(doctorId: number, hospitalId: number, isAvailable: boolean) {
    await this.doctorHospitalRepository.update(
      { doctorId, hospitalId },
      { 
        isAvailable,
        updatedAt: new Date()
      }
    );

    return { success: true };
  }

  async getAllSpecialties() {
    const specialties = await this.doctorRepository
      .createQueryBuilder('doctor')
      .select('DISTINCT doctor.specialty')
      .orderBy('doctor.specialty')
      .getRawMany();

    return specialties.map(s => s.specialty);
  }
}

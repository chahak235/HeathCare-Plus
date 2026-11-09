import { AppDataSource } from './database.config';
import { Hospital } from '../entities/Hospital.entity';
import { Doctor } from '../entities/Doctor.entity';
import { Bed } from '../entities/Bed.entity';

// Real, well-known Indian hospitals used to seed a fresh deployment so the app
// has real data to show immediately instead of an empty database.
const HOSPITALS: Partial<Hospital>[] = [
  { name: 'All India Institute of Medical Sciences (AIIMS)', address: 'Ansari Nagar', city: 'Delhi', state: 'Delhi', pincode: '110029', latitude: 28.5672, longitude: 77.21, phone: '+91-11-26588500', type: 'government', totalBeds: 2500, icuBeds: 250, emergencyContact: '+91-11-26588700', ayushmanEmpaneled: true, rating: 4.8, specialties: ['Cardiology', 'Neurology', 'Oncology', 'Pediatrics', 'Orthopedics', 'ENT'] },
  { name: 'Safdarjung Hospital', address: 'Ansari Nagar West', city: 'Delhi', state: 'Delhi', pincode: '110029', latitude: 28.5691, longitude: 77.2064, phone: '+91-11-26165060', type: 'government', totalBeds: 1600, icuBeds: 120, emergencyContact: '+91-11-26165060', ayushmanEmpaneled: true, rating: 4.1, specialties: ['General Medicine', 'Surgery', 'Pediatrics', 'Orthopedics'] },
  { name: 'Apollo Hospitals Greams Road', address: '21, Greams Lane', city: 'Chennai', state: 'Tamil Nadu', pincode: '600006', latitude: 13.0604, longitude: 80.2493, phone: '+91-44-28290200', type: 'private', totalBeds: 700, icuBeds: 100, emergencyContact: '+91-44-28293333', ayushmanEmpaneled: false, rating: 4.7, specialties: ['Cardiology', 'Neurology', 'Orthopedics', 'Gastroenterology', 'Urology', 'Nephrology'] },
  { name: 'CMC Vellore', address: 'Ida Scudder Road', city: 'Vellore', state: 'Tamil Nadu', pincode: '632004', latitude: 12.9352, longitude: 79.1349, phone: '+91-416-2282011', type: 'trust', totalBeds: 2800, icuBeds: 200, emergencyContact: '+91-416-2282011', ayushmanEmpaneled: true, rating: 4.9, specialties: ['Cardiology', 'Neurology', 'Oncology', 'Orthopedics', 'Pediatrics', 'ENT', 'Ophthalmology'] },
  { name: 'Fortis Hospital Mohali', address: 'Sector 62, Phase VIII', city: 'Mohali', state: 'Punjab', pincode: '160062', latitude: 30.7046, longitude: 76.7179, phone: '+91-172-4692222', type: 'private', totalBeds: 350, icuBeds: 60, emergencyContact: '+91-172-4692222', ayushmanEmpaneled: false, rating: 4.5, specialties: ['Cardiology', 'Orthopedics', 'Neurosurgery', 'Gastroenterology', 'Oncology'] },
  { name: 'Manipal Hospital HAL Airport Road', address: '98, HAL Airport Road', city: 'Bangalore', state: 'Karnataka', pincode: '560017', latitude: 12.955, longitude: 77.641, phone: '+91-80-25024444', type: 'private', totalBeds: 400, icuBeds: 70, emergencyContact: '+91-80-25024444', ayushmanEmpaneled: false, rating: 4.4, specialties: ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Nephrology'] },
  { name: 'NIMHANS', address: 'Hosur Road', city: 'Bangalore', state: 'Karnataka', pincode: '560029', latitude: 12.9432, longitude: 77.5966, phone: '+91-80-26995000', type: 'government', totalBeds: 950, icuBeds: 80, emergencyContact: '+91-80-26995111', ayushmanEmpaneled: true, rating: 4.6, specialties: ['Psychiatry', 'Neurology', 'Neurosurgery'] },
  { name: 'King Edward Memorial (KEM) Hospital', address: 'Acharya Donde Marg, Parel', city: 'Mumbai', state: 'Maharashtra', pincode: '400012', latitude: 19.0009, longitude: 72.8419, phone: '+91-22-24136051', type: 'government', totalBeds: 1800, icuBeds: 150, emergencyContact: '+91-22-24107000', ayushmanEmpaneled: true, rating: 4.2, specialties: ['General Medicine', 'Surgery', 'Cardiology', 'Oncology'] },
  { name: 'Lilavati Hospital', address: 'A-791, Bandra Reclamation', city: 'Mumbai', state: 'Maharashtra', pincode: '400050', latitude: 19.0509, longitude: 72.8295, phone: '+91-22-26568000', type: 'private', totalBeds: 323, icuBeds: 55, emergencyContact: '+91-22-26568000', ayushmanEmpaneled: false, rating: 4.5, specialties: ['Cardiology', 'Orthopedics', 'Gastroenterology', 'Oncology'] },
  { name: 'Apollo Hospitals Jubilee Hills', address: 'Road No. 72, Jubilee Hills', city: 'Hyderabad', state: 'Telangana', pincode: '500033', latitude: 17.4239, longitude: 78.4738, phone: '+91-40-23607777', type: 'private', totalBeds: 550, icuBeds: 90, emergencyContact: '+91-40-23607777', ayushmanEmpaneled: false, rating: 4.6, specialties: ['Cardiology', 'Neurology', 'Orthopedics', 'Transplant'] },
  { name: 'Nizam\'s Institute of Medical Sciences (NIMS)', address: 'Punjagutta', city: 'Hyderabad', state: 'Telangana', pincode: '500082', latitude: 17.4239, longitude: 78.4483, phone: '+91-40-23489000', type: 'government', totalBeds: 1250, icuBeds: 110, emergencyContact: '+91-40-23489000', ayushmanEmpaneled: true, rating: 4.3, specialties: ['Cardiology', 'Nephrology', 'Neurology', 'General Medicine'] },
  { name: 'SSKM Hospital (IPGMER)', address: '244 AJC Bose Road', city: 'Kolkata', state: 'West Bengal', pincode: '700020', latitude: 22.5354, longitude: 88.3453, phone: '+91-33-22041101', type: 'government', totalBeds: 1700, icuBeds: 140, emergencyContact: '+91-33-22041101', ayushmanEmpaneled: true, rating: 4.1, specialties: ['General Medicine', 'Surgery', 'Cardiology', 'Neurology'] },
  { name: 'Apollo Gleneagles Hospital', address: '58, Canal Circular Road', city: 'Kolkata', state: 'West Bengal', pincode: '700054', latitude: 22.5817, longitude: 88.3945, phone: '+91-33-23202122', type: 'private', totalBeds: 430, icuBeds: 65, emergencyContact: '+91-33-23202122', ayushmanEmpaneled: false, rating: 4.4, specialties: ['Cardiology', 'Oncology', 'Orthopedics', 'Nephrology'] },
  { name: 'Sassoon General Hospital', address: 'Near Pune Railway Station', city: 'Pune', state: 'Maharashtra', pincode: '411001', latitude: 18.5308, longitude: 73.8767, phone: '+91-20-26128000', type: 'government', totalBeds: 1400, icuBeds: 100, emergencyContact: '+91-20-26128000', ayushmanEmpaneled: true, rating: 4.0, specialties: ['General Medicine', 'Surgery', 'Pediatrics'] },
  { name: 'Ruby Hall Clinic', address: '40, Sassoon Road', city: 'Pune', state: 'Maharashtra', pincode: '411001', latitude: 18.5362, longitude: 73.8776, phone: '+91-20-66455100', type: 'private', totalBeds: 700, icuBeds: 90, emergencyContact: '+91-20-66455100', ayushmanEmpaneled: false, rating: 4.5, specialties: ['Cardiology', 'Orthopedics', 'Oncology', 'Neurology'] },
  { name: 'PGIMER', address: 'Sector 12', city: 'Chandigarh', state: 'Chandigarh', pincode: '160012', latitude: 30.7649, longitude: 76.7764, phone: '+91-172-2756565', type: 'government', totalBeds: 2000, icuBeds: 170, emergencyContact: '+91-172-2756565', ayushmanEmpaneled: true, rating: 4.7, specialties: ['Cardiology', 'Neurology', 'Oncology', 'Nephrology'] },
  { name: 'SGPGI', address: 'Raebareli Road', city: 'Lucknow', state: 'Uttar Pradesh', pincode: '226014', latitude: 26.7534, longitude: 80.9459, phone: '+91-522-2668700', type: 'government', totalBeds: 1600, icuBeds: 130, emergencyContact: '+91-522-2668700', ayushmanEmpaneled: true, rating: 4.5, specialties: ['Cardiology', 'Nephrology', 'Gastroenterology', 'Neurology'] },
  { name: 'Sir Ganga Ram Hospital', address: 'Rajinder Nagar', city: 'Delhi', state: 'Delhi', pincode: '110060', latitude: 28.6403, longitude: 77.19, phone: '+91-11-25750000', type: 'private', totalBeds: 675, icuBeds: 95, emergencyContact: '+91-11-25750000', ayushmanEmpaneled: false, rating: 4.5, specialties: ['Cardiology', 'Gastroenterology', 'Nephrology', 'Orthopedics'] },
  { name: 'Christian Medical College Hospital', address: 'Bagayam', city: 'Vellore', state: 'Tamil Nadu', pincode: '632002', latitude: 12.9584, longitude: 79.1325, phone: '+91-416-2284000', type: 'trust', totalBeds: 800, icuBeds: 70, emergencyContact: '+91-416-2284000', ayushmanEmpaneled: true, rating: 4.6, specialties: ['General Medicine', 'Pediatrics', 'Surgery'] },
  { name: 'Narayana Health City', address: '258/A, Bommasandra', city: 'Bangalore', state: 'Karnataka', pincode: '560099', latitude: 12.8047, longitude: 77.6975, phone: '+91-80-71222222', type: 'private', totalBeds: 1000, icuBeds: 140, emergencyContact: '+91-80-71222222', ayushmanEmpaneled: true, rating: 4.5, specialties: ['Cardiology', 'Cardiac Surgery', 'Oncology', 'Neurology'] },
];

const DOCTORS: Partial<Doctor>[] = [
  { name: 'Dr. Rajesh Kumar', specialty: 'Cardiology', qualification: ['MBBS', 'MD (Medicine)', 'DM (Cardiology)'], experienceYears: 15, consultationFee: 800, languages: ['English', 'Hindi', 'Tamil'], bio: 'Senior Cardiologist with 15+ years experience in interventional cardiology and heart failure management.', phone: '+91-9876543210', email: 'dr.rajesh@healthcareplus.in', rating: 4.8, reviewCount: 214, patientCount: 3200, isVerified: true, availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], availableHours: '9:00 AM - 5:00 PM' },
  { name: 'Dr. Priya Sharma', specialty: 'Dermatology', qualification: ['MBBS', 'MD (Dermatology)'], experienceYears: 10, consultationFee: 700, languages: ['English', 'Hindi', 'Marathi'], bio: 'Consultant Dermatologist specializing in cosmetic dermatology, skin allergies, and pediatric dermatology.', phone: '+91-9876543211', email: 'dr.priya@healthcareplus.in', rating: 4.6, reviewCount: 180, patientCount: 2600, isVerified: true, availableDays: ['Monday', 'Wednesday', 'Friday'], availableHours: '10:00 AM - 4:00 PM' },
  { name: 'Dr. Amit Patel', specialty: 'Neurology', qualification: ['MBBS', 'MD (Medicine)', 'DM (Neurology)'], experienceYears: 12, consultationFee: 900, languages: ['English', 'Hindi', 'Gujarati'], bio: 'Neurologist with expertise in epilepsy, stroke, and movement disorders.', phone: '+91-9876543212', email: 'dr.amit@healthcareplus.in', rating: 4.7, reviewCount: 150, patientCount: 2100, isVerified: true, availableDays: ['Tuesday', 'Thursday', 'Saturday'], availableHours: '9:00 AM - 3:00 PM' },
  { name: 'Dr. Anjali Gupta', specialty: 'Pediatrics', qualification: ['MBBS', 'MD (Pediatrics)'], experienceYears: 8, consultationFee: 600, languages: ['English', 'Hindi', 'Bengali'], bio: 'Pediatrician specializing in newborn care, vaccinations, and child nutrition.', phone: '+91-9876543213', email: 'dr.anjali@healthcareplus.in', rating: 4.9, reviewCount: 260, patientCount: 4100, isVerified: true, availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], availableHours: '9:00 AM - 6:00 PM' },
  { name: 'Dr. Suresh Reddy', specialty: 'Orthopedics', qualification: ['MBBS', 'MS (Orthopedics)'], experienceYears: 20, consultationFee: 1000, languages: ['English', 'Hindi', 'Telugu'], bio: 'Orthopedic surgeon with expertise in joint replacements, sports injuries, and spine surgery.', phone: '+91-9876543214', email: 'dr.suresh@healthcareplus.in', rating: 4.8, reviewCount: 310, patientCount: 5200, isVerified: true, availableDays: ['Monday', 'Wednesday', 'Friday'], availableHours: '10:00 AM - 5:00 PM' },
  { name: 'Dr. Meera Iyer', specialty: 'Gynecology', qualification: ['MBBS', 'MD (Obstetrics & Gynecology)'], experienceYears: 14, consultationFee: 850, languages: ['English', 'Hindi', 'Malayalam'], bio: 'Gynecologist and infertility specialist providing comprehensive women\'s healthcare.', phone: '+91-9876543215', email: 'dr.meera@healthcareplus.in', rating: 4.7, reviewCount: 190, patientCount: 3000, isVerified: true, availableDays: ['Tuesday', 'Thursday', 'Saturday'], availableHours: '9:00 AM - 4:00 PM' },
  { name: 'Dr. Vikram Singh', specialty: 'General Medicine', qualification: ['MBBS', 'MD (General Medicine)'], experienceYears: 18, consultationFee: 500, languages: ['English', 'Hindi', 'Punjabi'], bio: 'Senior physician with expertise in diabetes, hypertension, and infectious diseases.', phone: '+91-9876543216', email: 'dr.vikram@healthcareplus.in', rating: 4.5, reviewCount: 400, patientCount: 6100, isVerified: true, availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], availableHours: '8:00 AM - 2:00 PM' },
  { name: 'Dr. Sunita Desai', specialty: 'Dentistry', qualification: ['BDS', 'MDS (Oral Surgery)'], experienceYears: 9, consultationFee: 400, languages: ['English', 'Hindi', 'Marathi'], bio: 'Dental surgeon specializing in cosmetic dentistry, implants, and oral surgeries.', phone: '+91-9876543217', email: 'dr.sunita@healthcareplus.in', rating: 4.6, reviewCount: 140, patientCount: 2400, isVerified: true, availableDays: ['Monday', 'Tuesday', 'Thursday'], availableHours: '11:00 AM - 6:00 PM' },
  { name: 'Dr. Arjun Mehta', specialty: 'Psychiatry', qualification: ['MBBS', 'MD (Psychiatry)'], experienceYears: 11, consultationFee: 750, languages: ['English', 'Hindi'], bio: 'Psychiatrist specializing in depression, anxiety disorders, and addiction psychiatry.', phone: '+91-9876543218', email: 'dr.arjun@healthcareplus.in', rating: 4.7, reviewCount: 165, patientCount: 1900, isVerified: true, availableDays: ['Monday', 'Wednesday', 'Friday'], availableHours: '10:00 AM - 5:00 PM' },
  { name: 'Dr. Kavita Nair', specialty: 'ENT', qualification: ['MBBS', 'MS (ENT)'], experienceYears: 7, consultationFee: 650, languages: ['English', 'Hindi', 'Malayalam'], bio: 'ENT specialist with expertise in sinusitis, hearing disorders, and throat infections.', phone: '+91-9876543219', email: 'dr.kavita@healthcareplus.in', rating: 4.5, reviewCount: 120, patientCount: 1700, isVerified: true, availableDays: ['Tuesday', 'Thursday', 'Saturday'], availableHours: '9:00 AM - 3:00 PM' },
  { name: 'Dr. Rohan Kapoor', specialty: 'Gastroenterology', qualification: ['MBBS', 'MD (Medicine)', 'DM (Gastroenterology)'], experienceYears: 13, consultationFee: 900, languages: ['English', 'Hindi'], bio: 'Gastroenterologist specializing in liver disease, endoscopy, and IBD management.', phone: '+91-9876543220', email: 'dr.rohan@healthcareplus.in', rating: 4.6, reviewCount: 110, patientCount: 1600, isVerified: true, availableDays: ['Monday', 'Wednesday', 'Friday'], availableHours: '9:00 AM - 4:00 PM' },
  { name: 'Dr. Neha Joshi', specialty: 'Endocrinology', qualification: ['MBBS', 'MD (Medicine)', 'DM (Endocrinology)'], experienceYears: 10, consultationFee: 800, languages: ['English', 'Hindi', 'Marathi'], bio: 'Endocrinologist focused on diabetes, thyroid disorders, and metabolic health.', phone: '+91-9876543221', email: 'dr.neha@healthcareplus.in', rating: 4.7, reviewCount: 95, patientCount: 1400, isVerified: true, availableDays: ['Tuesday', 'Thursday'], availableHours: '10:00 AM - 4:00 PM' },
  { name: 'Dr. Sandeep Verma', specialty: 'Nephrology', qualification: ['MBBS', 'MD (Medicine)', 'DM (Nephrology)'], experienceYears: 16, consultationFee: 950, languages: ['English', 'Hindi'], bio: 'Nephrologist specializing in chronic kidney disease and dialysis management.', phone: '+91-9876543222', email: 'dr.sandeep@healthcareplus.in', rating: 4.5, reviewCount: 88, patientCount: 1200, isVerified: true, availableDays: ['Monday', 'Wednesday', 'Friday'], availableHours: '9:00 AM - 3:00 PM' },
  { name: 'Dr. Pooja Malhotra', specialty: 'Oncology', qualification: ['MBBS', 'MD', 'DM (Oncology)'], experienceYears: 14, consultationFee: 1200, languages: ['English', 'Hindi', 'Punjabi'], bio: 'Medical oncologist with expertise in breast and gastrointestinal cancers.', phone: '+91-9876543223', email: 'dr.pooja@healthcareplus.in', rating: 4.8, reviewCount: 130, patientCount: 1500, isVerified: true, availableDays: ['Tuesday', 'Thursday', 'Saturday'], availableHours: '9:00 AM - 5:00 PM' },
  { name: 'Dr. Karan Bedi', specialty: 'Urology', qualification: ['MBBS', 'MS', 'MCh (Urology)'], experienceYears: 12, consultationFee: 850, languages: ['English', 'Hindi'], bio: 'Urologist specializing in kidney stones, prostate health, and minimally invasive surgery.', phone: '+91-9876543224', email: 'dr.karan@healthcareplus.in', rating: 4.5, reviewCount: 100, patientCount: 1300, isVerified: true, availableDays: ['Monday', 'Wednesday'], availableHours: '10:00 AM - 4:00 PM' },
];

// Deterministic city -> hospital-name mapping so doctors get linked to a hospital in the same city.
const DOCTOR_CITY_HOSPITAL: Record<string, string> = {
  Cardiology: 'All India Institute of Medical Sciences (AIIMS)',
  Dermatology: 'Apollo Hospitals Jubilee Hills',
  Neurology: 'NIMHANS',
  Pediatrics: 'CMC Vellore',
  Orthopedics: 'Fortis Hospital Mohali',
  Gynecology: 'Lilavati Hospital',
  'General Medicine': 'Safdarjung Hospital',
  Dentistry: 'Ruby Hall Clinic',
  Psychiatry: 'NIMHANS',
  ENT: 'CMC Vellore',
  Gastroenterology: 'Apollo Gleneagles Hospital',
  Endocrinology: 'PGIMER',
  Nephrology: 'SGPGI',
  Oncology: 'Narayana Health City',
  Urology: 'Apollo Hospitals Greams Road',
};

// A representative slice of each hospital's real bed inventory (not the full
// totalBeds count on the Hospital row, which is just a headline number) —
// enough for the allocation engine and hospital dashboard to have real rows
// to match/manage against, across the ward types the matching algorithm
// actually understands (General / ICU / Emergency / NICU / CCU).
const BED_TEMPLATE: Array<{ type: string; ward: string; specialty: string; equipment: string[]; isIsolation?: boolean }> = [
  { type: 'ICU', ward: 'Intensive Care Unit', specialty: 'Critical Care', equipment: ['ventilator', 'monitor', 'defibrillator'] },
  { type: 'ICU', ward: 'Cardiac Care Unit', specialty: 'Cardiology', equipment: ['ventilator', 'monitor', 'defibrillator', 'pacemaker'] },
  { type: 'CCU', ward: 'Coronary Care Unit', specialty: 'Cardiology', equipment: ['monitor', 'defibrillator'] },
  { type: 'Emergency', ward: 'Emergency Department', specialty: 'Emergency Medicine', equipment: ['monitor', 'defibrillator'] },
  { type: 'Emergency', ward: 'Emergency Department', specialty: 'Emergency Medicine', equipment: ['monitor'] },
  { type: 'General', ward: 'General Ward', specialty: 'General Medicine', equipment: ['monitor'] },
  { type: 'General', ward: 'General Ward', specialty: 'General Medicine', equipment: [] },
  { type: 'General', ward: 'Surgical Ward', specialty: 'Surgery', equipment: ['monitor'] },
  { type: 'General', ward: 'Isolation Ward', specialty: 'General Medicine', equipment: ['monitor'], isIsolation: true },
  { type: 'NICU', ward: 'Neonatal ICU', specialty: 'Pediatrics', equipment: ['incubator', 'monitor'] },
];

export async function seedInitialData(): Promise<void> {
  try {
    const hospitalRepo = AppDataSource.getRepository(Hospital);
    const doctorRepo = AppDataSource.getRepository(Doctor);
    const bedRepo = AppDataSource.getRepository(Bed);

    const hospitalCount = await hospitalRepo.count();
    let savedHospitals: Hospital[] = [];
    if (hospitalCount === 0) {
      savedHospitals = await hospitalRepo.save(HOSPITALS as Hospital[]);
      console.log(`🌱 Seeded ${savedHospitals.length} hospitals`);
    } else {
      savedHospitals = await hospitalRepo.find();
    }

    const doctorCount = await doctorRepo.count();
    if (doctorCount === 0) {
      const hospitalByName = new Map(savedHospitals.map((h) => [h.name, h]));
      const doctorsToInsert = DOCTORS.map((doc) => {
        const hospitalName = DOCTOR_CITY_HOSPITAL[doc.specialty as string];
        const hospital = hospitalName ? hospitalByName.get(hospitalName) : undefined;
        return { ...doc, hospitalId: hospital?.id };
      });
      const saved = await doctorRepo.save(doctorsToInsert as Doctor[]);
      console.log(`🌱 Seeded ${saved.length} doctors`);
    }

    const bedCount = await bedRepo.count();
    if (bedCount === 0 && savedHospitals.length > 0) {
      const bedsToInsert: Partial<Bed>[] = [];
      savedHospitals.forEach((hospital, hIdx) => {
        BED_TEMPLATE.forEach((template, bIdx) => {
          // Deterministic mix of statuses so the dashboard isn't 100% empty
          // or 100% full on first load.
          const statusRoll = (hIdx + bIdx) % 5;
          const status = statusRoll === 0 ? 'occupied' : statusRoll === 1 ? 'cleaning' : 'available';
          bedsToInsert.push({
            hospitalId: hospital.id,
            bedNumber: `${template.type.slice(0, 3).toUpperCase()}-${hIdx + 1}${bIdx + 1}`,
            ward: template.ward,
            floor: Math.floor(bIdx / 3) + 1,
            type: template.type,
            specialty: template.specialty,
            status,
            equipment: template.equipment,
            isIsolation: !!template.isIsolation,
            lastCleaned: new Date(Date.now() - Math.random() * 6 * 60 * 60 * 1000),
          });
        });
      });
      const savedBeds = await bedRepo.save(bedsToInsert as Bed[]);
      console.log(`🌱 Seeded ${savedBeds.length} beds across ${savedHospitals.length} hospitals`);
    }
  } catch (error) {
    console.error('⚠️ Seeding initial data failed (non-fatal):', error);
  }
}

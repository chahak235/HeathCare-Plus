import { AppDataSource } from './src/config/database.config';
import { Appointment } from './src/entities/Appointment.entity';
import { Doctor } from './src/entities/Doctor.entity';

async function test() {
  await AppDataSource.initialize();
  const appointmentRepo = AppDataSource.getRepository(Appointment);
  const doctorRepo = AppDataSource.getRepository(Doctor);

  const doc = await doctorRepo.find();
  console.log('Doctors with refresh token:', doc.map(d => ({id: d.id, hasToken: !!d.googleRefreshToken})));

  const apts = await appointmentRepo.find({ order: { id: 'DESC' }, take: 5 });
  console.log('Recent appointments:');
  for (const a of apts) {
    console.log(`- ID: ${a.id}, Status: ${a.status}, Type: ${a.appointmentType}, Link: ${a.meetingLink}`);
  }
  
  process.exit(0);
}

test().catch(console.error);

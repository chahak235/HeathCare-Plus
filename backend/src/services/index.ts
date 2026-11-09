import { SocketService } from './socket.service';
import { NotificationService } from './notification.service';
import { PatientAPIService } from './patient-api.service';
import { BedAllocationService } from './bed-allocation.service';
import { DoctorsService } from './doctors.service';

// Declare variables
let socketService: SocketService;
let notificationService: NotificationService;
let patientService: PatientAPIService;
let bedAllocationService: BedAllocationService;
let doctorsService: DoctorsService;

// Initialize all services
export const initializeServices = (socketSvc: SocketService) => {
  socketService = socketSvc;
  notificationService = new NotificationService(socketService);
  patientService = new PatientAPIService();
  bedAllocationService = new BedAllocationService();
  doctorsService = new DoctorsService();

  console.log('✅ All services initialized');
  return {
    socketService,
    notificationService,
    patientService,
    bedAllocationService,
    doctorsService
  };
};

// Export getters (they will be undefined until initialized)
export const getServices = () => ({
  socketService,
  notificationService,
  patientService,
  bedAllocationService,
  doctorsService
});

// Direct exports for convenience (will be undefined until initialized)
export {
  socketService,
  notificationService,
  patientService,
  bedAllocationService,
  doctorsService
};
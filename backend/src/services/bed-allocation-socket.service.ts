import { BedAllocationService } from './bed-allocation.service';
import { SocketService } from './socket.service';
import { BedUpdateData } from '../types/socket.types';

export class BedAllocationSocketService extends BedAllocationService {
  private socketService: SocketService;

  constructor(socketService: SocketService) {
    super();
    this.socketService = socketService;
  }

  async reserveBed(bedId: string, patientId: string, doctorId: string, duration?: number) {
    const reservation = await super.reserveBed(bedId, patientId, doctorId, duration);

    // Emit socket event
    const bed = await this.getBedById(bedId);
    if (bed) {
      const updateData: BedUpdateData = {
        bedId,
        status: 'reserved',
        patientId,
        patientName: `Patient-${patientId.substring(0, 8)}`,
        estimatedVacancy: bed.estimatedVacancy,
        updatedAt: new Date()
      };
      this.socketService.broadcastBedUpdate(updateData);
    }
    
    return reservation;
  }

  async occupyBed(bedId: string, patientId: string) {
    await super.occupyBed(bedId, patientId);
    
    const updateData: BedUpdateData = {
      bedId,
      status: 'occupied',
      patientId,
      patientName: `Patient-${patientId.substring(0, 8)}`,
      updatedAt: new Date()
    };
    this.socketService.broadcastBedUpdate(updateData);
  }

  async startCleaning(bedId: string) {
    await super.startCleaning(bedId);
    
    const updateData: BedUpdateData = {
      bedId,
      status: 'cleaning',
      updatedAt: new Date()
    };
    this.socketService.broadcastBedUpdate(updateData);
  }

  async completeCleaning(bedId: string) {
    await super.completeCleaning(bedId);
    
    const updateData: BedUpdateData = {
      bedId,
      status: 'available',
      updatedAt: new Date()
    };
    this.socketService.broadcastBedUpdate(updateData);
  }
}

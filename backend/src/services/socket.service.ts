import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { 
  SocketEvent, 
  BedUpdateData, 
  PatientTransitionData,
  AmbulanceLocationData,
  DoctorStatusData,
  EmergencyAlertData,
  SocketRoom
} from '../types/socket.types';

export class SocketService {
  private io: SocketServer;
  private connectedUsers: Map<string, SocketRoom> = new Map();
  private ambulanceRooms: Map<string, Set<string>> = new Map();

  constructor(server: HttpServer) {
    this.io = new SocketServer(server, {
      cors: {
        origin: ['http://localhost:3000', 'http://localhost:5173'],
        credentials: true,
        methods: ['GET', 'POST']
      },
      path: '/socket.io'
    });

    this.initialize();
    console.log('✅ WebSocket server initialized');
  }

  private initialize() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`🔌 New client connected: ${socket.id}`);

      // Authenticate user
      socket.on('authenticate', (data: { userId: string; userType: string; hospitalId?: string }) => {
        const { userId, userType, hospitalId } = data;
        
        // Store user info
        this.connectedUsers.set(socket.id, {
          userId,
          userType: userType as any,
          rooms: []
        });

        // Join hospital room if provided
        if (hospitalId) {
          socket.join(`hospital:${hospitalId}`);
          this.connectedUsers.get(socket.id)?.rooms.push(`hospital:${hospitalId}`);
        }

        // Join role-based room
        socket.join(`role:${userType}`);
        this.connectedUsers.get(socket.id)?.rooms.push(`role:${userType}`);

        // Join this user's personal room — sendNotificationToUser() below
        // targets `user:${userId}` specifically, so without this join
        // in-app notifications are emitted to an empty room and vanish.
        socket.join(`user:${userId}`);
        this.connectedUsers.get(socket.id)?.rooms.push(`user:${userId}`);

        // If doctor, join doctor-specific room
        if (userType === 'doctor') {
          socket.join(`doctor:${userId}`);
          this.connectedUsers.get(socket.id)?.rooms.push(`doctor:${userId}`);
        }

        // If ambulance, track separately
        if (userType === 'paramedic') {
          socket.join('ambulance');
          this.connectedUsers.get(socket.id)?.rooms.push('ambulance');
        }

        console.log(`✅ User ${userId} (${userType}) authenticated on socket ${socket.id}`);
        
        socket.emit('authenticated', { 
          success: true, 
          message: 'Connected to real-time server' 
        });
      });

      // Join ambulance tracking room for a specific hospital
      socket.on('track-ambulances', (hospitalId: string) => {
        socket.join(`ambulances:${hospitalId}`);
        console.log(`Socket ${socket.id} tracking ambulances for hospital ${hospitalId}`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        const user = this.connectedUsers.get(socket.id);
        if (user) {
          console.log(`🔌 User ${user.userId} disconnected`);
          this.connectedUsers.delete(socket.id);
        }
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`❌ Socket error for ${socket.id}:`, error);
      });
    });
  }

  /**
   * Broadcast bed status update to all relevant clients
   */
  broadcastBedUpdate(data: BedUpdateData) {
    this.io.emit('bed:update', data);
    console.log(`📡 Bed update broadcast: ${data.bedId} -> ${data.status}`);
  }

  /**
   * Send bed update to specific hospital only
   */
  sendBedUpdateToHospital(hospitalId: string, data: BedUpdateData) {
    this.io.to(`hospital:${hospitalId}`).emit('bed:update', data);
    console.log(`📡 Bed update sent to hospital ${hospitalId}: ${data.bedId}`);
  }

  /**
   * Broadcast patient transition
   */
  broadcastPatientTransition(data: PatientTransitionData) {
    this.io.emit('patient:transition', data);
    
    // If it's a critical transition (P1/P2), also send emergency alert
    if (data.priority && data.priority <= 2) {
      this.sendEmergencyAlert({
        alertId: `alert-${Date.now()}`,
        type: data.priority === 1 ? 'P1' : 'P2',
        patientId: data.patientId,
        patientName: data.patientName,
        location: 'Hospital',
        message: `${data.patientName} moved to ${data.toStatus}`,
        requiredSpecialty: this.getSpecialtyFromStatus(data.toStatus),
        timestamp: new Date(),
        acknowledgedBy: []
      });
    }
    
    console.log(`📡 Patient transition broadcast: ${data.patientId}`);
  }

  /**
   * Update ambulance location (sent to specific hospital)
   */
  updateAmbulanceLocation(hospitalId: string, data: AmbulanceLocationData) {
    this.io.to(`ambulances:${hospitalId}`).emit('ambulance:location', data);
    console.log(`📡 Ambulance ${data.ambulanceId} location sent to hospital ${hospitalId}`);
  }

  /**
   * Broadcast ambulance location to all tracking clients
   */
  broadcastAmbulanceLocation(data: AmbulanceLocationData) {
    this.io.to('ambulance').emit('ambulance:location', data);
    console.log(`📡 Ambulance ${data.ambulanceId} location broadcast`);
  }

  /**
   * Update doctor status
   */
  broadcastDoctorStatus(data: DoctorStatusData) {
    this.io.emit('doctor:status', data);
    console.log(`📡 Doctor ${data.doctorId} status updated: ${data.isOnDuty ? 'on duty' : 'off duty'}`);
  }

  /**
   * Send emergency alert
   */
  sendEmergencyAlert(data: EmergencyAlertData) {
    // Send to all admins
    this.io.to('role:admin').emit('alert:emergency', data);
    
    // Send to relevant doctors if specialty specified
    if (data.requiredSpecialty) {
      this.io.emit('alert:emergency', data);
    }
    
    console.log(`🚨 Emergency alert sent: ${data.type} - ${data.message}`);
  }

  /**
   * Send notification to specific user
   */
  sendNotificationToUser(userId: string, notification: any) {
    this.io.to(`user:${userId}`).emit('notification:new', notification);
  }

  /**
   * Send notification to all users of a role
   */
  sendNotificationToRole(role: string, notification: any) {
    this.io.to(`role:${role}`).emit('notification:new', notification);
  }

  /**
   * Get connecteers count
   */
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Get online doctors
   */
  getOnlineDoctors(): string[] {
    const doctors: string[] = [];
    this.connectedUsers.forEach((user) => {
      if (user.userType === 'doctor') {
        doctors.push(user.userId);
      }
    });
    return doctors;
  }

  private getSpecialtyFromStatus(status: string): string | undefined {
    const map: Record<string, string> = {
      'UNDER_TREATMENT': 'Critical Care',
      'AWAITING_BED': 'Emergency Medicine',
      'TRIAGED': 'Emergency Medicine'
    };
    return map[status];
  }
}

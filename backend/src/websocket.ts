import { Server as HttpServer } from 'http';
import { SocketService } from './services/socket.service';
import { BedAllocationSocketService } from './services/bed-allocation-socket.service';
import { initializeServices } from './services';

let socketService: SocketService;
let bedAllocationService: BedAllocationSocketService;

export const initializeWebSocket = (server: HttpServer) => {
  // Initialize socket service
  socketService = new SocketService(server);
  
  // Initialize bed allocation with socket integration
  bedAllocationService = new BedAllocationSocketService(socketService);
  
  // Initialize all other services with socket
  initializeServices(socketService);
  
  console.log('✅ WebSocket initialized and services connected');
  
  return { socketService, bedAllocationService };
};

export { socketService, bedAllocationService };
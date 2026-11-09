import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import axios from 'axios';
import { 
  Bell, 
  Clock, 
  MapPin, 
  Phone, 
  Video,
  Heart,
  Activity,
  AlertTriangle,
  Users,
  BedDouble,
  Calendar,
  ChevronRight,
  CheckCircle,
  XCircle
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://healthcare-backend-tylz.onrender.com/api';

interface Patient {
  id: string;
  name: string;
  age: number;
  priority: number;
  symptoms: string[];
  vitals?: {
    heartRate: number;
    bloodPressure: string;
    oxygenSaturation: number;
    temperature: number;
  };
  status: string;
  bedId?: string;
  bedNumber?: string;
  ward?: string;
  floor?: number;
  doctorId?: string;
  estimatedArrival?: number;
}

interface EmergencyAlert {
  id: string;
  patientId: string;
  patientName: string;
  priority: number;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

export const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const { onEmergencyAlert, onPatientTransition, onBedUpdate } = useSocket();
  
  const [assignedPatients, setAssignedPatients] = useState<Patient[]>([]);
  const [emergencyQueue, setEmergencyQueue] = useState<EmergencyAlert[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(false);
  const [currentEmergency, setCurrentEmergency] = useState<EmergencyAlert | null>(null);

  // Real-time emergency alerts
  useEffect(() => {
    onEmergencyAlert((alert: any) => {
      const newAlert: EmergencyAlert = {
        id: alert.alertId,
        patientId: alert.patientId,
        patientName: alert.patientName || 'Unknown',
        priority: alert.type === 'P1' ? 1 : 2,
        message: alert.message,
        timestamp: new Date(),
        acknowledged: false
      };
      
      setEmergencyQueue(prev => [newAlert, ...prev]);
      setCurrentEmergency(newAlert);
      setShowEmergencyAlert(true);
      
      // Play sound
      const audio = new Audio('/emergency-alert.mp3');
      audio.play().catch(e => console.log('Audio play failed:', e));
      
      // Auto-hide after 10 seconds
      setTimeout(() => setShowEmergencyAlert(false), 10000);
    });

    // Real-time patient status updates
    onPatientTransition((data: any) => {
      if (data.doctorId === user?.id) {
        setAssignedPatients(prev => 
          prev.map(p => 
            p.id === data.patientId 
              ? { ...p, status: data.toStatus }
              : p
          )
        );
      }
    });

    // Real-time bed updates
    onBedUpdate((data: any) => {
      setAssignedPatients(prev =>
        prev.map(p => 
          p.bedId === data.bedId
            ? { ...p, bedNumber: data.bedNumber, status: data.status }
            : p
        )
      );
    });
  }, [onEmergencyAlert, onPatientTransition, onBedUpdate, user?.id]);

  // Fetch assigned patients
  useEffect(() => {
    const fetchDoctorData = async () => {
      try {
        setLoading(true);
        
        // Get doctor's assigned patients
        const patientsRes = await axios.get(`${API_URL}/doctors/${user?.id}/patients`);
        setAssignedPatients(patientsRes.data.data || []);
        
        // Get today's schedule
        const scheduleRes = await axios.get(`${API_URL}/doctors/${user?.id}/schedule/today`);
        setTodaySchedule(scheduleRes.data.data || []);
        
      } catch (error) {
        console.error('Error fetching doctor data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchDoctorData();
      
      // Poll for updates every 30 seconds
      const interval = setInterval(fetchDoctorData, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  const acknowledgeEmergency = (alertId: string) => {
    setEmergencyQueue(prev => prev.filter(a => a.id !== alertId));
    setShowEmergencyAlert(false);
    setCurrentEmergency(null);
  };

  const acceptPatient = async (patientId: string) => {
    try {
      await axios.post(`${API_URL}/doctors/patients/${patientId}/assign`, {
        doctorId: user?.id
      });
      
      // Update local state
      setAssignedPatients(prev => 
        prev.map(p => 
          p.id === patientId 
            ? { ...p, status: 'assigned' }
            : p
        )
      );
      
    } catch (error) {
      console.error('Error accepting patient:', error);
    }
  };

  const startVideoCall = (patientId: string) => {
    // Generate meeting link
    window.open(`https://meet.google.com/new`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Emergency Alert Banner */}
      {showEmergencyAlert && currentEmergency && (
        <div className="fixed top-0 left-0 right-0 z-50 animate-slide-down">
          <div className="bg-red-600 text-white p-4 shadow-lg">
            <div className="container mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
                <div>
                  <h3 className="font-bold text-lg">
                    🚨 Priority {currentEmergency.priority} Emergency
                  </h3>
                  <p className="text-sm opacity-90">{currentEmergency.message}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => acceptPatient(currentEmergency.patientId)}
                  className="px-4 py-2 bg-white text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors"
                >
                  Accept
                </button>
                <button
                  onClick={() => acknowledgeEmergency(currentEmergency.id)}
                  className="px-4 py-2 bg-red-700 rounded-lg hover:bg-red-800 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navbar with Doctor Info */}
      <nav className="bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold">Doctor Dashboard</h1>
              <div className="flex items-center gap-2 bg-blue-800 px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">Live</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Emergency Queue Indicator */}
              <div className="relative">
                <button className="relative">
                  <Bell className="w-5 h-5" />
                  {emergencyQueue.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                      {emergencyQueue.length}
                    </span>
                  )}
                </button>
              </div>
              
              {/* Doctor Profile */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold">{user?.name?.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-xs text-blue-200">Cardiologist • On Duty</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Emergency Queue</p>
                <p className="text-3xl font-bold text-red-600">{emergencyQueue.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
        </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Assigned Patients</p>
                <p className="text-3xl font-bold text-blue-600">{assignedPatients.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Available Beds</p>
                <p className="text-3xl font-bold text-green-600">12</p>
              </div>
              <BedDouble className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Today's Appointments</p>
                <p className="text-3xl font-bold text-purple-600">{todaySchedule.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Emergency Queue */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Emergency Queue
              </h2>
              
              {emergencyQueue.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p>No emergencies</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {emergencyQueue.map((alert) => (
                    <div key={alert.id} className="bg-red-50 rounded-xl p-4 border border-red-200">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            alert.priority === 1 ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'
                          }`}>
                            P{alert.priority}
                          </span>
                          <h3 className="font-bold mt-2">{alert.patientName}</h3>
                        </div>
                        <button
                          onClick={() => acknowledgeEmergency(alert.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{alert.message}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => acceptPatient(alert.patientId)}
                          className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm hover:bg-red-600"
                        >
                          Accept
                        </button>
                        <button className="flex-1 border border-red-500 text-red-500 py-2 rounded-lg text-sm hover:bg-red-50">
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Today's Schedule */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                Today's Schedule
              </h2>
              
              {todaySchedule.length === 0 ? (
                <p className="text-center py-4 text-gray-500">No appointments today</p>
              ) : (
                <div className="space-y-3">
                  {todaySchedule.map((apt, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-medium">{apt.patientName}</p>
                        <p className="text-sm text-gray-500">{apt.time}</p>
                      </div>
                      <button className="text-blue-500 hover:text-blue-600">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Assigned Patients */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Your Patients
              </h2>

              {assignedPatients.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">No patients assigned yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignedPatients.map((patient) => (
                    <div key={patient.id} className="border rounded-xl p-4 hover:shadow-md transition">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg">{patient.name}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              patient.priority === 1 ? 'bg-red-100 text-red-700' :
                              patient.priority === 2 ? 'bg-orange-100 text-orange-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              P{patient.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {patient.age} yrs
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startVideoCall(patient.id)}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                          >
                            <Video className="w-5 h-5" />
                          </button>
                          <button className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100">
                            <Phone className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Vitals */}
                      {patient.vitals && (
                        <div className="grid grid-cols-4 gap-2 mb-3">
                          <div className="bg-gray-50 p-2 rounded-lg text-center">
                            <Heart className="w-4 h-4 text-red-500 mx-auto mb-1" />
                            <span className="text-xs font-medium">{patient.vitals.heartRate} bpm</span>
                          </div>
                          <div className="bg-gray-50 p-2 rounded-lg text-center">
                            <Activity className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                            <span className="text-xs font-medium">{patient.vitals.bloodPressure}</span>
                          </div>
                          <div className="bg-gray-50 p-2 rounded-lg text-center">
                            <span className="text-xs">SpO₂</span>
                            <span className="text-xs font-medium block">{patient.vitals.oxygenSaturation}%</span>
                          </div>
                          <div className="bg-gray-50 p-2 rounded-lg text-center">
                            <span className="text-xs">Temp</span>
                            <span className="text-xs font-medium block">{patient.vitals.temperature}°F</span>
                          </div>
                        </div>
                      )}

                      {/* Bed Location */}
                      {patient.bedNumber && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3 p-2 bg-blue-50 rounded-lg">
                          <MapPin className="w-4 h-4 text-blue-500" />
                       <span>Bed {patient.bedNumber} • {patient.ward} (Floor {patient.floor})</span>
                        </div>
                      )}

                      {/* Symptoms */}
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">Symptoms</p>
                        <div className="flex flex-wrap gap-1">
                          {patient.symptoms.map((s, i) => (
                            <span key={i} className="px-2 py-1 bg-gray-100 rounded-lg text-xs">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t">
                        <button className="flex-1 bg-blue-500 text-white py-2 rounded-lg text-sm hover:bg-blue-600">
                          View Details
                        </button>
                        <button className="flex-1 border border-blue-500 text-blue-500 py-2 rounded-lg text-sm hover:bg-blue-50">
                          Update Status
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

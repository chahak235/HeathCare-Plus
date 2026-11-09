import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { RealtimeProvider } from './contexts/RealtimeContext';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { MainLayout } from './layouts/MainLayout';
import { About } from './pages/About';
import { Doctors } from './pages/Doctors';
import { Features } from './pages/Features';
import { HealthAssessment } from './pages/HealthAssessment';
import ImageAnalysis from './pages/ImageAnalysis';
import { Home } from "./pages/Home";
import { Login } from './pages/Login';
import MapPrediction from './pages/MapPrediction';
import { SignUp } from './pages/SignUp';
import './styles/globals.css';
import { Profile } from './pages/Profile';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { Chat } from './pages/Chat';
import { ChatPublic } from './pages/ChatPublic';
import { Dashboard } from './pages/Dashboard';
import { BedStatusProvider } from './contexts/BedStatusContext';
import DoctorDashboard from './pages/doctor/Dashboard';
import PatientPortal from './pages/patient/Portal';

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-lg">Page not found</p>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <RealtimeProvider>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              {/* Public Routes */}
              <Route index element={<Home />} />
              <Route path="about" element={<About />} />
              <Route path="features" element={<Features />} />
              <Route path="doctors" element={<Doctors />} />

              {/* Auth Routes */}
              <Route path="login" element={<Login />} />
              <Route path="signup" element={<SignUp />} />
              <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/chat-test" element={<ChatPublic />} />

              {/* Feature Routes */}
              <Route path="/chat" element={<Chat />} />
              <Route path="analysis" element={<ImageAnalysis />} />
              <Route path="map-prediction" element={<MapPrediction />} />
              <Route path="health-assessment" element={<HealthAssessment />} />
              
              {/* Protected Routes */}
              <Route path="dashboard" element={
                <ProtectedRoute allowedRoles={['hospital']}>
                  <BedStatusProvider>
                    <Dashboard />
                  </BedStatusProvider>
                </ProtectedRoute>
              } />
              
              <Route path="doctor-dashboard" element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <DoctorDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="patient-portal" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <PatientPortal />
                </ProtectedRoute>
              } />

              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </RealtimeProvider>
      </AuthProvider>
    </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;

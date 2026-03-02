import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { SplashScreen } from './screens/SplashScreen';
import { LoginScreen } from './screens/LoginScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ActivityScreen } from './screens/ActivityScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { AttendanceScreen } from './screens/AttendanceScreen';
import { DoubtsScreen } from './screens/DoubtsScreen';
import { ProfileScreen } from './screens/ProfileScreen';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<SplashScreen />} />
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/home" replace /> : <LoginScreen />}
      />
      <Route path="/home" element={<ProtectedRoute><HomeScreen /></ProtectedRoute>} />
      <Route path="/activity/:type/:id" element={<ProtectedRoute><ActivityScreen /></ProtectedRoute>} />
      <Route path="/results/:type/:id" element={<ProtectedRoute><ResultsScreen /></ProtectedRoute>} />
      <Route path="/attendance" element={<ProtectedRoute><AttendanceScreen /></ProtectedRoute>} />
      <Route path="/doubts" element={<ProtectedRoute><DoubtsScreen /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

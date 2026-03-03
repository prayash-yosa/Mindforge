import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { PageTransition } from './components/Animations';
import { BottomNav } from './components/BottomNav';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import ClassesScreen from './screens/ClassesScreen';
import AttendanceCalendarScreen from './screens/AttendanceCalendarScreen';
import SyllabusScreen from './screens/SyllabusScreen';
import TestsScreen from './screens/TestsScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import AlertsScreen from './screens/AlertsScreen';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AnimatedScreen({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <PageTransition>{children}</PageTransition>
    </ProtectedRoute>
  );
}

const NAV_ROUTES = ['/dashboard', '/classes', '/syllabus', '/tests', '/analytics', '/alerts'];

function AppLayout() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const showNav = isAuthenticated && NAV_ROUTES.some((r) => location.pathname.startsWith(r));

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <PageTransition><LoginScreen /></PageTransition>} />
        <Route path="/dashboard" element={<AnimatedScreen><DashboardScreen /></AnimatedScreen>} />
        <Route path="/classes" element={<AnimatedScreen><ClassesScreen /></AnimatedScreen>} />
        <Route path="/classes/calendar" element={<AnimatedScreen><AttendanceCalendarScreen /></AnimatedScreen>} />
        <Route path="/syllabus" element={<AnimatedScreen><SyllabusScreen /></AnimatedScreen>} />
        <Route path="/tests" element={<AnimatedScreen><TestsScreen /></AnimatedScreen>} />
        <Route path="/analytics" element={<AnimatedScreen><AnalyticsScreen /></AnimatedScreen>} />
        <Route path="/alerts" element={<AnimatedScreen><AlertsScreen /></AnimatedScreen>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {showNav && <BottomNav />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import SystemArchitecture from './pages/SystemArchitecture';
import DashboardPeon from './pages/DashboardPeon';
import DashboardPrincipal from './pages/DashboardPrincipal';
import DashboardDEO from './pages/DashboardDEO';
import DashboardContractor from './pages/DashboardContractor';
import './index.css';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/architecture" element={<SystemArchitecture />} />
            <Route
              path="/dashboard/peon"
              element={
                <ProtectedRoute requiredRole="peon">
                  <DashboardPeon />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/principal"
              element={
                <ProtectedRoute requiredRole="principal">
                  <DashboardPrincipal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/deo"
              element={
                <ProtectedRoute requiredRole="deo">
                  <DashboardDEO />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/contractor"
              element={
                <ProtectedRoute requiredRole="contractor">
                  <DashboardContractor />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;

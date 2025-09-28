import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';
import Dashboard from './pages/DashboardPage';
import AuthCallback from './pages/AuthCallback';
import Login from './pages/LoginPage';
import Register from './pages/RegisterPage';
import VerifyOTP from './pages/VerifyOtpPage';
import { NoteProvider } from './contexts/NoteContext';

function App() {
  return (
    <AuthProvider>
      <NoteProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-otp" element={<VerifyOTP />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
        </Router>
        </NoteProvider>
    </AuthProvider>
  );
}

export default App;

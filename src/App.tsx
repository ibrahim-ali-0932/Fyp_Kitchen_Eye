import { useState } from 'react';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import DashboardLayout from './components/DashboardLayout';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'landing' | 'login' | 'signup' | 'dashboard'>('landing');
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentPage('landing');
  };

  if (currentPage === 'landing') {
    return <LandingPage onSignIn={() => setCurrentPage('dashboard')} onGetStarted={() => setCurrentPage('signup')} />;
  }

  if (currentPage === 'login') {
    return <LoginPage onLogin={handleLogin} onSignup={() => setCurrentPage('signup')} onBack={() => setCurrentPage('landing')} />;
  }

  if (currentPage === 'signup') {
    return <SignupPage onSignup={handleLogin} onLogin={() => setCurrentPage('login')} onBack={() => setCurrentPage('landing')} />;
  }

  if (isAuthenticated) {
    return <DashboardLayout onLogout={handleLogout} />;
  }

  return null;
}

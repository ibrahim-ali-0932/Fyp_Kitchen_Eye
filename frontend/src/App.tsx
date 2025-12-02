import React, { useState } from "react";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardLayout from "./pages/DashboardLayout";

export default function App() {
  const [currentPage, setCurrentPage] = useState<
    "landing" | "login" | "signup" | "dashboard"
  >("landing");

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = (success: boolean) => {
    if (success) {
      setIsAuthenticated(true);
      setCurrentPage("dashboard");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("token"); // Clear stored token
    setCurrentPage("landing");
  };

  if (currentPage === "landing") {
    return (
      <LandingPage
        onSignIn={() => setCurrentPage("login")}
        onGetStarted={() => setCurrentPage("signup")}
      />
    );
  }

  if (currentPage === "login") {
    return (
      <LoginPage
        onLogin={handleLogin}
        onSignup={() => setCurrentPage("signup")}
        onBack={() => setCurrentPage("landing")}
      />
    );
  }

  if (currentPage === "signup") {
    return (
      <SignupPage
        onSignup={() => handleLogin(false)}
        onLogin={() => setCurrentPage("login")}
        onBack={() => setCurrentPage("landing")}
      />
    );
  }

  if (currentPage === "dashboard") {
    return isAuthenticated ? (
      <DashboardLayout onLogout={handleLogout} />
    ) : (
      <LoginPage
        onLogin={() => handleLogin(true)}
        onSignup={() => setCurrentPage("signup")}
        onBack={() => setCurrentPage("landing")}
      />
    );
  }

  return null;
}

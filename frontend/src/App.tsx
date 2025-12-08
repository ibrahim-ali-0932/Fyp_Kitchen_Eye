import React, { useState, useEffect } from "react";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardLayout from "./pages/DashboardLayout";
import BlogPage from "./pages/BlogPage";

export default function App() {
  const [currentPage, setCurrentPage] = useState<
    "landing" | "login" | "signup" | "dashboard" | "blog"
  >("landing");

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Scroll to top when navigating to blog or landing page
  useEffect(() => {
    if (currentPage === "blog" || currentPage === "landing") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentPage]);

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
        onBlog={() => setCurrentPage("blog")}
      />
    );
  }

  if (currentPage === "blog") {
    return (
      <BlogPage
        onBack={() => setCurrentPage("landing")}
        onSignIn={() => setCurrentPage("login")}
        onGetStarted={() => setCurrentPage("signup")}
        onBlog={() => setCurrentPage("blog")}
      />
    );
  }

  if (currentPage === "login") {
    return (
      <LoginPage
        onLogin={handleLogin}
        onSignup={() => setCurrentPage("signup")}
        onBack={() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
          setCurrentPage("landing");
        }}
        onBlog={() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
          setCurrentPage("blog");
        }}
      />
    );
  }

  if (currentPage === "signup") {
    return (
      <SignupPage
        onSignup={() => handleLogin(false)}
        onLogin={() => setCurrentPage("login")}
        onBack={() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
          setCurrentPage("landing");
        }}
        onBlog={() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
          setCurrentPage("blog");
        }}
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

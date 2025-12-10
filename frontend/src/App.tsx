import React, { useState, useEffect } from "react";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardLayout from "./pages/DashboardLayout";
import BlogPage from "./pages/BlogPage";
//import AdminUserManagement from "./pages/AdminUserManagement";

export default function App() {
  // Initialize state from sessionStorage or default to landing
  const [currentPage, setCurrentPage] = useState<
    "landing" | "login" | "signup" | "dashboard" | "blog" | "admin"
  >(() => {
    const saved = sessionStorage.getItem("currentPage");
    return (saved as any) || "landing";
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem("token");
    const savedAuth = sessionStorage.getItem("isAuthenticated");
    return savedAuth === "true" || !!token;
  });

  // Initialize browser history
  useEffect(() => {
    // Push initial state if not already present
    if (!window.history.state) {
      window.history.replaceState({ page: currentPage }, "", window.location.href);
    }
  }, []);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.page) {
        setCurrentPage(event.state.page);
      } else {
        // If no state and we're on landing, prevent going back further
        if (currentPage === "landing") {
          window.history.pushState({ page: "landing" }, "", window.location.href);
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [currentPage]);

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem("currentPage", currentPage);
    sessionStorage.setItem("isAuthenticated", String(isAuthenticated));
  }, [currentPage, isAuthenticated]);

  // Scroll to top when navigating to blog or landing page
  useEffect(() => {
    if (currentPage === "blog" || currentPage === "landing") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentPage]);
  const navigateTo = (page: typeof currentPage) => {
    setCurrentPage(page);
    window.history.pushState({ page }, "", window.location.href);
  };

  const handleLogin = (success: boolean, isAdmin = false) => {
    if (success) {
      if(isAdmin){
        navigateTo("admin");
      }
      else{
        setIsAuthenticated(true);
        navigateTo("dashboard");
      }
        
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("token"); // Clear stored token
    sessionStorage.removeItem("isAuthenticated");
    navigateTo("landing");
  };

  if (currentPage === "landing") {
    return (
      <LandingPage
        onSignIn={() => navigateTo("login")}
        onGetStarted={() => navigateTo("signup")}
        onBlog={() => navigateTo("blog")}
        onHome={() => navigateTo("landing")}
        onContactUs={() => navigateTo("landing")}
        onOurTeam={() => navigateTo("landing")}
      />
    );
  }

  if (currentPage === "blog") {
    return (
      <BlogPage
        onBack={() => navigateTo("landing")}
        onSignIn={() => navigateTo("login")}
        onGetStarted={() => navigateTo("signup")}
        onBlog={() => navigateTo("blog")}
      />
    );
  }

  if (currentPage === "login") {
    return (
      <LoginPage
        onLogin={handleLogin}
        onSignup={() => navigateTo("signup")}
        onBack={() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
          navigateTo("landing");
        }}
        onBlog={() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
          navigateTo("blog");
        }}
      />
    );
  }

  if (currentPage === "signup") {
    return (
      <SignupPage
        onSignup={(success) => {
          // After signup, user needs to verify email and login
          // The SignupPage will call onLogin() to redirect to login page
          if (success) {
            navigateTo("login");
          }
        }}
        onLogin={() => navigateTo("login")}
        onBack={() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
          navigateTo("landing");
        }}
        onBlog={() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
          navigateTo("blog");
        }}
      />
    );
  }

  if (currentPage === "dashboard") {
    return isAuthenticated ? (
      <DashboardLayout onLogout={handleLogout} />
    ) : (
      <LoginPage
        onLogin={(success) => handleLogin(success)}
        onSignup={() => navigateTo("signup")}
        onBack={() => navigateTo("landing")}
        onBlog={() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
          navigateTo("blog");
        }}
      />
    );
  }
      if (currentPage === "admin") {
      //return <AdminUserManagement onLogout={handleLogout} />;
  }

  return null;
}

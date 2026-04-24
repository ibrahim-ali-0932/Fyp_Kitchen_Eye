import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardLayout from "./pages/DashboardLayout";
import BlogPage from "./pages/BlogPage";
import { AdminPanel } from "./pages/AdminPanel";
import { ProtectedRoute, PublicRoute } from "./components/auth";
import { auth } from "./firebase";

/**
 * AppRoutes - Contains all the route definitions
 * Uses ProtectedRoute for authenticated pages and PublicRoute for login/signup
 */
function AppRoutes() {
  const navigate = useNavigate();

  const handleLogin = (success: boolean, isAdmin = false) => {
    if (success) {
      localStorage.setItem("isAuthenticated", "true");
      if (isAdmin) {
        localStorage.setItem("token", "admin_bypass");
        localStorage.setItem("token_uid", "admin");
        navigate("/admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("token_uid");
      localStorage.removeItem("isAuthenticated");
      navigate("/", { replace: true });
    }
  };

  const handleSignupSuccess = (success: boolean) => {
    if (success) {
      navigate("/login", { replace: true });
    }
  };

  return (
    <Routes>
      {/* Public Routes - accessible to everyone */}
      <Route
        path="/"
        element={
          <LandingPage
            onSignIn={() => navigate("/login")}
            onGetStarted={() => navigate("/signup")}
            onBlog={() => navigate("/blog")}
            onHome={() => navigate("/")}
            onContactUs={() => navigate("/")}
            onOurTeam={() => navigate("/")}
          />
        }
      />

      <Route
        path="/blog"
        element={
          <BlogPage
            onBack={() => navigate("/")}
            onSignIn={() => navigate("/login")}
            onGetStarted={() => navigate("/signup")}
            onBlog={() => navigate("/blog")}
          />
        }
      />

      {/* Auth Routes - redirect to dashboard if already logged in */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage
              onLogin={handleLogin}
              onSignup={() => navigate("/signup")}
              onBack={() => navigate("/")}
              onBlog={() => navigate("/blog")}
            />
          </PublicRoute>
        }
      />

      <Route
        path="/signup"
        element={
          <PublicRoute>
            <SignupPage
              onSignup={handleSignupSuccess}
              onLogin={() => navigate("/login")}
              onBack={() => navigate("/")}
              onBlog={() => navigate("/blog")}
            />
          </PublicRoute>
        }
      />

      {/* Protected Routes - require authentication */}
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            <DashboardLayout onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute>
            <AdminPanel onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      {/* Catch-all route - redirect to home */}
      <Route
        path="*"
        element={
          <LandingPage
            onSignIn={() => navigate("/login")}
            onGetStarted={() => navigate("/signup")}
            onBlog={() => navigate("/blog")}
            onHome={() => navigate("/")}
            onContactUs={() => navigate("/")}
            onOurTeam={() => navigate("/")}
          />
        }
      />
    </Routes>
  );
}

/**
 * App - Main application component with BrowserRouter
 */
export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

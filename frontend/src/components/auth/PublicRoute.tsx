import { Navigate } from "react-router-dom";

interface PublicRouteProps {
  children: React.ReactNode;
}

/**
 * PublicRoute - Wraps routes that should only be accessible when NOT authenticated
 * If user IS authenticated, redirects to dashboard
 * This prevents logged-in users from accessing login/signup pages
 * Also solves the "back button" problem - pressing back to login redirects to dashboard
 */
export function PublicRoute({ children }: PublicRouteProps) {
  const token = localStorage.getItem("token");
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";

  // Only redirect if BOTH token exists AND user is explicitly marked as authenticated
  // This prevents redirect with stale tokens from previous sessions
  if (token && isAuthenticated) {
    // User is already logged in, redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}


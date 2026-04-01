//////D:\sem 7\FYP\Frontend\backend\app\main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .router import signup, login, profile, stats, violations, users, cameras

app = FastAPI(title="KitchenEye API")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:3001",
    ],  # Your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers with /auth prefix
app.include_router(signup.router, prefix="/auth")
app.include_router(login.router, prefix="/auth")
app.include_router(profile.router, prefix="/auth")
app.include_router(stats.router)
app.include_router(violations.router)
app.include_router(users.router, prefix="/auth")
app.include_router(cameras.router, prefix="/auth")


@app.get("/")
def read_root():
    return {"message": "KitchenEye API is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
//////////////D:\sem 7\FYP\Frontend\backend\app\database\db.py
# app/db.py
import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate(
    "app/credentials/kitchen-eye-f607f-firebase-adminsdk-fbsvc-2d8eb5ab8e.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

//////////backend/app/auth/authentication.py

from fastapi import Header, HTTPException
from firebase_admin import credentials, auth
import firebase_admin
import os


# ------------------------------
# Extract Bearer token correctly
# ------------------------------

async def oauth2_scheme(Authorization: str = Header(None)):
    """
    Extract Firebase ID token from the Authorization header.
    Must be: Authorization: Bearer <token>
    """

    print("🔥 Authorization header received:", Authorization)

    if Authorization is None:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    if not Authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid Authorization format")

    return Authorization.replace("Bearer ", "").strip()  # return only token


# ------------------------------
# Initialize Firebase Admin SDK
# ------------------------------

current_dir = os.path.dirname(os.path.abspath(__file__))
cred_path = os.path.normpath(
    os.path.join(
        current_dir,
        "..",
        "credentials",
        "kitchen-eye-f607f-firebase-adminsdk-fbsvc-1ccac73f93.json",
        
    )
)

cred = credentials.Certificate(cred_path)

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)


# ------------------------------
# Verify Firebase ID Token
# ------------------------------

def verify_token(token: str = None, require_verified: bool = True):
    """
    Verify Firebase ID token - can be used as a dependency or called directly
    """
    if token is None:
        # If used as dependency, token should come from oauth2_scheme
        raise HTTPException(status_code=401, detail="Token is required")
    
    print("🔥 Verifying token:", token[:30] if token else "None", "...")

    try:
        decoded = auth.verify_id_token(token)
    except Exception as e:
        print("🔥 Firebase token verification failed:", e)
        raise HTTPException(status_code=401, detail="Invalid token")

    if require_verified and not decoded.get("email_verified"):
        raise HTTPException(status_code=403, detail="Email not verified")

    return decoded


# ------------------------------
# FastAPI Dependency for verifying tokens
# ------------------------------

async def get_current_user(Authorization: str = Header(None)):
    """
    FastAPI dependency to verify Firebase token from Authorization header
    """
    if Authorization is None:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    if not Authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid Authorization format")
    
    token = Authorization.replace("Bearer ", "").strip()
    
    print("🔥 Verifying token from dependency:", token[:30] + "...")
    
    try:
        decoded = auth.verify_id_token(token)
    except Exception as e:
        print("🔥 Firebase token verification failed:", e)
        raise HTTPException(status_code=401, detail="Invalid token")

    # For profile access, we require email verification
    if not decoded.get("email_verified"):
        raise HTTPException(status_code=403, detail="Email not verified")

    return decoded
/////////////////D:\sem 7\FYP\Frontend\backend\app\router\violations.py
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..auth.authentication import oauth2_scheme, verify_token
from ..database.db import db

router = APIRouter(prefix="/violations", tags=["violations"])


class ViolationLogRequest(BaseModel):
    violation_type: str
    camera_location: str
    destination_email: Optional[str] = None
    is_test: bool = True


@router.post("/log")
async def log_violation(
    payload: ViolationLogRequest, token: str = Depends(oauth2_scheme)
):
    """Log a violation/test email for the authenticated user."""
    decoded = verify_token(token, require_verified=True)
    user_email = decoded.get("email")

    if not user_email:
        raise HTTPException(status_code=400, detail="User email missing in token")

    try:
        doc = {
            "email": user_email,
            "destination_email": payload.destination_email or user_email,
            "violation_type": payload.violation_type,
            "camera_location": payload.camera_location,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "is_test": payload.is_test,
            "sent_via": "emailjs",
        }
        db.collection("violations").add(doc)
        return {"message": "Logged"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user")
async def list_user_violations(token: str = Depends(oauth2_scheme)):
    """Return recent violations for the authenticated user."""
    print(f"🔔 GET /violations/user - Request received")
    
    try:
        print(f"🔑 Verifying token...")
        decoded = verify_token(token, require_verified=True)
        user_email = decoded.get("email")
        print(f"✅ Token verified for user: {user_email}")

        if not user_email:
            print(f"❌ User email missing in token")
            raise HTTPException(status_code=400, detail="User email missing in token")

        print(f"📦 Fetching violations from Firestore for: {user_email}")
        docs = db.collection("violations").where("email", "==", user_email).stream()
        items = []
        for doc in docs:
            data = doc.to_dict() or {}
            data["id"] = doc.id
            items.append(data)

        print(f"📋 Found {len(items)} violations for user")
        
        # Sort newest first using ISO timestamps
        items.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        
        print(f"✅ Returning {len(items)} violations")
        return items
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Failed to fetch violations: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
/////////////////////D:\sem 7\FYP\Frontend\backend\app\router\stats.py
# app/router/stats.py
# -----------------------
# Reads .txt files from /app/data and returns JSON.

from fastapi import APIRouter, HTTPException, Response
import os, json

router = APIRouter()

DATA_FOLDER = "app/data"

@router.get("/stats/{filename}")
async def get_stats(filename: str, response: Response):
    # Disable caching
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    
    file_path = os.path.join(DATA_FOLDER, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    try:
        # Always read fresh from disk
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read().strip()

            # If file is pure JSON — parse it safely
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                # If simple number inside txt
                if content.isdigit():
                    return {"value": int(content)}
                return {"value": content}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

/////////////////////D:\sem 7\FYP\Frontend\frontend\src\services\api.ts
export const API_URL = "http://127.0.0.1:8000";

export async function loginUser(email: string, password: string) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error("Invalid credentials");
  }

  return response.json();
}

/////////D:\sem 7\FYP\Frontend\frontend\src\services\violationsService.ts
import { API_URL } from "./api";

export type ViolationRecord = {
  id: string;
  violation_type: string;
  camera_location: string;
  destination_email?: string;
  timestamp: string;
  is_test?: boolean;
  sent_via?: string;
};

export async function fetchUserViolations(
  token: string
): Promise<ViolationRecord[]> {
  console.log("🔔 VIOLATIONS API - Fetching user violations");
  console.log("   URL:", `${API_URL}/violations/user`);
  console.log("   Token:", token.substring(0, 20) + "...");
  
  const response = await fetch(`${API_URL}/violations/user`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log("📡 Response status:", response.status);
  console.log("📡 Response ok:", response.ok);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ API Error:", errorText);
    throw new Error(`Failed to fetch violations: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log("✅ Violations data received:", data);
  return data;
}

export async function logViolation(params: {
  violation_type: string;
  camera_location: string;
  destination_email?: string;
  token: string;
  is_test?: boolean;
}): Promise<void> {
  const { violation_type, camera_location, destination_email, token, is_test } =
    params;

  const response = await fetch(`${API_URL}/violations/log`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      violation_type,
      camera_location,
      destination_email,
      is_test: is_test ?? true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to log violation");
  }
}
////////////D:\sem 7\FYP\Frontend\frontend\src\services\statsService.ts
// services/statsService.ts
// -------------------------
// Handles fetching text-based statistics from FastAPI backend.
// Every backend file returns JSON, this service parses it safely.

export interface StatItem {
  title: string;
  value: number | string;
  change?: string;
  trend?: string;
  icon?: any;
  color?: string;
  bgColor?: string;
}

export interface ViolationTrend {
  day: string;
  ppe: number;
  spill: number;
  pest: number;
  fire: number;
}

export interface RecentViolation {
  id: number;
  type: string;
  description: string;
  severity: string;
  location: string;
  timestamp: string;
  status: string;
  image: string;
}

const API_BASE = "http://localhost:8000"; // change in production

// Fetch any stat file like violations.txt, trend.txt, etc.
export async function fetchStats(filename: string) {
  try {
    // Add timestamp to prevent caching
    const timestamp = new Date().getTime();
    const response = await fetch(`${API_BASE}/stats/${filename}?t=${timestamp}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    if (!response.ok) {
      console.warn("File not found:", filename);
      return null;
    }
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Failed to fetch stats:", err);
    return null;
  }
}
////////////D:\sem 7\FYP\Frontend\frontend\src\App.tsx
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardLayout from "./pages/DashboardLayout";
import BlogPage from "./pages/BlogPage";
import { AdminPanel } from "./pages/AdminPanel";
import { ProtectedRoute, PublicRoute } from "./components/auth";

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
        navigate("/admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("isAuthenticated");
    navigate("/", { replace: true });
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
      <Route path="*" element={<LandingPage
        onSignIn={() => navigate("/login")}
        onGetStarted={() => navigate("/signup")}
        onBlog={() => navigate("/blog")}
        onHome={() => navigate("/")}
        onContactUs={() => navigate("/")}
        onOurTeam={() => navigate("/")}
      />} />
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
//////////////////////D:\sem 7\FYP\Frontend\frontend\src\firebase.js

import { getAuth } from "firebase/auth";
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBZxmhMGMWQspOJ-5mvb9XzcUXUrJwyifU",
  authDomain: "kitchen-eye-f607f.firebaseapp.com",
  projectId: "kitchen-eye-f607f",
  storageBucket: "kitchen-eye-f607f.firebasestorage.app",
  messagingSenderId: "680623555246",
  appId: "1:680623555246:web:83a97dc62470853c72e33f",
  measurementId: "G-VKN355F72C",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only in browser environment
let analytics = null;
if (typeof window !== "undefined") {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn("Analytics initialization failed:", error);
  }
}

// Initialize Auth (always available)
export const auth = getAuth(app);
//////////////////////////D:\sem 7\FYP\Frontend\frontend\src\pages\Dashboard.tsx
import { useEffect, useState } from "react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  AlertTriangle,
  Droplet,
  Bug,
  Flame,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Clock,
  Camera,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import {
  fetchStats,
  StatItem,
  ViolationTrend,
  RecentViolation,
} from "../services/statsService";

export default function Dashboard() {
  const [stats, setStats] = useState([
    {
      title: "PPE Violations",
      value: "0",
      change: "0%",
      trend: "neutral",
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Spill Violations",
      value: "0",
      change: "0%",
      trend: "neutral",
      icon: Droplet,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Pest Detections",
      value: "0",
      change: "0%",
      trend: "neutral",
      icon: Bug,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Fire/Smoke Alerts",
      value: "0",
      change: "0%",
      trend: "neutral",
      icon: Flame,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Hygiene Index Score",
      value: "0%",
      change: "0%",
      trend: "neutral",
      icon: ShieldCheck,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  ]);

  const [violationData, setViolationData] = useState<ViolationTrend[]>([]);
  const [recentViolations, setRecentViolations] = useState<RecentViolation[]>(
    []
  );

  const loadDashboardData = async () => {
    // Fetch violations.txt for stats
    const violationsResponse = await fetchStats("violations.txt");
    if (violationsResponse?.value) {
      const lines = violationsResponse.value
        .split("\n")
        .filter((line: string) => line.trim());
      const iconMapping = {
        "PPE Violations": AlertTriangle,
        "Spill Violations": Droplet,
        "Pest Detections": Bug,
        "Fire/Smoke Alerts": Flame,
        "Hygiene Index Score": ShieldCheck,
      };
      const colorMapping = {
        "PPE Violations": { color: "text-orange-600", bgColor: "bg-orange-50" },
        "Spill Violations": { color: "text-blue-600", bgColor: "bg-blue-50" },
        "Pest Detections": { color: "text-red-600", bgColor: "bg-red-50" },
        "Fire/Smoke Alerts": {
          color: "text-purple-600",
          bgColor: "bg-purple-50",
        },
        "Hygiene Index Score": {
          color: "text-green-600",
          bgColor: "bg-green-50",
        },
      };

      const parsedStats = lines.map((line: string) => {
        const [title, value, change, trend] = line.split("|");
        return {
          title,
          value,
          change,
          trend,
          icon: iconMapping[title as keyof typeof iconMapping] || AlertTriangle,
          color:
            colorMapping[title as keyof typeof colorMapping]?.color ||
            "text-gray-600",
          bgColor:
            colorMapping[title as keyof typeof colorMapping]?.bgColor ||
            "bg-gray-50",
        };
      });
      setStats(parsedStats);
    }

    // Fetch violation_trend.txt for chart data
    const trendResponse = await fetchStats("violation_trend.txt");
    if (trendResponse?.value) {
      const lines = trendResponse.value
        .split("\n")
        .filter((line: string) => line.trim());
      const parsedTrend = lines.slice(1).map((line: string) => {
        const [day, ppe, spill, pest, fire] = line.split(",");
        return {
          day,
          ppe: parseInt(ppe),
          spill: parseInt(spill),
          pest: parseInt(pest),
          fire: parseInt(fire),
        };
      });
      setViolationData(parsedTrend);
    }

    // Fetch recent_violations.txt
    const recentResponse = await fetchStats("recent_violations.txt");
    if (recentResponse?.value) {
      const lines = recentResponse.value
        .split("\n")
        .filter((line: string) => line.trim());
      const parsedViolations = lines.map((line: string) => {
        const [
          id,
          type,
          description,
          severity,
          location,
          timestamp,
          status,
          image,
        ] = line.split("|");
        return {
          id: parseInt(id),
          type,
          description,
          severity,
          location,
          timestamp,
          status,
          image,
        };
      });
      setRecentViolations(parsedViolations);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Reload data when window regains focus
    const handleFocus = () => {
      loadDashboardData();
    };

    window.addEventListener("focus", handleFocus);

    // Optional: Auto-refresh every 10 seconds
    const interval = setInterval(loadDashboardData, 10000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "bg-red-100 text-red-700 border-red-200";
      case "High":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusColor = (status: string) => {
    return status === "Resolved"
      ? "bg-green-100 text-green-700 border-green-200"
      : "bg-blue-100 text-blue-700 border-blue-200";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl mb-2">Dashboard</h1>
        <p className="text-slate-600">
          Monitor hygiene compliance and safety violations in real-time
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}
              >
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              {stat.trend !== "neutral" && (
                <div
                  className={`flex items-center gap-1 text-sm ${
                    stat.trend === "up" ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {stat.trend === "up" ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span>{stat.change}</span>
                </div>
              )}
            </div>
            <div>
              <div className="text-3xl mb-1">{stat.value}</div>
              <div className="text-sm text-slate-600">{stat.title}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Violations Chart */}
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-xl mb-1">Violations Per Day</h2>
          <p className="text-sm text-slate-600">
            Last 12 days violation trends by category
          </p>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={violationData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="day" tick={{ fill: "#64748b" }} />
            <YAxis tick={{ fill: "#64748b" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
            <Legend />
            <Bar
              dataKey="ppe"
              fill="#f97316"
              name="PPE Violations"
              radius={[8, 8, 0, 0]}
            />
            <Bar
              dataKey="spill"
              fill="#3b82f6"
              name="Spill Violations"
              radius={[8, 8, 0, 0]}
            />
            <Bar
              dataKey="pest"
              fill="#ef4444"
              name="Pest Detections"
              radius={[8, 8, 0, 0]}
            />
            <Bar
              dataKey="fire"
              fill="#a855f7"
              name="Fire Alerts"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Recent Violations */}
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-xl mb-1">Recent Violations</h2>
          <p className="text-sm text-slate-600">
            Latest detected violations across all locations
          </p>
        </div>
        <div className="space-y-4">
          {recentViolations.map((violation) => (
            <div
              key={violation.id}
              className="flex gap-4 p-4 rounded-xl border hover:shadow-md transition-shadow"
            >
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                <ImageWithFallback
                  src={violation.image}
                  alt={violation.type}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <h3 className="mb-1">{violation.type}</h3>
                    <p className="text-sm text-slate-600">
                      {violation.description}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Badge
                      className={getSeverityColor(violation.severity)}
                      variant="outline"
                    >
                      {violation.severity}
                    </Badge>
                    <Badge
                      className={getStatusColor(violation.status)}
                      variant="outline"
                    >
                      {violation.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1">
                    <Camera className="w-4 h-4" />
                    {violation.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {violation.timestamp}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
////D:\sem 7\FYP\Frontend\frontend\src\pages\ViolationHistory.tsx

import { useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Calendar,
  Download,
  Filter,
  Search,
  Camera,
  Clock,
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export default function ViolationHistory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const violations = [
    {
      id: "VIO-2024-001",
      type: "PPE Violation",
      description: "Missing hairnet detected in food preparation area",
      severity: "Medium",
      location: "Kitchen 1 - Main Prep Area",
      timestamp: "2024-11-23 14:30:22",
      status: "Pending",
      branch: "Downtown Branch",
      image:
        "https://images.unsplash.com/photo-1762330018258-2cf9b8f80618?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tZXJjaWFsJTIwa2l0Y2hlbiUyMGh5Z2llbmV8ZW58MXx8fHwxNzYzODg2MjA1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    },
    {
      id: "VIO-2024-002",
      type: "Spill Detection",
      description: "Liquid spill detected on floor near dishwashing station",
      severity: "High",
      location: "Kitchen 2 - Dishwashing Area",
      timestamp: "2024-11-23 11:15:44",
      status: "Resolved",
      branch: "Downtown Branch",
      image:
        "https://images.unsplash.com/photo-1762330018258-2cf9b8f80618?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tZXJjaWFsJTIwa2l0Y2hlbiUyMGh5Z2llbmV8ZW58MXx8fHwxNzYzODg2MjA1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    },
    {
      id: "VIO-2024-003",
      type: "PPE Violation",
      description: "Missing gloves detected while handling food",
      severity: "Medium",
      location: "Kitchen 1 - Food Prep Station",
      timestamp: "2024-11-23 09:42:15",
      status: "Pending",
      branch: "Westside Branch",
      image:
        "https://images.unsplash.com/photo-1762330018258-2cf9b8f80618?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tZXJjaWFsJTIwa2l0Y2hlbiUyMGh5Z2llbmV8ZW58MXx8fHwxNzYzODg2MjA1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    },
    {
      id: "VIO-2024-004",
      type: "Pest Detection",
      description: "Rodent activity detected in storage area",
      severity: "Critical",
      location: "Storage Room B",
      timestamp: "2024-11-22 22:18:33",
      status: "Resolved",
      branch: "Eastside Branch",
      image:
        "https://images.unsplash.com/photo-1762330018258-2cf9b8f80618?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tZXJjaWFsJTIwa2l0Y2hlbiUyMGh5Z2llbmV8ZW58MXx8fHwxNzYzODg2MjA1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    },
    {
      id: "VIO-2024-005",
      type: "PPE Violation",
      description: "Improper mask usage detected",
      severity: "Low",
      location: "Kitchen 3 - Salad Station",
      timestamp: "2024-11-22 16:05:12",
      status: "Resolved",
      branch: "Downtown Branch",
      image:
        "https://images.unsplash.com/photo-1762330018258-2cf9b8f80618?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tZXJjaWFsJTIwa2l0Y2hlbiUyMGh5Z2llbmV8ZW58MXx8fHwxNzYzODg2MjA1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    },
    {
      id: "VIO-2024-006",
      type: "Spill Detection",
      description: "Oil spill detected near cooking station",
      severity: "High",
      location: "Kitchen 1 - Cooking Area",
      timestamp: "2024-11-22 13:27:45",
      status: "Pending",
      branch: "Westside Branch",
      image:
        "https://images.unsplash.com/photo-1762330018258-2cf9b8f80618?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tZXJjaWFsJTIwa2l0Y2hlbiUyMGh5Z2llbmV8ZW58MXx8fHwxNzYzODg2MjA1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "bg-red-100 text-red-700 border-red-200";
      case "High":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Low":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusColor = (status: string) => {
    return status === "Resolved"
      ? "bg-green-100 text-green-700 border-green-200"
      : "bg-blue-100 text-blue-700 border-blue-200";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl mb-2">Violation History</h1>
        <p className="text-slate-600">
          View and manage all detected violations across your locations
        </p>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Filter className="w-5 h-5 text-slate-600" />
          <h2 className="text-lg">Filters</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label>Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search violations..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="ppe">PPE Violations</SelectItem>
                <SelectItem value="spill">Spill Detection</SelectItem>
                <SelectItem value="pest">Pest Detection</SelectItem>
                <SelectItem value="fire">Fire/Smoke Alerts</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Severity</Label>
            <Select
              value={selectedSeverity}
              onValueChange={setSelectedSeverity}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date Range</Label>
            <Button variant="outline" className="w-full justify-start">
              <Calendar className="w-4 h-4 mr-2" />
              Select dates
            </Button>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </Card>

      {/* Violations List */}
      <Card className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg mb-1">All Violations</h2>
            <p className="text-sm text-slate-600">
              {violations.length} total violations found
            </p>
          </div>
        </div>
        <div className="space-y-4">
          {violations.map((violation) => (
            <div
              key={violation.id}
              className="flex gap-4 p-4 rounded-xl border hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                <ImageWithFallback
                  src={violation.image}
                  alt={violation.type}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3>{violation.type}</h3>
                      <span className="text-sm text-slate-500">
                        #{violation.id}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">
                      {violation.description}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Badge
                      className={getSeverityColor(violation.severity)}
                      variant="outline"
                    >
                      {violation.severity}
                    </Badge>
                    <Badge
                      className={getStatusColor(violation.status)}
                      variant="outline"
                    >
                      {violation.status}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1">
                    <Camera className="w-4 h-4" />
                    {violation.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {violation.timestamp}
                  </span>
                  <span className="flex items-center gap-1">
                    {violation.branch}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t">
          <p className="text-sm text-slate-600">Showing 1 to 6 of 6 results</p>
          <div className="flex gap-2">
            <Button variant="outline" disabled>
              Previous
            </Button>
            <Button variant="outline" className="bg-blue-50 text-blue-600">
              1
            </Button>
            <Button variant="outline" disabled>
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

//////////////////////////////////D:\sem 7\FYP\Frontend\frontend\src\pages\Reports.tsx
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Calendar, Download, FileText, Printer, Mail, Eye } from "lucide-react";

export default function Reports() {
  const reports = [
    {
      id: "RPT-2024-11",
      title: "Monthly Hygiene Compliance Report",
      period: "November 2024",
      generatedDate: "2024-11-20",
      type: "Monthly",
      status: "Ready",
      fileSize: "2.4 MB",
      violations: 156,
      branches: 4,
    },
    {
      id: "RPT-2024-10",
      title: "Monthly Hygiene Compliance Report",
      period: "October 2024",
      generatedDate: "2024-10-20",
      type: "Monthly",
      status: "Ready",
      fileSize: "2.1 MB",
      violations: 189,
      branches: 4,
    },
    {
      id: "RPT-2024-W46",
      title: "Weekly Violation Summary",
      period: "Week 46, 2024",
      generatedDate: "2024-11-17",
      type: "Weekly",
      status: "Ready",
      fileSize: "856 KB",
      violations: 42,
      branches: 4,
    },
    {
      id: "RPT-2024-W45",
      title: "Weekly Violation Summary",
      period: "Week 45, 2024",
      generatedDate: "2024-11-10",
      type: "Weekly",
      status: "Ready",
      fileSize: "782 KB",
      violations: 38,
      branches: 4,
    },
  ];

  const reportTemplates = [
    {
      name: "Monthly Compliance Report",
      description:
        "Comprehensive monthly report with all violations, trends, and compliance metrics",
      frequency: "Monthly",
      icon: FileText,
    },
    {
      name: "Weekly Summary",
      description: "Quick weekly overview of violations and key metrics",
      frequency: "Weekly",
      icon: FileText,
    },
    {
      name: "Quarterly Audit Report",
      description:
        "Detailed quarterly report for regulatory compliance and audits",
      frequency: "Quarterly",
      icon: FileText,
    },
    {
      name: "Custom Date Range Report",
      description: "Generate reports for any custom date range you need",
      frequency: "On-demand",
      icon: FileText,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl mb-2">Reports</h1>
        <p className="text-slate-600">
          Generate and download compliance reports for audits and analysis
        </p>
      </div>

      {/* Generate New Report */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border-blue-100">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-xl mb-2">Generate New Report</h2>
            <p className="text-sm text-slate-600 mb-4">
              Create custom reports for any time period or branch
            </p>
            <div className="flex flex-wrap gap-3">
              <Select defaultValue="monthly">
                <SelectTrigger className="w-48 bg-white">
                  <SelectValue placeholder="Report Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly Report</SelectItem>
                  <SelectItem value="weekly">Weekly Report</SelectItem>
                  <SelectItem value="quarterly">Quarterly Report</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-48 bg-white">
                  <SelectValue placeholder="Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  <SelectItem value="downtown">Downtown Branch</SelectItem>
                  <SelectItem value="westside">Westside Branch</SelectItem>
                  <SelectItem value="eastside">Eastside Branch</SelectItem>
                </SelectContent>
              </Select>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </div>
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
            <FileText className="w-8 h-8 text-white" />
          </div>
        </div>
      </Card>

      {/* Report Templates */}
      <div>
        <h2 className="text-xl mb-4">Report Templates</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportTemplates.map((template, index) => (
            <Card
              key={index}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                <template.icon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="mb-2">{template.name}</h3>
              <p className="text-sm text-slate-600 mb-4">
                {template.description}
              </p>
              <Badge variant="outline" className="text-xs">
                {template.frequency}
              </Badge>
            </Card>
          ))}
        </div>
      </div>

      {/* Generated Reports */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl">Generated Reports</h2>
          <div className="flex gap-2">
            <Select defaultValue="all">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reports</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-3">
          {reports.map((report) => (
            <Card key={report.id} className="p-6">
              <div className="flex items-start justify-between gap-6">
                <div className="flex gap-4 flex-1">
                  <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-7 h-7 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="mb-1">{report.title}</h3>
                        <p className="text-sm text-slate-600">
                          {report.period}
                        </p>
                      </div>
                      <Badge
                        className="bg-green-100 text-green-700 border-green-200"
                        variant="outline"
                      >
                        {report.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Generated: {report.generatedDate}
                      </span>
                      <span>ID: {report.id}</span>
                      <span>Size: {report.fileSize}</span>
                      <span>{report.violations} Violations</span>
                      <span>{report.branches} Branches</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        PDF
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Excel
                      </Button>
                      <Button size="sm" variant="outline">
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                      </Button>
                      <Button size="sm" variant="outline">
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Report Preview */}
      <Card className="p-6">
        <h2 className="text-xl mb-4">Report Preview</h2>
        <div className="bg-slate-50 rounded-xl p-8 border-2 border-dashed border-slate-200">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl mb-2">
                Monthly Hygiene Compliance Report
              </h3>
              <p className="text-slate-600 mb-6">November 2024</p>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-white rounded-lg">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Violations</p>
                <p className="text-2xl">156</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Compliance Score</p>
                <p className="text-2xl text-green-600">87%</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Critical Alerts</p>
                <p className="text-2xl text-red-600">4</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">
                  Avg Resolution Time
                </p>
                <p className="text-2xl">2.4h</p>
              </div>
            </div>

            <div className="text-center text-sm text-slate-500">
              Generate a report to see full preview
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
/////////////D:\sem 7\FYP\Frontend\frontend\src\pages\Analytics.tsx
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function Analytics() {
  const weeklyTrends = [
    { week: "Week 1", ppe: 45, spill: 12, pest: 3, fire: 0 },
    { week: "Week 2", ppe: 38, spill: 15, pest: 2, fire: 1 },
    { week: "Week 3", ppe: 42, spill: 10, pest: 4, fire: 0 },
    { week: "Week 4", ppe: 24, spill: 8, pest: 3, fire: 0 },
  ];

  const branchComparison = [
    { branch: "Downtown", violations: 85 },
    { branch: "Westside", violations: 62 },
    { branch: "Eastside", violations: 48 },
    { branch: "Northside", violations: 71 },
  ];

  const hourlyHeatmap = [
    { hour: "6 AM", violations: 2 },
    { hour: "7 AM", violations: 5 },
    { hour: "8 AM", violations: 8 },
    { hour: "9 AM", violations: 12 },
    { hour: "10 AM", violations: 15 },
    { hour: "11 AM", violations: 18 },
    { hour: "12 PM", violations: 22 },
    { hour: "1 PM", violations: 20 },
    { hour: "2 PM", violations: 16 },
    { hour: "3 PM", violations: 12 },
    { hour: "4 PM", violations: 10 },
    { hour: "5 PM", violations: 14 },
    { hour: "6 PM", violations: 16 },
    { hour: "7 PM", violations: 19 },
    { hour: "8 PM", violations: 15 },
    { hour: "9 PM", violations: 8 },
    { hour: "10 PM", violations: 5 },
  ];

  const violationCategories = [
    { name: "PPE Violations", value: 149, color: "#f97316" },
    { name: "Spill Detection", value: 45, color: "#3b82f6" },
    { name: "Pest Detection", value: 12, color: "#ef4444" },
    { name: "Fire/Smoke", value: 1, color: "#a855f7" },
  ];

  const kpiData = [
    {
      title: "Avg Daily Violations",
      value: "12.3",
      change: "-18%",
      trend: "down",
      period: "vs last month",
    },
    {
      title: "Resolution Time",
      value: "2.4h",
      change: "-32%",
      trend: "down",
      period: "average time",
    },
    {
      title: "Compliance Rate",
      value: "87%",
      change: "+5%",
      trend: "up",
      period: "this month",
    },
    {
      title: "Critical Alerts",
      value: "4",
      change: "-60%",
      trend: "down",
      period: "this month",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Analytics & Trends</h1>
          <p className="text-slate-600">
            Comprehensive insights into hygiene compliance and violations
          </p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="30days">
            <SelectTrigger className="w-48">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <p className="text-sm text-slate-600">{kpi.title}</p>
              <div
                className={`flex items-center gap-1 text-sm ${
                  kpi.trend === "up" ? "text-green-600" : "text-red-600"
                }`}
              >
                {kpi.trend === "up" ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span>{kpi.change}</span>
              </div>
            </div>
            <div>
              <div className="text-3xl mb-1">{kpi.value}</div>
              <p className="text-xs text-slate-500">{kpi.period}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Weekly Trends */}
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-xl mb-1">Weekly Violation Trends</h2>
          <p className="text-sm text-slate-600">
            Violation patterns over the last 4 weeks
          </p>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={weeklyTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="week" tick={{ fill: "#64748b" }} />
            <YAxis tick={{ fill: "#64748b" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="ppe"
              stroke="#f97316"
              strokeWidth={2}
              name="PPE Violations"
            />
            <Line
              type="monotone"
              dataKey="spill"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Spill Violations"
            />
            <Line
              type="monotone"
              dataKey="pest"
              stroke="#ef4444"
              strokeWidth={2}
              name="Pest Detections"
            />
            <Line
              type="monotone"
              dataKey="fire"
              stroke="#a855f7"
              strokeWidth={2}
              name="Fire Alerts"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Multi-Branch Comparison & Violation Categories */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-xl mb-1">Multi-Branch Comparison</h2>
            <p className="text-sm text-slate-600">
              Total violations by location
            </p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={branchComparison} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fill: "#64748b" }} />
              <YAxis
                dataKey="branch"
                type="category"
                tick={{ fill: "#64748b" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              <Bar dataKey="violations" fill="#3b82f6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-xl mb-1">Violation Categories</h2>
            <p className="text-sm text-slate-600">Distribution by type</p>
          </div>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={violationCategories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {violationCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            {violationCategories.map((category, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <div className="text-sm">
                  <p className="text-slate-600">{category.name}</p>
                  <p>{category.value} total</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Hourly Heatmap */}
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-xl mb-1">High-Risk Hours Heatmap</h2>
          <p className="text-sm text-slate-600">
            Violation frequency by time of day
          </p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={hourlyHeatmap}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="hour" tick={{ fill: "#64748b", fontSize: 12 }} />
            <YAxis tick={{ fill: "#64748b" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
            <Bar dataKey="violations" fill="#10b981" radius={[8, 8, 0, 0]}>
              {hourlyHeatmap.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.violations > 18
                      ? "#ef4444"
                      : entry.violations > 12
                      ? "#f97316"
                      : entry.violations > 6
                      ? "#fbbf24"
                      : "#10b981"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-center gap-6 mt-6">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 bg-green-500 rounded" />
            <span className="text-slate-600">Low (0-6)</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 bg-yellow-400 rounded" />
            <span className="text-slate-600">Medium (7-12)</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 bg-orange-500 rounded" />
            <span className="text-slate-600">High (13-18)</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 bg-red-500 rounded" />
            <span className="text-slate-600">Critical (19+)</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
/////////////////////D:\sem 7\FYP\Frontend\frontend\src\pages\CameraManagement.tsx
import { useState } from "react";
import { Plus, Settings, Trash2, Camera, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import type { CameraInfo } from "./AdminPanel";

interface CameraManagementProps {
  cameras: CameraInfo[];
  userId: string;
  onAddCamera: (camera: Omit<CameraInfo, "id" | "thumbnail">) => void;
  onUpdateCamera: (cameraId: string, updates: Partial<CameraInfo>) => void;
  onDeleteCamera: (cameraId: string) => void;
}

export function CameraManagement({
  cameras,
  userId,
  onAddCamera,
  onUpdateCamera,
  onDeleteCamera,
}: CameraManagementProps) {
  const [isAddCameraOpen, setIsAddCameraOpen] = useState(false);
  const [isConfigureOpen, setIsConfigureOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<CameraInfo | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<"success" | "error" | null>(null);
  
  const [newCamera, setNewCamera] = useState({
    name: "",
    ipAddress: "",
    location: "",
    status: "Offline" as CameraInfo["status"],
    userId: userId,
  });

  const [editedCamera, setEditedCamera] = useState({
    name: "",
    ipAddress: "",
    location: "",
    status: "Offline" as CameraInfo["status"],
  });

  const handleAddCamera = () => {
    if (newCamera.name && newCamera.ipAddress && newCamera.location) {
      onAddCamera(newCamera);
      setNewCamera({
        name: "",
        ipAddress: "",
        location: "",
        status: "Offline",
        userId: userId,
      });
      setIsAddCameraOpen(false);
      setConnectionTestResult(null);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionTestResult(null);
    
    // Simulate connection test
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // Random success/failure for demo
    const isSuccess = Math.random() > 0.3;
    setConnectionTestResult(isSuccess ? "success" : "error");
    setIsTestingConnection(false);
    
    if (isSuccess && isAddCameraOpen) {
      setNewCamera({ ...newCamera, status: "Online" });
    }
  };

  const handleConfigure = (camera: CameraInfo) => {
    setSelectedCamera(camera);
    setEditedCamera({
      name: camera.name,
      ipAddress: camera.ipAddress,
      location: camera.location,
      status: camera.status,
    });
    setIsConfigureOpen(true);
    setConnectionTestResult(null);
  };

  const handleSaveConfiguration = () => {
    if (selectedCamera) {
      onUpdateCamera(selectedCamera.id, editedCamera);
      setIsConfigureOpen(false);
      setSelectedCamera(null);
      setConnectionTestResult(null);
    }
  };

  const handleDeleteCamera = () => {
    if (selectedCamera) {
      onDeleteCamera(selectedCamera.id);
      setIsDeleteDialogOpen(false);
      setSelectedCamera(null);
    }
  };

  const openDeleteDialog = (camera: CameraInfo) => {
    setSelectedCamera(camera);
    setIsDeleteDialogOpen(true);
  };

  return (
    <>
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Camera Management</CardTitle>
            <Button
              size="sm"
              onClick={() => setIsAddCameraOpen(true)}
              className="bg-gradient-to-r from-[#155dfc] to-[#9810fa] hover:opacity-90"
            >
              <Plus className="size-4" />
              Add Camera
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {cameras.length === 0 ? (
            <div className="text-center py-12">
              <Camera className="size-12 text-[#90a1b9] mx-auto mb-3" />
              <p className="text-[#90a1b9]">No cameras added yet</p>
              <p className="text-sm text-[#90a1b9] mt-1">Click "Add Camera" to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cameras.map((camera) => (
                <div
                  key={camera.id}
                  className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="size-16 rounded-lg bg-gradient-to-br from-[#155dfc]/20 to-[#9810fa]/20 flex items-center justify-center shrink-0">
                      <Camera className="size-8 text-[#8ec5ff]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-white">{camera.name}</h4>
                        <Badge
                          variant={camera.status === "Online" ? "default" : "secondary"}
                          className={
                            camera.status === "Online"
                              ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                              : "bg-gray-500/20 border-gray-500/50 text-gray-400"
                          }
                        >
                          {camera.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 mb-3">
                        <p className="text-sm text-[#90a1b9]">
                          IP: <span className="text-white">{camera.ipAddress}</span>
                        </p>
                        <p className="text-sm text-[#90a1b9]">
                          Location: <span className="text-white">{camera.location}</span>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleConfigure(camera)}
                          className="bg-transparent border-white/20 text-white hover:bg-white/10"
                        >
                          <Settings className="size-3.5" />
                          Configure
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openDeleteDialog(camera)}
                        >
                          <Trash2 className="size-3.5" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Camera Dialog */}
      <Dialog open={isAddCameraOpen} onOpenChange={setIsAddCameraOpen}>
        <DialogContent className="bg-[#1a1f3a] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Add New Camera</DialogTitle>
            <DialogDescription className="text-[#90a1b9]">
              Configure a new camera for monitoring.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#90a1b9] mb-1.5 block">Camera Name</label>
              <Input
                placeholder="e.g., Main Kitchen Camera"
                value={newCamera.name}
                onChange={(e) => setNewCamera({ ...newCamera, name: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-[#90a1b9]"
              />
            </div>
            <div>
              <label className="text-sm text-[#90a1b9] mb-1.5 block">IP Address</label>
              <Input
                placeholder="e.g., 192.168.1.100"
                value={newCamera.ipAddress}
                onChange={(e) => setNewCamera({ ...newCamera, ipAddress: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-[#90a1b9]"
              />
            </div>
            <div>
              <label className="text-sm text-[#90a1b9] mb-1.5 block">Location</label>
              <Input
                placeholder="e.g., Main Kitchen - Zone A"
                value={newCamera.location}
                onChange={(e) => setNewCamera({ ...newCamera, location: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-[#90a1b9]"
              />
            </div>
            <div>
              <Button
                onClick={handleTestConnection}
                disabled={isTestingConnection || !newCamera.ipAddress}
                className="w-full bg-white/10 border border-white/20 text-white hover:bg-white/20"
                variant="outline"
              >
                {isTestingConnection ? "Testing Connection..." : "Test Connection"}
              </Button>
              {connectionTestResult === "success" && (
                <div className="flex items-center gap-2 mt-2 text-emerald-400">
                  <CheckCircle2 className="size-4" />
                  <p className="text-sm">Connection successful!</p>
                </div>
              )}
              {connectionTestResult === "error" && (
                <div className="flex items-center gap-2 mt-2 text-red-400">
                  <XCircle className="size-4" />
                  <p className="text-sm">Connection failed. Please check the IP address.</p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddCameraOpen(false);
                setConnectionTestResult(null);
              }}
              className="bg-transparent border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddCamera}
              className="bg-gradient-to-r from-[#155dfc] to-[#9810fa] hover:opacity-90"
            >
              Save Camera
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Configure Camera Dialog */}
      <Dialog open={isConfigureOpen} onOpenChange={setIsConfigureOpen}>
        <DialogContent className="bg-[#1a1f3a] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Configure Camera</DialogTitle>
            <DialogDescription className="text-[#90a1b9]">
              Update camera settings and test connection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#90a1b9] mb-1.5 block">Camera Name</label>
              <Input
                placeholder="e.g., Main Kitchen Camera"
                value={editedCamera.name}
                onChange={(e) => setEditedCamera({ ...editedCamera, name: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-[#90a1b9]"
              />
            </div>
            <div>
              <label className="text-sm text-[#90a1b9] mb-1.5 block">IP Address</label>
              <Input
                placeholder="e.g., 192.168.1.100"
                value={editedCamera.ipAddress}
                onChange={(e) => setEditedCamera({ ...editedCamera, ipAddress: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-[#90a1b9]"
              />
            </div>
            <div>
              <label className="text-sm text-[#90a1b9] mb-1.5 block">Location</label>
              <Input
                placeholder="e.g., Main Kitchen - Zone A"
                value={editedCamera.location}
                onChange={(e) => setEditedCamera({ ...editedCamera, location: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-[#90a1b9]"
              />
            </div>
            <div>
              <Button
                onClick={handleTestConnection}
                disabled={isTestingConnection || !editedCamera.ipAddress}
                className="w-full bg-white/10 border border-white/20 text-white hover:bg-white/20"
                variant="outline"
              >
                {isTestingConnection ? "Testing Connection..." : "Test Connection"}
              </Button>
              {connectionTestResult === "success" && (
                <div className="flex items-center gap-2 mt-2 text-emerald-400">
                  <CheckCircle2 className="size-4" />
                  <p className="text-sm">Connection successful!</p>
                </div>
              )}
              {connectionTestResult === "error" && (
                <div className="flex items-center gap-2 mt-2 text-red-400">
                  <XCircle className="size-4" />
                  <p className="text-sm">Connection failed. Please check the IP address.</p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsConfigureOpen(false);
                setConnectionTestResult(null);
              }}
              className="bg-transparent border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveConfiguration}
              className="bg-gradient-to-r from-[#155dfc] to-[#9810fa] hover:opacity-90"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Camera Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-[#1a1f3a] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Remove Camera</DialogTitle>
            <DialogDescription className="text-[#90a1b9]">
              Are you sure you want to remove {selectedCamera?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="bg-transparent border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCamera}
            >
              Remove Camera
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
/////////////D:\sem 7\FYP\Frontend\backend\model\snapshot.py
"""
Kitchen Eye - Violation Detection with YOLO Tracking
Detects and counts unique violations using object tracking

FEATURES:
- YOLO Tracking: Each object gets unique ID, counted only once
- Multi-Person Support: IoU-based conflict resolution
- Smart PPE Logic: Higher confidence wins for same person

Classes:
0: apron      1: gloves     2: hairnet
3: no_apron   4: no_gloves  5: no_hairnet  6: fire
"""

from ultralytics import YOLO
import cv2
from datetime import datetime
from pathlib import Path
from collections import defaultdict

# ============================================
# CONFIGURATION
# ============================================

MODEL_PATH = "D:\sem 7\FYP\Frontend\backend\model\best (6).pt"
VIDEO_PATH = "D:\sem 7\FYP\Frontend\backend\model\CHEFS WORKING _BUSY KITCHEN_ Over 3000 Meals A Week _Chef Life _Gopro(720P_60FPS).mp4"
CONFIDENCE = 0.3  # General threshold



# Video segment to process (in seconds)
# Set to None to process entire video
VIDEO_START_SEC = 220   # Start at 1:00 minute
VIDEO_END_SEC = 440    # End at 2:00 minutes
SAVE_SNAPSHOTS = True
IOU_THRESHOLD = 0.3

# Fire detection: only count if fire covers at least this % of frame
# 0.05 = 5% of frame area (significant fire)
MIN_FIRE_AREA_RATIO = 0.35

# Snapshot settings (for production optimization)
SNAPSHOT_QUALITY = 20       # JPEG quality 1-100 (lower = smaller file, 50 is good balance)
SNAPSHOT_RESIZE = 0.4       # Resize factor (0.5 = half size, 1.0 = full size)
SNAPSHOT_CROP_ONLY = False  # True = save only detection area, False = full frame

# Violation classes
VIOLATION_CLASSES = {
    'no_apron': 'PPE - Missing Apron',
    'no_gloves': 'PPE - Missing Gloves', 
    'no_hairnet': 'PPE - Missing Hairnet',
    'fire': 'Hazard - Fire'
}

COMPLIANT_CLASSES = ['apron', 'gloves', 'hairnet']

# ============================================
# SETUP
# ============================================

SNAPSHOT_DIR = Path("D:\sem 7\FYP\Frontend\backend\model\snapshots")
SNAPSHOT_DIR.mkdir(exist_ok=True)

print(f"Loading model: {MODEL_PATH}")
model = YOLO(MODEL_PATH)

# Tracking: store counted object IDs
counted_violation_ids = set()  # IDs we've already counted
counted_compliant_ids = set()

# Fire tracking: smart fire monitoring
ignored_small_fires = set()  # Fire IDs we've already warned about (reduce log spam)
fire_max_area = {}  # Track max area seen for each fire ID (detect fire growth)

violation_counts = defaultdict(int)
total_violations = 0

# ============================================
# IoU CALCULATION
# ============================================

def calculate_iou(box1, box2):
    """Calculate IoU between two boxes in xyxy format."""
    x1_1, y1_1, x2_1, y2_1 = box1
    x1_2, y1_2, x2_2, y2_2 = box2
    
    x1_i = max(x1_1, x1_2)
    y1_i = max(y1_1, y1_2)
    x2_i = min(x2_1, x2_2)
    y2_i = min(y2_1, y2_2)
    
    if x2_i < x1_i or y2_i < y1_i:
        return 0.0
    
    intersection = (x2_i - x1_i) * (y2_i - y1_i)
    area1 = (x2_1 - x1_1) * (y2_1 - y1_1)
    area2 = (x2_2 - x1_2) * (y2_2 - y1_2)
    union = area1 + area2 - intersection
    
    return intersection / union if union > 0 else 0.0

def get_box_coords(box):
    """Extract xyxy coordinates from YOLO box."""
    return box.xyxy[0].cpu().numpy()

# ============================================
# MULTI-PERSON CONFLICT RESOLUTION
# ============================================

def resolve_ppe_conflicts_multi_person(detections):
    """
    Resolve conflicts for multiple people using IoU.
    Returns list of (class_name, confidence, box, track_id) tuples.
    """
    ppe_groups = {
        'apron': [],
        'gloves': [],
        'hairnet': []
    }
    other_detections = []
    
    for class_name, conf, box, track_id in detections:
        if class_name in ['apron', 'no_apron']:
            ppe_groups['apron'].append((class_name, conf, box, track_id))
        elif class_name in ['gloves', 'no_gloves']:
            ppe_groups['gloves'].append((class_name, conf, box, track_id))
        elif class_name in ['hairnet', 'no_hairnet']:
            ppe_groups['hairnet'].append((class_name, conf, box, track_id))
        else:
            other_detections.append((class_name, conf, box, track_id))
    
    resolved = []
    
    for ppe_type, dets in ppe_groups.items():
        if not dets:
            continue
        
        if len(dets) == 1:
            resolved.append(dets[0])
            continue
        
        # Multiple detections - check for overlaps
        used = [False] * len(dets)
        
        for i in range(len(dets)):
            if used[i]:
                continue
            
            group = [i]
            box_i = get_box_coords(dets[i][2])
            
            for j in range(i + 1, len(dets)):
                if used[j]:
                    continue
                
                box_j = get_box_coords(dets[j][2])
                iou = calculate_iou(box_i, box_j)
                
                if iou > IOU_THRESHOLD:
                    group.append(j)
                    used[j] = True
            
            used[i] = True
            
            # Pick highest confidence from group
            group_dets = [dets[idx] for idx in group]
            best = max(group_dets, key=lambda x: x[1])
            resolved.append(best)
    
    resolved.extend(other_detections)
    return resolved

# ============================================
# MAIN DETECTION WITH TRACKING
# ============================================

def process_video():
    global total_violations
    
    cap = cv2.VideoCapture(VIDEO_PATH)
    
    if not cap.isOpened():
        print(f"Error: Cannot open video {VIDEO_PATH}")
        return
    
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    total_duration = total_frames / fps
    
    # Calculate frame range based on time segment
    start_frame = int(VIDEO_START_SEC * fps) if VIDEO_START_SEC else 0
    end_frame = int(VIDEO_END_SEC * fps) if VIDEO_END_SEC else total_frames
    
    # Clamp to valid range
    start_frame = max(0, min(start_frame, total_frames))
    end_frame = max(start_frame, min(end_frame, total_frames))
    
    # Seek to start frame
    if start_frame > 0:
        cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
    
    print(f"\nVideo: {VIDEO_PATH}")
    print(f"FPS: {fps}, Total Frames: {total_frames}")
    print(f"Total Duration: {total_duration:.1f} seconds")
    print(f"\n📍 PROCESSING SEGMENT:")
    print(f"   Start: {VIDEO_START_SEC}s (frame {start_frame})" if VIDEO_START_SEC else "   Start: 0s (beginning)")
    print(f"   End: {VIDEO_END_SEC}s (frame {end_frame})" if VIDEO_END_SEC else f"   End: {total_duration:.0f}s (full video)")
    print(f"   Segment Duration: {(end_frame - start_frame) / fps:.1f} seconds")
    print("=" * 60)
    print("🎯 YOLO TRACKING ENABLED:")
    print("  - Each object gets unique ID")
    print("  - Same object counted ONLY ONCE")
    print("  - Multi-person support with IoU")
    print("=" * 60)
    print("Press 'q' to quit\n")
    
    frame_count = 0
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        frame_count += 1
        current_frame = start_frame + frame_count
        
        # Stop if we've passed the end frame
        if current_frame > end_frame:
            print(f"\n✅ Reached end of segment at {VIDEO_END_SEC}s")
            break
        
        # Use TRACKING instead of predict
        results = model.track(frame, conf=CONFIDENCE,iou=0.5, persist=True, verbose=False)
        
        # Collect detections with track IDs
        all_detections = []
        for result in results:
            if result.boxes.id is None:
                continue  # No tracking IDs available
            
            for i, box in enumerate(result.boxes):
                class_id = int(box.cls[0])
                class_name = model.names[class_id]
                confidence = float(box.conf[0])
                track_id = int(result.boxes.id[i])
                all_detections.append((class_name, confidence, box, track_id))
        
        # Apply multi-person conflict resolution
        resolved_detections = resolve_ppe_conflicts_multi_person(all_detections)
        
        # DEBUG: Print detections every 500 frames to see what's happening
        if frame_count % 500 == 1 and all_detections:
            print(f"\n[DEBUG Frame {frame_count}] Raw detections: {len(all_detections)}")
            for d in all_detections:
                print(f"    RAW: {d[0]} (conf: {d[1]:.2f}, ID: {d[3]})")
            print(f"[DEBUG Frame {frame_count}] After resolution: {len(resolved_detections)}")
            for d in resolved_detections:
                print(f"    RESOLVED: {d[0]} (conf: {d[1]:.2f}, ID: {d[3]})")
        
        # Process resolved detections
        for class_name, confidence, box, track_id in resolved_detections:
            # Create unique key: class + track_id
            unique_key = f"{class_name}_{track_id}"
            

            
            if class_name in VIOLATION_CLASSES:
                # Only count if this specific object hasn't been counted
                if unique_key not in counted_violation_ids:
                    
                    # FIRE SIZE CHECK: Only count fire if it's BIG (dangerous)
                    if class_name == 'fire':
                        box_coords = get_box_coords(box)
                        box_width = box_coords[2] - box_coords[0]
                        box_height = box_coords[3] - box_coords[1]
                        box_area = box_width * box_height
                        frame_area = frame.shape[0] * frame.shape[1]
                        area_ratio = box_area / frame_area
                        
                        # Track max area for this fire ID
                        prev_max = fire_max_area.get(track_id, 0)
                        fire_max_area[track_id] = max(prev_max, area_ratio)
                        
                        if area_ratio < MIN_FIRE_AREA_RATIO:
                            # Small fire - only warn ONCE per fire ID
                            if track_id not in ignored_small_fires:
                                ignored_small_fires.add(track_id)
                                print(f"⚠️ Small fire detected ID:{track_id} | Area: {area_ratio*100:.1f}% (monitoring for growth...)")
                            continue
                        else:
                            # Large fire! Check if this is growth from a previously small fire
                            if track_id in ignored_small_fires:
                                print(f"🔥🔥 FIRE ESCALATED! ID:{track_id} grew from small to {area_ratio*100:.1f}% of frame!")
                                ignored_small_fires.discard(track_id)  # Remove from small fires
                            else:
                                print(f"🔥 LARGE FIRE DETECTED! ID:{track_id} | Area: {area_ratio*100:.1f}% of frame")
                    
                    counted_violation_ids.add(unique_key)
                    violation_counts[class_name] += 1
                    total_violations += 1
                    
                    violation_type = VIOLATION_CLASSES[class_name]
                    print(f"🚨 NEW VIOLATION [{frame_count}] ID:{track_id} | {violation_type} ({confidence:.2f})")
                    
                    if SAVE_SNAPSHOTS:
                        timestamp = datetime.now().strftime("%H%M%S")
                        filename = f"{class_name}_ID{track_id}_{timestamp}.jpg"
                        filepath = SNAPSHOT_DIR / filename
                        
                        if SNAPSHOT_CROP_ONLY:
                            # Save only the detection region (smallest file size)
                            box_coords = get_box_coords(box)
                            x1, y1, x2, y2 = map(int, box_coords)
                            # Add padding (10%)
                            h, w = frame.shape[:2]
                            pad_x, pad_y = int((x2-x1)*0.1), int((y2-y1)*0.1)
                            x1, y1 = max(0, x1-pad_x), max(0, y1-pad_y)
                            x2, y2 = min(w, x2+pad_x), min(h, y2+pad_y)
                            crop = frame[y1:y2, x1:x2]
                            cv2.imwrite(str(filepath), crop, [cv2.IMWRITE_JPEG_QUALITY, SNAPSHOT_QUALITY])
                        else:
                            # Save full frame with annotations
                            annotated = results[0].plot()
                            # Resize if needed
                            if SNAPSHOT_RESIZE < 1.0:
                                new_size = (int(annotated.shape[1] * SNAPSHOT_RESIZE), 
                                           int(annotated.shape[0] * SNAPSHOT_RESIZE))
                                annotated = cv2.resize(annotated, new_size)
                            cv2.imwrite(str(filepath), annotated, [cv2.IMWRITE_JPEG_QUALITY, SNAPSHOT_QUALITY])
            
            elif class_name in COMPLIANT_CLASSES:
                if unique_key not in counted_compliant_ids:
                    counted_compliant_ids.add(unique_key)
                    print(f"✅ COMPLIANT [{frame_count}] ID:{track_id} | {class_name} ({confidence:.2f})")
        
        # Display with tracking info
        annotated_frame = results[0].plot()
        
        # Add stats overlay
        cv2.putText(annotated_frame, f"Unique Violations: {total_violations}", 
                    (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
        cv2.putText(annotated_frame, f"Tracked Objects: {len(counted_violation_ids) + len(counted_compliant_ids)}", 
                    (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 0), 2)
        # Instead of cv2.imshow, just print progress
        if frame_count % 100 == 0:
            segment_frames = end_frame - start_frame
            progress_pct = (frame_count / segment_frames) * 100
            print(f"Progress: {frame_count}/{segment_frames} frames ({progress_pct:.1f}%)")
        #cv2.imshow("Kitchen Eye - YOLO Tracking", annotated_frame)
        
        #if cv2.waitKey(1) & 0xFF == ord('q'):
            #break
        
    cap.release()
    cv2.destroyAllWindows()
    
    # Print summary
    print("\n" + "=" * 60)
    print("📊 FINAL VIOLATION SUMMARY (Unique Counts)")
    print("=" * 60)
    
    print("\n🚫 PPE Violations:")
    for v in ['no_apron', 'no_gloves', 'no_hairnet']:
        if violation_counts[v] > 0:
            print(f"   {v}: {violation_counts[v]} unique violations")
    

    
    print("\n🔥 Fire Hazards:")
    if violation_counts['fire'] > 0:
        print(f"   fire: {violation_counts['fire']} incidents")
    
    print(f"\n📈 TOTAL UNIQUE VIOLATIONS: {total_violations}")
    print(f"📁 Snapshots saved to: {SNAPSHOT_DIR}/")
    print(f"🔍 Total objects tracked: {len(counted_violation_ids) + len(counted_compliant_ids)}")

if __name__ == "__main__":
    process_video()
backend/services/violation_service.py i reset the broken app to previous wroking commit thaty why this file is not made
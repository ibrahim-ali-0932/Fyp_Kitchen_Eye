import React, { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Camera, ArrowLeft } from "lucide-react";
import { loginUser } from "../services/api"; // Not used, can be removed
import { useNavigate } from "react-router-dom"; // Not used
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth"; // Correct import
import {
  Shield,
  TrendingUp,
  CheckCircle,
  Users,
  Bell,
  FileText,
  ArrowRight,
  Sparkles,
  Zap,
  ChevronLeft,
  ChevronRight,
  Flame,
  Droplet,
  AlertTriangle,
  Trash2,
  BarChart3,
  Eye,
  EyeOff,
  Clock,
  MapPin,
} from "lucide-react";
import { motion, useInView, Variants } from "motion/react";
import { useRef, useEffect, useMemo } from "react";

interface LoginPageProps {
  onLogin: (success: boolean) => void;
  onSignup: () => void;
  onBack: () => void;
  onBlog: () => void;
}

export default function LoginPage({
  onLogin,
  onSignup,
  onBack,
  onBlog,
}: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Field-specific error states
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  // Validation functions
  const validateEmail = (email: string): string => {
    if (!email.trim()) {
      return "Email is required";
    }

    // Only allow @gmail.com addresses (case-sensitive)
    const emailRegex = /^[a-zA-Z0-9]+@gmail\.com$/;

    // Check if email contains @
    if (!email.includes("@")) {
      return "Email must contain @ symbol";
    }

    // Check if email has multiple @ symbols
    if (email.split("@").length !== 2) {
      return "Email can only contain one @ symbol";
    }

    const [local, domain] = email.split("@");

    // Check if there's content before @
    if (!local || local.trim().length === 0) {
      return "Email must have characters before @ (e.g., yourname@gmail.com)";
    }

    // Check if local part is valid (only alphabets and digits)
    if (!/^[a-zA-Z0-9]+$/.test(local)) {
      return "Email can only contain letters and numbers before @gmail.com";
    }

    // Check if domain is exactly gmail.com (case-sensitive)
    if (!domain || domain !== "gmail.com") {
      return "Only @gmail.com email addresses are allowed";
    }

    // Check email length
    if (email.length > 64) {
      return "Email address is too long (maximum 64 characters)";
    }

    // Final regex check
    if (!emailRegex.test(email)) {
      return "Please enter a valid @gmail.com email address";
    }

    return "";
  };

  const validatePassword = (password: string): string => {
    if (!password) {
      return "Password is required";
    }
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (password.length > 64) {
      return "Password is too long (maximum 64 characters)";
    }
    return "";
  };

  const validateForm = (): boolean => {
    const newErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
    };

    setErrors(newErrors);

    // Check if there are any errors
    return !Object.values(newErrors).some((error) => error !== "");
  };

  // Real-time validation handlers
  const handleEmailChange = (value: string) => {
    let filtered = "";

    // Check if email contains @gmail.com
    if (value.includes("@gmail.com")) {
      const [localPart] = value.split("@gmail.com");
      // Only allow alphanumeric in local part (before @gmail.com)
      const filteredLocal = localPart.replace(/[^a-zA-Z0-9]/g, "");
      filtered = filteredLocal + "@gmail.com";
    } else if (value.includes("@")) {
      // User is typing @gmail.com part
      const [localPart, domainPart] = value.split("@");
      // Only allow alphanumeric in local part
      const filteredLocal = localPart.replace(/[^a-zA-Z0-9]/g, "");
      // Only allow characters that match "gmail.com" (case-sensitive)
      const allowedDomainChars = "gmail.com";
      let filteredDomain = "";
      for (let i = 0; i < domainPart.length; i++) {
        const char = domainPart[i];
        const expectedChar = allowedDomainChars[i];
        if (char === expectedChar) {
          filteredDomain += char;
        } else {
          break; // Stop if character doesn't match expected sequence
        }
      }
      filtered = filteredLocal + "@" + filteredDomain;
    } else {
      // Before @, only allow alphanumeric
      filtered = value.replace(/[^a-zA-Z0-9]/g, "");
    }

    setEmail(filtered);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: validateEmail(filtered) }));
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: validatePassword(value) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Validate all fields
    if (!validateForm()) {
      setErrorMsg("Please fix the errors in the form");
      return;
    }

    setLoading(true);

    try {
      // Step 1: Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("User logged in:", userCredential.user);

      // Step 2: Get ID token from Firebase (force refresh to get latest token)
      const idToken = await userCredential.user.getIdToken(true);

      // Step 3: Verify the token belongs to the logged-in user
      console.log("Logged in user email:", userCredential.user.email);
      console.log("Token stored for:", email);

      // Step 4: Store token in localStorage (overwrite any old token)
      localStorage.setItem("token", idToken);
      console.log("Token stored successfully");

      // Step 4: Show success alert
      alert("Login successful! Welcome back.");

      // Step 5: Call onLogin(true) to indicate success and navigate
      onLogin(true);
    } catch (error: any) {
      console.error("Login error:", error.message);
      // ERROR HANDLER: Set user-friendly error message and call onLogin(false)
      let firebaseErrorMsg = "Invalid email or password. Please try again.";

      if (error.code) {
        // Handle specific Firebase Auth errors
        if (error.code === "auth/user-not-found") {
          firebaseErrorMsg = "Invalid email or password.";
        } else if (error.code === "auth/wrong-password") {
          firebaseErrorMsg = "Invalid email or password.";
        } else if (error.code === "auth/invalid-email") {
          firebaseErrorMsg = "Invalid email format.";
        } else if (error.code === "auth/invalid-credential") {
          firebaseErrorMsg = "Invalid email or password.";
        } else if (error.code === "auth/too-many-requests") {
          firebaseErrorMsg =
            "Too many failed attempts. Please try again later.";
        } else {
          firebaseErrorMsg =
            error.message
              .replace(/firebase: /i, "")
              .replace(/\(auth\/.*?\)\.?/i, "")
              .trim() || "Invalid email or password. Please try again.";
        }
      }

      // Show error alert
      alert(firebaseErrorMsg);

      setErrorMsg(firebaseErrorMsg);
      onLogin(false);
    } finally {
      // FINALLY: Stop loading regardless of success/fail
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Fixed Background Image with Overlay */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{
            backgroundImage: "url('/images/bg-2.jpg')",
            filter: "brightness(0.8) contrast(1.2)",
          }}
        />

        {/* Solid Dark Overlay for better text contrast */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Gradient Overlay for Style */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/40 via-blue-900/30 to-slate-900/40" />
      </div>
      <div className="relative z-10">
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/50 backdrop-blur-xl"
        >
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <motion.div
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div className="w-12 h-12 bg-gradient-to-br  rounded-xl flex items-center justify-center shadow-xl">
                <img
                  src="/images/Kitcheneye_logo.png"
                  alt="KitchenEye Logo"
                  className="w-14 h-14"
                />
              </div>

              <span className="text-2xl text-white tracking-tight">
                Kitchen
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Eye
                </span>
              </span>
            </motion.div>
            <div className="flex items-center gap-8">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    onBack();
                  }}
                  className="text-white hover:bg-white/10"
                >
                  Home
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    onBlog();
                  }}
                  className="text-white hover:bg-white/10"
                >
                  Blog
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    onBack();
                  }}
                  className="text-white hover:bg-white/10"
                >
                  Our Team
                </Button>
              </motion.div>
            </div>

            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="text-white hover:bg-white/10"
                >
                  Sign In
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={onSignup}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl shadow-blue-500/30"
                >
                  Get Started
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.header>
        <div className="top-12 left-6">
          <Button
            variant="ghost"
            className="absolute text-white"
            onClick={onBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
        <div className="w-full max-w-md mx-auto mt-16 mb-32 px-6 text-white ">
          <div className="bg-transparent backdrop-blur-xl rounded-2xl shadow-xl p-8 border">
            {/* Logo */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="flex items-center justify-center gap-2 mb-8">
                <div className="w-14 h-14 bg-gradient-to-br  rounded-xl flex items-center justify-center">
                  <img
                    src="/images/Kitcheneye_logo.png"
                    alt="KitchenEye Logo"
                    className="w-18 h-18"
                  />
                </div>
              </div>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-2xl mb-2">Welcome Back</h1>
              <p className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                Sign in to your KitchenEye account
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@gmail.com"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  onBlur={() =>
                    setErrors((prev) => ({
                      ...prev,
                      email: validateEmail(email),
                    }))
                  }
                  required
                  className={`w-full p-3 pr-12 rounded-lg border bg-white/10 text-white placeholder-gray-300 ${
                    errors.email ? "border-red-500/50" : "border-white/20"
                  }`}
                />
                {errors.email && (
                  <p className="text-sm text-red-400 mt-1">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg("Password reset functionality coming soon!");
                    }}
                    className="text-sm bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent hover:text-blue-700"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    onBlur={() =>
                      setErrors((prev) => ({
                        ...prev,
                        password: validatePassword(password),
                      }))
                    }
                    placeholder="••••••••"
                    required
                    className={`w-full p-3 pl-3 pr-12 rounded-lg border bg-white/10 text-white placeholder-gray-300 ${
                      errors.password ? "border-red-500/50" : "border-white/20"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                  >
                    {showPassword ? (
                      <Eye className="w-5 h-5" />
                    ) : (
                      <EyeOff className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-400 mt-1">{errors.password}</p>
                )}
                {!errors.password && password && (
                  <p className="text-xs text-slate-400 mt-1">
                    Must be 8-64 characters long
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                Sign In
              </Button>
            </form>

            <div className="mt-6 text-center  text-white text-sm text-slate-600">
              Don't have an account?{" "}
              <button
                onClick={onSignup}
                className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent hover:text-blue-700"
              >
                Create Account
              </button>
            </div>

            <div className="mt-8 pt-6 border-t text-center">
              <p className="text-xs text-slate-500 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                Powered by KitchenEye AI Engine
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  // return (

  //   <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 flex items-center justify-center p-6" >
  //     <Button
  //       variant="ghost"
  //       className="absolute top-6 left-6"
  //       onClick={onBack}
  //     >
  //       <ArrowLeft className="w-4 h-4 mr-2" />
  //       Back to Home
  //     </Button>

  //     <div className="w-full max-w-md">
  //       <div className="bg-white rounded-2xl shadow-xl p-8 border">
  //         {/* Logo */}
  //         <div className="flex items-center justify-center gap-2 mb-8">
  //           <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
  //             <Camera className="w-7 h-7 text-white" />
  //           </div>
  //         </div>

  //         <div className="text-center mb-8">
  //           <h1 className="text-2xl mb-2">Welcome Back</h1>
  //           <p className="text-slate-600">Sign in to your KitchenEye account</p>
  //         </div>

  //         <form onSubmit={handleSubmit} className="space-y-6">
  //           <div className="space-y-2">
  //             <Label htmlFor="email">Email Address</Label>
  //             <Input
  //               id="email"
  //               type="email"
  //               placeholder="you@company.com"
  //               value={email}
  //               onChange={(e) => setEmail(e.target.value)}
  //               required
  //             />
  //           </div>

  //           <div className="space-y-2">
  //             <div className="flex items-center justify-between">
  //               <Label htmlFor="password">Password</Label>
  //               <a
  //                 href="#"
  //                 className="text-sm text-blue-600 hover:text-blue-700"
  //               >
  //                 Forgot password?
  //               </a>
  //             </div>
  //             <Input
  //               id="password"
  //               type="password"
  //               placeholder="••••••••"
  //               value={password}
  //               onChange={(e) => setPassword(e.target.value)}
  //               required
  //             />
  //           </div>

  //           <Button
  //             type="submit"
  //             className="w-full bg-blue-600 hover:bg-blue-700"
  //             size="lg"
  //           >
  //             Sign In
  //           </Button>
  //         </form>

  //         <div className="mt-6 text-center text-sm text-slate-600">
  //           Don't have an account?{" "}
  //           <button
  //             onClick={onSignup}
  //             className="text-blue-600 hover:text-blue-700"
  //           >
  //             Create Account
  //           </button>
  //         </div>

  //         <div className="mt-8 pt-6 border-t text-center">
  //           <p className="text-xs text-slate-500">
  //             Powered by KitchenEye AI Engine
  //           </p>
  //         </div>
  //       </div>
  //     </div>
  //   </div>
  // );
}

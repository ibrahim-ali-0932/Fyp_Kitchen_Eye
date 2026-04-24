import React, { useState, type FormEvent } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Camera, ArrowLeft, EyeOff } from "lucide-react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut, // add this
} from "firebase/auth";
import { auth } from "../firebase";
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
  Clock,
  MapPin,
} from "lucide-react";
import { motion, useInView, Variants } from "motion/react";
import { useRef, useEffect, useMemo } from "react";
import { signup } from "../services/authService";

interface SignupPageProps {
  onSignup: (success: boolean) => void;
  onLogin: () => void;
  onBack: () => void;
  onBlog: () => void;
}

const ORGANIZATION_OPTIONS = ["Pearl Continental", "Hotel One"];

export default function SignupPage({
  onSignup,
  onLogin,
  onBack,
  onBlog,
}: SignupPageProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [organization, setOrganization] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Field-specific error states
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    organization: "",
    address: "",
  });

  // Validation functions
  const validateEmail = (email: string): string => {
    if (!email.trim()) {
      return "Email is required";
    }

    // Only allow @gmail.com addresses (case-sensitive)
    // Local part (before @) can only contain alphabets and digits
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
      return "Only @gmail.com email addresses are allowed (lowercase only)";
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

  const validateName = (name: string): string => {
    if (!name.trim()) {
      return "Full name is required";
    }
    if (name.trim().length < 2) {
      return "Name must be at least 2 characters long";
    }
    if (name.trim().length > 100) {
      return "Name is too long (maximum 100 characters)";
    }
    // Only allow alphabets and digits
    if (!/^[a-zA-Z0-9]+$/.test(name.trim())) {
      return "Name can only contain letters and numbers";
    }
    return "";
  };

  const validateOrganization = (organization: string): string => {
    if (!organization.trim()) {
      return "Organization/Branch name is required";
    }
    if (!ORGANIZATION_OPTIONS.includes(organization.trim())) {
      return "Please select a valid organization from the dropdown";
    }
    return "";
  };

  const validateAddress = (address: string): string => {
    if (!address.trim()) {
      return "Address is required";
    }
    if (address.trim().length < 5) {
      return "Address must be at least 5 characters long";
    }
    if (address.trim().length > 500) {
      return "Address is too long (maximum 500 characters)";
    }
    // Only allow alphabets, digits, comma, and hash
    if (!/^[a-zA-Z0-9,\s#]+$/.test(address.trim())) {
      return "Address can only contain letters, numbers, commas (,), and hash (#)";
    }
    return "";
  };

  const validateForm = (): boolean => {
    const newErrors = {
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword: "",
      organization: validateOrganization(organization),
      address: validateAddress(address),
    };

    // Validate confirm password separately
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);

    // Check if there are any errors
    return !Object.values(newErrors).some((error) => error !== "");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!validateForm()) {
      setErrorMsg("Please fix the errors in the form");
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      // Step 2: Send email verification
      await sendEmailVerification(user);
      console.log("Verification email sent");

      // Step 3: Get ID token from Firebase (needed for backend)
      const idToken = await user.getIdToken();

      // Step 4: Prepare profile data to send to backend
      const profileDataToSend = {
        email,
        full_name: name,
        organization,
        address,
      };

      console.log("===== SENDING PROFILE DATA TO BACKEND =====");
      console.log("Form state values:");
      console.log("   - email:", email);
      console.log("   - name:", name);
      console.log("   - organization:", organization);
      console.log("   - address:", address);
      console.log("Profile data object:", profileDataToSend);
      console.log("JSON stringified:", JSON.stringify(profileDataToSend));

      // Validate that we have the required data
      if (!name || name.trim() === "") {
        console.error("ERROR: name is empty!");
      }
      if (!organization || organization.trim() === "") {
        console.error("ERROR: organization is empty!");
      }
      if (!address || address.trim() === "") {
        console.error("ERROR: address is empty!");
      }

      // Step 5: Send profile data to backend with token
      const response = await fetch("http://localhost:8000/auth/signup/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(profileDataToSend),
      });

      console.log("Response received, status:", response.status);

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        // If response is not JSON, sign out user, clear token, and show error
        await signOut(auth);
        localStorage.removeItem("token");
        setErrorMsg("Failed to create profile. Please try again.");
        setLoading(false);
        return;
      }

      if (response.ok) {
        // Profile created successfully
        // Sign out user - they need to verify email before logging in
        await signOut(auth);
        console.log("User signed out - email verification required");

        // IMPORTANT: Clear any old token from localStorage
        localStorage.removeItem("token");
        console.log("Old token cleared from localStorage");

        // Show success message with verification reminder
        alert(
          "Account created successfully! Please check your email to verify your account before logging in."
        );

        // Redirect to LOGIN page (not dashboard) - user must verify email and login
        onLogin();
      } else {
        // Profile creation failed - sign out user and clear any tokens
        await signOut(auth);
        localStorage.removeItem("token");

        // Handle 409 Conflict (email already exists)
        if (response.status === 409) {
          const errorMessage =
            data.detail ||
            "This email is already registered. Please sign in instead.";
          const normalizedDetail = String(data.detail || "").toLowerCase();
          if (
            normalizedDetail.includes("organization") &&
            normalizedDetail.includes("already")
          ) {
            setErrors((prev) => ({ ...prev, organization: errorMessage }));
          } else {
            setErrors((prev) => ({ ...prev, email: errorMessage }));
          }
          setErrorMsg(errorMessage);
        } else {
          const errorMessage =
            data.detail || "Failed to create profile. Please try again.";
          setErrorMsg(errorMessage);
        }
        // Don't call onSignup(false) here - stay on page
      }
    } catch (err: any) {
      console.error(err);

      // If user was created but something else failed, sign them out and clear token
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          await signOut(auth);
          console.log("Signed out user due to error");
        }
        // Always clear any old token on error
        localStorage.removeItem("token");
        console.log("Token cleared from localStorage due to error");
      } catch (signOutError) {
        console.error("Error signing out:", signOutError);
      }

      let errorMessage = "Unable to create account. Please try again.";

      if (err.code === "auth/email-already-in-use") {
        errorMessage =
          "This email address is already registered. Please sign in instead.";
        setErrors((prev) => ({ ...prev, email: errorMessage }));
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "Invalid email address format";
        setErrors((prev) => ({ ...prev, email: errorMessage }));
      } else if (err.code === "auth/weak-password") {
        errorMessage = "Password is too weak. Please use a stronger password.";
        setErrors((prev) => ({ ...prev, password: errorMessage }));
      } else if (err.code === "auth/network-request-failed") {
        errorMessage =
          "Network error. Please check your internet connection and try again.";
      } else if (err.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setErrorMsg(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Real-time validation handlers
  const handleNameChange = (value: string) => {
    // Only allow alphabets and digits
    const filtered = value.replace(/[^a-zA-Z0-9]/g, "");
    setName(filtered);
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: validateName(filtered) }));
    }
  };

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
    if (errors.confirmPassword && confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword:
          value !== confirmPassword ? "Passwords do not match" : "",
      }));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (errors.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: value !== password ? "Passwords do not match" : "",
      }));
    }
  };

  const handleOrganizationSelect = (value: string) => {
    setOrganization(value);
    if (errors.organization) {
      setErrors((prev) => ({
        ...prev,
        organization: validateOrganization(value),
      }));
    }
  };

  const handleAddressChange = (value: string) => {
    // Only allow alphabets, digits, comma, hash, and spaces
    const filtered = value.replace(/[^a-zA-Z0-9,\s#]/g, "");
    setAddress(filtered);
    if (errors.address) {
      setErrors((prev) => ({ ...prev, address: validateAddress(filtered) }));
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Fixed Background Image with Overlay */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{
            backgroundImage: "url('/images/bg-1.jpg')",
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
                  onClick={onLogin}
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
                  onClick={onLogin}
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
        <div className="w-full max-w-md mx-auto mt-16 mb-32 px-6 text-white">
          <div className="bg-transparent backdrop-blur-xl rounded-2xl shadow-xl p-8 border ">
            {/* Logo */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="w-14 h-14 bg-gradient-to-br  rounded-xl flex items-center justify-center">
                <img
                  src="/images/Kitcheneye_logo.png"
                  alt="KitchenEye Logo"
                  className="w-18 h-18"
                />
              </div>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-2xl mb-2">Create Your Account</h1>
              <p className="text-slate-600 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                Start monitoring hygiene with AI today
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onBlur={() =>
                    setErrors((prev) => ({ ...prev, name: validateName(name) }))
                  }
                  required
                  className={`w-full p-3 pr-12 rounded-lg border bg-white/10 text-white placeholder-gray-300 ${
                    errors.name ? "border-red-500/50" : "border-white/20"
                  }`}
                />
                {errors.name && (
                  <p className="text-sm text-red-400 mt-1">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
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
                <Label htmlFor="organization">Branch/Organization Name</Label>
                <Select value={organization} onValueChange={handleOrganizationSelect}>
                  <SelectTrigger
                    id="organization"
                    className={`w-full p-3 pr-12 rounded-lg border bg-white/10 text-white placeholder-gray-300 ${
                      errors.organization
                        ? "border-red-500/50"
                        : "border-white/20"
                    }`}
                  >
                    <SelectValue placeholder="Select your organization" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 text-white border-white/20">
                    {ORGANIZATION_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.organization && (
                  <p className="text-sm text-red-400 mt-1">
                    {errors.organization}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="Street Address, City, Country"
                  value={address}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  onBlur={() =>
                    setErrors((prev) => ({
                      ...prev,
                      address: validateAddress(address),
                    }))
                  }
                  required
                  className={`w-full p-3 pr-12 rounded-lg border bg-white/10 text-white placeholder-gray-300 ${
                    errors.address ? "border-red-500/50" : "border-white/20"
                  }`}
                />
                {errors.address && (
                  <p className="text-sm text-red-400 mt-1">{errors.address}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
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
                    placeholder="*******"
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) =>
                      handleConfirmPasswordChange(e.target.value)
                    }
                    onBlur={() =>
                      setErrors((prev) => ({
                        ...prev,
                        confirmPassword: !confirmPassword
                          ? "Please confirm your password"
                          : confirmPassword !== password
                          ? "Passwords do not match"
                          : "",
                      }))
                    }
                    placeholder="*******"
                    required
                    className={`w-full p-3 pl-3 pr-12 rounded-lg border bg-white/10 text-white placeholder-gray-300 ${
                      errors.confirmPassword
                        ? "border-red-500/50"
                        : "border-white/20"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                  >
                    {showConfirmPassword ? (
                      <Eye className="w-5 h-5" />
                    ) : (
                      <EyeOff className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-400 mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-600 text-white">
              Already have an account?{" "}
              <button
                onClick={onLogin}
                className="text-green-600 hover:text-green-700"
              >
                Sign In
              </button>
            </div>

            <div className="mt-6 text-xs text-slate-500 text-center text-white ">
              By creating an account, you agree to our{" "}
              <a
                href="#"
                className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent hover:underline"
              >
                Terms
              </a>{" "}
              and{" "}
              <a
                href="#"
                className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent hover:underline"
              >
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

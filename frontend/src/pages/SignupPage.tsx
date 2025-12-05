import React, { useState, type FormEvent } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Camera, ArrowLeft, EyeOff } from "lucide-react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import {  Shield, TrendingUp, CheckCircle, Users, Bell, FileText, ArrowRight, Sparkles, Zap, ChevronLeft, ChevronRight, Flame, Droplet, AlertTriangle, Trash2, BarChart3, Eye, Clock, MapPin } from 'lucide-react';
import { motion, useInView, Variants } from 'motion/react';
import { useRef, useEffect, useMemo } from 'react';

interface SignupPageProps {
  onSignup: (success: boolean) => void;
  onLogin: () => void;
  onBack: () => void;
}

export default function SignupPage({
  onSignup,
  onLogin,
  onBack,
}: SignupPageProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [organization, setOrganization] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);



  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Client-side validation
    if (password !== confirmPassword) {
      const errorMessage = "Passwords do not match";
      setErrorMsg(errorMessage);
      alert(errorMessage);
      return;
    }

    if (password.length < 6) {
      const errorMessage = "Password must be at least 6 characters long";
      setErrorMsg(errorMessage);
      alert(errorMessage);
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

      // Step 2: Get ID token from Firebase
      const idToken = await userCredential.user.getIdToken();

      // Step 3: Send profile data to backend with token
      const response = await fetch("http://localhost:8000/auth/signup/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          email,
          full_name: name,
          organization,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token in localStorage
        localStorage.setItem("token", idToken);
        alert("Account created successfully! Welcome to KitchenEye!");
        onSignup(true);
      } else {
        const errorMessage = data.detail || "Failed to create profile";
        setErrorMsg(errorMessage);
        alert(errorMessage);
        // Don't call onSignup(false) here - stay on page
      }
    } catch (err: any) {
      console.error(err);
      let errorMessage = "Unable to create account";

      if (err.code === "auth/email-already-in-use") {
        errorMessage = "Email already in use";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      } else if (err.code === "auth/weak-password") {
        errorMessage = "Password is too weak";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setErrorMsg(errorMessage);
      alert(errorMessage);
    } finally {
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
              backgroundImage: "url('/images/bg-1.jpg')",
              filter: 'brightness(0.8) contrast(1.2)',
    
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
                  Kitchen<span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Eye</span>
                </span>
              </motion.div>
              <div className="flex items-center gap-8">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" onClick={onBack} className="text-white hover:bg-white/10">
                    Home
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost"  className="text-white hover:bg-white/10">
                    About us
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost"  className="text-white hover:bg-white/10">
                    Contact us
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost"  className="text-white hover:bg-white/10">
                    Our Team
                  </Button>
                </motion.div>
              </div>
            
              <div className="flex items-center gap-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost"  className="text-white hover:bg-white/10">
                    Sign In
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    
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

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full p-3 pr-12 rounded-lg border bg-white/10 border-white/20 text-white placeholder-gray-300"

                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full p-3 pr-12 rounded-lg border bg-white/10 border-white/20 text-white placeholder-gray-300"

                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organization">Branch/Organization Name</Label>
                <Input
                  id="organization"
                  type="text"
                  placeholder="Your Restaurant Name"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  required
                  className="w-full p-3 pr-12 rounded-lg border bg-white/10 border-white/20 text-white placeholder-gray-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>

               <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="●●●●●●●"
                className="w-full p-1 pl-2 rounded-lg border bg-white/10 border-white/20 text-white placeholder-gray-300"
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

              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Confirm Password</Label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="●●●●●●●"
                      className="w-full p-1 pl-2 rounded-lg border bg-white/10 border-white/70 text-white placeholder-gray-300"
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
              <a href="#" className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent hover:underline">
                Terms
              </a>{" "}
              and{" "}
              <a href="#" className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent hover:underline">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
   
        

 
  );
}

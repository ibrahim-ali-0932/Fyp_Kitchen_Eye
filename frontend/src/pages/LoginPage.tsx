import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Camera, ArrowLeft } from "lucide-react";
import { loginUser} from "../services/api"; // Not used, can be removed
import {useNavigate} from "react-router-dom"; // Not used
import { auth } from "../firebase";
import { signInWithEmailAndPassword} from "firebase/auth" // Correct import
import {  Shield, TrendingUp, CheckCircle, Users, Bell, FileText, ArrowRight, Sparkles, Zap, ChevronLeft, ChevronRight, Flame, Droplet, AlertTriangle, Trash2, BarChart3, Eye, Clock, MapPin } from 'lucide-react';
import { motion, useInView, Variants } from 'motion/react';
import { useRef, useEffect, useMemo } from 'react';

interface LoginPageProps {
  onLogin: (success: boolean) => void;
  onSignup: () => void;
  onBack: () => void;
}

export default function LoginPage({
  onLogin,
  onSignup,
  onBack,
}: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("User logged in:", userCredential.user);
      
      // 1. **SUCCESS HANDLER**: Call onLogin(true) to indicate success and potentially navigate
      onLogin(true); 

    } catch (error: any) {
        console.error("Login error:", error.message);
        // 2. **ERROR HANDLER**: Set user-friendly error message and call onLogin(false)
        const firebaseErrorMsg = error.code 
            ? error.message.replace(/firebase: /i, '').replace(/\(auth\/.*?\)\.?/i, '').trim()
            : "Login failed. Please check your email and password.";
        setErrorMsg(firebaseErrorMsg);
        onLogin(false);
    } finally {
        // 3. **FINALLY**: Stop loading regardless of success/fail
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
          <p className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">Sign in to your KitchenEye account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
             <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a
                  href="#"
                  className="text-sm bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent hover:text-blue-700"
                >
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
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

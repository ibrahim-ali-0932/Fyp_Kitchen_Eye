import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Camera, ArrowLeft } from "lucide-react";
import { loginUser} from "../services/api"; // Not used, can be removed
import {useNavigate} from "react-router-dom"; // Not used
import { auth } from "../firebase";
import { signInWithEmailAndPassword} from "firebase/auth" // Correct import

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 flex items-center justify-center p-6" >
      <Button
        variant="ghost"
        className="absolute top-6 left-6"
        onClick={onBack}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Home
      </Button>

      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Camera className="w-7 h-7 text-white" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl mb-2">Welcome Back</h1>
            <p className="text-slate-600">Sign in to your KitchenEye account</p>
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
                  className="text-sm text-blue-600 hover:text-blue-700"
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

          <div className="mt-6 text-center text-sm text-slate-600">
            Don't have an account?{" "}
            <button
              onClick={onSignup}
              className="text-blue-600 hover:text-blue-700"
            >
              Create Account
            </button>
          </div>

          <div className="mt-8 pt-6 border-t text-center">
            <p className="text-xs text-slate-500">
              Powered by KitchenEye AI Engine
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

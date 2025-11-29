import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Camera, ArrowLeft } from 'lucide-react';

interface SignupPageProps {
  onSignup: () => void;
  onLogin: () => void;
  onBack: () => void;
}

export default function SignupPage({ onSignup, onLogin, onBack }: SignupPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organization, setOrganization] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSignup();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-slate-50 flex items-center justify-center p-6">
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
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <Camera className="w-7 h-7 text-white" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl mb-2">Create Your Account</h1>
            <p className="text-slate-600">Start monitoring hygiene with AI today</p>
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" size="lg">
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <button onClick={onLogin} className="text-green-600 hover:text-green-700">
              Sign In
            </button>
          </div>

          <div className="mt-6 text-xs text-slate-500 text-center">
            By creating an account, you agree to our{' '}
            <a href="#" className="text-blue-600 hover:underline">Terms</a> and{' '}
            <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
}

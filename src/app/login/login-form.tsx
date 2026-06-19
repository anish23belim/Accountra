"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Mail, ArrowRight, Zap } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);

  const handleGuestLogin = async () => {
    setIsGuestLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: "guest",
        password: "guest",
      });

      if (res?.error) {
        setError("Failed to start quick session");
        setIsGuestLoading(false);
      } else {
        if (typeof window !== 'undefined' && localStorage.getItem('hasSeenTour')) {
          router.push("/");
        } else {
          router.push("/onboarding");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setIsGuestLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError("Invalid email or password");
        setIsLoading(false);
      } else {
        if (typeof window !== 'undefined' && localStorage.getItem('hasSeenTour')) {
          router.push("/");
        } else {
          router.push("/onboarding");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-2xl border-0 overflow-hidden rounded-2xl bg-white/80 backdrop-blur-xl">
      <CardContent className="p-6 sm:p-8">
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm mb-6 flex items-center">
            <span className="font-semibold mr-2">Error:</span> {error}
          </div>
        )}

        <div className="space-y-6">
          
          <Button 
            onClick={handleGuestLogin}
            disabled={isGuestLoading || isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg h-14 rounded-xl text-lg font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {isGuestLoading ? "Starting..." : "Quick Start (No Password)"}
            {!isGuestLoading && <Zap className="w-5 h-5" />}
          </Button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-sm font-medium">OR</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {!showPasswordLogin ? (
            <Button 
              variant="outline"
              onClick={() => setShowPasswordLogin(true)}
              className="w-full h-12 rounded-xl text-slate-600 border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Login with Password
            </Button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-600 font-medium">Email Address</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@accountra.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500 bg-slate-50/50"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-600 font-medium">Password</Label>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500 bg-slate-50/50"
                    required
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 rounded-xl font-semibold transition-all duration-300" 
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in to Accountra"}
                {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
              
            </form>
          )}

          {showPasswordLogin && (
            <div className="text-center text-xs text-slate-400 mt-6 pt-4 border-t border-slate-100">
              Admin Login: <span className="font-semibold text-slate-600">admin@accountra.com</span> / <span className="font-semibold text-slate-600">admin123</span>
            </div>
          )}

        </div>
      </CardContent>
    </Card>
  );
}

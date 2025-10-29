import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Database } from "lucide-react";
import { Link } from "react-router-dom";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Welcome/Login Prompt */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="floating-shape w-64 h-64 bg-white/10 top-20 -left-20 animate-float" />
        <div className="floating-shape w-80 h-80 bg-white/5 bottom-20 -right-20 animate-float" style={{ animationDelay: "2s" }} />
        
        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-white w-full">
          <div className="max-w-md text-center">
            <div className="mb-8 inline-flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm">
                <Database className="w-16 h-16" />
              </div>
            </div>
            
            {isLogin ? (
              <>
                <h2 className="text-4xl font-bold mb-4">Welcome Back!</h2>
                <p className="text-lg text-white/90 mb-8">
                  To keep connected with us, please login with your personal info.
                </p>
                <Button
                  onClick={() => setIsLogin(false)}
                  variant="outline"
                  className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary font-semibold px-8 py-6 text-lg transition-all duration-300"
                >
                  Sign Up
                </Button>
              </>
            ) : (
              <>
                <h2 className="text-4xl font-bold mb-4">Hello, Friend!</h2>
                <p className="text-lg text-white/90 mb-8">
                  Enter your personal details and start your journey with Querybot.
                </p>
                <Button
                  onClick={() => setIsLogin(true)}
                  variant="outline"
                  className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary font-semibold px-8 py-6 text-lg transition-all duration-300"
                >
                  Sign In
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-8 text-center lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Database className="w-6 h-6 text-primary" />
              </div>
              <span className="text-2xl font-bold">Querybot</span>
            </Link>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {isLogin ? "Sign In" : "Create Account"}
            </h1>
            <p className="text-muted-foreground">
              {isLogin ? "Welcome back! Please sign in to continue" : "Sign up to get started with Querybot"}
            </p>
          </div>

          {/* Form */}
          <form className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  className="mt-1"
                />
              </div>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="mt-1"
              />
            </div>

            {!isLogin && (
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="mt-1"
                />
              </div>
            )}

            {isLogin && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded" />
                  <span>Remember me</span>
                </label>
                <a href="#" className="text-primary hover:underline">
                  Forgot password?
                </a>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 font-semibold py-6 text-lg"
            >
              {isLogin ? "Sign In" : "Sign Up"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm lg:hidden">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline"
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </button>
          </div>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            By continuing, you agree to our{" "}
            <a href="#" className="text-primary hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-primary hover:underline">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;

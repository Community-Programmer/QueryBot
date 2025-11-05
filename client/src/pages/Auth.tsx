import { useState, useEffect, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Database, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { loginUser, signupUser, clearError, checkAuthentication } from "@/store/slices/authSlice";
import { toast } from "sonner";
import ServerStatus from "@/components/ServerStatus";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    password: '',
    confirm_password: ''
  });

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Clear error when switching between login/signup
    dispatch(clearError());
  }, [isLogin, dispatch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Clear any existing errors
    if (error) {
      dispatch(clearError());
    }

    // Basic client-side validation
    if (!formData.email || !formData.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!isLogin && !formData.fullname) {
      toast.error("Please enter your full name");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    if (!isLogin && formData.password !== formData.confirm_password) {
      toast.error("Passwords don't match");
      return;
    }

    try {
      let result;
      
      if (isLogin) {
        result = await dispatch(loginUser({
          email: formData.email,
          password: formData.password
        }));
        
        if (loginUser.fulfilled.match(result)) {
          toast.success("Welcome back! Login successful.");
          // Navigation will be handled by useEffect when isAuthenticated changes
        } else if (loginUser.rejected.match(result)) {
          toast.error(result.payload as string || "Login failed");
        }
      } else {
        result = await dispatch(signupUser({
          fullname: formData.fullname,
          email: formData.email,
          password: formData.password,
          confirm_password: formData.confirm_password
        }));
        
        if (signupUser.fulfilled.match(result)) {
          toast.success("Account created successfully! Welcome to QueryBot.");
          // Navigation will be handled by useEffect when isAuthenticated changes
        } else if (signupUser.rejected.match(result)) {
          toast.error(result.payload as string || "Registration failed");
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    // Keep email but clear other fields when switching
    setFormData({
      fullname: '',
      email: formData.email, // Preserve email for better UX
      password: '',
      confirm_password: ''
    });
    dispatch(clearError());
  };

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
                  onClick={toggleAuthMode}
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
                  onClick={toggleAuthMode}
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
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="fullname">Full Name</Label>
                <Input
                  id="fullname"
                  name="fullname"
                  type="text"
                  placeholder="John Doe"
                  className="mt-1"
                  value={formData.fullname}
                  onChange={handleInputChange}
                  required
                />
              </div>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                className="mt-1"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="mt-1 pr-10"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <Label htmlFor="confirm_password">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirm_password"
                    name="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="mt-1 pr-10"
                    value={formData.confirm_password}
                    onChange={handleInputChange}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
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
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 font-semibold py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </div>
              ) : (
                isLogin ? "Sign In" : "Sign Up"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm lg:hidden">
            <button
              onClick={toggleAuthMode}
              className="text-primary hover:underline"
              type="button"
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </button>
          </div>

          <div className="mt-6 text-center">
            <ServerStatus />
          </div>

          <div className="mt-4 text-center text-xs text-muted-foreground">
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

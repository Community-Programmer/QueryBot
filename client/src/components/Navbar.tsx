import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Database, Menu, X, User, LogOut } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
import { logoutUser } from "@/store/slices/authSlice";
import { toast } from "sonner";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    try {
      const result = await dispatch(logoutUser());
      if (logoutUser.fulfilled.match(result)) {
        toast.success("Logged out successfully");
      } else if (logoutUser.rejected.match(result)) {
        toast.error("Logout failed, but you've been signed out locally");
      }
    } catch (error) {
      toast.error("Logout failed, but you've been signed out locally");
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "glass-card shadow-lg py-3" : "bg-transparent py-4"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Database className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xl font-bold text-foreground">Querybot</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-foreground/80 hover:text-primary transition-colors font-medium">
              Features
            </a>
            <a href="#workflow" className="text-foreground/80 hover:text-primary transition-colors font-medium">
              How it Works
            </a>
            <a href="#" className="text-foreground/80 hover:text-primary transition-colors font-medium">
              Docs
            </a>
            <Link to="/playground" className="text-foreground/80 hover:text-primary transition-colors font-medium">
              Playground
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10">
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{user?.fullname}</span>
                </div>
                <Button 
                  onClick={handleLogout}
                  variant="ghost" 
                  className="font-semibold flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" className="font-semibold">
                    Login
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button className="bg-primary hover:bg-primary/90 font-semibold">
                    Sign Up Free
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 animate-fade-in">
            <div className="flex flex-col gap-4">
              <a href="#features" className="text-foreground/80 hover:text-primary transition-colors font-medium py-2">
                Features
              </a>
              <a href="#workflow" className="text-foreground/80 hover:text-primary transition-colors font-medium py-2">
                How it Works
              </a>
              <a href="#" className="text-foreground/80 hover:text-primary transition-colors font-medium py-2">
                Docs
              </a>
              <div className="flex flex-col gap-2 mt-2">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10">
                      <User className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">{user?.fullname}</span>
                    </div>
                    <Button 
                      onClick={handleLogout}
                      variant="outline" 
                      className="w-full font-semibold flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/auth">
                      <Button variant="outline" className="w-full font-semibold">
                        Login
                      </Button>
                    </Link>
                    <Link to="/auth">
                      <Button className="w-full bg-primary hover:bg-primary/90 font-semibold">
                        Sign Up Free
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

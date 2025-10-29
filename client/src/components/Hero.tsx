import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import heroVisual from "@/assets/hero-visual.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Floating Background Shapes */}
      <div className="floating-shape w-96 h-96 bg-primary top-20 -left-48 animate-float" style={{ animationDelay: "0s" }} />
      <div className="floating-shape w-64 h-64 bg-accent top-40 -right-32 animate-float" style={{ animationDelay: "2s" }} />
      <div className="floating-shape w-80 h-80 bg-primary/50 bottom-20 left-1/4 animate-float" style={{ animationDelay: "4s" }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">AI-Powered Data Intelligence</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Ask Your Data.{" "}
              <span className="gradient-text">Get Instant Insights.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">
              Upload data or connect a database and ask questions in English to get charts, SQL, or insights instantly.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button className="btn-hero text-lg group">
                Try Demo
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Link to="/auth">
                <Button className="btn-outline-hero text-lg">
                  Sign Up Free
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex items-center gap-8 justify-center lg:justify-start text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span>Free forever plan</span>
              </div>
            </div>
          </div>

          {/* Right Visual */}
          <div className="relative animate-scale-in">
            <div className="glass-card rounded-2xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,168,120,0.4)]">
              <img 
                src={heroVisual} 
                alt="Querybot Dashboard Visualization" 
                className="w-full h-auto"
              />
            </div>
            
            {/* Floating Cards */}
            <div className="absolute -top-4 -left-4 glass-card p-4 rounded-xl animate-float" style={{ animationDelay: "1s" }}>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-sm font-medium">SQL Generated</span>
              </div>
            </div>
            
            <div className="absolute -bottom-4 -right-4 glass-card p-4 rounded-xl animate-float" style={{ animationDelay: "3s" }}>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent" />
                <span className="text-sm font-medium">Chart Created</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

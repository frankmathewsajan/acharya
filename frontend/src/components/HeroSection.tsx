import { Button } from "@/components/ui/button";
import { ArrowRight, Users, BookOpen, Award, Shield } from "lucide-react";
import heroImage from "@/assets/acharya-hero.jpg";
const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center bg-gradient-hero overflow-hidden traditional-pattern">
      {/* Background Image with Classic Overlay */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Acharya Education Portal - Modern school building" 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/95 via-secondary/85 to-secondary/75" />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="container relative z-10 py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Hero Content */}
          <div className="text-center lg:text-left">
            {/* Government Badge */}
            <div className="inline-flex items-center px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm text-white mb-8 border border-white/30 shadow-classic">
              <Shield className="h-5 w-5 mr-3" />
              <span className="text-sm font-semibold tracking-wide">Government of Rajasthan</span>
            </div>
            
            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
              Welcome to{" "}
              <span className="text-primary-light">Acharya</span>
              <br />
              <span className="text-4xl md:text-5xl">Education Portal</span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-white/90 mb-10 leading-relaxed max-w-2xl font-light">
              Empowering education through digital transformation. A comprehensive ERP system 
              designed for schools across Rajasthan, connecting students, parents, faculty, and 
              administrators in one unified platform.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-4 text-lg shadow-primary-glow border-2 border-primary/20 hover:border-primary/40 transition-all duration-300"
              >
                Access Login Portal
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
              
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="classic-card bg-white/95 backdrop-blur-sm p-8 rounded-xl shadow-classic border-2 border-white/20 hover:shadow-primary-glow transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="p-3 rounded-lg bg-primary/20 border border-primary/30">
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-3">50,000+</h3>
              <p className="text-muted-foreground font-medium">Active Students</p>
            </div>

            <div className="classic-card bg-white/95 backdrop-blur-sm p-8 rounded-xl shadow-classic border-2 border-white/20 hover:shadow-primary-glow transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="p-3 rounded-lg bg-accent/20 border border-accent/30">
                  <BookOpen className="h-8 w-8 text-accent" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-3">5,000+</h3>
              <p className="text-muted-foreground font-medium">Faculty Members</p>
            </div>

            <div className="classic-card bg-white/95 backdrop-blur-sm p-8 rounded-xl shadow-classic border-2 border-white/20 hover:shadow-primary-glow transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="p-3 rounded-lg bg-info/20 border border-info/30">
                  <Award className="h-8 w-8 text-info" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-3">1,200+</h3>
              <p className="text-muted-foreground font-medium">Schools Connected</p>
            </div>

            <div className="classic-card bg-white/95 backdrop-blur-sm p-8 rounded-xl shadow-classic border-2 border-white/20 hover:shadow-primary-glow transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="p-3 rounded-lg bg-success/20 border border-success/30">
                  <Shield className="h-8 w-8 text-success" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-3">99.9%</h3>
              <p className="text-muted-foreground font-medium">System Uptime</p>
            </div>
          </div>
        </div>
      </div>

      {/* Classic Decorative Elements */}
      <div className="absolute top-20 right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl border border-primary/20" />
      <div className="absolute bottom-20 left-20 w-48 h-48 bg-accent/10 rounded-full blur-3xl border border-accent/20" />
      
      {/* Traditional Pattern Overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 border-2 border-white/20 rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-24 h-24 border-2 border-white/20 rounded-full"></div>
      </div>
    </section>
  );
};
export default HeroSection;
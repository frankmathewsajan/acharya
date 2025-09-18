import { Button } from "@/components/ui/button";
import { GraduationCap, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Faculty", href: "/faculty" },
    { name: "Gallery", href: "/gallery" },
    { name: "Notices", href: "/notices" },
    { name: "Contact", href: "/contact" },
    { name: "Track Application", href: "/track" },
    { name: "Blockchain Marks", href: "/blockchain-marks" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full government-header shadow-government">
      <div className="container flex h-20 items-center justify-between">
        {/* Logo & Branding */}
        <Link to="/" className="flex items-center space-x-4 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm border-2 border-white/20 group-hover:bg-white/20 transition-all duration-300">
            <GraduationCap className="h-7 w-7 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Acharya
            </h1>
            <p className="text-sm text-white/80 font-medium">Government of Rajasthan</p>
            <p className="text-xs text-white/60">Education Portal</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className="px-4 py-2 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-md transition-all duration-200 border border-transparent hover:border-white/20"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Login Button & Mobile Menu */}
        <div className="flex items-center space-x-4">
          <Link to="/auth">
            <Button 
              size="sm" 
              className="bg-white text-secondary hover:bg-white/90 font-semibold px-6 py-2 shadow-classic border-2 border-white/20"
            >
              Login Portal
            </Button>
          </Link>
          
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden text-white hover:bg-white/10 border border-white/20"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-white/20 bg-secondary/95 backdrop-blur-sm">
          <nav className="container py-6 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="block px-4 py-3 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-md transition-all duration-200 border border-transparent hover:border-white/20"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
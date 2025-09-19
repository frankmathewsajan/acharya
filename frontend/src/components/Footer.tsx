import { GraduationCap, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-government text-white traditional-pattern">
      <div className="container py-16">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Branding */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/10 border-2 border-white/20">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-2xl">Acharya</h3>
                <p className="text-sm text-white/80 font-medium">Government of Rajasthan</p>
                <p className="text-xs text-white/60">Education Portal</p>
              </div>
            </div>
            <p className="text-base text-white/80 leading-relaxed">
              Empowering education through digital transformation for a better tomorrow. 
              Committed to excellence in educational management across Rajasthan.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-xl mb-6 classic-accent-border pl-4 text-white">Quick Links</h4>
            <ul className="space-y-3 text-base">
              <li><Link to="/about" className="text-white/80 hover:text-white transition-colors duration-200 hover:underline">About Us</Link></li>
              <li><Link to="/help" className="text-white/80 hover:text-white transition-colors duration-200 hover:underline">Help & Support</Link></li>
              <li><Link to="/track" className="text-white/80 hover:text-white transition-colors duration-200 hover:underline">Track Application</Link></li>
            </ul>
          </div>

          {/* Student Portal */}
          <div>
            <h4 className="font-bold text-xl mb-6 classic-accent-border pl-4 text-white">Student Services</h4>
            <ul className="space-y-3 text-base">
              <li><Link to="/auth" className="text-white/80 hover:text-white transition-colors duration-200 hover:underline">Student Portal</Link></li>
              <li><Link to="/auth" className="text-white/80 hover:text-white transition-colors duration-200 hover:underline">Parent Portal</Link></li>
              <li><Link to="/admissions" className="text-white/80 hover:text-white transition-colors duration-200 hover:underline">Admissions</Link></li>
              <li><Link to="/fees" className="text-white/80 hover:text-white transition-colors duration-200 hover:underline">Fee Payment</Link></li>
              <li><Link to="/results" className="text-white/80 hover:text-white transition-colors duration-200 hover:underline">Results</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-bold text-xl mb-6 classic-accent-border pl-4 text-white">Contact Us</h4>
            <ul className="space-y-4 text-base">
              <li className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
                  <Mail className="h-5 w-5 text-primary-light" />
                </div>
                <span className="text-white/80">info@acharya.raj.gov.in</span>
              </li>
              <li className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
                  <Phone className="h-5 w-5 text-primary-light" />
                </div>
                <span className="text-white/80">+91-141-2234567</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-primary/20 border border-primary/30 mt-1">
                  <MapPin className="h-5 w-5 text-primary-light" />
                </div>
                <span className="text-white/80">Education Directorate, Jaipur, Rajasthan</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/20 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-base text-white/70">
              © 2024 Acharya Education Portal, Government of Rajasthan. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm text-white/70">
              <Link to="/privacy" className="hover:text-white transition-colors duration-200">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white transition-colors duration-200">Terms of Service</Link>
              <Link to="/accessibility" className="hover:text-white transition-colors duration-200">Accessibility</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
import { Card, CardContent } from "@/components/ui/card";
import { 
  UserCheck, 
  GraduationCap, 
  Users, 
  Shield, 
  BarChart3, 
  CreditCard,
  FileText,
  Building,
  Bell
} from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: UserCheck,
      title: "Student Portal",
      description: "Access attendance, marks, timetable, course materials, and fee status in one place.",
      color: "text-primary",
      bg: "bg-primary/10"
    },
    {
      icon: Users,
      title: "Parent Dashboard",
      description: "Monitor your child's progress, view attendance, download report cards, and track fees.",
      color: "text-accent",
      bg: "bg-accent/10"
    },
    {
      icon: GraduationCap,
      title: "Faculty Management",
      description: "Enter marks, update attendance, upload course materials, and approve student leave.",
      color: "text-info",
      bg: "bg-info/10"
    },
    {
      icon: Building,
      title: "Hostel Management",
      description: "Streamlined hostel operations with leave approvals and occupancy tracking.",
      color: "text-secondary",
      bg: "bg-secondary/10"
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Comprehensive analytics for administrators with detailed insights and reports.",
      color: "text-success",
      bg: "bg-success/10"
    },
    {
      icon: CreditCard,
      title: "Payment Integration",
      description: "Secure fee payments through Razorpay with automatic receipt generation.",
      color: "text-warning",
      bg: "bg-warning/10"
    },
    {
      icon: Shield,
      title: "Secure Authentication",
      description: "JWT-based authentication with role-based access control and audit logs.",
      color: "text-destructive",
      bg: "bg-destructive/10"
    },
    {
      icon: FileText,
      title: "Document Management",
      description: "Secure file uploads, document verification, and digital certificate storage.",
      color: "text-muted-foreground",
      bg: "bg-muted/20"
    },
    {
      icon: Bell,
      title: "Notifications",
      description: "Real-time notifications for important updates, announcements, and deadlines.",
      color: "text-primary",
      bg: "bg-primary/10"
    }
  ];

  return (
    <section className="py-24">
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center px-6 py-3 rounded-full bg-primary/10 text-primary font-semibold mb-6 border border-primary/20">
            <Shield className="h-5 w-5 mr-2" />
            Comprehensive Solutions
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Complete School Management
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Everything you need to run a modern educational institution, from student management 
            to administrative operations, all in one integrated platform designed for excellence.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group classic-card hover:shadow-primary-glow transition-all duration-300 hover:-translate-y-2 border-2 border-border/30 hover:border-primary/30"
            >
              <CardContent className="p-8">
                {/* Icon Container */}
                <div className={`inline-flex p-4 rounded-xl ${feature.bg} mb-6 group-hover:scale-110 transition-transform duration-300 border-2 border-current/20`}>
                  <feature.icon className={`h-8 w-8 ${feature.color}`} />
                </div>
                
                {/* Content */}
                <h3 className="text-2xl font-semibold text-card-foreground mb-4 classic-accent-border pl-4">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  {feature.description}
                </p>
                
                {/* Hover Effect Indicator */}
                <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-full h-1 bg-gradient-primary rounded-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-20">
          <div className="inline-flex items-center px-8 py-4 rounded-full bg-gradient-primary text-white font-semibold text-lg shadow-primary-glow border-2 border-primary/20 hover:border-primary/40 transition-all duration-300">
            <Shield className="h-6 w-6 mr-3" />
            Ready to transform your school's digital infrastructure?
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
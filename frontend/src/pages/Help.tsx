import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Mail, Clock, Send, MessageCircle, User, FileText, HelpCircle, Book, Settings, UserCheck } from "lucide-react";

const Help = () => {
  const helpCategories = [
    {
      icon: UserCheck,
      title: "Admissions Help",
      content: "Get help with admission process, requirements, and application status.",
      action: "Learn More"
    },
    {
      icon: Book,
      title: "Academic Support",
      content: "Find information about curriculum, exams, and academic policies.",
      action: "View Guides"
    },
    {
      icon: Settings,
      title: "Technical Support",
      content: "Need help with the portal, login issues, or technical problems?",
      action: "Get Support"
    },
    {
      icon: HelpCircle,
      title: "General Inquiries",
      content: "Have questions about school policies, events, or general information?",
      action: "Ask Question"
    }
  ];

  const departments = [
    {
      name: "Principal Office",
      head: "Dr. Priya Sharma",
      phone: "+91 141-2345678",
      email: "principal@acharya.raj.gov.in",
      timings: "9:00 AM - 3:00 PM"
    },
    {
      name: "Admission Office", 
      head: "Mr. Rakesh Gupta",
      phone: "+91 141-2345679",
      email: "admissions@acharya.raj.gov.in",
      timings: "8:00 AM - 4:00 PM"
    },
    {
      name: "Accounts Department",
      head: "Mrs. Meera Joshi",
      phone: "+91 141-2345680",
      email: "accounts@acharya.raj.gov.in",
      timings: "9:00 AM - 3:00 PM"
    },
    {
      name: "Student Affairs",
      head: "Mr. Suresh Kumar",
      phone: "+91 141-2345681",
      email: "studentaffairs@acharya.raj.gov.in",
      timings: "8:30 AM - 3:30 PM"
    }
  ];

  const faqs = [
    {
      question: "How do I apply for admission?",
      answer: "Visit the Admission page, fill out the application form with required details, and submit documents. You'll receive an application ID for tracking."
    },
    {
      question: "I forgot my login credentials. What should I do?",
      answer: "Use the 'Forgot Password' option on the login page. Enter your registered email to receive a password reset link."
    },
    {
      question: "How can I track my application status?",
      answer: "Use the Tracking page with your application ID and email address to check real-time status updates."
    },
    {
      question: "What documents are required for admission?",
      answer: "Birth certificate, previous school records, residential proof, and passport-size photographs are typically required."
    },
    {
      question: "How do I update my contact information?",
      answer: "Log into your account and visit the Profile section to update your personal and contact details."
    },
    {
      question: "Is there a mobile app available?",
      answer: "Currently, our system is web-based and mobile-responsive. You can access it from any device with a web browser."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="rajasthan-pattern">
        <div className="container mx-auto px-4 py-12">
          {/* Hero Section */}
          <section className="text-center mb-16">
            <h1 className="text-4xl font-bold text-foreground mb-6">Help & Support</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Find answers to your questions, get help with the portal, and learn about our processes. 
              We're here to support you every step of the way.
            </p>
          </section>

          {/* Help Categories */}
          <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {helpCategories.map((category, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <category.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <CardTitle className="text-lg">{category.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {category.content}
                  </p>
                  <Button size="sm" variant="outline" className="w-full">
                    {category.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </section>

          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            {/* Support Request Form */}
            <section>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    Submit Support Request
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Full Name *
                      </label>
                      <Input placeholder="Enter your name" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Email Address *
                      </label>
                      <Input type="email" placeholder="Enter your email" />
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Phone Number
                      </label>
                      <Input placeholder="Enter your phone" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Issue Type *
                      </label>
                      <Input placeholder="e.g., Login Problem, Application Status" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Describe your issue *
                    </label>
                    <Textarea 
                      placeholder="Please provide detailed information about your issue or question..."
                      className="min-h-[120px]"
                    />
                  </div>
                  
                  <Button className="w-full">
                    <Send className="h-4 w-4 mr-2" />
                    Submit Support Request
                  </Button>
                </CardContent>
              </Card>
            </section>

            {/* Quick Help & Contact */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-6">Need Immediate Help?</h2>
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground mb-3">Contact Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary" />
                        <span>+91 141-2345678 (Main Office)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-primary" />
                        <span>help@acharya.raj.gov.in</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span>Mon-Fri: 8:00 AM - 4:00 PM</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground mb-3">Common Issues</h3>
                    <div className="space-y-2 text-sm">
                      <div>• Login problems or forgotten passwords</div>
                      <div>• Application submission issues</div>
                      <div>• Document upload problems</div>
                      <div>• Technical errors or website bugs</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground mb-3">Response Times</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Email Support:</span>
                        <Badge variant="secondary">24-48 hours</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Phone Support:</span>
                        <Badge variant="secondary">Immediate</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          </div>

          {/* FAQ Section */}
          <section>
            <h2 className="text-2xl font-bold text-center text-foreground mb-8">
              Frequently Asked Questions
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {faqs.map((faq, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-start gap-2">
                      <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      {faq.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="text-center mt-8">
              <p className="text-muted-foreground mb-4">
                Didn't find what you're looking for?
              </p>
              <Button variant="outline">
                <MessageCircle className="h-4 w-4 mr-2" />
                Ask a Question
              </Button>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Help;
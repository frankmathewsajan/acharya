import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Mail, Clock, Send, MessageCircle, User, FileText } from "lucide-react";

const Contact = () => {
  const contactInfo = [
    {
      icon: MapPin,
      title: "Address",
      content: "Acharya Government School, Education Complex, Shiksha Nagar, Jaipur, Rajasthan - 302015",
      action: "Get Directions"
    },
    {
      icon: Phone,
      title: "Phone Numbers",
      content: "+91 141-2345678 (Main Office)\n+91 141-2345679 (Admission Office)",
      action: "Call Now"
    },
    {
      icon: Mail,
      title: "Email",
      content: "principal@acharya.raj.gov.in\nadmissions@acharya.raj.gov.in",
      action: "Send Email"
    },
    {
      icon: Clock,
      title: "Office Hours",
      content: "Monday - Friday: 8:00 AM - 4:00 PM\nSaturday: 8:00 AM - 12:00 PM\nSunday: Closed",
      action: "View Schedule"
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
      question: "What are the admission requirements?",
      answer: "Students must submit birth certificate, previous school records, and residential proof. Age criteria as per RTE guidelines."
    },
    {
      question: "Is transportation facility available?",
      answer: "Yes, we provide bus service covering major areas of Jaipur. Route details available at admission office."
    },
    {
      question: "What is the fee structure?",
      answer: "As a government school, fees are minimal as per state guidelines. Detailed fee structure available on request."
    },
    {
      question: "Are scholarships available?",
      answer: "Yes, various government scholarships and merit-based awards are available for eligible students."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="rajasthan-pattern">
        <div className="container mx-auto px-4 py-12">
          {/* Hero Section */}
          <section className="text-center mb-16">
            <h1 className="text-4xl font-bold text-foreground mb-6">Contact Us</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Get in touch with us for admissions, inquiries, or any assistance. 
              We're here to help you and provide the information you need.
            </p>
          </section>

          {/* Quick Contact Info */}
          <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {contactInfo.map((info, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <info.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <CardTitle className="text-lg">{info.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 whitespace-pre-line">
                    {info.content}
                  </p>
                  <Button size="sm" variant="outline" className="w-full">
                    {info.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </section>

          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            {/* Contact Form */}
            <section>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    Send us a Message
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
                        Subject *
                      </label>
                      <Input placeholder="Message subject" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Message *
                    </label>
                    <Textarea 
                      placeholder="Type your message here..."
                      className="min-h-[120px]"
                    />
                  </div>
                  
                  <Button className="w-full">
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </CardContent>
              </Card>
            </section>

            {/* Departments */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-6">Department Contacts</h2>
              <div className="space-y-4">
                {departments.map((dept, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-foreground">{dept.name}</h3>
                        <Badge variant="secondary">{dept.timings}</Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Head:</span>
                          <span className="font-medium">{dept.head}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{dept.phone}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{dept.email}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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

export default Contact;
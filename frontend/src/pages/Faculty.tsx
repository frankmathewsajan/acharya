import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Award, BookOpen } from "lucide-react";

const Faculty = () => {
  const facultyMembers = [
    {
      id: 1,
      name: "Dr. Priya Sharma",
      designation: "Principal",
      department: "Administration",
      qualification: "M.Ed, Ph.D in Education",
      experience: "20+ years",
      specialization: ["Educational Leadership", "Curriculum Development"],
      email: "principal@acharya.raj.gov.in",
      phone: "+91 98765 43210",
      image: "/placeholder.svg"
    },
    {
      id: 2,
      name: "Prof. Rajesh Kumar",
      designation: "Vice Principal",
      department: "Mathematics",
      qualification: "M.Sc Mathematics, B.Ed",
      experience: "15+ years",
      specialization: ["Advanced Mathematics", "Statistics"],
      email: "rajesh.kumar@acharya.raj.gov.in",
      phone: "+91 98765 43211",
      image: "/placeholder.svg"
    },
    {
      id: 3,
      name: "Dr. Sunita Agarwal",
      designation: "Head of Science Department",
      department: "Physics",
      qualification: "M.Sc Physics, Ph.D",
      experience: "18+ years",
      specialization: ["Quantum Physics", "Research Methodology"],
      email: "sunita.agarwal@acharya.raj.gov.in",
      phone: "+91 98765 43212",
      image: "/placeholder.svg"
    },
    {
      id: 4,
      name: "Shri Amit Verma",
      designation: "Senior Faculty",
      department: "English Literature",
      qualification: "M.A English, B.Ed",
      experience: "12+ years",
      specialization: ["Creative Writing", "Literary Analysis"],
      email: "amit.verma@acharya.raj.gov.in",
      phone: "+91 98765 43213",
      image: "/placeholder.svg"
    },
    {
      id: 5,
      name: "Ms. Kavita Singh",
      designation: "Senior Faculty",
      department: "Computer Science",
      qualification: "MCA, M.Tech",
      experience: "10+ years",
      specialization: ["Programming", "Web Development", "AI/ML"],
      email: "kavita.singh@acharya.raj.gov.in",
      phone: "+91 98765 43214",
      image: "/placeholder.svg"
    },
    {
      id: 6,
      name: "Dr. Mohan Lal",
      designation: "Senior Faculty",
      department: "History",
      qualification: "M.A History, Ph.D",
      experience: "16+ years",
      specialization: ["Indian History", "Archaeological Studies"],
      email: "mohan.lal@acharya.raj.gov.in",
      phone: "+91 98765 43215",
      image: "/placeholder.svg"
    }
  ];

  const departments = [
    { name: "Mathematics", count: 8 },
    { name: "Science", count: 12 },
    { name: "English", count: 6 },
    { name: "Hindi", count: 5 },
    { name: "Social Studies", count: 7 },
    { name: "Computer Science", count: 4 },
    { name: "Physical Education", count: 3 },
    { name: "Arts & Crafts", count: 4 }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="rajasthan-pattern">
        <div className="container mx-auto px-4 py-12">
          {/* Hero Section */}
          <section className="text-center mb-16">
            <h1 className="text-4xl font-bold text-foreground mb-6">Our Faculty</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Meet our dedicated team of experienced educators committed to nurturing young minds 
              and providing quality education with excellence and innovation.
            </p>
          </section>

          {/* Department Stats */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-center text-foreground mb-8">Departments</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {departments.map((dept, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="pt-6">
                    <BookOpen className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <div className="font-semibold text-foreground">{dept.name}</div>
                    <div className="text-sm text-muted-foreground">{dept.count} Faculty</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Faculty Grid */}
          <section>
            <h2 className="text-2xl font-bold text-center text-foreground mb-8">Faculty Members</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {facultyMembers.map((faculty) => (
                <Card key={faculty.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="text-center">
                    <div className="w-24 h-24 mx-auto bg-gradient-primary rounded-full flex items-center justify-center mb-4">
                      <span className="text-2xl font-bold text-primary-foreground">
                        {faculty.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-foreground">{faculty.name}</h3>
                    <p className="text-primary font-medium">{faculty.designation}</p>
                    <Badge variant="outline" className="w-fit mx-auto">
                      {faculty.department}
                    </Badge>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Award className="h-4 w-4" />
                        Qualification
                      </div>
                      <p className="text-sm font-medium">{faculty.qualification}</p>
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Experience</div>
                      <p className="text-sm font-medium">{faculty.experience}</p>
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Specialization</div>
                      <div className="flex flex-wrap gap-1">
                        {faculty.specialization.map((spec, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{faculty.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{faculty.phone}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Faculty;
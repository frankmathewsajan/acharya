import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Award, BookOpen, Target } from "lucide-react";

const About = () => {
  const stats = [
    { icon: Users, label: "Students Enrolled", value: "2,500+" },
    { icon: Award, label: "Years of Excellence", value: "25+" },
    { icon: BookOpen, label: "Courses Offered", value: "50+" },
    { icon: Target, label: "Success Rate", value: "95%" },
  ];

  const values = [
    {
      title: "Excellence in Education",
      description: "Committed to providing quality education that meets global standards while preserving our cultural heritage."
    },
    {
      title: "Innovation & Technology", 
      description: "Embracing modern teaching methods and educational technology to enhance learning outcomes."
    },
    {
      title: "Holistic Development",
      description: "Focusing on overall personality development including academics, sports, arts, and moral values."
    },
    {
      title: "Community Service",
      description: "Instilling values of social responsibility and community service among our students."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="rajasthan-pattern">
        <div className="container mx-auto px-4 py-12">
          {/* Hero Section */}
          <section className="text-center mb-16">
            <h1 className="text-4xl font-bold text-foreground mb-6">About Acharya</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              A premier educational institution under the Government of Rajasthan, dedicated to nurturing 
              young minds and building the leaders of tomorrow through quality education and holistic development.
            </p>
          </section>

          {/* Stats Section */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <stat.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </section>

          {/* Mission & Vision */}
          <section className="grid md:grid-cols-2 gap-8 mb-16">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Our Mission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  To provide accessible, quality education that empowers students with knowledge, skills, and values 
                  necessary for personal growth and societal contribution, while preserving and promoting our rich 
                  cultural heritage.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Our Vision
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  To be recognized as a leading educational institution that combines traditional wisdom with 
                  modern pedagogy, producing well-rounded individuals who contribute meaningfully to society and 
                  the nation's progress.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Core Values */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-center text-foreground mb-8">Our Core Values</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {values.map((value, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Accreditations */}
          <section className="text-center">
            <h2 className="text-3xl font-bold text-foreground mb-8">Accreditations & Affiliations</h2>
            <div className="flex flex-wrap justify-center gap-3">
              <Badge variant="secondary" className="px-4 py-2">CBSE Affiliated</Badge>
              <Badge variant="secondary" className="px-4 py-2">NAAC Accredited</Badge>
              <Badge variant="secondary" className="px-4 py-2">ISO 9001:2015 Certified</Badge>
              <Badge variant="secondary" className="px-4 py-2">Government Recognized</Badge>
              <Badge variant="secondary" className="px-4 py-2">Quality Council of India</Badge>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;
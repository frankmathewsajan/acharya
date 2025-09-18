import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Award, Camera } from "lucide-react";

const Gallery = () => {
  const galleryItems = [
    {
      id: 1,
      title: "Annual Sports Day 2024",
      category: "Sports",
      date: "March 15, 2024",
      description: "Students showcasing their athletic talents in various sports competitions.",
      image: "/placeholder.svg",
      participants: "500+ Students"
    },
    {
      id: 2,
      title: "Science Exhibition",
      category: "Academic",
      date: "February 20, 2024",
      description: "Innovative science projects and experiments by our talented students.",
      image: "/placeholder.svg",
      participants: "200+ Projects"
    },
    {
      id: 3,
      title: "Cultural Festival",
      category: "Cultural",
      date: "January 26, 2024",
      description: "Republic Day celebrations with traditional dances and cultural programs.",
      image: "/placeholder.svg",
      participants: "All Classes"
    },
    {
      id: 4,
      title: "Teacher's Day Celebration",
      category: "Events",
      date: "September 5, 2023",
      description: "Students honoring their teachers with special performances and gratitude.",
      image: "/placeholder.svg",
      participants: "Faculty & Students"
    },
    {
      id: 5,
      title: "Inter-School Mathematics Olympiad",
      category: "Competition",
      date: "November 12, 2023",
      description: "Regional mathematics competition hosted by Acharya School.",
      image: "/placeholder.svg",
      participants: "15 Schools"
    },
    {
      id: 6,
      title: "Environment Awareness Drive",
      category: "Social",
      date: "June 5, 2023",
      description: "World Environment Day tree plantation and awareness campaign.",
      image: "/placeholder.svg",
      participants: "Community"
    },
    {
      id: 7,
      title: "Art & Craft Exhibition",
      category: "Arts",
      date: "December 10, 2023",
      description: "Creative artworks and handicrafts by students of all classes.",
      image: "/placeholder.svg",
      participants: "300+ Artworks"
    },
    {
      id: 8,
      title: "Independence Day Parade",
      category: "Patriotic",
      date: "August 15, 2023",
      description: "Flag hoisting ceremony and patriotic programs by students.",
      image: "/placeholder.svg",
      participants: "Entire School"
    }
  ];

  const categories = ["All", "Academic", "Sports", "Cultural", "Events", "Competition", "Social", "Arts", "Patriotic"];
  const [selectedCategory, setSelectedCategory] = React.useState("All");

  const filteredItems = selectedCategory === "All" 
    ? galleryItems 
    : galleryItems.filter(item => item.category === selectedCategory);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <h1 className="text-4xl font-bold text-foreground mb-6">Gallery</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Capturing precious moments, achievements, and memorable events from our vibrant school community. 
            Explore our journey of learning, growing, and celebrating together.
          </p>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Camera className="h-8 w-8 mx-auto mb-3 text-primary" />
              <div className="text-2xl font-bold text-foreground mb-1">500+</div>
              <div className="text-sm text-muted-foreground">Photos</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Calendar className="h-8 w-8 mx-auto mb-3 text-primary" />
              <div className="text-2xl font-bold text-foreground mb-1">50+</div>
              <div className="text-sm text-muted-foreground">Events</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Users className="h-8 w-8 mx-auto mb-3 text-primary" />
              <div className="text-2xl font-bold text-foreground mb-1">2500+</div>
              <div className="text-sm text-muted-foreground">Participants</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Award className="h-8 w-8 mx-auto mb-3 text-primary" />
              <div className="text-2xl font-bold text-foreground mb-1">25+</div>
              <div className="text-sm text-muted-foreground">Awards</div>
            </CardContent>
          </Card>
        </section>

        {/* Category Filter */}
        <section className="mb-12">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="mb-2"
              >
                {category}
              </Button>
            ))}
          </div>
        </section>

        {/* Gallery Grid */}
        <section>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gradient-subtle flex items-center justify-center">
                  <Camera className="h-12 w-12 text-muted-foreground" />
                </div>
                
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="secondary">{item.category}</Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {item.date}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                  
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {item.participants}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No items found for the selected category.</p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Gallery;
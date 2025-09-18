import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Download, Eye, Bell, Clock, Pin } from "lucide-react";

const Notices = () => {
  const notices = [
    {
      id: 1,
      title: "Summer Vacation Notice - 2024",
      category: "Academic",
      priority: "High",
      date: "2024-04-15",
      postedBy: "Administration",
      description: "Summer vacation will commence from May 15, 2024, and school will reopen on July 1, 2024. All students are advised to complete their holiday homework.",
      isPinned: true,
      hasAttachment: true,
      views: 1250
    },
    {
      id: 2,
      title: "Annual Examination Schedule - Class X & XII",
      category: "Examination",
      priority: "High",
      date: "2024-04-10",
      postedBy: "Examination Cell",
      description: "Board examination schedule for Class X and XII has been released. Students can download the detailed timetable from the attachment.",
      isPinned: true,
      hasAttachment: true,
      views: 890
    },
    {
      id: 3,
      title: "Parent-Teacher Meeting - April 2024",
      category: "Events",
      priority: "Medium",
      date: "2024-04-08",
      postedBy: "Academic Coordinator",
      description: "Parent-Teacher meeting is scheduled for April 20, 2024, from 9:00 AM to 2:00 PM. Parents are requested to attend and discuss their ward's progress.",
      isPinned: false,
      hasAttachment: false,
      views: 650
    },
    {
      id: 4,
      title: "Fee Payment Reminder - Q1 2024",
      category: "Finance",
      priority: "High",
      date: "2024-04-05",
      postedBy: "Accounts Department",
      description: "This is a reminder for parents to pay the first quarter fees by April 30, 2024. Late fee charges will apply after the due date.",
      isPinned: false,
      hasAttachment: true,
      views: 1100
    },
    {
      id: 5,
      title: "Science Exhibition Registration Open",
      category: "Competition",
      priority: "Medium",
      date: "2024-04-02",
      postedBy: "Science Department",
      description: "Registration for the annual science exhibition is now open. Students from Classes VI-XII can participate. Last date for registration: April 25, 2024.",
      isPinned: false,
      hasAttachment: true,
      views: 420
    },
    {
      id: 6,
      title: "Library Hours Extension",
      category: "Library",
      priority: "Low",
      date: "2024-03-28",
      postedBy: "Library",
      description: "Library hours have been extended for board exam students. The library will remain open till 7:00 PM from April 1 to May 31, 2024.",
      isPinned: false,
      hasAttachment: false,
      views: 380
    },
    {
      id: 7,
      title: "Inter-House Sports Competition",
      category: "Sports",
      priority: "Medium",
      date: "2024-03-25",
      postedBy: "Sports Department",
      description: "Inter-house sports competition will be held from April 15-19, 2024. Students are encouraged to participate in various sports events.",
      isPinned: false,
      hasAttachment: true,
      views: 560
    },
    {
      id: 8,
      title: "School Uniform Guidelines",
      category: "General",
      priority: "Low",
      date: "2024-03-20",
      postedBy: "Administration",
      description: "Updated school uniform guidelines for the academic year 2024-25. All students must adhere to the dress code as specified in the attached document.",
      isPinned: false,
      hasAttachment: true,
      views: 720
    }
  ];

  const categories = ["All", "Academic", "Examination", "Events", "Finance", "Competition", "Library", "Sports", "General"];
  const [selectedCategory, setSelectedCategory] = React.useState("All");

  const filteredNotices = selectedCategory === "All" 
    ? notices 
    : notices.filter(notice => notice.category === selectedCategory);

  const pinnedNotices = filteredNotices.filter(notice => notice.isPinned);
  const regularNotices = filteredNotices.filter(notice => !notice.isPinned);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "bg-red-100 text-red-800 border-red-200";
      case "Medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="rajasthan-pattern">
        <div className="container mx-auto px-4 py-12 animate-fade">
          {/* Hero Section */}
          <section className="text-center mb-16 animate-slide-up">
            <h1 className="text-4xl font-bold text-foreground mb-6">Notices & Announcements</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Stay updated with the latest announcements, important dates, and school notifications. 
              Never miss an important update from Acharya School.
            </p>
          </section>

          {/* Quick Stats */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 stagger">
            <Card className="text-center hover-elevate reveal">
              <CardContent className="pt-6">
                <Bell className="h-8 w-8 mx-auto mb-3 text-primary" />
                <div className="text-2xl font-bold text-foreground mb-1">{notices.length}</div>
                <div className="text-sm text-muted-foreground">Total Notices</div>
              </CardContent>
            </Card>
            <Card className="text-center hover-elevate reveal">
              <CardContent className="pt-6">
                <Pin className="h-8 w-8 mx-auto mb-3 text-primary" />
                <div className="text-2xl font-bold text-foreground mb-1">{pinnedNotices.length}</div>
                <div className="text-sm text-muted-foreground">Pinned</div>
              </CardContent>
            </Card>
            <Card className="text-center hover-elevate reveal">
              <CardContent className="pt-6">
                <Clock className="h-8 w-8 mx-auto mb-3 text-primary" />
                <div className="text-2xl font-bold text-foreground mb-1">5</div>
                <div className="text-sm text-muted-foreground">This Week</div>
              </CardContent>
            </Card>
            <Card className="text-center hover-elevate reveal">
              <CardContent className="pt-6">
                <Eye className="h-8 w-8 mx-auto mb-3 text-primary" />
                <div className="text-2xl font-bold text-foreground mb-1">5.2K</div>
                <div className="text-sm text-muted-foreground">Total Views</div>
              </CardContent>
            </Card>
          </section>

          {/* Category Filter */}
          <section className="mb-12 animate-zoom-in reveal">
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="mb-2 hover-elevate"
                >
                  {category}
                </Button>
              ))}
            </div>
          </section>

          {/* Pinned Notices */}
          {pinnedNotices.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Pin className="h-6 w-6 text-primary" />
                Pinned Notices
              </h2>
              <div className="space-y-4">
                {pinnedNotices.map((notice) => (
                  <Card key={notice.id} className="border-l-4 border-l-primary hover-elevate reveal">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">{notice.title}</CardTitle>
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <Badge variant="outline">{notice.category}</Badge>
                            <Badge className={getPriorityColor(notice.priority)}>{notice.priority}</Badge>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {new Date(notice.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Eye className="h-4 w-4" />
                              {notice.views} views
                            </div>
                          </div>
                        </div>
                        <Pin className="h-5 w-5 text-primary flex-shrink-0" />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-muted-foreground mb-4">{notice.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Posted by: {notice.postedBy}</span>
                        <div className="flex gap-2">
                          {notice.hasAttachment && (
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          )}
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Regular Notices */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-6">All Notices</h2>
            <div className="grid gap-6">
              {regularNotices.map((notice) => (
                <Card key={notice.id} className="hover:shadow-md transition-shadow hover-elevate reveal">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg mb-2">{notice.title}</CardTitle>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <Badge variant="outline">{notice.category}</Badge>
                        <Badge className={getPriorityColor(notice.priority)}>{notice.priority}</Badge>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(notice.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {notice.views} views
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-muted-foreground mb-4">{notice.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Posted by: {notice.postedBy}</span>
                      <div className="flex gap-2">
                        {notice.hasAttachment && (
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        )}
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
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

export default Notices;
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Clock } from "lucide-react";

const TestStyling = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-amber-900 mb-8">CSS Theme Test</h1>
        
        {/* Government Header Test */}
        <div className="government-header p-4 rounded-lg mb-6">
          <h2 className="text-white text-xl font-bold mb-2">Government Header Style</h2>
          <p className="text-white/80">This should have the government gradient background</p>
        </div>

        {/* Rajasthan Pattern Test */}
        <div className="rajasthan-pattern p-8 rounded-lg">
          <Card className="classic-card">
            <CardHeader>
              <CardTitle className="text-amber-900">Rajasthan Pattern Background</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-amber-800/80">This card should have the traditional Rajasthan pattern background</p>
            </CardContent>
          </Card>
        </div>

        {/* Color Tokens Test */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-6">
              <h3 className="font-bold">Primary Color</h3>
              <p>Should be saffron/orange</p>
            </CardContent>
          </Card>
          
          <Card className="bg-secondary text-secondary-foreground">
            <CardContent className="p-6">
              <h3 className="font-bold">Secondary Color</h3>
              <p>Should be navy blue</p>
            </CardContent>
          </Card>
          
          <Card className="bg-accent text-accent-foreground">
            <CardContent className="p-6">
              <h3 className="font-bold">Accent Color</h3>
              <p>Should be forest green</p>
            </CardContent>
          </Card>
        </div>

        {/* Animation Test */}
        <div className="stagger space-y-4">
          <Card className="hover-elevate transition-all duration-300">
            <CardContent className="p-6">
              <h3 className="font-bold text-amber-900">Hover Elevation Test</h3>
              <p className="text-amber-800/80">This card should lift on hover</p>
            </CardContent>
          </Card>
          
          <div className="animate-slide-up">
            <Button className="w-full">
              <Clock className="h-4 w-4 mr-2" />
              Animated Button
            </Button>
          </div>
        </div>

        {/* Government Footer */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center space-x-4 bg-amber-100 rounded-lg px-6 py-3 ring-1 ring-amber-200">
            <Shield className="h-6 w-6 text-amber-700" />
            <div className="text-amber-900 text-sm">
              <p className="font-medium">राजस्थान सरकार | Government of Rajasthan</p>
              <p className="text-amber-800/70">CSS Theme Test • Testing Colors</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestStyling;
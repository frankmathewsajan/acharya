import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <div className="rajasthan-pattern">
          <FeaturesSection />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;

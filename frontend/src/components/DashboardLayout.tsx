import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  user: any;
  profile: any;
  sidebarContent?: ReactNode;
}

const DashboardLayout = ({ children, title, user, profile, sidebarContent }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout } = useAuth();

  const handleSignOut = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout Failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="government-header shadow-government sticky top-0 z-50 border-b-2 border-primary/30">
        <div className="container mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center space-x-6">
            {sidebarContent && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="md:hidden text-white hover:bg-white/10 border border-white/20"
                  >
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 bg-card">
                  {sidebarContent}
                </SheetContent>
              </Sheet>
            )}
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{title}</h1>
                <p className="text-sm text-white/80">Government of Rajasthan</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-right hidden sm:block">
              <p className="font-semibold text-white text-lg">{user?.first_name} {user?.last_name}</p>
              <p className="text-sm text-white/80 capitalize">{user?.role}</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="text-white hover:bg-white/10 border border-white/20 px-4 py-2"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        {sidebarContent && (
          <aside className="hidden md:block w-80 bg-card border-r-2 border-border/50 min-h-screen shadow-classic">
            <div className="h-full bg-gradient-to-b from-card to-muted/30">
              {sidebarContent}
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen rajasthan-pattern">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
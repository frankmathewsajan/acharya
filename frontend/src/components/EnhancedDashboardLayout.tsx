import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface EnhancedDashboardLayoutProps {
  children: ReactNode;
  title: string;
  user: any;
  profile: any;
  sidebarContent?: ReactNode;
}

const EnhancedDashboardLayout = ({ children, title, user, profile, sidebarContent }: EnhancedDashboardLayoutProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

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
    <div className="min-h-screen rajasthan-pattern">
      {/* Inline style for collapsed sidebar label hiding */}
      <style>{`.sidebar.collapsed .sidebar-label{display:none}`}</style>
      {/* Header */}
      <header className="government-header shadow-government border-b sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            {sidebarContent && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="hidden md:inline-flex text-white hover:bg-white/10"
                onClick={() => setIsCollapsed(v => !v)}
                title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
              </Button>
            )}
            {sidebarContent && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="md:hidden text-white hover:bg-white/10"
                  >
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 bg-white">
                  <SheetHeader>
                    <SheetTitle>Navigation Menu</SheetTitle>
                    <SheetDescription>
                      Access the main navigation and menu options
                    </SheetDescription>
                  </SheetHeader>
                  {sidebarContent}
                </SheetContent>
              </Sheet>
            )}
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-r from-amber-500 to-rose-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{title}</h1>
                <p className="text-sm text-white/80">Acharya Education Portal</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* User Info */}
            <div className="text-right hidden sm:block">
              <p className="font-semibold text-white text-lg">{user?.first_name} {user?.last_name}</p>
              <p className="text-sm text-white/80 capitalize">{user?.role}</p>
            </div>
            
            {/* Logout Button */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 px-4 py-2"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        {sidebarContent && (
          <aside className={`sidebar hidden md:block ${isCollapsed ? 'w-20 collapsed' : 'w-80'} bg-white border-r min-h-screen shadow-sm transition-all duration-200`}> 
            <div className="h-full p-2">
              {sidebarContent}
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen bg-gray-50">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default EnhancedDashboardLayout;

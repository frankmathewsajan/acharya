import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { parentAuthService } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import StudentDashboard from "./dashboards/StudentDashboard";
import ParentDashboard from "./dashboards/ParentDashboard";
import FacultyDashboard from "./dashboards/FacultyDashboard";
import WardenDashboard from "./dashboards/WardenDashboard";
import AdminDashboard from "./dashboards/AdminDashboard";

const Dashboard = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [isParentAuthenticated, setIsParentAuthenticated] = useState(false);
  const [parentCheckLoading, setParentCheckLoading] = useState(true);

  // Check for parent authentication
  useEffect(() => {
    const checkParentAuth = async () => {
      try {
        console.log("Checking parent auth...");
        const isParentAuth = parentAuthService.isAuthenticated();
        console.log("Parent authenticated:", isParentAuth);
        setIsParentAuthenticated(isParentAuth);
        
        if (isParentAuth) {
          console.log("Verifying parent session...");
          // Verify session is still valid
          const sessionResponse = await parentAuthService.verifySession();
          console.log("Session response:", sessionResponse);
          if (!sessionResponse.valid) {
            console.log("Session invalid, clearing parent auth");
            setIsParentAuthenticated(false);
          }
        }
      } catch (error) {
        console.error("Parent auth check failed:", error);
        setIsParentAuthenticated(false);
      } finally {
        console.log("Parent check completed, setting parentCheckLoading to false");
        setParentCheckLoading(false);
      }
    };

    checkParentAuth();
  }, []);

  const handleLogout = async () => {
    try {
      if (isParentAuthenticated) {
        await parentAuthService.logout();
      } else {
        await logout();
      }
      navigate("/auth");
    } catch (error) {
      console.error("Logout error:", error);
      // Force navigation even if logout fails
      navigate("/auth");
    }
  };

  const LogoutButton = () => (
    <Button onClick={handleLogout} variant="outline" className="mt-4">
      <LogOut className="h-4 w-4 mr-2" />
      Logout
    </Button>
  );

  useEffect(() => {
    if (!isLoading && !parentCheckLoading && !isAuthenticated && !isParentAuthenticated) {
      navigate("/auth");
    }
  }, [isAuthenticated, isParentAuthenticated, isLoading, parentCheckLoading, navigate]);

  if (isLoading || parentCheckLoading) {
    return (
      <div className="min-h-screen rajasthan-pattern flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If parent is authenticated, show parent dashboard
  if (isParentAuthenticated) {
    return <ParentDashboard />;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen rajasthan-pattern flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Please log in to access your dashboard.</p>
          <Button onClick={() => navigate("/auth")} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // Route to appropriate dashboard based on user role
  switch (user.role?.toLowerCase()) {
    case "student":
      return <StudentDashboard />;
    case "parent":
      return <ParentDashboard />;
    case "faculty":
      return <FacultyDashboard />;
    case "warden":
      return <WardenDashboard />;
    case "admin":
    case "management":  // Add Management role support (case-insensitive)
      return <AdminDashboard />;
    default:
      return (
        <div className="min-h-screen rajasthan-pattern flex items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              Your role ({user.role}) is not recognized in the system.
            </p>
            <LogoutButton />
          </div>
        </div>
      );
  }
};

export default Dashboard;
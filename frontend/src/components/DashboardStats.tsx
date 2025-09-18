import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  color?: "primary" | "success" | "warning" | "destructive";
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard = ({ title, value, icon: Icon, description, color = "primary", trend }: StatCardProps) => {
  const getColorClasses = () => {
    switch (color) {
      case "success":
        return "text-success bg-success/10";
      case "warning":
        return "text-warning bg-warning/10";
      case "destructive":
        return "text-destructive bg-destructive/10";
      default:
        return "text-primary bg-primary/10";
    }
  };

  return (
    <Card className="classic-card hover:shadow-primary-glow transition-all duration-300 border-2 border-border/30 hover:border-primary/30">
      <CardContent className="p-8">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <p className="text-base text-muted-foreground font-medium">{title}</p>
            <div className="flex items-baseline space-x-3">
              <p className="text-3xl font-bold text-foreground">{value}</p>
              {trend && (
                <span className={`text-sm font-semibold px-2 py-1 rounded-full ${trend.isPositive ? 'text-success bg-success/10' : 'text-destructive bg-destructive/10'}`}>
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
              )}
            </div>
            {description && (
              <p className="text-sm text-muted-foreground font-medium">{description}</p>
            )}
          </div>
          <div className={`p-4 rounded-xl ${getColorClasses()} border-2 border-current/20 shadow-classic`}>
            <Icon className="h-8 w-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface DashboardStatsProps {
  stats: StatCardProps[];
}

const DashboardStats = ({ stats }: DashboardStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default DashboardStats;
import { Shield, Activity, Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  criticalAlerts?: number;
}

const Header = ({ criticalAlerts = 0 }: HeaderProps) => {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground tracking-tight">
                  FraudShield AI
                </h1>
                <p className="text-xs text-muted-foreground">
                  Public Transaction Anomaly Detection
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="w-4 h-4 text-risk-normal" />
              <span>System Active</span>
            </div>
            
            {criticalAlerts > 0 && (
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-risk-critical animate-pulse" />
                <Badge variant="destructive" className="animate-pulse">
                  {criticalAlerts} Critical
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

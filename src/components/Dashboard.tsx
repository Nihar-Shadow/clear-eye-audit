import { DashboardStats } from '@/types/fraud';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle, 
  DollarSign,
  TrendingUp,
  Building2,
  Users,
  Activity,
  Shield
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Area,
  AreaChart,
} from 'recharts';
import AnimatedCounter from './AnimatedCounter';
import RiskGauge from './RiskGauge';

interface DashboardProps {
  stats: DashboardStats;
}

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
};

const RISK_COLORS = {
  Critical: 'hsl(0, 72%, 51%)',
  Review: 'hsl(38, 92%, 50%)',
  Normal: 'hsl(142, 71%, 45%)',
};

const Dashboard = ({ stats }: DashboardProps) => {
  const statCards = [
    {
      title: 'Total Transactions',
      value: stats.totalTransactions,
      icon: FileText,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      glowColor: 'shadow-primary/20',
    },
    {
      title: 'Total Amount',
      value: stats.totalAmount,
      isCurrency: true,
      icon: DollarSign,
      color: 'text-chart-2',
      bgColor: 'bg-chart-2/10',
      glowColor: 'shadow-chart-2/20',
    },
    {
      title: 'Critical Alerts',
      value: stats.criticalAlerts,
      icon: AlertCircle,
      color: 'text-risk-critical',
      bgColor: 'bg-risk-critical/10',
      glowColor: 'shadow-risk-critical/20',
      pulse: stats.criticalAlerts > 0,
    },
    {
      title: 'Under Review',
      value: stats.reviewAlerts,
      icon: AlertTriangle,
      color: 'text-risk-review',
      bgColor: 'bg-risk-review/10',
      glowColor: 'shadow-risk-review/20',
    },
    {
      title: 'Normal',
      value: stats.normalCount,
      icon: CheckCircle,
      color: 'text-risk-normal',
      bgColor: 'bg-risk-normal/10',
      glowColor: 'shadow-risk-normal/20',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Main Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat, index) => (
          <Card 
            key={index} 
            className={`stat-card animate-slide-up ${stat.pulse ? 'pulse-dot' : ''}`} 
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-medium">
                    {stat.title}
                  </p>
                  <p className={`text-3xl font-bold ${stat.color} number-glow`}>
                    {stat.isCurrency ? (
                      formatCurrency(stat.value)
                    ) : (
                      <AnimatedCounter value={stat.value} duration={1200} />
                    )}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor} shadow-lg ${stat.glowColor}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Risk Score Gauge + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="glass-panel lg:col-span-1 animate-scale-in">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Overall Risk Score
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-6">
            <RiskGauge score={stats.averageRiskScore} size="lg" />
            <div className="mt-4 text-center">
              <p className="text-2xl font-bold">
                <AnimatedCounter value={stats.averageRiskScore} duration={1500} suffix="%" />
              </p>
              <p className="text-xs text-muted-foreground mt-1">Average Risk Level</p>
            </div>
          </CardContent>
        </Card>

        {/* Risk Distribution Pie Chart */}
        <Card className="glass-panel lg:col-span-1 animate-scale-in" style={{ animationDelay: '100ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Risk Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <Pie
                    data={stats.riskDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="count"
                    nameKey="level"
                    filter="url(#glow)"
                  >
                    {stats.riskDistribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={RISK_COLORS[entry.level as keyof typeof RISK_COLORS]}
                        stroke="transparent"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(222, 47%, 8%)',
                      border: '1px solid hsl(217, 33%, 18%)',
                      borderRadius: '12px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    }}
                    itemStyle={{ color: 'hsl(210, 40%, 96%)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {stats.riskDistribution.map((item) => (
                <div key={item.level} className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full shadow-lg" 
                      style={{ 
                        backgroundColor: RISK_COLORS[item.level as keyof typeof RISK_COLORS],
                        boxShadow: `0 0 10px ${RISK_COLORS[item.level as keyof typeof RISK_COLORS]}`
                      }}
                    />
                    <span className="text-xs font-medium">{item.level}</span>
                  </div>
                  <span className="text-lg font-bold">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Risky Departments */}
        <Card className="glass-panel lg:col-span-2 animate-scale-in" style={{ animationDelay: '200ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="w-4 h-4 text-risk-critical" />
              Top Risky Departments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.topRiskyDepartments}
                  layout="vertical"
                  margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="hsl(0, 72%, 51%)" />
                      <stop offset="100%" stopColor="hsl(0, 72%, 65%)" />
                    </linearGradient>
                  </defs>
                  <XAxis type="number" hide />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={120}
                    tick={{ fill: 'hsl(210, 40%, 96%)', fontSize: 12, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(222, 47%, 8%)',
                      border: '1px solid hsl(217, 33%, 18%)',
                      borderRadius: '12px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    }}
                    itemStyle={{ color: 'hsl(210, 40%, 96%)' }}
                    formatter={(value: number) => [`${value} alerts`, 'Alerts']}
                    cursor={{ fill: 'hsl(217, 33%, 18%)' }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="url(#barGradient)" 
                    radius={[0, 8, 8, 0]}
                    className="drop-shadow-lg"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vendors + Time Series */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Risky Vendors */}
        <Card className="glass-panel animate-scale-in" style={{ animationDelay: '300ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-risk-review" />
              Top Risky Vendors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topRiskyVendors.slice(0, 5).map((vendor, index) => (
                <div key={vendor.name} className="flex items-center gap-3 animate-slide-in-right" style={{ animationDelay: `${(index + 4) * 80}ms` }}>
                  <span className="text-xs text-muted-foreground w-4">{index + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate max-w-[140px]">{vendor.name}</span>
                      <span className="text-xs text-risk-review font-semibold">{vendor.count} alerts</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ 
                          width: `${(vendor.count / (stats.topRiskyVendors[0]?.count || 1)) * 100}%`,
                          background: 'linear-gradient(90deg, hsl(38, 92%, 50%), hsl(45, 90%, 55%))',
                          boxShadow: '0 0 8px hsl(38, 92%, 50%)'
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Time Series Chart */}
        <Card className="glass-panel lg:col-span-2 animate-scale-in" style={{ animationDelay: '400ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Transaction Volume & Risk Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {stats.timeSeriesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.timeSeriesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 18%)" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }}
                      axisLine={{ stroke: 'hsl(217, 33%, 18%)' }}
                      tickLine={false}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis 
                      yAxisId="left"
                      tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }}
                      axisLine={{ stroke: 'hsl(217, 33%, 18%)' }}
                      tickLine={false}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }}
                      axisLine={{ stroke: 'hsl(217, 33%, 18%)' }}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(222, 47%, 8%)',
                        border: '1px solid hsl(217, 33%, 18%)',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                      }}
                      itemStyle={{ color: 'hsl(210, 40%, 96%)' }}
                      labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="count" 
                      stroke="hsl(217, 91%, 60%)" 
                      strokeWidth={2}
                      fill="url(#colorCount)"
                      name="Transactions"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="avgRisk" 
                      stroke="hsl(0, 72%, 51%)" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(0, 72%, 51%)', strokeWidth: 0, r: 4 }}
                      name="Avg Risk"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No time series data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

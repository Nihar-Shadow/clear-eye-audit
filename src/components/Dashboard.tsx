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
  Users
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
} from 'recharts';

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
      value: stats.totalTransactions.toLocaleString(),
      icon: FileText,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Total Amount',
      value: formatCurrency(stats.totalAmount),
      icon: DollarSign,
      color: 'text-chart-2',
      bgColor: 'bg-chart-2/10',
    },
    {
      title: 'Critical Alerts',
      value: stats.criticalAlerts.toString(),
      icon: AlertCircle,
      color: 'text-risk-critical',
      bgColor: 'bg-risk-critical/10',
    },
    {
      title: 'Under Review',
      value: stats.reviewAlerts.toString(),
      icon: AlertTriangle,
      color: 'text-risk-review',
      bgColor: 'bg-risk-review/10',
    },
    {
      title: 'Normal',
      value: stats.normalCount.toString(),
      icon: CheckCircle,
      color: 'text-risk-normal',
      bgColor: 'bg-risk-normal/10',
    },
    {
      title: 'Avg Risk Score',
      value: stats.averageRiskScore.toString(),
      icon: TrendingUp,
      color: stats.averageRiskScore > 50 ? 'text-risk-review' : 'text-risk-normal',
      bgColor: stats.averageRiskScore > 50 ? 'bg-risk-review/10' : 'bg-risk-normal/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="stat-card animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Pie Chart */}
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.riskDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="level"
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
                      borderRadius: '8px',
                    }}
                    itemStyle={{ color: 'hsl(210, 40%, 96%)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {stats.riskDistribution.map((item) => (
                <div key={item.level} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: RISK_COLORS[item.level as keyof typeof RISK_COLORS] }}
                  />
                  <span className="text-xs text-muted-foreground">{item.level}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Risky Departments */}
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Top Risky Departments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.topRiskyDepartments}
                  layout="vertical"
                  margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={100}
                    tick={{ fill: 'hsl(210, 40%, 96%)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(222, 47%, 8%)',
                      border: '1px solid hsl(217, 33%, 18%)',
                      borderRadius: '8px',
                    }}
                    itemStyle={{ color: 'hsl(210, 40%, 96%)' }}
                    formatter={(value: number, name: string) => [
                      name === 'count' ? `${value} alerts` : `${value}%`,
                      name === 'count' ? 'Alerts' : 'Avg Risk'
                    ]}
                  />
                  <Bar dataKey="count" fill="hsl(0, 72%, 51%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Risky Vendors */}
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Top Risky Vendors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.topRiskyVendors}
                  layout="vertical"
                  margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={100}
                    tick={{ fill: 'hsl(210, 40%, 96%)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(222, 47%, 8%)',
                      border: '1px solid hsl(217, 33%, 18%)',
                      borderRadius: '8px',
                    }}
                    itemStyle={{ color: 'hsl(210, 40%, 96%)' }}
                    formatter={(value: number, name: string) => [
                      name === 'count' ? `${value} alerts` : `${value}%`,
                      name === 'count' ? 'Alerts' : 'Avg Risk'
                    ]}
                  />
                  <Bar dataKey="count" fill="hsl(38, 92%, 50%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Series Chart */}
      {stats.timeSeriesData.length > 0 && (
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Transaction Volume & Risk Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.timeSeriesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                      borderRadius: '8px',
                    }}
                    itemStyle={{ color: 'hsl(210, 40%, 96%)' }}
                    labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(217, 91%, 60%)" 
                    strokeWidth={2}
                    dot={false}
                    name="Transactions"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="avgRisk" 
                    stroke="hsl(0, 72%, 51%)" 
                    strokeWidth={2}
                    dot={false}
                    name="Avg Risk"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;

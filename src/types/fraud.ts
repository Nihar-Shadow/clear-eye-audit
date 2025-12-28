export interface Transaction {
  id: string;
  amount: number;
  date: string;
  department: string;
  vendor: string;
  beneficiary: string;
  bankAccount: string;
  description?: string;
  
  // Analysis results
  riskScore?: number;
  riskLevel?: 'normal' | 'review' | 'critical';
  aiScore?: number;
  ruleViolations?: RuleViolation[];
  
  // Case status
  caseStatus?: 'pending' | 'under_review' | 'cleared' | 'escalated';
  reviewerNotes?: CaseNote[];
}

export interface RuleViolation {
  ruleId: string;
  ruleName: string;
  triggered: boolean;
  explanation: string;
  severity: 'low' | 'medium' | 'high';
}

export interface CaseNote {
  id: string;
  timestamp: string;
  action: string;
  comment: string;
  reviewer?: string;
}

export interface ColumnMapping {
  amount: string;
  date: string;
  department: string;
  vendor: string;
  beneficiary: string;
  bankAccount: string;
  description?: string;
}

export interface DashboardStats {
  totalTransactions: number;
  totalAmount: number;
  criticalAlerts: number;
  reviewAlerts: number;
  normalCount: number;
  averageRiskScore: number;
  topRiskyDepartments: { name: string; count: number; avgRisk: number }[];
  topRiskyVendors: { name: string; count: number; avgRisk: number }[];
  riskDistribution: { level: string; count: number }[];
  timeSeriesData: { date: string; count: number; avgRisk: number }[];
}

export interface FraudRule {
  id: string;
  name: string;
  description: string;
  check: (transaction: Transaction, allTransactions: Transaction[], stats: DatasetStats) => RuleViolation;
}

export interface DatasetStats {
  departmentAverages: Record<string, number>;
  vendorFrequency: Record<string, { count: number; dates: string[] }>;
  bankAccountBeneficiaries: Record<string, Set<string>>;
  historicalDailyAverage: number;
  dailyCounts: Record<string, number>;
}

export interface AnalysisResult {
  transactions: Transaction[];
  stats: DashboardStats;
}

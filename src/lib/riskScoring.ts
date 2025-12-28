import { Transaction, RuleViolation, DashboardStats } from '@/types/fraud';
import { fraudRules, calculateDatasetStats, applyRules } from './fraudRules';
import { calculateAnomalyScore } from './anomalyDetection';

/**
 * Calculate combined risk score
 * Formula: 60% AI Score + 40% Rule Violations Score
 */
const calculateCombinedRiskScore = (
  aiScore: number,
  ruleViolations: RuleViolation[]
): number => {
  // Calculate rule violation score (0-100)
  const severityWeights = { high: 40, medium: 25, low: 0 };
  
  let ruleScore = 0;
  let maxPossibleScore = 0;
  
  ruleViolations.forEach(violation => {
    maxPossibleScore += severityWeights.high;
    if (violation.triggered) {
      ruleScore += severityWeights[violation.severity];
    }
  });
  
  const normalizedRuleScore = maxPossibleScore > 0 
    ? (ruleScore / maxPossibleScore) * 100 
    : 0;
  
  // Combined score: 60% AI + 40% Rules
  const combinedScore = (aiScore * 0.6) + (normalizedRuleScore * 0.4);
  
  return Math.round(Math.min(100, combinedScore));
};

/**
 * Determine risk level based on score
 */
const getRiskLevel = (score: number): 'normal' | 'review' | 'critical' => {
  if (score >= 71) return 'critical';
  if (score >= 31) return 'review';
  return 'normal';
};

/**
 * Fully analyze a dataset of transactions
 */
export const analyzeDataset = (rawTransactions: Transaction[]): {
  transactions: Transaction[];
  stats: DashboardStats;
} => {
  const datasetStats = calculateDatasetStats(rawTransactions);
  
  // Analyze each transaction
  const analyzedTransactions = rawTransactions.map(transaction => {
    // Apply rule-based detection
    const ruleViolations = applyRules(transaction, rawTransactions, datasetStats);
    
    // Apply AI anomaly detection
    const { score: aiScore } = calculateAnomalyScore(
      transaction,
      datasetStats,
      rawTransactions
    );
    
    // Calculate combined risk score
    const riskScore = calculateCombinedRiskScore(aiScore, ruleViolations);
    const riskLevel = getRiskLevel(riskScore);
    
    return {
      ...transaction,
      riskScore,
      riskLevel,
      aiScore,
      ruleViolations,
      caseStatus: transaction.caseStatus || 'pending',
      reviewerNotes: transaction.reviewerNotes || [],
    };
  });
  
  // Calculate dashboard stats
  const criticalAlerts = analyzedTransactions.filter(t => t.riskLevel === 'critical').length;
  const reviewAlerts = analyzedTransactions.filter(t => t.riskLevel === 'review').length;
  const normalCount = analyzedTransactions.filter(t => t.riskLevel === 'normal').length;
  
  const totalAmount = analyzedTransactions.reduce((sum, t) => sum + t.amount, 0);
  const averageRiskScore = analyzedTransactions.length > 0
    ? analyzedTransactions.reduce((sum, t) => sum + (t.riskScore || 0), 0) / analyzedTransactions.length
    : 0;
  
  // Top risky departments
  const deptStats: Record<string, { count: number; totalRisk: number }> = {};
  analyzedTransactions.forEach(t => {
    if (!deptStats[t.department]) {
      deptStats[t.department] = { count: 0, totalRisk: 0 };
    }
    if (t.riskLevel !== 'normal') {
      deptStats[t.department].count += 1;
      deptStats[t.department].totalRisk += t.riskScore || 0;
    }
  });
  
  const topRiskyDepartments = Object.entries(deptStats)
    .map(([name, data]) => ({
      name,
      count: data.count,
      avgRisk: data.count > 0 ? Math.round(data.totalRisk / data.count) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  // Top risky vendors
  const vendorStats: Record<string, { count: number; totalRisk: number }> = {};
  analyzedTransactions.forEach(t => {
    if (!vendorStats[t.vendor]) {
      vendorStats[t.vendor] = { count: 0, totalRisk: 0 };
    }
    if (t.riskLevel !== 'normal') {
      vendorStats[t.vendor].count += 1;
      vendorStats[t.vendor].totalRisk += t.riskScore || 0;
    }
  });
  
  const topRiskyVendors = Object.entries(vendorStats)
    .map(([name, data]) => ({
      name,
      count: data.count,
      avgRisk: data.count > 0 ? Math.round(data.totalRisk / data.count) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  // Risk distribution
  const riskDistribution = [
    { level: 'Critical', count: criticalAlerts },
    { level: 'Review', count: reviewAlerts },
    { level: 'Normal', count: normalCount },
  ];
  
  // Time series data
  const dateStats: Record<string, { count: number; totalRisk: number }> = {};
  analyzedTransactions.forEach(t => {
    if (!dateStats[t.date]) {
      dateStats[t.date] = { count: 0, totalRisk: 0 };
    }
    dateStats[t.date].count += 1;
    dateStats[t.date].totalRisk += t.riskScore || 0;
  });
  
  const timeSeriesData = Object.entries(dateStats)
    .map(([date, data]) => ({
      date,
      count: data.count,
      avgRisk: Math.round(data.totalRisk / data.count),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  return {
    transactions: analyzedTransactions,
    stats: {
      totalTransactions: analyzedTransactions.length,
      totalAmount,
      criticalAlerts,
      reviewAlerts,
      normalCount,
      averageRiskScore: Math.round(averageRiskScore),
      topRiskyDepartments,
      topRiskyVendors,
      riskDistribution,
      timeSeriesData,
    },
  };
};

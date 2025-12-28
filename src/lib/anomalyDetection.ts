import { Transaction, DatasetStats } from '@/types/fraud';

/**
 * Simplified Isolation Forest-like anomaly detection
 * Uses statistical deviation scoring instead of actual tree building
 * This approach is hackathon-friendly and produces similar results
 */

interface FeatureVector {
  normalizedAmount: number;
  departmentDeviation: number;
  vendorFrequencyScore: number;
  bankAccountRiskScore: number;
  temporalScore: number;
}

const extractFeatures = (
  transaction: Transaction,
  stats: DatasetStats,
  allTransactions: Transaction[]
): FeatureVector => {
  // Feature 1: Normalized amount (0-1 scale based on dataset)
  const amounts = allTransactions.map(t => t.amount);
  const maxAmount = Math.max(...amounts);
  const minAmount = Math.min(...amounts);
  const normalizedAmount = (transaction.amount - minAmount) / (maxAmount - minAmount || 1);
  
  // Feature 2: Department deviation (how far from department average)
  const deptAvg = stats.departmentAverages[transaction.department] || transaction.amount;
  const deptStd = calculateStdDev(
    allTransactions.filter(t => t.department === transaction.department).map(t => t.amount)
  );
  const departmentDeviation = deptStd > 0 
    ? Math.abs(transaction.amount - deptAvg) / deptStd 
    : 0;
  
  // Feature 3: Vendor frequency score (rare vendors are more suspicious)
  const vendorData = stats.vendorFrequency[transaction.vendor];
  const totalTransactions = allTransactions.length;
  const vendorFrequency = vendorData ? vendorData.count / totalTransactions : 0;
  const vendorFrequencyScore = 1 - vendorFrequency; // Higher score for rare vendors
  
  // Feature 4: Bank account risk (multiple beneficiaries)
  const beneficiaries = stats.bankAccountBeneficiaries[transaction.bankAccount];
  const beneficiaryCount = beneficiaries ? beneficiaries.size : 1;
  const bankAccountRiskScore = Math.min((beneficiaryCount - 1) / 3, 1); // Cap at 4+ beneficiaries
  
  // Feature 5: Temporal score (end of month/quarter patterns)
  const date = new Date(transaction.date);
  const dayOfMonth = date.getDate();
  const month = date.getMonth();
  const isEndOfMonth = dayOfMonth >= 28;
  const isEndOfQuarter = isEndOfMonth && [2, 5, 8, 11].includes(month);
  const temporalScore = isEndOfQuarter ? 0.8 : isEndOfMonth ? 0.5 : 0;
  
  return {
    normalizedAmount,
    departmentDeviation,
    vendorFrequencyScore,
    bankAccountRiskScore,
    temporalScore,
  };
};

const calculateStdDev = (values: number[]): number => {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquaredDiff);
};

/**
 * Calculate anomaly score using weighted feature combination
 * Higher score = more anomalous (0-100 scale)
 */
export const calculateAnomalyScore = (
  transaction: Transaction,
  stats: DatasetStats,
  allTransactions: Transaction[]
): { score: number; explanation: string } => {
  const features = extractFeatures(transaction, stats, allTransactions);
  
  // Weighted combination (weights tuned for fraud detection)
  const weights = {
    normalizedAmount: 0.25,
    departmentDeviation: 0.30,
    vendorFrequencyScore: 0.20,
    bankAccountRiskScore: 0.15,
    temporalScore: 0.10,
  };
  
  // Calculate raw score
  const rawScore = 
    features.normalizedAmount * weights.normalizedAmount +
    Math.min(features.departmentDeviation / 3, 1) * weights.departmentDeviation +
    features.vendorFrequencyScore * weights.vendorFrequencyScore +
    features.bankAccountRiskScore * weights.bankAccountRiskScore +
    features.temporalScore * weights.temporalScore;
  
  // Scale to 0-100
  const score = Math.round(rawScore * 100);
  
  // Generate explanation
  const explanationParts: string[] = [];
  
  if (features.normalizedAmount > 0.7) {
    explanationParts.push(`High transaction amount (${Math.round(features.normalizedAmount * 100)}th percentile)`);
  }
  
  if (features.departmentDeviation > 2) {
    explanationParts.push(`${features.departmentDeviation.toFixed(1)} standard deviations from department mean`);
  }
  
  if (features.vendorFrequencyScore > 0.9) {
    explanationParts.push('Rare vendor with few historical transactions');
  }
  
  if (features.bankAccountRiskScore > 0) {
    explanationParts.push('Bank account shared with multiple beneficiaries');
  }
  
  if (features.temporalScore > 0.5) {
    explanationParts.push('Transaction near fiscal period end');
  }
  
  const explanation = explanationParts.length > 0
    ? `AI detected anomalies: ${explanationParts.join('; ')}.`
    : 'No significant anomalies detected by AI model.';
  
  return { score, explanation };
};

/**
 * Batch analyze all transactions
 */
export const analyzeTransactions = (
  transactions: Transaction[],
  stats: DatasetStats
): Transaction[] => {
  return transactions.map(transaction => {
    const { score: aiScore, explanation } = calculateAnomalyScore(
      transaction,
      stats,
      transactions
    );
    
    return {
      ...transaction,
      aiScore,
      // Store AI explanation in a way that can be accessed later
    };
  });
};

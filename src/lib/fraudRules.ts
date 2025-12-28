import { Transaction, RuleViolation, DatasetStats, FraudRule } from '@/types/fraud';

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Rule 1: Duplicate Payments Detection
const duplicatePaymentRule: FraudRule = {
  id: 'RULE_001',
  name: 'Duplicate Payment Detection',
  description: 'Flags transactions with same vendor, amount, and date',
  check: (transaction, allTransactions) => {
    const duplicates = allTransactions.filter(t => 
      t.id !== transaction.id &&
      t.vendor === transaction.vendor &&
      t.amount === transaction.amount &&
      t.date === transaction.date
    );
    
    const triggered = duplicates.length > 0;
    
    return {
      ruleId: 'RULE_001',
      ruleName: 'Duplicate Payment Detection',
      triggered,
      explanation: triggered 
        ? `Found ${duplicates.length} duplicate payment(s) to "${transaction.vendor}" for ${formatCurrency(transaction.amount)} on ${transaction.date}. This may indicate double billing or payment processing error.`
        : 'No duplicate payments detected.',
      severity: triggered ? 'high' : 'low',
    };
  },
};

// Rule 2: Amount Exceeds 3x Department Average
const amountAnomalyRule: FraudRule = {
  id: 'RULE_002',
  name: 'Excessive Amount Detection',
  description: 'Flags transactions exceeding 3x the department average',
  check: (transaction, _, stats) => {
    const deptAvg = stats.departmentAverages[transaction.department] || 0;
    const threshold = deptAvg * 3;
    const triggered = transaction.amount > threshold && deptAvg > 0;
    const ratio = deptAvg > 0 ? (transaction.amount / deptAvg).toFixed(1) : 'N/A';
    
    return {
      ruleId: 'RULE_002',
      ruleName: 'Excessive Amount Detection',
      triggered,
      explanation: triggered
        ? `Transaction amount ${formatCurrency(transaction.amount)} is ${ratio}x the department average of ${formatCurrency(deptAvg)}. The "${transaction.department}" department typically processes smaller payments.`
        : `Transaction amount is within normal range for ${transaction.department} department (avg: ${formatCurrency(deptAvg)}).`,
      severity: triggered ? 'high' : 'low',
    };
  },
};

// Rule 3: Same Bank Account Multiple Beneficiaries
const bankAccountAnomalyRule: FraudRule = {
  id: 'RULE_003',
  name: 'Shared Bank Account Detection',
  description: 'Flags bank accounts linked to multiple beneficiaries',
  check: (transaction, _, stats) => {
    const beneficiaries = stats.bankAccountBeneficiaries[transaction.bankAccount];
    const beneficiaryCount = beneficiaries ? beneficiaries.size : 1;
    const triggered = beneficiaryCount > 1;
    
    return {
      ruleId: 'RULE_003',
      ruleName: 'Shared Bank Account Detection',
      triggered,
      explanation: triggered
        ? `Bank account "${transaction.bankAccount}" is linked to ${beneficiaryCount} different beneficiaries. This may indicate shell company activity or data entry errors.`
        : 'Bank account is uniquely linked to this beneficiary.',
      severity: triggered ? 'medium' : 'low',
    };
  },
};

// Rule 4: High Frequency Vendor Payments
const vendorFrequencyRule: FraudRule = {
  id: 'RULE_004',
  name: 'Rapid Vendor Payment Detection',
  description: 'Flags high frequency payments to same vendor in short time',
  check: (transaction, _, stats) => {
    const vendorData = stats.vendorFrequency[transaction.vendor];
    if (!vendorData) {
      return {
        ruleId: 'RULE_004',
        ruleName: 'Rapid Vendor Payment Detection',
        triggered: false,
        explanation: 'Single transaction to this vendor.',
        severity: 'low',
      };
    }
    
    // Check for payments within 7 days
    const transactionDate = new Date(transaction.date);
    const nearbyPayments = vendorData.dates.filter(dateStr => {
      const d = new Date(dateStr);
      const diffDays = Math.abs((transactionDate.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && dateStr !== transaction.date;
    });
    
    const triggered = nearbyPayments.length >= 3;
    
    return {
      ruleId: 'RULE_004',
      ruleName: 'Rapid Vendor Payment Detection',
      triggered,
      explanation: triggered
        ? `Detected ${nearbyPayments.length + 1} payments to "${transaction.vendor}" within 7 days. This unusually high frequency may warrant investigation for split invoicing.`
        : `Normal payment frequency to "${transaction.vendor}".`,
      severity: triggered ? 'medium' : 'low',
    };
  },
};

// Rule 5: Transaction Spike Detection
const transactionSpikeRule: FraudRule = {
  id: 'RULE_005',
  name: 'Transaction Spike Detection',
  description: 'Flags days with transaction count 2x above historical average',
  check: (transaction, _, stats) => {
    const dailyCount = stats.dailyCounts[transaction.date] || 0;
    const avgDaily = stats.historicalDailyAverage || 1;
    const ratio = dailyCount / avgDaily;
    const triggered = ratio > 2;
    
    return {
      ruleId: 'RULE_005',
      ruleName: 'Transaction Spike Detection',
      triggered,
      explanation: triggered
        ? `${dailyCount} transactions occurred on ${transaction.date}, which is ${ratio.toFixed(1)}x the daily average of ${avgDaily.toFixed(0)}. This spike may indicate rushed processing to meet deadlines or circumvent controls.`
        : `Transaction volume on ${transaction.date} is within normal range.`,
      severity: triggered ? 'medium' : 'low',
    };
  },
};

export const fraudRules: FraudRule[] = [
  duplicatePaymentRule,
  amountAnomalyRule,
  bankAccountAnomalyRule,
  vendorFrequencyRule,
  transactionSpikeRule,
];

export const calculateDatasetStats = (transactions: Transaction[]): DatasetStats => {
  // Department averages
  const departmentTotals: Record<string, { sum: number; count: number }> = {};
  const vendorFrequency: Record<string, { count: number; dates: string[] }> = {};
  const bankAccountBeneficiaries: Record<string, Set<string>> = {};
  const dailyCounts: Record<string, number> = {};
  
  transactions.forEach(t => {
    // Department averages
    if (!departmentTotals[t.department]) {
      departmentTotals[t.department] = { sum: 0, count: 0 };
    }
    departmentTotals[t.department].sum += t.amount;
    departmentTotals[t.department].count += 1;
    
    // Vendor frequency
    if (!vendorFrequency[t.vendor]) {
      vendorFrequency[t.vendor] = { count: 0, dates: [] };
    }
    vendorFrequency[t.vendor].count += 1;
    vendorFrequency[t.vendor].dates.push(t.date);
    
    // Bank account beneficiaries
    if (!bankAccountBeneficiaries[t.bankAccount]) {
      bankAccountBeneficiaries[t.bankAccount] = new Set();
    }
    bankAccountBeneficiaries[t.bankAccount].add(t.beneficiary);
    
    // Daily counts
    dailyCounts[t.date] = (dailyCounts[t.date] || 0) + 1;
  });
  
  const departmentAverages: Record<string, number> = {};
  Object.entries(departmentTotals).forEach(([dept, data]) => {
    departmentAverages[dept] = data.sum / data.count;
  });
  
  const dailyCountValues = Object.values(dailyCounts);
  const historicalDailyAverage = dailyCountValues.length > 0
    ? dailyCountValues.reduce((a, b) => a + b, 0) / dailyCountValues.length
    : 0;
  
  return {
    departmentAverages,
    vendorFrequency,
    bankAccountBeneficiaries,
    historicalDailyAverage,
    dailyCounts,
  };
};

export const applyRules = (
  transaction: Transaction,
  allTransactions: Transaction[],
  stats: DatasetStats
): RuleViolation[] => {
  return fraudRules.map(rule => rule.check(transaction, allTransactions, stats));
};

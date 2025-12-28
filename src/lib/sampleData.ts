import { Transaction } from '@/types/fraud';

const departments = [
  'Public Works',
  'Health Services',
  'Education',
  'Transportation',
  'Social Services',
  'Parks & Recreation',
  'Finance',
  'IT Services',
];

const vendors = [
  'Acme Construction Co.',
  'Metro Office Supplies',
  'City Maintenance LLC',
  'Healthcare Solutions Inc.',
  'Tech Systems Corp.',
  'Green Landscaping',
  'Premier Consulting Group',
  'Safety Equipment Providers',
  'DataServ Technologies',
  'Municipal Services Inc.',
  'Elite Cleaning Services',
  'Infrastructure Partners',
  'Educational Resources Ltd.',
  'Quick Print Solutions',
  'Facility Management Corp.',
];

const beneficiaries = [
  'John Smith',
  'Jane Doe',
  'Robert Johnson',
  'Maria Garcia',
  'David Williams',
  'Sarah Brown',
  'Michael Davis',
  'Lisa Wilson',
  'James Taylor',
  'Jennifer Anderson',
  'William Thomas',
  'Patricia Martinez',
];

const generateBankAccount = (): string => {
  const prefix = ['ACH', 'WIR', 'CHK'][Math.floor(Math.random() * 3)];
  const number = Math.floor(Math.random() * 900000000) + 100000000;
  return `${prefix}-${number}`;
};

const generateDate = (startDate: Date, endDate: Date): string => {
  const start = startDate.getTime();
  const end = endDate.getTime();
  const randomTime = start + Math.random() * (end - start);
  return new Date(randomTime).toISOString().split('T')[0];
};

const generateAmount = (base: number, variance: number): number => {
  return Math.round(base + (Math.random() - 0.5) * variance * 2);
};

export const generateSampleData = (count: number = 200): Transaction[] => {
  const transactions: Transaction[] = [];
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2024-12-31');
  
  // Create some shared bank accounts for fraud detection
  const sharedBankAccounts = [
    generateBankAccount(),
    generateBankAccount(),
  ];
  
  // Generate normal transactions
  for (let i = 0; i < count * 0.7; i++) {
    const dept = departments[Math.floor(Math.random() * departments.length)];
    const baseAmount = dept === 'Public Works' ? 50000 : 
                       dept === 'Health Services' ? 30000 :
                       dept === 'Education' ? 25000 : 15000;
    
    transactions.push({
      id: `TXN-${String(i + 1).padStart(6, '0')}`,
      amount: generateAmount(baseAmount, baseAmount * 0.5),
      date: generateDate(startDate, endDate),
      department: dept,
      vendor: vendors[Math.floor(Math.random() * vendors.length)],
      beneficiary: beneficiaries[Math.floor(Math.random() * beneficiaries.length)],
      bankAccount: generateBankAccount(),
      description: `Standard payment for services rendered`,
    });
  }
  
  // Generate suspicious transactions
  
  // Duplicate payments (same vendor, amount, date)
  for (let i = 0; i < 5; i++) {
    const date = generateDate(startDate, endDate);
    const vendor = vendors[Math.floor(Math.random() * vendors.length)];
    const amount = generateAmount(25000, 5000);
    const dept = departments[Math.floor(Math.random() * departments.length)];
    
    transactions.push({
      id: `TXN-DUP-${String(i + 1).padStart(3, '0')}-A`,
      amount,
      date,
      department: dept,
      vendor,
      beneficiary: beneficiaries[Math.floor(Math.random() * beneficiaries.length)],
      bankAccount: generateBankAccount(),
      description: `Duplicate payment suspect`,
    });
    
    transactions.push({
      id: `TXN-DUP-${String(i + 1).padStart(3, '0')}-B`,
      amount,
      date,
      department: dept,
      vendor,
      beneficiary: beneficiaries[Math.floor(Math.random() * beneficiaries.length)],
      bankAccount: generateBankAccount(),
      description: `Duplicate payment suspect`,
    });
  }
  
  // Excessive amounts (>3x department average)
  for (let i = 0; i < 8; i++) {
    const dept = departments[Math.floor(Math.random() * departments.length)];
    const baseAmount = dept === 'Public Works' ? 50000 : 
                       dept === 'Health Services' ? 30000 :
                       dept === 'Education' ? 25000 : 15000;
    
    transactions.push({
      id: `TXN-EXC-${String(i + 1).padStart(3, '0')}`,
      amount: baseAmount * 4 + Math.random() * baseAmount,
      date: generateDate(startDate, endDate),
      department: dept,
      vendor: vendors[Math.floor(Math.random() * vendors.length)],
      beneficiary: beneficiaries[Math.floor(Math.random() * beneficiaries.length)],
      bankAccount: generateBankAccount(),
      description: `Large contract payment`,
    });
  }
  
  // Shared bank accounts with multiple beneficiaries
  for (let i = 0; i < 6; i++) {
    const bankAccount = sharedBankAccounts[i % 2];
    transactions.push({
      id: `TXN-SHR-${String(i + 1).padStart(3, '0')}`,
      amount: generateAmount(20000, 10000),
      date: generateDate(startDate, endDate),
      department: departments[Math.floor(Math.random() * departments.length)],
      vendor: vendors[Math.floor(Math.random() * vendors.length)],
      beneficiary: beneficiaries[i % beneficiaries.length],
      bankAccount,
      description: `Shared bank account suspect`,
    });
  }
  
  // High frequency vendor payments (multiple in same week)
  const frequentVendor = 'Premier Consulting Group';
  const weekStart = new Date('2024-06-10');
  for (let i = 0; i < 5; i++) {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    
    transactions.push({
      id: `TXN-FRQ-${String(i + 1).padStart(3, '0')}`,
      amount: generateAmount(15000, 5000),
      date: date.toISOString().split('T')[0],
      department: 'IT Services',
      vendor: frequentVendor,
      beneficiary: 'James Taylor',
      bankAccount: generateBankAccount(),
      description: `Rapid payment sequence`,
    });
  }
  
  // Transaction spikes (many on same day)
  const spikeDate = '2024-09-30';
  for (let i = 0; i < 15; i++) {
    transactions.push({
      id: `TXN-SPK-${String(i + 1).padStart(3, '0')}`,
      amount: generateAmount(12000, 5000),
      date: spikeDate,
      department: departments[Math.floor(Math.random() * departments.length)],
      vendor: vendors[Math.floor(Math.random() * vendors.length)],
      beneficiary: beneficiaries[Math.floor(Math.random() * beneficiaries.length)],
      bankAccount: generateBankAccount(),
      description: `End of quarter rush`,
    });
  }
  
  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const generateSampleCSV = (): string => {
  const transactions = generateSampleData(150);
  
  const headers = ['id', 'amount', 'date', 'department', 'vendor', 'beneficiary', 'bank_account', 'description'];
  const rows = transactions.map(t => [
    t.id,
    t.amount.toString(),
    t.date,
    t.department,
    t.vendor,
    t.beneficiary,
    t.bankAccount,
    t.description || '',
  ].map(v => `"${v}"`).join(','));
  
  return [headers.join(','), ...rows].join('\n');
};

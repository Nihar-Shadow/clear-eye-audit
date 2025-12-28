import { useState, useCallback } from 'react';
import { Transaction, DashboardStats, CaseNote } from '@/types/fraud';
import { analyzeDataset } from '@/lib/riskScoring';
import Header from '@/components/Header';
import FileUpload from '@/components/FileUpload';
import Dashboard from '@/components/Dashboard';
import TransactionTable from '@/components/TransactionTable';
import ExplainabilityPanel from '@/components/ExplainabilityPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Table2, Upload, Shield, Zap, Brain } from 'lucide-react';

const Index = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [activeTab, setActiveTab] = useState('upload');

  const handleDataLoaded = useCallback((rawTransactions: Transaction[]) => {
    const { transactions: analyzed, stats: newStats } = analyzeDataset(rawTransactions);
    setTransactions(analyzed);
    setStats(newStats);
    setActiveTab('dashboard');
  }, []);

  const handleUpdateCase = useCallback((
    transactionId: string,
    status: Transaction['caseStatus'],
    note: CaseNote
  ) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === transactionId) {
        return {
          ...t,
          caseStatus: status,
          reviewerNotes: [...(t.reviewerNotes || []), note],
        };
      }
      return t;
    }));

    // Update the selected transaction too
    setSelectedTransaction(prev => {
      if (prev?.id === transactionId) {
        return {
          ...prev,
          caseStatus: status,
          reviewerNotes: [...(prev.reviewerNotes || []), note],
        };
      }
      return prev;
    });
  }, []);

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <Header criticalAlerts={stats?.criticalAlerts} />
      
      <main className="container mx-auto px-6 py-8">
        {/* Hero Section when no data */}
        {transactions.length === 0 && (
          <div className="mb-12 text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">AI-Powered Fraud Detection</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Detect Anomalies in{' '}
              <span className="text-gradient">Public Transactions</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Upload government transaction data and let our AI identify potential fraud, 
              duplicate payments, and suspicious patterns with full explainability.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12">
              <div className="p-6 bg-card/50 rounded-lg border border-border">
                <Brain className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold mb-2">AI Anomaly Detection</h3>
                <p className="text-sm text-muted-foreground">
                  Isolation Forest algorithm identifies outliers in your data
                </p>
              </div>
              <div className="p-6 bg-card/50 rounded-lg border border-border">
                <Zap className="w-8 h-8 text-risk-review mb-3" />
                <h3 className="font-semibold mb-2">5 Fraud Rules</h3>
                <p className="text-sm text-muted-foreground">
                  Duplicate payments, excessive amounts, shared accounts & more
                </p>
              </div>
              <div className="p-6 bg-card/50 rounded-lg border border-border">
                <Shield className="w-8 h-8 text-risk-normal mb-3" />
                <h3 className="font-semibold mb-2">Full Explainability</h3>
                <p className="text-sm text-muted-foreground">
                  Understand exactly why each transaction was flagged
                </p>
              </div>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Data
            </TabsTrigger>
            <TabsTrigger 
              value="dashboard" 
              disabled={transactions.length === 0}
              className="flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="transactions" 
              disabled={transactions.length === 0}
              className="flex items-center gap-2"
            >
              <Table2 className="w-4 h-4" />
              Transactions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="animate-fade-in">
            <div className="max-w-2xl mx-auto">
              <FileUpload onDataLoaded={handleDataLoaded} />
            </div>
          </TabsContent>

          <TabsContent value="dashboard" className="animate-fade-in">
            {stats && <Dashboard stats={stats} />}
          </TabsContent>

          <TabsContent value="transactions" className="animate-fade-in">
            <div className="flex gap-6">
              <div className={selectedTransaction ? 'flex-1' : 'w-full'}>
                <TransactionTable
                  transactions={transactions}
                  onSelectTransaction={setSelectedTransaction}
                />
              </div>
              
              {selectedTransaction && (
                <div className="w-[450px] flex-shrink-0">
                  <ExplainabilityPanel
                    transaction={selectedTransaction}
                    onClose={() => setSelectedTransaction(null)}
                    onUpdateCase={handleUpdateCase}
                  />
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border py-6 mt-12">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>FraudShield AI • Public Transaction Anomaly Detection System</p>
          <p className="mt-1">Demo for Government Audit Hackathon 2024</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

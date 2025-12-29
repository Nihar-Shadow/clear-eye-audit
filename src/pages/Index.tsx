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
          <div className="mb-16 text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary/10 rounded-full mb-8 border border-primary/20 animated-border">
              <Shield className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm font-semibold tracking-wide">AI-Powered Fraud Detection</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight leading-tight">
              Detect Anomalies in{' '}
              <span className="text-gradient block mt-2">Public Transactions</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
              Upload government transaction data and let our AI identify potential fraud, 
              duplicate payments, and suspicious patterns with full explainability.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-16">
              <div className="feature-card group animate-slide-up" style={{ animationDelay: '100ms' }}>
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Brain className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">AI Anomaly Detection</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Isolation Forest algorithm identifies statistical outliers and unusual patterns in your transaction data
                </p>
              </div>
              <div className="feature-card group animate-slide-up" style={{ animationDelay: '200ms' }}>
                <div className="w-14 h-14 rounded-xl bg-risk-review/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-7 h-7 text-risk-review" />
                </div>
                <h3 className="text-lg font-semibold mb-2">5 Fraud Rules</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Duplicate payments, excessive amounts, shared bank accounts, high-frequency vendors & more
                </p>
              </div>
              <div className="feature-card group animate-slide-up" style={{ animationDelay: '300ms' }}>
                <div className="w-14 h-14 rounded-xl bg-risk-normal/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-7 h-7 text-risk-normal" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Full Explainability</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Understand exactly why each transaction was flagged with clear, human-readable explanations
                </p>
              </div>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-muted/30 p-1.5 backdrop-blur-sm border border-border/50 rounded-xl">
            <TabsTrigger value="upload" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200">
              <Upload className="w-4 h-4" />
              Upload Data
            </TabsTrigger>
            <TabsTrigger 
              value="dashboard" 
              disabled={transactions.length === 0}
              className="flex items-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
            >
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="transactions" 
              disabled={transactions.length === 0}
              className="flex items-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
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
      <footer className="border-t border-border/50 py-8 mt-16 bg-card/30">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-semibold">FraudShield AI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Public Transaction Anomaly Detection System
          </p>
          <p className="text-xs text-muted-foreground/60 mt-2">
            Demo for Government Audit Hackathon 2024
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

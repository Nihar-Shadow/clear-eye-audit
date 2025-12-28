import { Transaction, CaseNote } from '@/types/fraud';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  X, 
  AlertTriangle, 
  Brain, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  Clock,
  User,
  FileCheck,
  AlertCircle,
  ArrowUpCircle
} from 'lucide-react';
import { useState } from 'react';

interface ExplainabilityPanelProps {
  transaction: Transaction;
  onClose: () => void;
  onUpdateCase: (transactionId: string, status: Transaction['caseStatus'], note: CaseNote) => void;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getRiskColor = (level: string) => {
  switch (level) {
    case 'critical':
      return 'text-risk-critical';
    case 'review':
      return 'text-risk-review';
    default:
      return 'text-risk-normal';
  }
};

const ExplainabilityPanel = ({ transaction, onClose, onUpdateCase }: ExplainabilityPanelProps) => {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStatusChange = async (status: Transaction['caseStatus']) => {
    if (!comment.trim() && status !== 'under_review') {
      return;
    }
    
    setIsSubmitting(true);
    
    const note: CaseNote = {
      id: `NOTE-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: status === 'under_review' ? 'Marked for Review' :
              status === 'cleared' ? 'Cleared' :
              status === 'escalated' ? 'Escalated' : 'Updated',
      comment: comment.trim() || 'Status updated',
      reviewer: 'Auditor',
    };
    
    onUpdateCase(transaction.id, status, note);
    setComment('');
    setIsSubmitting(false);
  };

  const triggeredRules = transaction.ruleViolations?.filter(r => r.triggered) || [];
  const passedRules = transaction.ruleViolations?.filter(r => !r.triggered) || [];

  return (
    <Card className="glass-panel h-full flex flex-col animate-slide-up">
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Transaction Analysis
            </CardTitle>
            <CardDescription className="mt-1">
              {transaction.id} • {transaction.date}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-6">
            {/* Transaction Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase mb-1">Amount</p>
                <p className="text-xl font-bold">{formatCurrency(transaction.amount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase mb-1">Risk Score</p>
                <p className={`text-xl font-bold ${getRiskColor(transaction.riskLevel || 'normal')}`}>
                  {transaction.riskScore}/100
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase mb-1">Department</p>
                <p className="font-medium">{transaction.department}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase mb-1">Vendor</p>
                <p className="font-medium">{transaction.vendor}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase mb-1">Beneficiary</p>
                <p className="font-medium">{transaction.beneficiary}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase mb-1">Bank Account</p>
                <p className="font-mono text-sm">{transaction.bankAccount}</p>
              </div>
            </div>

            <Separator />

            {/* Risk Score Breakdown */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                Risk Score Breakdown
              </h4>
              <div className="space-y-2 bg-muted/30 rounded-lg p-4">
                <div className="flex justify-between text-sm">
                  <span>AI Anomaly Score (60%)</span>
                  <span className="font-mono">{transaction.aiScore} × 0.6 = {Math.round((transaction.aiScore || 0) * 0.6)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Rule Violations Score (40%)</span>
                  <span className="font-mono">
                    {triggeredRules.length} violations = {Math.round((triggeredRules.length / 5) * 100 * 0.4)}
                  </span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-medium">
                  <span>Combined Risk Score</span>
                  <span className={getRiskColor(transaction.riskLevel || 'normal')}>
                    {transaction.riskScore}/100
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Rule Violations */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-risk-review" />
                Rule-Based Detection ({triggeredRules.length} triggered)
              </h4>
              <div className="space-y-3">
                {triggeredRules.map((rule, idx) => (
                  <div key={idx} className="p-3 bg-risk-critical/10 border border-risk-critical/30 rounded-lg">
                    <div className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-risk-critical mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">{rule.ruleName}</p>
                        <p className="text-sm text-muted-foreground mt-1">{rule.explanation}</p>
                        <Badge variant="outline" className="mt-2 text-xs">
                          Severity: {rule.severity}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
                
                {passedRules.length > 0 && (
                  <details className="mt-2">
                    <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                      Show {passedRules.length} passed rules
                    </summary>
                    <div className="mt-2 space-y-2">
                      {passedRules.map((rule, idx) => (
                        <div key={idx} className="p-2 bg-muted/30 rounded-lg flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-risk-normal" />
                          <span className="text-sm">{rule.ruleName}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>

            <Separator />

            {/* AI Explanation */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                AI Anomaly Analysis
              </h4>
              <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                <p className="text-sm">
                  The AI model assigned an anomaly score of <strong>{transaction.aiScore}/100</strong> based on:
                </p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                    <span>Transaction amount deviation from department average</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                    <span>Vendor transaction frequency patterns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                    <span>Bank account association analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                    <span>Temporal patterns (fiscal period analysis)</span>
                  </li>
                </ul>
              </div>
            </div>

            <Separator />

            {/* Case Actions */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Case Review Actions
              </h4>
              
              <div className="space-y-3">
                <Textarea
                  placeholder="Add reviewer notes..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-[80px]"
                />
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange('under_review')}
                    disabled={isSubmitting || transaction.caseStatus === 'under_review'}
                  >
                    <Clock className="w-4 h-4 mr-1" />
                    Mark Under Review
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleStatusChange('cleared')}
                    disabled={isSubmitting || !comment.trim()}
                  >
                    <FileCheck className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                  <Button
                    variant="critical"
                    size="sm"
                    onClick={() => handleStatusChange('escalated')}
                    disabled={isSubmitting || !comment.trim()}
                  >
                    <ArrowUpCircle className="w-4 h-4 mr-1" />
                    Escalate
                  </Button>
                </div>
              </div>
            </div>

            {/* Review History */}
            {transaction.reviewerNotes && transaction.reviewerNotes.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Review History
                  </h4>
                  <div className="space-y-3">
                    {transaction.reviewerNotes.map((note) => (
                      <div key={note.id} className="p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <User className="w-3 h-3" />
                          <span>{note.reviewer}</span>
                          <span>•</span>
                          <span>{new Date(note.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">{note.action}</Badge>
                        </div>
                        <p className="text-sm">{note.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ExplainabilityPanel;

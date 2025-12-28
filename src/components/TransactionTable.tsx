import { useState, useMemo } from 'react';
import { Transaction } from '@/types/fraud';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Search, Filter, ArrowUpDown, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

interface TransactionTableProps {
  transactions: Transaction[];
  onSelectTransaction: (transaction: Transaction) => void;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getRiskBadge = (level: string) => {
  switch (level) {
    case 'critical':
      return <span className="risk-badge-critical">Critical</span>;
    case 'review':
      return <span className="risk-badge-review">Review</span>;
    default:
      return <span className="risk-badge-normal">Normal</span>;
  }
};

const getCaseStatusBadge = (status: string) => {
  switch (status) {
    case 'escalated':
      return <Badge variant="destructive">Escalated</Badge>;
    case 'under_review':
      return <Badge className="bg-risk-review text-black">Under Review</Badge>;
    case 'cleared':
      return <Badge className="bg-risk-normal text-black">Cleared</Badge>;
    default:
      return <Badge variant="secondary">Pending</Badge>;
  }
};

const TransactionTable = ({ transactions, onSelectTransaction }: TransactionTableProps) => {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof Transaction>('riskScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const departments = useMemo(() => {
    const depts = new Set(transactions.map(t => t.department));
    return Array.from(depts).sort();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = 
        t.id.toLowerCase().includes(search.toLowerCase()) ||
        t.vendor.toLowerCase().includes(search.toLowerCase()) ||
        t.beneficiary.toLowerCase().includes(search.toLowerCase()) ||
        t.department.toLowerCase().includes(search.toLowerCase());
      
      const matchesRisk = riskFilter === 'all' || t.riskLevel === riskFilter;
      const matchesDept = departmentFilter === 'all' || t.department === departmentFilter;
      
      return matchesSearch && matchesRisk && matchesDept;
    });
  }, [transactions, search, riskFilter, departmentFilter]);

  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      const aStr = String(aVal || '');
      const bStr = String(bVal || '');
      return sortOrder === 'asc' 
        ? aStr.localeCompare(bStr) 
        : bStr.localeCompare(aStr);
    });
  }, [filteredTransactions, sortField, sortOrder]);

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedTransactions.slice(start, start + itemsPerPage);
  }, [sortedTransactions, currentPage]);

  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);

  const handleSort = (field: keyof Transaction) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <Card className="glass-panel">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span>Transaction Analysis</span>
          <Badge variant="outline">{sortedTransactions.length} results</Badge>
        </CardTitle>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-3 pt-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Risk Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risks</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-[120px]">
                  <Button variant="ghost" size="sm" onClick={() => handleSort('id')}>
                    ID <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('date')}>
                    Date <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('amount')}>
                    Amount <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-center">
                  <Button variant="ghost" size="sm" onClick={() => handleSort('riskScore')}>
                    Risk Score <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="w-[80px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTransactions.map((transaction) => (
                <TableRow 
                  key={transaction.id} 
                  className="data-table-row cursor-pointer"
                  onClick={() => onSelectTransaction(transaction)}
                >
                  <TableCell className="font-mono text-xs">{transaction.id}</TableCell>
                  <TableCell className="text-sm">{transaction.date}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(transaction.amount)}</TableCell>
                  <TableCell className="text-sm">{transaction.department}</TableCell>
                  <TableCell className="text-sm max-w-[150px] truncate">{transaction.vendor}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-bold">{transaction.riskScore}</span>
                      {getRiskBadge(transaction.riskLevel || 'normal')}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {getCaseStatusBadge(transaction.caseStatus || 'pending')}
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTransaction(transaction);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, sortedTransactions.length)} of{' '}
              {sortedTransactions.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm px-3">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionTable;

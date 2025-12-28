import { useState, useCallback } from 'react';
import { Upload, FileText, Check, AlertCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ColumnMapping, Transaction } from '@/types/fraud';
import { generateSampleCSV } from '@/lib/sampleData';
import { toast } from 'sonner';

interface FileUploadProps {
  onDataLoaded: (transactions: Transaction[]) => void;
}

const FileUpload = ({ onDataLoaded }: FileUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Partial<ColumnMapping>>({});
  const [step, setStep] = useState<'upload' | 'mapping' | 'complete'>('upload');
  const [dragActive, setDragActive] = useState(false);

  const requiredFields: (keyof ColumnMapping)[] = [
    'amount',
    'date',
    'department',
    'vendor',
    'beneficiary',
    'bankAccount',
  ];

  const parseCSV = (text: string): { headers: string[]; data: Record<string, string>[] } => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    
    const data = lines.slice(1).map(line => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      
      const row: Record<string, string> = {};
      headers.forEach((header, i) => {
        row[header] = values[i] || '';
      });
      return row;
    });
    
    return { headers, data };
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFile = async (uploadedFile: File) => {
    if (!uploadedFile.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }
    
    setFile(uploadedFile);
    const text = await uploadedFile.text();
    const { headers, data } = parseCSV(text);
    
    setCsvHeaders(headers);
    setCsvData(data);
    
    // Auto-detect common column names
    const autoMapping: Partial<ColumnMapping> = {};
    headers.forEach(header => {
      const lower = header.toLowerCase();
      if (lower.includes('amount') || lower.includes('value')) autoMapping.amount = header;
      if (lower.includes('date')) autoMapping.date = header;
      if (lower.includes('department') || lower.includes('dept')) autoMapping.department = header;
      if (lower.includes('vendor') || lower.includes('supplier')) autoMapping.vendor = header;
      if (lower.includes('beneficiary') || lower.includes('recipient')) autoMapping.beneficiary = header;
      if (lower.includes('bank') || lower.includes('account')) autoMapping.bankAccount = header;
      if (lower.includes('description') || lower.includes('desc')) autoMapping.description = header;
    });
    
    setMapping(autoMapping);
    setStep('mapping');
    toast.success(`Loaded ${data.length} rows from ${uploadedFile.name}`);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const processData = () => {
    // Validate all required fields are mapped
    const missingFields = requiredFields.filter(field => !mapping[field]);
    if (missingFields.length > 0) {
      toast.error(`Please map all required fields: ${missingFields.join(', ')}`);
      return;
    }

    const transactions: Transaction[] = csvData.map((row, index) => ({
      id: `TXN-${String(index + 1).padStart(6, '0')}`,
      amount: parseFloat(row[mapping.amount!]) || 0,
      date: row[mapping.date!],
      department: row[mapping.department!],
      vendor: row[mapping.vendor!],
      beneficiary: row[mapping.beneficiary!],
      bankAccount: row[mapping.bankAccount!],
      description: mapping.description ? row[mapping.description] : undefined,
    }));

    // Validate data
    const invalidRows = transactions.filter(t => 
      isNaN(t.amount) || !t.date || !t.department || !t.vendor
    );

    if (invalidRows.length > 0) {
      toast.warning(`${invalidRows.length} rows have missing or invalid data`);
    }

    const validTransactions = transactions.filter(t => 
      !isNaN(t.amount) && t.date && t.department && t.vendor
    );

    onDataLoaded(validTransactions);
    setStep('complete');
    toast.success(`Successfully processed ${validTransactions.length} transactions`);
  };

  const downloadSampleCSV = () => {
    const csvContent = generateSampleCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Sample CSV downloaded');
  };

  const loadSampleData = () => {
    const csvContent = generateSampleCSV();
    const { headers, data } = parseCSV(csvContent);
    
    setCsvHeaders(headers);
    setCsvData(data);
    setFile(new File([csvContent], 'sample_transactions.csv', { type: 'text/csv' }));
    
    // Set mapping for sample data
    setMapping({
      amount: 'amount',
      date: 'date',
      department: 'department',
      vendor: 'vendor',
      beneficiary: 'beneficiary',
      bankAccount: 'bank_account',
      description: 'description',
    });
    
    setStep('mapping');
    toast.success('Sample data loaded - review mapping and proceed');
  };

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Data Ingestion
        </CardTitle>
        <CardDescription>
          Upload transaction data for fraud analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'upload' && (
          <div className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                dragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">
                Drag & drop your CSV file here
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                or click to browse
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button variant="outline" className="cursor-pointer" asChild>
                  <span>Select File</span>
                </Button>
              </label>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-sm text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            
            <div className="flex gap-3 justify-center">
              <Button variant="secondary" onClick={loadSampleData}>
                <FileText className="w-4 h-4 mr-2" />
                Load Sample Data
              </Button>
              <Button variant="ghost" onClick={downloadSampleCSV}>
                <Download className="w-4 h-4 mr-2" />
                Download Sample CSV
              </Button>
            </div>
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">{file?.name}</span>
              <span className="text-sm text-muted-foreground">
                ({csvData.length} rows, {csvHeaders.length} columns)
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {requiredFields.map(field => (
                <div key={field} className="space-y-2">
                  <Label className="flex items-center gap-2">
                    {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    <span className="text-risk-critical">*</span>
                    {mapping[field] && (
                      <Check className="w-4 h-4 text-risk-normal" />
                    )}
                  </Label>
                  <Select
                    value={mapping[field] || ''}
                    onValueChange={(value) => setMapping(prev => ({ ...prev, [field]: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column..." />
                    </SelectTrigger>
                    <SelectContent>
                      {csvHeaders.map(header => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Description
                  <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Select
                  value={mapping.description || '__none__'}
                  onValueChange={(value) => setMapping(prev => ({ ...prev, description: value === '__none__' ? undefined : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select column..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {csvHeaders.map(header => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setStep('upload');
                  setFile(null);
                  setCsvHeaders([]);
                  setCsvData([]);
                  setMapping({});
                }}
              >
                Back
              </Button>
              <Button onClick={processData} className="flex-1">
                Analyze Transactions
              </Button>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-risk-normal/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-risk-normal" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Data Loaded Successfully</h3>
            <p className="text-muted-foreground mb-4">
              {csvData.length} transactions are ready for analysis
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setStep('upload');
                setFile(null);
                setCsvHeaders([]);
                setCsvData([]);
                setMapping({});
              }}
            >
              Upload New File
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileUpload;


import React, { useState } from 'react';
import { Upload, FileSpreadsheet, FileJson, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveInventory, saveSales, addHistory } from '../db/database';
import { InventoryItem, SaleRecord, ProcessingHistory } from '../types';

export const DataBridge: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastStatus, setLastStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'inventory' | 'sales') => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    setLastStatus(null);
    try {
      const reader = new FileReader();
      if (type === 'inventory' && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
        reader.onload = async (e) => {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]) as any[];
          const items: InventoryItem[] = jsonData.map((row, idx) => ({
            id: row.id || `ITEM-${idx}-${Date.now()}`,
            sku: String(row.sku || row.SKU || ''),
            name: String(row.name || row.Name || 'Unknown Product'),
            category: String(row.category || row.Category || 'General'),
            price: Number(row.price || row.Price || 0),
            cost: Number(row.cost || row.Cost || 0),
            stock: Number(row.stock || row.Stock || 0),
            minStock: Number(row.minStock || row.MinStock || 12),
            updatedAt: new Date().toISOString()
          }));
          await saveInventory(items);
          await addHistory({ id: crypto.randomUUID(), fileName: file.name, type: 'inventory', timestamp: new Date().toISOString(), status: 'success', recordsProcessed: items.length });
          setLastStatus({ type: 'success', message: `SUCCESS: INGESTED ${items.length} ASSETS` });
          setIsProcessing(false);
        };
        reader.readAsArrayBuffer(file);
      } else if (type === 'sales' && file.name.endsWith('.json')) {
        reader.onload = async (e) => {
          const records: SaleRecord[] = JSON.parse(e.target?.result as string).map((row: any, idx: number) => ({
            id: row.id || `SALE-${idx}-${Date.now()}`,
            date: row.date || new Date().toISOString(),
            amount: Number(row.amount || 0),
            itemsCount: Number(row.itemsCount || 0),
            type: row.type || 'retail'
          }));
          await saveSales(records);
          await addHistory({ id: crypto.randomUUID(), fileName: file.name, type: 'sales', timestamp: new Date().toISOString(), status: 'success', recordsProcessed: records.length });
          setLastStatus({ type: 'success', message: `SUCCESS: INGESTED ${records.length} TRANSACTIONS` });
          setIsProcessing(false);
        };
        reader.readAsText(file);
      } else {
        throw new Error('Invalid format');
      }
    } catch (error) {
      setLastStatus({ type: 'error', message: 'CRITICAL: INGESTION FAILURE' });
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="text-center">
        <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Data Bridge</h2>
        <p className="text-text-muted font-bold text-xs uppercase tracking-[0.3em] mt-2">External Data Reconciliation Hub</p>
      </div>

      {lastStatus && (
        <div className={`p-6 rounded-2xl flex items-center gap-4 border shadow-2xl animate-in zoom-in-95 duration-300 ${
          lastStatus.type === 'success' ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-red-400/10 border-red-400/30 text-red-400'
        }`}>
          {lastStatus.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
          <span className="text-xs font-black uppercase tracking-widest">{lastStatus.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-surface p-10 rounded-[3rem] border border-accent-muted flex flex-col items-center text-center shadow-2xl group hover:border-accent transition-all">
          <div className="w-20 h-20 bg-accent/5 text-accent rounded-3xl flex items-center justify-center mb-8 border border-accent/20 transition-transform group-hover:scale-110">
            <FileSpreadsheet size={40} />
          </div>
          <h3 className="text-xl font-black text-white mb-3 uppercase tracking-tighter italic">Supplier Manifests</h3>
          <p className="text-xs text-text-muted font-semibold mb-10 leading-relaxed uppercase tracking-wider">
            Merge excel inventory records into the master catalog.
          </p>
          <label className={`w-full relative cursor-pointer ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}>
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => handleFileUpload(e, 'inventory')} />
            <div className="w-full py-5 bg-background border border-accent-muted/50 rounded-2xl flex items-center justify-center gap-3 hover:border-accent hover:shadow-[0_0_20px_rgba(196,181,253,0.1)] transition-all">
              {isProcessing ? <Loader2 className="animate-spin text-accent" /> : <Upload className="text-text-muted" size={24} />}
              <span className="text-xs font-black text-white uppercase tracking-widest">Select Manifest</span>
            </div>
          </label>
        </div>

        <div className="bg-surface p-10 rounded-[3rem] border border-accent-muted flex flex-col items-center text-center shadow-2xl group hover:border-accent transition-all">
          <div className="w-20 h-20 bg-accent/5 text-accent rounded-3xl flex items-center justify-center mb-8 border border-accent/20 transition-transform group-hover:scale-110">
            <FileJson size={40} />
          </div>
          <h3 className="text-xl font-black text-white mb-3 uppercase tracking-tighter italic">Terminal Reports</h3>
          <p className="text-xs text-text-muted font-semibold mb-10 leading-relaxed uppercase tracking-wider">
            Reconcile daily POS outputs with BOH accounting.
          </p>
          <label className={`w-full relative cursor-pointer ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}>
            <input type="file" accept=".json" className="hidden" onChange={(e) => handleFileUpload(e, 'sales')} />
            <div className="w-full py-5 bg-background border border-accent-muted/50 rounded-2xl flex items-center justify-center gap-3 hover:border-accent hover:shadow-[0_0_20px_rgba(196,181,253,0.1)] transition-all">
              {isProcessing ? <Loader2 className="animate-spin text-accent" /> : <Upload className="text-text-muted" size={24} />}
              <span className="text-xs font-black text-white uppercase tracking-widest">Select POS Export</span>
            </div>
          </label>
        </div>
      </div>

      <div className="bg-background/50 border border-accent-muted p-8 rounded-[2rem] flex flex-col md:flex-row gap-8">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-accent text-background rounded-lg">
              {/* Added ShieldCheck to imports to fix "Cannot find name 'ShieldCheck'" error */}
              <ShieldCheck size={20} />
            </div>
            <h4 className="font-black text-white text-sm uppercase tracking-widest">Security Protocol</h4>
          </div>
          <p className="text-xs text-text-muted font-bold leading-relaxed uppercase tracking-wider">
            Hardware input sync active. All processing occurs within an isolated sandboxed session. Local database persistence ensures zero-latency operation.
          </p>
        </div>
        <div className="flex gap-4">
            <div className="h-2 w-2 rounded-full bg-accent animate-pulse"></div>
            <div className="h-2 w-2 rounded-full bg-accent animate-pulse delay-75"></div>
            <div className="h-2 w-2 rounded-full bg-accent animate-pulse delay-150"></div>
        </div>
      </div>
    </div>
  );
};

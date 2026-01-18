
import React, { useEffect, useState, useMemo } from 'react';
import { DollarSign, Package, TrendingUp, AlertTriangle, FileCheck, FileX } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getInventory, getSales, getHistory } from '../db/database';
import { InventoryItem, SaleRecord, ProcessingHistory } from '../types';

const KPICard: React.FC<{ title: string; value: string; trend: string; icon: React.ReactNode; isWarning?: boolean }> = ({ title, value, trend, icon, isWarning }) => (
  <div className="bg-surface p-6 rounded-[2rem] border border-accent-muted shadow-lg hover:border-accent transition-all">
    <div className="flex items-center justify-between mb-4">
      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${isWarning ? 'bg-amber-400/10 text-amber-400' : 'bg-accent/10 text-accent'}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
        isWarning ? 'text-amber-400 bg-amber-400/5' : 'text-accent bg-accent/5'
      }`}>{trend}</span>
    </div>
    <h3 className="text-text-muted text-xs font-bold uppercase tracking-widest">{title}</h3>
    <p className="text-3xl font-black text-white mt-1">{value}</p>
  </div>
);

export const Dashboard: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [history, setHistory] = useState<ProcessingHistory[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const [inv, sls, hist] = await Promise.all([getInventory(), getSales(), getHistory()]);
      setInventory(inv);
      setSales(sls);
      setHistory(hist.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5));
    };
    loadData();
  }, []);

  const totalStockValue = inventory.reduce((sum, item) => sum + (item.cost * item.stock), 0);
  const lowStockCount = inventory.filter(i => i.stock <= i.minStock).length;
  const totalSalesOverall = sales.reduce((sum, s) => sum + s.amount, 0);

  const chartData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        dateStr: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        sales: 0
      });
    }
    sales.forEach(sale => {
      const saleDate = sale.date.split('T')[0];
      const entry = days.find(d => d.dateStr === saleDate);
      if (entry) entry.sales += sale.amount;
    });
    return days.map(d => ({ name: d.label.toUpperCase(), sales: d.sales }));
  }, [sales]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Stock Value" 
          value={`$${totalStockValue.toLocaleString()}`} 
          trend="Live" 
          icon={<DollarSign size={24} />} 
        />
        <KPICard 
          title="Inventory Items" 
          value={inventory.length.toLocaleString()} 
          trend="Unique" 
          icon={<Package size={24} />} 
        />
        <KPICard 
          title="Revenue Mix" 
          value={`$${totalSalesOverall.toLocaleString()}`} 
          trend="Total" 
          icon={<TrendingUp size={24} />} 
        />
        <KPICard 
          title="Stock Alerts" 
          value={lowStockCount.toString()} 
          trend={lowStockCount > 0 ? "Alert" : "Clean"} 
          icon={<AlertTriangle size={24} />}
          isWarning={lowStockCount > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-surface p-8 rounded-[2rem] border border-accent-muted shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-white text-xl uppercase tracking-tighter italic">Store Flow Metrics</h3>
            <span className="text-[10px] font-black text-accent bg-accent/5 px-3 py-1 rounded-full uppercase tracking-widest border border-accent/20">7-Day Analysis</span>
          </div>
          <div className="h-80 w-full">
            {sales.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c4b5fd" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#c4b5fd" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#8e8a94', fontSize: 10, fontWeight: 'bold'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#8e8a94', fontSize: 10, fontWeight: 'bold'}} dx={-10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#242029', borderRadius: '16px', border: '1px solid #4c4452', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
                    itemStyle={{ color: '#c4b5fd', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#c4b5fd" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-text-muted border-2 border-dashed border-accent-muted rounded-[2rem]">
                <TrendingUp size={48} className="mb-4 opacity-10" />
                <p className="text-sm font-bold uppercase tracking-widest">No transaction flow detected</p>
                <p className="text-xs opacity-50 mt-1">Ingest POS reports to visualize data</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-surface p-8 rounded-[2rem] border border-accent-muted shadow-xl">
          <h3 className="font-black text-white text-xl mb-8 uppercase tracking-tighter italic">Audit Log</h3>
          <div className="space-y-6">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-text-muted">
                <FileCheck size={48} className="mb-4 opacity-10" />
                <p className="text-[10px] font-black uppercase tracking-widest text-center">System awaiting first sync</p>
              </div>
            ) : (
              history.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 rounded-2xl bg-background/50 border border-accent-muted/30 hover:border-accent/30 transition-all">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${item.status === 'success' ? 'bg-accent/10 text-accent' : 'bg-red-400/10 text-red-400'}`}>
                    {item.status === 'success' ? <FileCheck size={20} /> : <FileX size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-white truncate" title={item.fileName}>{item.fileName}</p>
                    <p className="text-[10px] text-accent font-bold uppercase tracking-wider">
                      {item.type} • {item.recordsProcessed} ITEMS
                    </p>
                    <p className="text-[10px] text-text-muted mt-1 font-medium">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

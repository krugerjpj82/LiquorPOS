
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getSales, getInventory } from '../db/database';
import { SaleRecord, InventoryItem } from '../types';

const COLORS = ['#c4b5fd', '#8b5cf6', '#4c4452', '#242029', '#1a161f'];

export const Reports: React.FC = () => {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  useEffect(() => {
    const load = async () => {
      const [s, i] = await Promise.all([getSales(), getInventory()]);
      setSales(s);
      setInventory(i);
    };
    load();
  }, []);

  const categoryDistribution = inventory.reduce((acc: any[], item) => {
    const existing = acc.find(a => a.name === item.category);
    if (existing) existing.value++;
    else acc.push({ name: item.category.toUpperCase(), value: 1 });
    return acc;
  }, []).sort((a, b) => b.value - a.value).slice(0, 5);

  const salesByType = [
    { name: 'RETAIL', value: sales.filter(s => s.type === 'retail').reduce((sum, s) => sum + s.amount, 0) },
    { name: 'WHOLESALE', value: sales.filter(s => s.type === 'wholesale').reduce((sum, s) => sum + s.amount, 0) }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Audit Intelligence</h2>
          <p className="text-text-muted font-bold text-xs uppercase tracking-[0.3em] mt-1">Strategic Asset & Performance Reporting</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-surface p-8 rounded-[2rem] border border-accent-muted shadow-2xl">
          <h3 className="font-black text-white text-lg mb-8 uppercase tracking-tighter italic">Asset Concentration</h3>
          <div className="h-80 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: '#242029', borderRadius: '16px', border: '1px solid #4c4452', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface p-8 rounded-[2rem] border border-accent-muted shadow-2xl">
          <h3 className="font-black text-white text-lg mb-8 uppercase tracking-tighter italic">Revenue Classification</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByType}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff08" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#8e8a94', fontSize: 10, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#8e8a94', fontSize: 10, fontWeight: 'bold'}} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.03)'}} contentStyle={{ backgroundColor: '#242029', borderRadius: '16px', border: '1px solid #4c4452' }} />
                <Bar dataKey="value" fill="#c4b5fd" radius={[12, 12, 0, 0]} barSize={80} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-surface p-8 rounded-[2rem] border border-accent-muted shadow-2xl">
        <h3 className="font-black text-white text-lg mb-8 uppercase tracking-tighter italic">Inventory Criticality Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-background/50 border border-accent-muted/30 rounded-2xl group hover:border-accent transition-all">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4">Top Valuation Assets</p>
            <div className="space-y-4">
              {inventory.sort((a, b) => (b.cost * b.stock) - (a.cost * a.stock)).slice(0, 3).map(item => (
                <div key={item.id} className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-[11px] font-black text-white uppercase truncate mr-2">{item.name}</span>
                  <span className="text-xs font-mono font-black text-accent">${(item.cost * item.stock).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-6 bg-background/50 border border-accent-muted/30 rounded-2xl group hover:border-accent transition-all">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4">High-Velocity Stock</p>
            <div className="space-y-4">
              {inventory.sort((a, b) => b.stock - a.stock).slice(0, 3).map(item => (
                <div key={item.id} className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-[11px] font-black text-white uppercase truncate mr-2">{item.name}</span>
                  <span className="text-xs font-black text-white uppercase">{item.stock} Units</span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-6 bg-background/50 border border-accent-muted/30 rounded-2xl group hover:border-accent transition-all">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4">Gross Margin Alpha</p>
            <div className="space-y-4">
              {inventory.sort((a, b) => (b.price - b.cost) - (a.price - a.cost)).slice(0, 3).map(item => (
                <div key={item.id} className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-[11px] font-black text-white uppercase truncate mr-2">{item.name}</span>
                  <span className="text-xs font-mono font-black text-emerald-400">+${(item.price - item.cost).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

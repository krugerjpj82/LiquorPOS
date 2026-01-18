
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Plus, MoreHorizontal, AlertCircle, PackageSearch, X } from 'lucide-react';
import { getInventory, saveInventory } from '../db/database';
import { InventoryItem } from '../types';

interface AddSkuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: InventoryItem) => void;
}

const AddSkuModal: React.FC<AddSkuModalProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: '',
    price: '',
    cost: '',
    stock: '',
    minStock: '12'
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: InventoryItem = {
      id: crypto.randomUUID(),
      sku: formData.sku,
      name: formData.name,
      category: formData.category || 'General',
      price: parseFloat(formData.price) || 0,
      cost: parseFloat(formData.cost) || 0,
      stock: parseInt(formData.stock) || 0,
      minStock: parseInt(formData.minStock) || 12,
      updatedAt: new Date().toISOString()
    };
    onSave(newItem);
    setFormData({ sku: '', name: '', category: '', price: '', cost: '', stock: '', minStock: '12' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-2xl rounded-[2.5rem] border border-accent-muted shadow-2xl overflow-hidden flex flex-col">
        <div className="p-8 border-b border-accent-muted/30 flex justify-between items-center">
          <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Add New Asset</h3>
          <button onClick={onClose} className="p-2 hover:bg-background rounded-full text-text-muted hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">SKU Identification</label>
              <input 
                required
                type="text" 
                placeholder="SCAN OR ENTER SKU..."
                value={formData.sku}
                onChange={e => setFormData({...formData, sku: e.target.value})}
                className="w-full h-14 bg-background border border-accent-muted/50 rounded-2xl px-6 text-sm font-bold uppercase tracking-wider focus:border-accent outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Product Identity</label>
              <input 
                required
                type="text" 
                placeholder="PRODUCT NAME..."
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full h-14 bg-background border border-accent-muted/50 rounded-2xl px-6 text-sm font-bold uppercase tracking-wider focus:border-accent outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Category</label>
              <input 
                type="text" 
                placeholder="E.G. WHISKEY, WINE..."
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full h-14 bg-background border border-accent-muted/50 rounded-2xl px-6 text-sm font-bold uppercase tracking-wider focus:border-accent outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Current Stock Level</label>
              <input 
                required
                type="number" 
                placeholder="0"
                value={formData.stock}
                onChange={e => setFormData({...formData, stock: e.target.value})}
                className="w-full h-14 bg-background border border-accent-muted/50 rounded-2xl px-6 text-sm font-bold focus:border-accent outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Unit Cost ($)</label>
              <input 
                required
                type="number" 
                step="0.01"
                placeholder="0.00"
                value={formData.cost}
                onChange={e => setFormData({...formData, cost: e.target.value})}
                className="w-full h-14 bg-background border border-accent-muted/50 rounded-2xl px-6 text-sm font-bold focus:border-accent outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Retail Price ($)</label>
              <input 
                required
                type="number" 
                step="0.01"
                placeholder="0.00"
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})}
                className="w-full h-14 bg-background border border-accent-muted/50 rounded-2xl px-6 text-sm font-bold focus:border-accent outline-none transition-all"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-4 bg-background border border-accent-muted rounded-2xl text-xs font-black uppercase tracking-widest text-text-muted hover:text-white transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 py-4 bg-accent text-background rounded-2xl text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(196,181,253,0.3)] hover:shadow-[0_0_30px_rgba(196,181,253,0.5)] transition-all active:scale-95"
            >
              Verify & Catalog
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const InventoryMaster: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    const data = await getInventory();
    setItems(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddItem = async (newItem: InventoryItem) => {
    await saveInventory([newItem]);
    await loadData();
    setIsModalOpen(false);
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, filterCategory]);

  const categories = useMemo(() => {
    const cats = new Set(items.map(i => i.category));
    return ['All', ...Array.from(cats)];
  }, [items]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Inventory Master</h2>
          <p className="text-text-muted font-bold text-xs uppercase tracking-widest mt-1">Cataloged Assets: {items.length}</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-surface border border-accent-muted rounded-2xl text-xs font-black uppercase tracking-widest text-white hover:border-accent transition-all shadow-lg active:scale-95">
            <Filter size={18} className="text-accent" />
            Filters
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-accent text-background rounded-2xl text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(196,181,253,0.3)] hover:shadow-[0_0_30px_rgba(196,181,253,0.5)] transition-all active:scale-95"
          >
            <Plus size={18} />
            Add SKU
          </button>
        </div>
      </div>

      <div className="bg-surface rounded-[2rem] border border-accent-muted shadow-2xl overflow-hidden">
        {/* Search Bar */}
        <div className="p-6 border-b border-accent-muted/30 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
            <input 
              type="text" 
              placeholder="TYPE PRODUCT NAME OR SKU..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 h-14 bg-background border border-accent-muted/50 rounded-2xl outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all text-sm font-bold tracking-wider text-white uppercase"
            />
          </div>
          <div className="flex items-center bg-background border border-accent-muted/50 rounded-2xl px-4 h-14">
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-transparent outline-none text-xs font-black uppercase tracking-widest text-accent cursor-pointer w-full"
            >
              {categories.map(cat => (
                <option key={cat} value={cat} className="bg-background text-white">{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background/50 border-b border-accent-muted/30">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-muted">SKU Identification</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-muted">Product Identity</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-muted">Category</th>
                <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-text-muted">Valuation</th>
                <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-text-muted">Stock Level</th>
                <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-text-muted">Status</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-accent-muted/10">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-24 text-center">
                    <div className="flex flex-col items-center text-text-muted">
                      <PackageSearch size={64} className="mb-4 opacity-5" />
                      <p className="text-xs font-black uppercase tracking-[0.3em]">No Assets Found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-accent/5 transition-colors group">
                    <td className="px-8 py-5">
                      <span className="font-mono text-[10px] font-black text-accent bg-accent/5 px-2 py-1 rounded border border-accent/20">
                        {item.sku}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <p className="font-black text-white text-sm uppercase tracking-tight">{item.name}</p>
                      <p className="text-[10px] text-text-muted font-bold">UID: {item.id}</p>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 bg-background text-text-muted border border-accent-muted rounded-full text-[9px] font-black uppercase tracking-widest">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                        <div className="flex flex-col">
                            <span className="text-sm font-black text-white">${item.price.toFixed(2)}</span>
                            <span className="text-[9px] font-bold text-text-muted">COST: ${item.cost.toFixed(2)}</span>
                        </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`text-lg font-black ${item.stock <= item.minStock ? 'text-amber-400' : 'text-white'}`}>
                        {item.stock}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      {item.stock <= item.minStock ? (
                        <div className="inline-flex items-center gap-1.5 text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-400/30">
                          <AlertCircle size={12} />
                          CRITICAL
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 text-accent bg-accent/10 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-accent/30">
                          STABLE
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="h-10 w-10 flex items-center justify-center hover:bg-surface rounded-xl text-text-muted group-hover:text-white transition-all">
                        <MoreHorizontal size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t border-accent-muted/30 bg-background/30 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
             RECORDS {filteredItems.length} / {items.length}
          </span>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-surface border border-accent-muted rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:border-accent disabled:opacity-20 transition-all">Previous</button>
            <button className="px-4 py-2 bg-accent text-background rounded-xl text-[10px] font-black uppercase tracking-widest">Page 01</button>
            <button className="px-4 py-2 bg-surface border border-accent-muted rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:border-accent transition-all">Next</button>
          </div>
        </div>
      </div>

      <AddSkuModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleAddItem} 
      />
    </div>
  );
};

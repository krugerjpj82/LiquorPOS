
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from './components/Sidebar';
import { View, AppState, Product, Sale, SaleItem } from './types';
import { dbService } from './services/dbService';
import { geminiService } from './services/geminiService';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => dbService.loadData());
  const [currentView, setCurrentView] = useState<View>(View.TERMINAL);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [qtyInput, setQtyInput] = useState('1');
  const [searchTerm, setSearchTerm] = useState('');
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Superuser Auth State
  const [isSuperuserAuthenticated, setIsSuperuserAuthenticated] = useState(false);
  const [superUserPass, setSuperUserPass] = useState('');
  const [superUserUser, setSuperUserUser] = useState('');

  // Cashup state
  const [isCashupMode, setIsCashupMode] = useState(false);
  const [cashupDenominations, setCashupDenominations] = useState({
    notes: { 200: 0, 100: 0, 50: 0, 20: 0, 10: 0 },
    coins: { 5: 0, 2: 0, 1: 0, 0.5: 0, 0.2: 0, 0.1: 0 }
  });
  const [manualCardTotal, setManualCardTotal] = useState(0);
  const [manualFloat, setManualFloat] = useState(0);

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persistence
  useEffect(() => {
    dbService.saveData(state);
  }, [state]);

  // Keyboard Focus for Terminal
  useEffect(() => {
    if (currentView === View.TERMINAL && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [currentView, cart]);

  // Auth Handler
  const handleSuperuserLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (superUserUser === 'springbok8340' && superUserPass === '531386') {
      setIsSuperuserAuthenticated(true);
      setSuperUserPass('');
      setSuperUserUser('');
    } else {
      alert("Access Denied: Invalid Credentials");
    }
  };

  const handleBarcodeScanned = (code: string) => {
    const product = state.products.find(p => p.sku === code);
    const quantity = parseInt(qtyInput) || 1;
    
    if (product) {
      if (product.stock < quantity) {
        alert(`Low Stock Alert: Only ${product.stock} units available.`);
      } else {
        addToCart(product, quantity);
        setBarcodeInput('');
        setQtyInput('1');
      }
    } else {
      alert(`Product SKU [${code}] not found.`);
      setBarcodeInput('');
    }
  };

  const addToCart = (product: Product, quantity: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { 
        productId: product.id, 
        name: product.name, 
        price: product.price, 
        quantity 
      }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        const newProducts: Product[] = jsonData.map((row, index) => ({
          id: row.id || `UPLOAD-${Date.now()}-${index}`,
          name: row.name || row.Product || 'Unknown Product',
          category: row.category || row.Category || 'General',
          price: parseFloat(row.price || row.Price) || 0,
          stock: parseInt(row.stock || row.Stock) || 0,
          sku: String(row.sku || row.SKU || `SKU-${Date.now()}-${index}`),
        }));

        if (newProducts.length === 0) {
          alert("No valid product data found in the Excel file.");
          return;
        }

        // Simple merge: if SKU exists, update. If not, add.
        setState(prev => {
          const existingProducts = [...prev.products];
          newProducts.forEach(newP => {
            const idx = existingProducts.findIndex(p => p.sku === newP.sku);
            if (idx > -1) {
              existingProducts[idx] = { ...existingProducts[idx], ...newP };
            } else {
              existingProducts.push(newP);
            }
          });
          return { ...prev, products: existingProducts };
        });

        alert(`Successfully imported/updated ${newProducts.length} products.`);
      } catch (err) {
        console.error(err);
        alert("Error parsing Excel file. Please ensure it follows the correct format (SKU, Name, Price, Stock, Category).");
      }
    };
    reader.readAsArrayBuffer(file);
    // Reset input
    e.target.value = '';
  };

  // Hardware Actions
  const openTillDrawer = () => {
    console.log("%c [HARDWARE] Command: ESC p 0 25 250 (Drawer Open)", "color: #D0BCFF; font-weight: bold;");
    const drawerSound = new Audio('https://www.soundjay.com/misc/sounds/cash-register-purchase-1.mp3');
    drawerSound.play().catch(() => {});
  };

  const printReceipt = (sale: Sale) => {
    console.log("%c [HARDWARE] Command: Printing Slip for " + sale.id, "color: #D0BCFF;");
  };

  const processSale = () => {
    if (cart.length === 0) return;
    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const newSale: Sale = {
      id: `SALE-${Date.now()}`,
      timestamp: Date.now(),
      items: [...cart],
      total,
      paymentMethod: 'card'
    };
    
    const newProducts = state.products.map(p => {
      const cartItem = cart.find(ci => ci.productId === p.id);
      if (cartItem) return { ...p, stock: p.stock - cartItem.quantity };
      return p;
    });
    
    setState(prev => ({ ...prev, sales: [...prev.sales, newSale], products: newProducts }));
    setCart([]);
    
    // Auto-sync hardware
    printReceipt(newSale);
    openTillDrawer();
    alert("Payment Successful. Printing Receipt and Opening Drawer.");
  };

  // Derived Data
  const totalSalesAmount = useMemo(() => 
    state.sales.filter(s => !s.voided).reduce((acc, sale) => acc + sale.total, 0)
  , [state.sales]);

  const salesData = useMemo(() => {
    const daily: Record<string, number> = {};
    state.sales.filter(s => !s.voided).forEach(sale => {
      const date = new Date(sale.timestamp).toLocaleDateString();
      daily[date] = (daily[date] || 0) + sale.total;
    });
    return Object.entries(daily).map(([name, total]) => ({ name, total })).slice(-7);
  }, [state.sales]);

  const dailyCashup = useMemo(() => {
    const today = new Date().toDateString();
    const todaySales = state.sales.filter(s => !s.voided && new Date(s.timestamp).toDateString() === today);
    return { total: todaySales.reduce((acc, s) => acc + s.total, 0), count: todaySales.length };
  }, [state.sales]);

  const totalCashCounted = useMemo(() => {
    const n = Object.entries(cashupDenominations.notes).reduce((acc, [v, q]) => acc + (parseFloat(v) * (q as number)), 0);
    const c = Object.entries(cashupDenominations.coins).reduce((acc, [v, q]) => acc + (parseFloat(v) * (q as number)), 0);
    return n + c;
  }, [cashupDenominations]);

  const variance = useMemo(() => (totalCashCounted + manualCardTotal - manualFloat) - dailyCashup.total, [totalCashCounted, manualCardTotal, manualFloat, dailyCashup.total]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return state.products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);
  }, [searchTerm, state.products]);

  // Terminal View
  const renderTerminal = () => (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-180px)]">
      <div className="flex-1 bg-[#2B2930] rounded-[32px] border border-[#49454F] flex flex-col items-center justify-center p-12 relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <span className="material-symbols-outlined text-[300px]">barcode_scanner</span>
        </div>

        <div className="z-10 text-center space-y-8 w-full max-w-2xl">
          <div className="space-y-4">
            <h2 className="text-5xl font-medium tracking-tight text-[#E6E1E5]">LiquorPOS System</h2>
            <p className="text-[#938F99] text-lg uppercase tracking-widest font-bold text-sm">Hardware Input Sync Active</p>
          </div>

          <div className="w-full space-y-6">
            {/* SEARCH BOX ABOVE BARCODE ENTRY */}
            <div className="w-full relative">
              <label className="block text-[10px] font-bold text-[#D0BCFF] text-left ml-2 mb-2 uppercase tracking-widest">Search Inventory</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#938F99] group-focus-within:text-[#D0BCFF] transition-colors">search</span>
                <input
                  type="text"
                  placeholder="Type product name or category..."
                  className="w-full bg-[#1C1B1F] border-2 border-[#49454F] rounded-2xl py-5 pl-14 pr-6 text-xl text-white focus:border-[#D0BCFF] outline-none transition-all placeholder-[#49454F]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Search Results Dropdown */}
              {filteredProducts.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1C1B1F] border border-[#49454F] rounded-2xl overflow-hidden shadow-2xl z-50">
                  {filteredProducts.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        addToCart(p, parseInt(qtyInput) || 1);
                        setSearchTerm('');
                        setQtyInput('1');
                      }}
                      className="w-full flex items-center justify-between p-4 hover:bg-[#D0BCFF]/10 transition-colors border-b border-[#49454F] last:border-0"
                    >
                      <div className="text-left">
                        <p className="font-bold text-[#E6E1E5]">{p.name}</p>
                        <p className="text-xs text-[#938F99] font-mono">{p.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#D0BCFF]">R{p.price.toFixed(2)}</p>
                        <p className="text-[10px] text-[#938F99] uppercase font-bold">{p.stock} in stock</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4 w-full">
              <div className="w-32 flex flex-col items-start space-y-2">
                <label className="text-[10px] font-bold text-[#D0BCFF] ml-2 uppercase tracking-widest">Quantity</label>
                <input
                  type="number"
                  min="1"
                  className="w-full bg-[#1C1B1F] border-2 border-[#49454F] rounded-2xl py-6 text-center text-3xl font-bold text-[#D0BCFF] focus:border-[#D0BCFF] outline-none transition-all"
                  value={qtyInput}
                  onChange={(e) => setQtyInput(e.target.value)}
                />
              </div>
              
              <div className="flex-1 flex flex-col items-start space-y-2">
                <label className="text-[10px] font-bold text-[#D0BCFF] ml-2 uppercase tracking-widest">SKU Scan</label>
                <form onSubmit={(e) => { e.preventDefault(); handleBarcodeScanned(barcodeInput); }} className="w-full relative">
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    placeholder="Scan item barcode..."
                    className="w-full bg-[#1C1B1F] border-2 border-[#49454F] rounded-2xl py-6 px-8 text-3xl font-bold text-white focus:border-[#D0BCFF] outline-none transition-all placeholder-[#49454F]"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                  />
                  <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#D0BCFF] text-[#381E72] p-4 rounded-xl hover:bg-[#EADDFF] transition-all">
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[480px] bg-[#1C1B1F] rounded-[32px] border border-[#49454F] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-[#49454F] bg-[#2B2930]/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#D0BCFF] text-3xl">shopping_basket</span>
            <h3 className="text-2xl font-medium tracking-tight">Checkout</h3>
          </div>
          <span className="bg-[#49454F] text-[#E6E1E5] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
            {cart.length} Lines
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#49454F] space-y-4 opacity-50">
              <span className="material-symbols-outlined text-8xl">receipt_long</span>
              <p className="font-medium text-xl uppercase tracking-widest">Cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.productId} className="flex items-center justify-between p-5 bg-[#2B2930] rounded-2xl border border-[#49454F]">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#E6E1E5] truncate text-lg">{item.name}</p>
                  <p className="text-sm text-[#938F99] font-medium">
                    {item.quantity} units × R{item.price.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <p className="font-bold text-[#D0BCFF] text-xl">R{(item.price * item.quantity).toFixed(2)}</p>
                  <button onClick={() => removeFromCart(item.productId)} className="text-[#938F99] hover:text-[#F2B8B5] transition-colors">
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-10 bg-[#2B2930] border-t border-[#49454F] space-y-8">
          <div className="flex justify-between items-end">
            <span className="text-[#938F99] font-bold uppercase tracking-[0.1em] text-sm">Net Payable</span>
            <span className="font-bold text-white text-5xl tracking-tighter">
              R{cart.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2)}
            </span>
          </div>

          <button
            onClick={processSale}
            disabled={cart.length === 0}
            className="w-full bg-[#D0BCFF] text-[#381E72] py-7 rounded-full font-bold text-2xl transition-all shadow-lg hover:shadow-[#D0BCFF]/20 active:scale-[0.98] disabled:bg-[#49454F] disabled:text-[#938F99] flex items-center justify-center gap-4"
          >
            <span className="material-symbols-outlined text-3xl">print</span>
            Finalize & Pay
          </button>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <StatCard title="Total Revenue" value={`R${totalSalesAmount.toFixed(2)}`} icon="trending_up" color="bg-[#D0BCFF]" />
        <StatCard title="Daily Sales" value={dailyCashup.count} icon="shopping_bag" color="bg-[#EADDFF]" />
        <StatCard title="Stock Value" value={`R${state.products.reduce((a, p) => a + (p.price * p.stock), 0).toFixed(2)}`} icon="database" color="bg-[#D0BCFF]" />
      </div>
      <div className="bg-[#2B2930] p-10 rounded-[40px] border border-[#49454F] shadow-xl">
        <h3 className="text-2xl font-medium mb-10 text-[#E6E1E5]">Revenue Trend (Last 7 Days)</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D0BCFF" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#D0BCFF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#49454F" />
              <XAxis dataKey="name" stroke="#938F99" tick={{fontSize: 12}} />
              <YAxis stroke="#938F99" tick={{fontSize: 12}} />
              <Tooltip contentStyle={{ backgroundColor: '#1C1B1F', borderRadius: '16px', border: '1px solid #49454F', color: '#E6E1E5' }} />
              <Area type="monotone" dataKey="total" stroke="#D0BCFF" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderInventory = () => (
    <div className="bg-[#2B2930] rounded-[40px] border border-[#49454F] overflow-hidden shadow-2xl">
      <div className="p-10 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#49454F] gap-6">
        <div>
          <h3 className="text-3xl font-medium tracking-tight">Item Registry</h3>
          <p className="text-[#938F99] text-sm mt-1">Manage stock levels and unit pricing</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".xlsx, .xls"
            onChange={handleExcelUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-[#49454F] text-[#EADDFF] px-8 py-4 rounded-full font-bold flex items-center gap-2 hover:bg-[#49454F]/80 transition-all border border-[#EADDFF]/20"
          >
            <span className="material-symbols-outlined">upload_file</span> Upload Excel
          </button>
          <button className="bg-[#D0BCFF] text-[#381E72] px-8 py-4 rounded-full font-bold flex items-center gap-2 hover:bg-[#EADDFF] transition-all">
            <span className="material-symbols-outlined">add</span> New Product
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[#1C1B1F]">
            <tr className="text-[#938F99] text-[10px] font-bold uppercase tracking-widest">
              <th className="px-10 py-6">Product Details</th>
              <th className="px-10 py-6">SKU Code</th>
              <th className="px-10 py-6">Unit Price</th>
              <th className="px-10 py-6">Available Stock</th>
              <th className="px-10 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#49454F]">
            {state.products.map(p => (
              <tr key={p.id} className="hover:bg-[#49454F]/20">
                <td className="px-10 py-6 font-bold text-lg">{p.name}</td>
                <td className="px-10 py-6 text-[#938F99] font-mono">{p.sku}</td>
                <td className="px-10 py-6 font-bold text-[#D0BCFF]">R{p.price.toFixed(2)}</td>
                <td className="px-10 py-6">
                  <span className={`font-bold px-4 py-1 rounded-full text-sm ${p.stock < 10 ? 'bg-red-500/20 text-red-400' : 'bg-[#D0BCFF]/10 text-[#D0BCFF]'}`}>
                    {p.stock} units
                  </span>
                </td>
                <td className="px-10 py-6 text-right">
                  <button className="text-[#938F99] hover:text-[#D0BCFF] mx-2"><span className="material-symbols-outlined">edit</span></button>
                  <button className="text-[#938F99] hover:text-[#F2B8B5] mx-2"><span className="material-symbols-outlined">delete</span></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSuperuser = () => {
    if (!isSuperuserAuthenticated) {
      return (
        <div className="max-w-md mx-auto mt-24 bg-[#2B2930] p-12 rounded-[40px] border border-[#49454F] shadow-2xl text-center animate-in zoom-in-95">
          <div className="bg-[#D0BCFF]/10 p-8 rounded-3xl w-fit mx-auto mb-8 border border-[#D0BCFF]/20 text-[#D0BCFF]">
            <span className="material-symbols-outlined text-6xl">verified_user</span>
          </div>
          <h2 className="text-3xl font-medium mb-2 tracking-tight">Manager Authentication</h2>
          <p className="text-[#938F99] mb-10 font-medium">Elevated permissions required.</p>
          <form onSubmit={handleSuperuserLogin} className="space-y-6">
            <div className="text-left space-y-1">
              <label className="text-[10px] text-[#938F99] font-bold uppercase tracking-widest ml-4">Manager ID</label>
              <input type="text" placeholder="Username" className="w-full bg-[#1C1B1F] border border-[#49454F] rounded-2xl px-6 py-4 text-[#E6E1E5] outline-none focus:border-[#D0BCFF]" value={superUserUser} onChange={e => setSuperUserUser(e.target.value)} />
            </div>
            <div className="text-left space-y-1">
              <label className="text-[10px] text-[#938F99] font-bold uppercase tracking-widest ml-4">Access Token</label>
              <input type="password" placeholder="Passkey" className="w-full bg-[#1C1B1F] border border-[#49454F] rounded-2xl px-6 py-4 text-[#E6E1E5] outline-none focus:border-[#D0BCFF]" value={superUserPass} onChange={e => setSuperUserPass(e.target.value)} />
            </div>
            <button className="w-full bg-[#D0BCFF] text-[#381E72] py-5 rounded-full font-bold text-lg uppercase tracking-widest hover:bg-[#EADDFF] transition-all shadow-lg active:scale-95">Verify Identity</button>
          </form>
        </div>
      );
    }

    if (isCashupMode) {
      return (
        <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in">
          <header className="flex justify-between items-center bg-[#2B2930] p-8 rounded-[32px] border border-[#49454F] shadow-lg">
            <div>
              <h2 className="text-4xl font-medium tracking-tight">Store Cashup</h2>
              <p className="text-[#938F99] mt-2 font-bold uppercase text-[10px] tracking-widest">Shift Reconciliation Audit</p>
            </div>
            <div className="flex items-center gap-12">
               <div className="text-right">
                  <p className="text-[10px] text-[#D0BCFF] font-bold uppercase tracking-widest mb-1">Expected Sales Today</p>
                  <p className="text-3xl font-bold text-white tracking-tighter">R{dailyCashup.total.toFixed(2)}</p>
               </div>
               <div className="flex gap-4 border-l border-[#49454F] pl-12">
                <button onClick={() => setIsCashupMode(false)} className="bg-[#49454F] text-[#E6E1E5] px-8 py-4 rounded-full font-bold hover:bg-[#49454F]/80 transition-all">Cancel</button>
                <button onClick={() => alert("Reconciliation Finalized. Session Closed.")} className="bg-[#D0BCFF] text-[#381E72] px-8 py-4 rounded-full font-bold shadow-lg hover:bg-[#EADDFF] transition-all">Finalise Cashup</button>
               </div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* NOTES COUNTER */}
              <div className="bg-[#2B2930] rounded-[32px] p-8 border border-[#49454F] shadow-xl">
                <h3 className="text-xl font-medium mb-8 flex items-center gap-3"><span className="material-symbols-outlined text-[#D0BCFF]">payments</span> Notes Registry</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                  {[200, 100, 50, 20, 10].map(val => (
                    <div key={val} className="space-y-2">
                      <label className="text-[10px] font-bold text-[#938F99] uppercase tracking-widest ml-1">R{val} Qty</label>
                      <input type="number" min="0" className="w-full bg-[#1C1B1F] border border-[#49454F] rounded-xl px-4 py-3 text-[#E6E1E5] focus:border-[#D0BCFF] outline-none transition-all" 
                        value={cashupDenominations.notes[val as keyof typeof cashupDenominations.notes]} 
                        onChange={e => setCashupDenominations({...cashupDenominations, notes: {...cashupDenominations.notes, [val]: parseInt(e.target.value) || 0}})} />
                    </div>
                  ))}
                </div>
              </div>

              {/* COIN COUNTER */}
              <div className="bg-[#2B2930] rounded-[32px] p-8 border border-[#49454F] shadow-xl">
                <h3 className="text-xl font-medium mb-8 flex items-center gap-3"><span className="material-symbols-outlined text-[#D0BCFF]">toll</span> Coins Registry</h3>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
                  {[5, 2, 1, 0.5, 0.2, 0.1].map(val => (
                    <div key={val} className="space-y-2">
                      <label className="text-[10px] font-bold text-[#938F99] uppercase tracking-widest ml-1">{val >= 1 ? `R${val}` : `${val * 100}c`} Qty</label>
                      <input type="number" min="0" className="w-full bg-[#1C1B1F] border border-[#49454F] rounded-xl px-4 py-3 text-[#E6E1E5] focus:border-[#D0BCFF] outline-none transition-all" 
                        value={cashupDenominations.coins[val as keyof typeof cashupDenominations.coins]} 
                        onChange={e => setCashupDenominations({...cashupDenominations, coins: {...cashupDenominations.coins, [val]: parseInt(e.target.value) || 0}})} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-[#2B2930] rounded-[32px] p-8 border border-[#49454F] space-y-6 shadow-xl">
                <h3 className="text-xl font-medium flex items-center gap-3"><span className="material-symbols-outlined text-[#D0BCFF]">calculate</span> Adjustments</h3>
                <div className="space-y-5">
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#938F99] uppercase font-bold ml-1 tracking-widest">Electronic Card Payments</label>
                    <input type="number" className="w-full bg-[#1C1B1F] border border-[#49454F] rounded-xl px-4 py-3 text-[#E6E1E5] outline-none focus:border-[#D0BCFF]" value={manualCardTotal} onChange={e => setManualCardTotal(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#938F99] uppercase font-bold ml-1 tracking-widest">Opening Float (Subtract)</label>
                    <input type="number" className="w-full bg-[#1C1B1F] border border-[#49454F] rounded-xl px-4 py-3 text-[#E6E1E5] outline-none focus:border-[#D0BCFF]" value={manualFloat} onChange={e => setManualFloat(parseFloat(e.target.value) || 0)} />
                  </div>
                </div>
              </div>

              <div className="bg-[#381E72] rounded-[32px] p-8 text-white shadow-2xl space-y-6 border border-[#D0BCFF]/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                   <span className="material-symbols-outlined text-8xl">balance</span>
                </div>
                <div className="flex justify-between items-center opacity-60 text-[10px] font-bold uppercase tracking-[0.2em] relative z-10">
                  <span>System Goal</span>
                  <span>R{dailyCashup.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-3xl font-bold relative z-10">
                  <span>Counted</span>
                  <span className="tracking-tighter">R{(totalCashCounted + manualCardTotal - manualFloat).toFixed(2)}</span>
                </div>
                <div className={`flex justify-between items-center pt-6 border-t border-[#D0BCFF]/20 font-bold text-2xl relative z-10 ${variance >= 0 ? 'text-[#D0BCFF]' : 'text-[#F2B8B5]'}`}>
                  <span className="text-sm uppercase tracking-widest opacity-80">Variance</span>
                  <span className="tracking-tighter">R{variance.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6">
        <header className="flex justify-between items-end">
          <div><h2 className="text-6xl font-medium tracking-tight">Manager Portal</h2><p className="text-[#938F99] text-xl font-medium mt-3">High-integrity store management system.</p></div>
          <button onClick={() => setIsSuperuserAuthenticated(false)} className="flex items-center gap-3 bg-[#F2B8B5]/10 text-[#F2B8B5] px-10 py-5 rounded-full font-bold border border-[#F2B8B5]/20 hover:bg-[#F2B8B5] hover:text-[#601410] transition-all">
            <span className="material-symbols-outlined">lock</span><span>Lock Access</span>
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          <AdminCard onClick={() => setCurrentView(View.DASHBOARD)} title="Analytics" desc="Live sales performance" icon="monitoring" color="bg-[#D0BCFF]" />
          <AdminCard onClick={() => setCurrentView(View.INVENTORY)} title="Inventory" desc="Pricing & Stock Vault" icon="inventory_2" color="bg-[#EADDFF]" />
          <AdminCard onClick={() => setIsCashupMode(true)} title="Cashup" desc="End of day reconciliation" icon="account_balance_wallet" color="bg-[#D0BCFF]" />
          <AdminCard onClick={() => setCurrentView(View.BACKUP)} title="Persistence" desc="Cloud & Local Backups" icon="cloud_sync" color="bg-[#EADDFF]" />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#1C1B1F] text-[#E6E1E5] flex transition-all duration-300">
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        storeName={state.config.storeName} 
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      <main className={`flex-1 p-12 transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-72'}`}>
        <header className="flex justify-between items-center mb-16 no-print">
          <div className="space-y-1">
            <h1 className="text-4xl font-medium tracking-tight flex items-center gap-4">
              {currentView === View.TERMINAL && 'LiquorPOS Active'}
              {currentView === View.SUPERUSER && 'System Management'}
              {currentView === View.DASHBOARD && 'Store Metrics'}
              {currentView === View.INVENTORY && 'Stock Inventory'}
              {currentView === View.BACKUP && 'System Persistence'}
            </h1>
            <p className="text-[#938F99] text-[10px] font-black uppercase tracking-[0.4em]">{new Date().toDateString()}</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="bg-[#2B2930] border border-[#49454F] px-8 py-4 rounded-3xl flex items-center space-x-5 shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-[#D0BCFF] flex items-center justify-center text-[#381E72] font-black text-xl">M</div>
              <div>
                <span className="block font-bold text-lg leading-none">Master-01</span>
                <span className="text-[10px] text-[#938F99] font-bold uppercase tracking-widest mt-1 inline-block">Secure Session</span>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-[1700px] mx-auto">
          {currentView === View.TERMINAL && renderTerminal()}
          {currentView === View.SUPERUSER && renderSuperuser()}
          {currentView === View.DASHBOARD && renderDashboard()}
          {currentView === View.INVENTORY && renderInventory()}
          {currentView === View.BACKUP && (
            <div className="max-w-4xl mx-auto py-20 bg-[#2B2930] rounded-[60px] border border-[#49454F] text-center space-y-10 shadow-2xl">
              <span className="material-symbols-outlined text-9xl text-[#D0BCFF]">database</span>
              <h3 className="text-4xl font-medium">Backup Vault</h3>
              <p className="text-[#938F99] max-w-lg mx-auto leading-relaxed">System snapshots ensure total data recovery. Export your current database state to a secure file.</p>
              <div className="flex gap-6 justify-center">
                <button onClick={() => dbService.exportData(state)} className="bg-[#D0BCFF] text-[#381E72] px-10 py-5 rounded-full font-bold shadow-xl">Export Database</button>
                <button className="bg-[#49454F] text-[#E6E1E5] px-10 py-5 rounded-full font-bold">Import Backup</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string | number; icon: string; color: string }> = ({ title, value, icon, color }) => (
  <div className="bg-[#2B2930] p-10 rounded-[40px] border border-[#49454F] flex items-center space-x-8 shadow-lg transition-transform hover:scale-[1.02]">
    <div className={`${color} p-6 rounded-[24px] text-[#381E72] shadow-inner`}>
      <span className="material-symbols-outlined text-4xl">{icon}</span>
    </div>
    <div>
      <p className="text-[#938F99] text-[10px] font-bold uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-4xl font-bold tracking-tight text-white">{value}</h3>
    </div>
  </div>
);

const AdminCard: React.FC<{ onClick: () => void; title: string; desc: string; icon: string; color: string }> = ({ onClick, title, desc, icon, color }) => (
  <button onClick={onClick} className="bg-[#2B2930] p-10 rounded-[48px] border border-[#49454F] flex flex-col items-center text-center group hover:bg-[#49454F]/30 transition-all shadow-xl active:scale-95">
    <div className={`${color} p-8 rounded-[32px] text-[#381E72] mb-8 group-hover:scale-110 transition-transform`}>
      <span className="material-symbols-outlined text-5xl font-bold">{icon}</span>
    </div>
    <h3 className="font-bold text-2xl tracking-tight mb-2 uppercase text-[#E6E1E5]">{title}</h3>
    <p className="text-[#938F99] font-medium text-sm max-w-[180px] leading-snug">{desc}</p>
  </button>
);

export default App;

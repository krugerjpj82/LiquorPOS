
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Database, 
  BarChart3, 
  LogOut, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

const SidebarItem: React.FC<{ 
  to: string; 
  icon: React.ReactNode; 
  label: string; 
  active: boolean; 
  collapsed: boolean 
}> = ({ to, icon, label, active, collapsed }) => (
  <Link
    to={to}
    title={collapsed ? label : undefined}
    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
      active ? 'bg-accent text-background' : 'text-text-muted hover:text-white hover:bg-surface'
    } ${collapsed ? 'justify-center' : ''}`}
  >
    <div className="flex-shrink-0 transition-transform group-active:scale-95">{icon}</div>
    {!collapsed && <span className="font-semibold text-sm whitespace-nowrap overflow-hidden">{label}</span>}
  </Link>
);

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    if (confirm("Are you sure you want to exit the Back of House system?")) {
      window.close();
      // Fallback if window.close() is blocked by browser security
      window.location.href = "about:blank";
    }
  };

  const dateString = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  }).toUpperCase();

  return (
    <div className="flex min-h-screen bg-background text-white selection:bg-accent selection:text-background">
      {/* Sidebar */}
      <aside 
        className={`${
          isCollapsed ? 'w-20' : 'w-64'
        } bg-background border-r border-surface flex flex-col fixed h-full transition-all duration-300 z-20`}
      >
        <div className="flex flex-col items-center py-6 gap-6">
           {/* Brand Logo - Rounded Square as seen in images */}
           <div className={`flex items-center justify-center h-12 w-12 rounded-xl bg-surface border border-accent-muted shadow-lg`}>
              <div className="text-accent font-black text-xl">L</div>
           </div>
        </div>

        <nav className={`flex-1 px-3 flex flex-col gap-2`}>
          <SidebarItem 
            to="/" 
            icon={<LayoutDashboard size={24} />} 
            label="Dashboard" 
            active={location.pathname === '/'} 
            collapsed={isCollapsed} 
          />
          <SidebarItem 
            to="/inventory" 
            icon={<Package size={24} />} 
            label="Inventory Master" 
            active={location.pathname === '/inventory'} 
            collapsed={isCollapsed} 
          />
          <SidebarItem 
            to="/bridge" 
            icon={<Database size={24} />} 
            label="Data Bridge" 
            active={location.pathname === '/bridge'} 
            collapsed={isCollapsed} 
          />
          <SidebarItem 
            to="/reports" 
            icon={<BarChart3 size={24} />} 
            label="Reports" 
            active={location.pathname === '/reports'} 
            collapsed={isCollapsed} 
          />
        </nav>

        <div className={`p-3 mt-auto flex flex-col gap-2`}>
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`w-full flex items-center gap-3 px-3 py-3 text-text-muted hover:text-white hover:bg-surface rounded-xl transition-colors ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight size={24} /> : <><ChevronLeft size={24} /><span className="font-semibold text-sm">Hide Sidebar</span></>}
          </button>
          
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-3 text-text-muted hover:text-red-400 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={24} />
            {!isCollapsed && <span className="font-semibold text-sm">Log Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'} flex flex-col`}>
        {/* Updated Header Title */}
        <header className="h-24 px-8 flex items-center justify-between sticky top-0 z-10 bg-background/80 backdrop-blur-md">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight text-white leading-none">
              LiquorPOS-Back Of House
            </h1>
            <p className="text-[10px] tracking-[0.2em] font-bold text-text-muted">
              {dateString}
            </p>
          </div>

          <div className="flex items-center gap-4">
             {/* User Profile Card from Image 1 */}
             <div className="bg-surface/50 border border-accent-muted rounded-[2rem] px-4 py-2 flex items-center gap-4 hover:bg-surface transition-colors cursor-pointer group">
                <div className="h-10 w-10 rounded-2xl bg-accent flex items-center justify-center flex-shrink-0 group-active:scale-95 transition-transform">
                  <span className="text-background font-black text-lg">M</span>
                </div>
                <div className="flex flex-col pr-4">
                  <span className="text-white font-bold text-base leading-tight">Master-01</span>
                  <span className="text-[9px] font-bold tracking-widest text-text-muted uppercase">Secure Session</span>
                </div>
             </div>
          </div>
        </header>

        <div className="px-8 pb-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
};

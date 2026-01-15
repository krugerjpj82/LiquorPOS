
import React from 'react';
import { View } from '../types';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  storeName: string;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, storeName, isCollapsed, toggleCollapse }) => {
  const menuItems = [
    { id: View.TERMINAL, label: 'POS Terminal', icon: 'point_of_sale' },
    { id: View.SUPERUSER, label: 'Superuser Menu', icon: 'admin_panel_settings' },
  ];

  return (
    <div 
      className={`h-screen bg-[#1C1B1F] border-r border-[#49454F] text-[#E6E1E5] flex flex-col fixed left-0 top-0 z-50 transition-all duration-300 ease-in-out no-print ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      <div className={`py-10 flex items-center transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'px-7 space-x-4'}`}>
        <div className="bg-[#D0BCFF] p-3 rounded-2xl flex-shrink-0 shadow-lg shadow-[#D0BCFF]/10">
          <span 
            className="material-symbols-outlined text-[#381E72] text-3xl block"
            style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}
          >
            liquor
          </span>
        </div>
        {!isCollapsed && (
          <h1 className="font-medium text-xl tracking-tight text-[#E6E1E5] truncate animate-in fade-in duration-300">
            {storeName}
          </h1>
        )}
      </div>
      
      <nav className={`flex-1 space-y-2 px-3`}>
        {menuItems.map((item) => {
          const isActive = currentView === item.id || 
            (item.id === View.SUPERUSER && [View.DASHBOARD, View.INVENTORY, View.REPORTS, View.AI_INSIGHTS, View.BACKUP].includes(currentView));
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              title={isCollapsed ? item.label : ''}
              className={`w-full flex items-center h-14 rounded-full transition-all relative overflow-hidden group ${
                isActive 
                  ? 'bg-[#EADDFF] text-[#21005D]' 
                  : 'text-[#CAC4D0] hover:bg-[#49454F]/30'
              } ${isCollapsed ? 'justify-center px-0' : 'px-4'}`}
            >
              <span className={`material-symbols-outlined ${isActive ? 'fill-1' : ''} ${isCollapsed ? 'mr-0' : 'mr-3'}`}>
                {item.icon}
              </span>
              {!isCollapsed && (
                <span className="font-medium tracking-wide text-sm whitespace-nowrap opacity-100 transition-opacity">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mb-6 px-3 space-y-3">
        {!isCollapsed && (
          <div className="bg-[#2B2930] rounded-3xl p-4 border border-[#49454F] animate-in slide-in-from-bottom-2 duration-300">
            <p className="text-[10px] text-[#938F99] uppercase font-bold mb-3 tracking-widest">Security Status</p>
            <div className="flex items-center space-x-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs text-[#E6E1E5] font-medium">Encrypted</span>
            </div>
          </div>
        )}
        
        <button 
          onClick={toggleCollapse}
          className="w-full flex items-center justify-center h-12 rounded-full text-[#CAC4D0] hover:bg-[#49454F]/30 transition-all border border-[#49454F]/50 group"
        >
          <span className="material-symbols-outlined group-hover:scale-110 transition-transform">
            {isCollapsed ? 'side_navigation' : 'keyboard_double_arrow_left'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

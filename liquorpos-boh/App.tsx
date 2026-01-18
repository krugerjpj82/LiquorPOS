
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './views/Dashboard';
import { InventoryMaster } from './views/InventoryMaster';
import { DataBridge } from './views/DataBridge';
import { Reports } from './views/Reports';
import { initDB } from './db/database';

const App: React.FC = () => {
  useEffect(() => {
    const setupDB = async () => {
      // Ensure DB is initialized on app start
      await initDB();
    };
    setupDB();
  }, []);

  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<InventoryMaster />} />
          <Route path="/bridge" element={<DataBridge />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="*" element={<div className="text-center py-20 text-slate-500 font-medium">View not found or under construction.</div>} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;

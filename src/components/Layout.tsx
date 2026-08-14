import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { supabase } from '../lib/supabaseClient';
import { LogOut } from 'lucide-react';

export const Layout: React.FC = () => {
  const [employeeId, setEmployeeId] = useState<string>('...');

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        // Extract Employee ID from the dummy email (e.g. emp123@company.internal -> EMP123)
        const id = user.email.split('@')[0].toUpperCase();
        setEmployeeId(id);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <header className="top-header">
          <span className="header-title">StockQR — Inventory Management</span>
          <div className="user-profile">
            <div className="user-avatar">{employeeId.slice(0, 2)}</div>
            <span className="badge badge-active" style={{ fontSize: '0.78rem' }}>{employeeId}</span>
            <button 
              onClick={handleLogout}
              className="btn btn-secondary" 
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

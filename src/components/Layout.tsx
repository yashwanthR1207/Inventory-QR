import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { supabase } from '../lib/supabaseClient';
import { LogOut } from 'lucide-react';

export const Layout: React.FC = () => {
  const [employeeId, setEmployeeId] = useState<string>('Loading...');

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
        <header className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', backgroundColor: 'var(--card-bg)', borderBottom: '1px solid var(--border-color)' }}>
          <div className="text-secondary font-medium">QR Inventory System</div>
          <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="badge badge-active" style={{ fontSize: '0.85rem' }}>{employeeId}</div>
            <button 
              onClick={handleLogout}
              className="btn btn-secondary" 
              style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
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

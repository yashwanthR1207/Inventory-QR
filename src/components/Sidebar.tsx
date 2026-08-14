import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PackageSearch, PlusCircle, QrCode, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/inventory', icon: <PackageSearch size={20} />, label: 'Inventory' },
    { to: '/create', icon: <PlusCircle size={20} />, label: 'Generate QR' },
    { to: '/scan', icon: <QrCode size={20} />, label: 'Scan QR' },
  ];

  return (
    <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div className="sidebar-header">
        <QrCode size={24} className="text-accent" style={{ color: 'var(--accent-color)' }} />
        <span>StockQR</span>
      </div>
      <nav className="sidebar-nav" style={{ flexGrow: 1 }}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div style={{ padding: '1rem' }}>
        <button 
          className="btn btn-secondary w-full" 
          style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}
          onClick={() => supabase.auth.signOut()}
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );
};

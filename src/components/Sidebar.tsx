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
    <aside className="sidebar">
      <div className="sidebar-header">
        <QrCode size={22} className="text-accent" />
        <span>StockQR</span>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            end={item.to === '/'}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-divider" />
      <div className="sidebar-footer">
        <button 
          className="btn btn-secondary w-full" 
          style={{ justifyContent: 'center' }}
          onClick={() => supabase.auth.signOut()}
        >
          <LogOut size={16} /> <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

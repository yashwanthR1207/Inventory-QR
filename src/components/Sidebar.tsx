import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PackageSearch, PlusCircle, QrCode } from 'lucide-react';

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
        <QrCode size={24} className="text-accent" style={{ color: 'var(--accent-color)' }} />
        <span>StockQR</span>
      </div>
      <nav className="sidebar-nav">
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
    </aside>
  );
};

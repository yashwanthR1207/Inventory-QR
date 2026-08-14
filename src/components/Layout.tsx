import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const Layout: React.FC = () => {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <header className="top-header">
          <div className="text-secondary font-medium">QR Inventory System</div>
          <div className="user-profile">
            {/* Placeholder for Auth/User Profile */}
            <div className="badge badge-active">Admin User</div>
          </div>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

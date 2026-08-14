import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Package, AlertTriangle, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    lowStock: 0,
    outOfStock: 0,
    expiringSoon: 0,
    expired: 0
  });
  
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const { data: products, error: pError } = await supabase.from('products').select('*');
      if (pError) throw pError;
      
      const { data: txs, error: tError } = await supabase
        .from('inventory_transactions')
        .select('*, products(product_name, qr_id)')
        .order('created_at', { ascending: false })
        .limit(5);
      if (tError) throw tError;

      const today = new Date();
      const nextMonth = new Date();
      nextMonth.setMonth(today.getMonth() + 1);

      let totalStock = 0;
      let lowStock = 0;
      let outOfStock = 0;
      let expiringSoon = 0;
      let expired = 0;

      (products || []).forEach(p => {
        totalStock += p.quantity;
        
        if (p.quantity === 0) {
          outOfStock++;
          // auto update status if not correct
          if(p.status !== 'OUT_OF_STOCK') updateProductStatus(p.id, 'OUT_OF_STOCK');
        } else if (p.quantity <= p.minimum_stock) {
          lowStock++;
          if(p.status !== 'LOW_STOCK') updateProductStatus(p.id, 'LOW_STOCK');
        }

        if (p.expiry_date) {
          const expDate = new Date(p.expiry_date);
          if (expDate < today) {
            expired++;
            if(p.status !== 'EXPIRED') updateProductStatus(p.id, 'EXPIRED');
          } else if (expDate <= nextMonth) {
            expiringSoon++;
            if(p.status !== 'EXPIRING_SOON') updateProductStatus(p.id, 'EXPIRING_SOON');
          }
        }
      });

      setStats({
        totalProducts: products?.length || 0,
        totalStock,
        lowStock,
        outOfStock,
        expiringSoon,
        expired
      });
      
      setRecentTransactions(txs || []);
      
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateProductStatus = async (id: string, status: string) => {
     await supabase.from('products').update({ status }).eq('id', id);
  };

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div>
      <div className="page-title">
        <h1>Inventory Dashboard</h1>
      </div>

      <div className="stat-grid">
        <div className="stat-card" style={{ borderLeft: '4px solid var(--info-color)' }}>
          <div className="stat-icon" style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info-color)' }}>
            <Package size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Products/Batches</h3>
            <p>{stats.totalProducts}</p>
          </div>
        </div>
        
        <div className="stat-card" style={{ borderLeft: '4px solid var(--success-color)' }}>
          <div className="stat-icon" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-color)' }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Stock Items</h3>
            <p>{stats.totalStock}</p>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--warning-color)' }}>
          <div className="stat-icon" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning-color)' }}>
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <h3>Low Stock</h3>
            <p>{stats.lowStock}</p>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--danger-color)' }}>
          <div className="stat-icon" style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger-color)' }}>
            <AlertCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>Out of Stock</h3>
            <p>{stats.outOfStock}</p>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--warning-color)' }}>
          <div className="stat-icon" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning-color)' }}>
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <h3>Expiring Soon (30 days)</h3>
            <p>{stats.expiringSoon}</p>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--danger-color)' }}>
          <div className="stat-icon" style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger-color)' }}>
            <AlertCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>Expired</h3>
            <p>{stats.expired}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-4">Recent Transactions</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Type</th>
                <th>Qty</th>
                <th>Stock After</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length === 0 ? (
                <tr><td colSpan={5}>No transactions found.</td></tr>
              ) : (
                recentTransactions.map(tx => (
                  <tr key={tx.id}>
                    <td>{format(new Date(tx.created_at), 'MMM d, HH:mm')}</td>
                    <td>{tx.products?.product_name} <br/><small className="text-secondary">{tx.products?.qr_id}</small></td>
                    <td><span className={`badge ${tx.transaction_type === 'STOCK_IN' ? 'badge-active' : (tx.transaction_type === 'SALE' ? 'badge-out_of_stock' : 'badge-low_stock')}`}>{tx.transaction_type}</span></td>
                    <td>{tx.quantity}</td>
                    <td>{tx.new_stock}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

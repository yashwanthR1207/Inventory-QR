import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import type { Product } from '../types/database.types';
import { format } from 'date-fns';
import { Search, Filter, Eye } from 'lucide-react';

export const Inventory: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*');
        // FEFO Ordering logic: Sort by expiry date ASC, then purchase date ASC
        // We'll sort in memory to show how FEFO prioritize works
      if (error) throw error;
      
      const sortedData = (data || []).sort((a, b) => {
        if (a.expiry_date && b.expiry_date) {
          return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
        }
        if (a.expiry_date) return -1;
        if (b.expiry_date) return 1;
        
        // Fallback to FIFO (purchase date or created_at)
        const dateA = a.purchase_date ? new Date(a.purchase_date).getTime() : new Date(a.created_at).getTime();
        const dateB = b.purchase_date ? new Date(b.purchase_date).getTime() : new Date(b.created_at).getTime();
        return dateA - dateB;
      });

      setProducts(sortedData);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = (p.product_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (p.qr_id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (p.sku?.toLowerCase() || '').includes(searchTerm.toLowerCase());
                          
    const matchesStatus = filterStatus === 'ALL' || p.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="page-title">
        <h1>Inventory Management (FEFO Priority)</h1>
      </div>

      <div className="card">
        <div className="flex gap-4 mb-4">
          <div className="flex-1 form-group mb-0 relative">
            <Search className="absolute" style={{ top: '10px', left: '10px', color: 'var(--text-secondary)' }} size={18} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search by Product Name, QR ID, SKU..." 
              style={{ paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="form-group mb-0 flex items-center gap-2">
            <Filter size={18} className="text-secondary" />
            <select className="form-control" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
              <option value="EXPIRING_SOON">Expiring Soon</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p>Loading inventory...</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>QR ID</th>
                  <th>Product</th>
                  <th>Batch</th>
                  <th>Qty</th>
                  <th>Expiry</th>
                  <th>Shelf</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr><td colSpan={8} className="text-center">No products found.</td></tr>
                ) : (
                  filteredProducts.map((product, index) => (
                    <tr key={product.id} style={index === 0 ? { backgroundColor: 'var(--info-bg)' } : {}}>
                      <td><strong>{product.qr_id}</strong></td>
                      <td>
                        {product.product_name}
                        {index === 0 && filterStatus === 'ALL' && <span className="badge badge-active ml-2" style={{ marginLeft: '0.5rem', fontSize: '10px' }}>PRIORITY</span>}
                      </td>
                      <td>{product.batch_number || '-'}</td>
                      <td>{product.quantity}</td>
                      <td>{product.expiry_date ? format(new Date(product.expiry_date), 'MMM d, yyyy') : '-'}</td>
                      <td>{product.shelf_no || '-'}</td>
                      <td>
                        <span className={`badge badge-${product.status.toLowerCase()}`}>
                          {product.status}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => navigate(`/product/${product.qr_id}`)}>
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

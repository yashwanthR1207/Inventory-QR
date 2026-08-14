import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import type { Product, InventoryTransaction } from '../types/database.types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Edit2, LogIn, LogOut, Move, History } from 'lucide-react';

export const ProductDetail: React.FC = () => {
  const { qrId } = useParams<{ qrId: string }>();
  const navigate = useNavigate();
  
  
  const [product, setProduct] = useState<Product | null>(null);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [activeModal, setActiveModal] = useState<'SALE' | 'STOCK_IN' | 'SHIFT' | 'EDIT' | null>(null);
  const [actionQuantity, setActionQuantity] = useState(1);
  const [actionReference, setActionReference] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [targetShelf, setTargetShelf] = useState('');

  const fetchProductAndTransactions = async () => {
    try {
      setLoading(true);
      // Fetch Product
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('qr_id', qrId)
        .single();
        
      if (productError) throw productError;
      setProduct(productData);

      // Fetch Transactions
      const { data: txData, error: txError } = await supabase
        .from('inventory_transactions')
        .select('*')
        .eq('product_id', productData.id)
        .order('created_at', { ascending: false });
        
      if (txError) throw txError;
      setTransactions(txData || []);
      
    } catch (error: any) {
      toast.error('Failed to load product details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (qrId) {
      fetchProductAndTransactions();
    }
  }, [qrId]);

  const handleTransaction = async (type: 'SALE' | 'STOCK_IN' | 'SHIFT') => {
    if (!product) return;
    
    try {
      if (type === 'SALE') {
        // User requested: "sail the product must be deleted"
        const { error: deleteError } = await supabase
          .from('products')
          .delete()
          .eq('id', product.id);

        if (deleteError) throw deleteError;
        
        toast.success('Product sold and deleted successfully!');
        setActiveModal(null);
        navigate('/'); // Redirect to dashboard since it's deleted
        return;
      }

      let newStock = product.quantity;
      if (type === 'STOCK_IN') {
        if (actionQuantity <= 0) throw new Error('Stock-in quantity must be greater than 0');
        newStock = product.quantity + actionQuantity;
      }

      // Update product stock
      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          quantity: newStock,
          shelf_no: type === 'SHIFT' ? targetShelf : product.shelf_no,
          status: newStock === 0 ? 'OUT_OF_STOCK' : (newStock <= product.minimum_stock ? 'LOW_STOCK' : 'ACTIVE')
        })
        .eq('id', product.id);

      if (updateError) throw updateError;

      // Record transaction
      const { error: txError } = await supabase
        .from('inventory_transactions')
        .insert([{
          product_id: product.id,
          transaction_type: type,
          quantity: type === 'SHIFT' ? product.quantity : actionQuantity,
          previous_stock: product.quantity,
          new_stock: newStock,
          from_shelf: product.shelf_no,
          to_shelf: type === 'SHIFT' ? targetShelf : product.shelf_no,
          reference: actionReference,
          notes: actionNotes
        }]);

      if (txError) throw txError;

      toast.success(`${type.replace('_', ' ')} recorded successfully!`);
      setActiveModal(null);
      resetModalState();
      fetchProductAndTransactions(); // Refresh data

    } catch (error: any) {
      toast.error(error.message || `Failed to process ${type}`);
    }
  };

  const resetModalState = () => {
    setActionQuantity(1);
    setActionReference('');
    setActionNotes('');
    setTargetShelf('');
  };

  if (loading) return <div>Loading product information...</div>;
  if (!product) return <div className="card text-center"><h2 className="text-danger">Product Not Found</h2><p>The requested QR code does not exist in the system.</p></div>;

  return (
    <div>
      <div className="page-title">
        <h1>Product Details: {product.product_name}</h1>
        <div className="flex gap-2">
          <div className={`badge badge-${product.status.toLowerCase()}`}>{product.status}</div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-secondary">Overview</h2>
          <div className="flex gap-2">
             <button className="btn btn-secondary" onClick={() => setActiveModal('EDIT')}><Edit2 size={16}/> Edit</button>
             <button className="btn btn-primary" onClick={() => setActiveModal('SALE')}><LogOut size={16}/> Sale</button>
             <button className="btn btn-primary" onClick={() => setActiveModal('STOCK_IN')}><LogIn size={16}/> Stock In</button>
             <button className="btn btn-secondary" onClick={() => setActiveModal('SHIFT')}><Move size={16}/> Shift</button>
          </div>
        </div>
        
        <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
           <div className="stat-card">
              <div className="stat-content">
                 <h3>Current Stock</h3>
                 <p>{product.quantity} {product.unit}</p>
              </div>
           </div>
           <div className="stat-card">
              <div className="stat-content">
                 <h3>Shelf / Location</h3>
                 <p>{product.shelf_no || 'Unassigned'}</p>
              </div>
           </div>
           <div className="stat-card">
              <div className="stat-content">
                 <h3>Batch Number</h3>
                 <p>{product.batch_number || 'N/A'}</p>
              </div>
           </div>
           <div className="stat-card">
              <div className="stat-content">
                 <h3>Expiry Date</h3>
                 <p>{product.expiry_date ? format(new Date(product.expiry_date), 'PPP') : 'N/A'}</p>
              </div>
           </div>
        </div>

        <div className="form-row">
           <div>
              <p className="text-secondary mb-2"><strong>QR ID:</strong> {product.qr_id}</p>
              <p className="text-secondary mb-2"><strong>SKU:</strong> {product.sku || 'N/A'}</p>
              <p className="text-secondary mb-2"><strong>Category:</strong> {product.category || 'N/A'}</p>
              <p className="text-secondary mb-2"><strong>Brand:</strong> {product.brand || 'N/A'}</p>
           </div>
           <div>
              <p className="text-secondary mb-2"><strong>Unit Price:</strong> ${product.unit_price || '0.00'}</p>
              <p className="text-secondary mb-2"><strong>Warehouse:</strong> {product.warehouse || 'N/A'}</p>
              <p className="text-secondary mb-2"><strong>Supplier:</strong> {product.supplier || 'N/A'}</p>
              <p className="text-secondary mb-2"><strong>Min Stock Level:</strong> {product.minimum_stock}</p>
           </div>
        </div>
        {product.description && (
          <div className="mt-4">
             <p className="text-secondary"><strong>Description:</strong> {product.description}</p>
          </div>
        )}
      </div>

      <div className="card">
         <h2 className="text-secondary mb-4 flex items-center gap-2"><History size={20}/> Transaction History</h2>
         <div className="table-container">
           <table>
             <thead>
               <tr>
                 <th>Date</th>
                 <th>Type</th>
                 <th>Quantity</th>
                 <th>From &rarr; To Shelf</th>
                 <th>Stock After</th>
                 <th>Reference/Notes</th>
               </tr>
             </thead>
             <tbody>
               {transactions.length === 0 ? (
                 <tr><td colSpan={6} className="text-center">No transactions found.</td></tr>
               ) : (
                 transactions.map(tx => (
                   <tr key={tx.id}>
                     <td>{format(new Date(tx.created_at), 'MMM d, yyyy HH:mm')}</td>
                     <td><span className={`badge ${tx.transaction_type === 'STOCK_IN' ? 'badge-active' : (tx.transaction_type === 'SALE' ? 'badge-out_of_stock' : 'badge-low_stock')}`}>{tx.transaction_type}</span></td>
                     <td>{tx.quantity}</td>
                     <td>{tx.from_shelf || '-'} &rarr; {tx.to_shelf || '-'}</td>
                     <td>{tx.new_stock}</td>
                     <td>{tx.reference} {tx.notes && `(${tx.notes})`}</td>
                   </tr>
                 ))
               )}
             </tbody>
           </table>
         </div>
      </div>

      {/* ACTION MODALS */}
      {activeModal && activeModal !== 'EDIT' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{activeModal === 'SALE' ? 'Record Sale' : activeModal === 'STOCK_IN' ? 'Add Stock' : 'Shift Location'}</h2>
              <button onClick={() => {setActiveModal(null); resetModalState();}} className="text-secondary text-xl">&times;</button>
            </div>
            
            {activeModal === 'STOCK_IN' && (
              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input type="number" min="1" className="form-control" value={actionQuantity} onChange={e => setActionQuantity(Number(e.target.value))} />
              </div>
            )}
            
            {activeModal === 'SALE' && (
              <p className="mb-4 text-danger">Warning: Recording a sale will permanently delete this product and its history from the database.</p>
            )}
            
            {activeModal === 'SHIFT' && (
              <>
                <div className="form-group">
                  <label className="form-label">Current Shelf</label>
                  <input type="text" className="form-control" value={product.shelf_no || ''} disabled />
                </div>
                <div className="form-group">
                  <label className="form-label">Destination Shelf *</label>
                  <input type="text" className="form-control" value={targetShelf} onChange={e => setTargetShelf(e.target.value)} required />
                </div>
              </>
            )}

            <div className="form-group mt-2">
              <label className="form-label">Reference / Customer</label>
              <input type="text" className="form-control" value={actionReference} onChange={e => setActionReference(e.target.value)} />
            </div>
            <div className="form-group mt-2">
              <label className="form-label">Notes / Reason</label>
              <textarea className="form-control" rows={2} value={actionNotes} onChange={e => setActionNotes(e.target.value)}></textarea>
            </div>

            <div className="flex gap-2 justify-between mt-4">
               <button className="btn btn-secondary w-full" onClick={() => {setActiveModal(null); resetModalState();}}>Cancel</button>
               <button className="btn btn-primary w-full" onClick={() => handleTransaction(activeModal)} disabled={activeModal === 'SHIFT' && !targetShelf}>Confirm {activeModal}</button>
            </div>
          </div>
        </div>
      )}
      
      {/* EDIT MODAL - Simplified for brevity */}
      {activeModal === 'EDIT' && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h2>Edit Product</h2>
              <button onClick={() => setActiveModal(null)} className="text-secondary text-xl">&times;</button>
            </div>
            <p className="mb-4">Please edit product details. Stock changes should be done via Stock In / Sale to preserve transaction history.</p>
            {/* Real implementation would have full form here */}
            <div className="form-group">
                <label className="form-label">Product Name</label>
                <input type="text" className="form-control" defaultValue={product.product_name} id="edit_product_name" />
            </div>
            <div className="flex gap-2 justify-between mt-4">
               <button className="btn btn-secondary w-full" onClick={() => setActiveModal(null)}>Cancel</button>
               <button className="btn btn-primary w-full" onClick={async () => {
                  const newName = (document.getElementById('edit_product_name') as HTMLInputElement).value;
                  await supabase.from('products').update({ product_name: newName }).eq('id', product.id);
                  toast.success('Product updated');
                  setActiveModal(null);
                  fetchProductAndTransactions();
               }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

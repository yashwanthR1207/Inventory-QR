import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';

export const ProductCreate: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    product_name: '',
    sku: '',
    category: '',
    brand: '',
    description: '',
    unit: 'pcs',
    supplier: '',
    batch_number: '',
    quantity: 0,
    unit_price: 0,
    purchase_date: '',
    manufacturing_date: '',
    expiry_date: '',
    shelf_no: '',
    warehouse: '',
    minimum_stock: 10,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'quantity' || name === 'unit_price' || name === 'minimum_stock' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Generate unique QR ID
      const year = new Date().getFullYear();
      const randomPart = Math.floor(100000 + Math.random() * 900000);
      const qrId = `INV-${year}-${randomPart}`;

      // 2. Determine initial status based on expiry and stock
      let initialStatus = 'ACTIVE';
      if (formData.quantity === 0) initialStatus = 'OUT_OF_STOCK';
      else if (formData.quantity <= formData.minimum_stock) initialStatus = 'LOW_STOCK';
      
      if (formData.expiry_date) {
        const expiryDate = new Date(formData.expiry_date);
        const today = new Date();
        if (expiryDate < today) initialStatus = 'EXPIRED';
      }

      // 3. Insert into Supabase
      const { data: product, error } = await supabase
        .from('products')
        .insert([{
          qr_id: qrId,
          product_name: formData.product_name,
          sku: formData.sku,
          category: formData.category,
          brand: formData.brand,
          description: formData.description,
          unit: formData.unit,
          supplier: formData.supplier,
          batch_number: formData.batch_number,
          quantity: formData.quantity,
          unit_price: formData.unit_price,
          purchase_date: formData.purchase_date || null,
          manufacturing_date: formData.manufacturing_date || null,
          expiry_date: formData.expiry_date || null,
          shelf_no: formData.shelf_no,
          warehouse: formData.warehouse,
          minimum_stock: formData.minimum_stock,
          status: initialStatus
        }])
        .select()
        .single();

      if (error) throw error;

      // 4. Record Initial Stock In Transaction if quantity > 0
      if (formData.quantity > 0) {
        const { error: txError } = await supabase
          .from('inventory_transactions')
          .insert([{
            product_id: product.id,
            transaction_type: 'STOCK_IN',
            quantity: formData.quantity,
            previous_stock: 0,
            new_stock: formData.quantity,
            to_shelf: formData.shelf_no,
            reason: 'Initial Registration'
          }]);
        
        if (txError) console.error("Transaction Error:", txError);
      }

      toast.success('Product registered successfully!');
      setGeneratedQR(qrId);
    } catch (error: any) {
      toast.error(error.message || 'Failed to register product');
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    const svg = document.getElementById("product-qrcode");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR-${generatedQR}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  if (generatedQR) {
    return (
      <div>
        <div className="page-title">
          <h1>Product Registered Successfully</h1>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h2 className="mb-4">QR ID: {generatedQR}</h2>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
            <QRCodeSVG 
              id="product-qrcode" 
              value={`${window.location.origin}/product/${generatedQR}`} 
              size={256} 
              level="H"
              includeMargin={true}
            />
          </div>
          <div className="flex justify-center gap-4">
            <button className="btn btn-secondary" onClick={downloadQR}>Download QR Code</button>
            <button className="btn btn-primary" onClick={() => navigate(`/product/${generatedQR}`)}>
              View Product Details
            </button>
            <button className="btn btn-secondary" onClick={() => setGeneratedQR(null)}>
              Register Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-title">
        <h1>Register New Product / Batch</h1>
      </div>
      
      <form onSubmit={handleSubmit} className="card">
        <h3 className="mb-4">Product Information</h3>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Product Name *</label>
            <input required type="text" name="product_name" className="form-control" value={formData.product_name} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">SKU / Code</label>
            <input type="text" name="sku" className="form-control" value={formData.sku} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <input type="text" name="category" className="form-control" value={formData.category} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Brand</label>
            <input type="text" name="brand" className="form-control" value={formData.brand} onChange={handleChange} />
          </div>
        </div>

        <div className="form-group mt-2">
          <label className="form-label">Description</label>
          <textarea name="description" className="form-control" rows={3} value={formData.description} onChange={handleChange}></textarea>
        </div>

        <h3 className="mb-4 mt-4">Inventory Information</h3>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Batch / Lot Number</label>
            <input type="text" name="batch_number" className="form-control" value={formData.batch_number} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Initial Quantity *</label>
            <input required type="number" min="0" name="quantity" className="form-control" value={formData.quantity} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Unit Price</label>
            <input type="number" min="0" step="0.01" name="unit_price" className="form-control" value={formData.unit_price} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Unit of Measure</label>
            <input type="text" name="unit" className="form-control" value={formData.unit} onChange={handleChange} placeholder="e.g., pcs, kg, boxes" />
          </div>
        </div>

        <div className="form-row mt-2">
          <div className="form-group">
            <label className="form-label">Manufacturing Date</label>
            <input type="date" name="manufacturing_date" className="form-control" value={formData.manufacturing_date} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Expiry Date</label>
            <input type="date" name="expiry_date" className="form-control" value={formData.expiry_date} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Shelf Number</label>
            <input type="text" name="shelf_no" className="form-control" value={formData.shelf_no} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Warehouse</label>
            <input type="text" name="warehouse" className="form-control" value={formData.warehouse} onChange={handleChange} />
          </div>
        </div>

        <div className="form-row mt-2">
           <div className="form-group">
            <label className="form-label">Minimum Stock Alert Level</label>
            <input type="number" min="0" name="minimum_stock" className="form-control" value={formData.minimum_stock} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Supplier</label>
            <input type="text" name="supplier" className="form-control" value={formData.supplier} onChange={handleChange} />
          </div>
        </div>

        <div className="mt-4 flex" style={{ justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Generating QR...' : 'Register & Generate QR'}
          </button>
        </div>
      </form>
    </div>
  );
};

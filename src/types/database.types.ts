export type Product = {
  id: string;
  qr_id: string;
  sku: string | null;
  product_name: string;
  category: string | null;
  brand: string | null;
  description: string | null;
  unit: string | null;
  supplier: string | null;
  batch_number: string | null;
  quantity: number;
  unit_price: number | null;
  purchase_date: string | null;
  manufacturing_date: string | null;
  expiry_date: string | null;
  shelf_no: string | null;
  warehouse: string | null;
  minimum_stock: number;
  status: string;
  created_at: string;
  updated_at: string;
};

export type TransactionType = 'STOCK_IN' | 'SALE' | 'SHIFT' | 'RETURN' | 'DAMAGE' | 'EXPIRED' | 'STOCK_ADJUSTMENT';

export type InventoryTransaction = {
  id: string;
  product_id: string;
  transaction_type: TransactionType;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  from_shelf: string | null;
  to_shelf: string | null;
  reason: string | null;
  reference: string | null;
  notes: string | null;
  employee_id: string | null;
  created_at: string;
};

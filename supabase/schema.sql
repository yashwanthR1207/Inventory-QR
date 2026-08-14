-- PHASE 1: Database schema and migrations

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products Table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    qr_id VARCHAR(50) UNIQUE NOT NULL,
    sku VARCHAR(100),
    product_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    brand VARCHAR(100),
    description TEXT,
    unit VARCHAR(50),
    supplier VARCHAR(255),
    batch_number VARCHAR(100),
    quantity INTEGER NOT NULL DEFAULT 0,
    unit_price DECIMAL(10, 2),
    purchase_date DATE,
    manufacturing_date DATE,
    expiry_date DATE,
    shelf_no VARCHAR(50),
    warehouse VARCHAR(100),
    minimum_stock INTEGER DEFAULT 10,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Transactions Table
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL, -- STOCK_IN, SALE, SHIFT, RETURN, DAMAGE, EXPIRED, STOCK_ADJUSTMENT
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    from_shelf VARCHAR(50),
    to_shelf VARCHAR(50),
    reason TEXT,
    reference VARCHAR(100),
    notes TEXT,
    employee_id UUID, -- If auth is enabled, references auth.users
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to update updated_at timestamp on products table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Optional: Indexes for faster querying
CREATE INDEX idx_products_qr_id ON products(qr_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_expiry_date ON products(expiry_date);

CREATE INDEX idx_transactions_product_id ON inventory_transactions(product_id);
CREATE INDEX idx_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX idx_transactions_created_at ON inventory_transactions(created_at);

-- RLS setup (assuming auth is used)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (allow all authenticated users for now, to be refined later)
CREATE POLICY "Allow all authenticated users to read products" ON products FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated users to insert products" ON products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated users to update products" ON products FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to read transactions" ON inventory_transactions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated users to insert transactions" ON inventory_transactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- For local development/testing without strict auth, we might enable public access
CREATE POLICY "Allow public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow public insert products" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update products" ON products FOR UPDATE USING (true);
CREATE POLICY "Allow public delete products" ON products FOR DELETE USING (true);

CREATE POLICY "Allow public read transactions" ON inventory_transactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert transactions" ON inventory_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update transactions" ON inventory_transactions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete transactions" ON inventory_transactions FOR DELETE USING (true);

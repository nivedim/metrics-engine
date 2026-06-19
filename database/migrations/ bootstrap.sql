-- 1. Create our core transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(255) PRIMARY KEY,
    amount INT NOT NULL, -- Stored in cents (e.g., 1000 = $10.00)
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    transaction_date TIMESTAMPTZ NOT NULL,
    source_system VARCHAR(50) NOT NULL, -- e.g., 'stripe', 'paypal'
    raw_status VARCHAR(50) NOT NULL,    -- The original status from the source
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- Our canonical status
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add our performance index
CREATE INDEX IF NOT EXISTS idx_transactions_date_status 
ON transactions(transaction_date, status);

-- 3. Explicitly enable Row Level Security (RLS)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 4. Create a policy that allows full access ONLY to the service_role key
-- (This is the secure key your Node.js backend will use behind the scenes)
CREATE POLICY "Allow full access to service_role" 
ON transactions 
TO service_role 
USING (true) 
WITH CHECK (true);
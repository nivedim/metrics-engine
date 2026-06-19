import { supabase } from '../config/supabase';

// 1. Define the incoming raw structure from outside source systems
export interface RawTransaction {
  id: string;
  amount: number;         // Expected in cents (e.g., 1000 = $10.00)
  currency: string;       // e.g., 'USD'
  transactionDate: string;// ISO timestamp string
  sourceSystem: string;   // e.g., 'stripe', 'paypal', 'shopify'
  rawStatus: string;      // What the outside world calls it (e.g., 'succeeded')
}

// 2. Define our strict internal Canonical Status options
export type CanonicalStatus = 'COLLECTED' | 'PENDING';

// 3. THE ALLOW-LIST Matrix
// This maps a specific source + its native status to our canonical 'COLLECTED' status.
// Anything NOT explicitly matching a pair in this list will automatically fall through to 'PENDING'.
const REVENUE_ALLOW_LIST: Array<{ source: string; status: string }> = [
  { source: 'stripe', status: 'succeeded' },
  { source: 'stripe', status: 'paid' },
  { source: 'paypal', status: 'completed' },
  { source: 'shopify', status: 'fulfilled' },
  { source: 'shopify', status: 'paid' },
  { source: 'plaid', status: 'posted' }
];

/**
 * Normalizes an external transaction into our strict internal schema
 * and evaluates its revenue eligibility against our strict allow-list.
 */
export function normalizeTransaction(rawTx: RawTransaction) {
  // Check if the current source system and status combination is explicitly allowed
  const isCollected = REVENUE_ALLOW_LIST.some(
    (allowed) => 
      allowed.source.toLowerCase() === rawTx.sourceSystem.toLowerCase() &&
      allowed.status.toLowerCase() === rawTx.rawStatus.toLowerCase()
  );

  // Assign canonical status based on the allow-list outcome
  const canonicalStatus: CanonicalStatus = isCollected ? 'COLLECTED' : 'PENDING';

  // Map the raw data keys to match our snake_case Postgres columns exactly
  return {
    id: rawTx.id,
    amount: rawTx.amount,
    currency: rawTx.currency.toUpperCase(),
    transaction_date: new Date(rawTx.transactionDate).toISOString(),
    source_system: rawTx.sourceSystem.toLowerCase(),
    raw_status: rawTx.rawStatus,
    status: canonicalStatus
  };
}

/**
 * Ingests a raw transaction, normalizes it, and saves it securely to Supabase.
 */
export async function ingestTransaction(rawTx: RawTransaction): Promise<void> {
  const normalizedData = normalizeTransaction(rawTx);

  // Insert into Supabase using the service_role key client (which bypasses RLS)
  const { error } = await supabase
    .from('transactions')
    .upsert(normalizedData, { onConflict: 'id' }); // Upsert prevents duplicate primary keys from counting twice

  if (error) {
    console.error(`[Ingestion Error] Failed to persist transaction ${rawTx.id}:`, error.message);
    throw error;
  }

  console.log(`[Ingestion Success] Transaction ${rawTx.id} stored with status: ${normalizedData.status}`);
}
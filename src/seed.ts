import 'dotenv/config';
import { ingestTransaction, RawTransaction } from './services/ingestion';

// Helper to generate an array of mock multi-source financial transaction records
const mockPayloads: RawTransaction[] = [
  // Day 1 Transactions
  {
    id: 'tx_stripe_001',
    amount: 10000, // $100.00
    currency: 'USD',
    transactionDate: '2026-06-18T10:00:00Z',
    sourceSystem: 'stripe',
    rawStatus: 'succeeded' // ALLOW-LISTED (Should count as COLLECTED)
  },
  {
    id: 'tx_paypal_002',
    amount: 5000, // $50.00
    currency: 'USD',
    transactionDate: '2026-06-18T14:30:00Z',
    sourceSystem: 'paypal',
    rawStatus: 'completed' // ALLOW-LISTED (Should count as COLLECTED)
  },
  {
    id: 'tx_stripe_003',
    amount: 2500, // $25.00
    currency: 'USD',
    transactionDate: '2026-06-18T23:45:00Z',
    sourceSystem: 'stripe',
    rawStatus: 'failed' // NOT ALLOW-LISTED (Should safely fall back to PENDING)
  },

  // Day 2 Transactions
  {
    id: 'tx_shopify_004',
    amount: 20000, // $200.00
    currency: 'USD',
    transactionDate: '2026-06-19T02:15:00Z',
    sourceSystem: 'shopify',
    rawStatus: 'paid' // ALLOW-LISTED (Should count as COLLECTED)
  },
  {
    id: 'tx_stripe_005',
    amount: 7500, // $75.00
    currency: 'USD',
    transactionDate: '2026-06-19T11:00:00-04:00', // Timezone offset check!
    sourceSystem: 'stripe',
    rawStatus: 'unknown_new_status' // UNEXPECTED NEW STATUS (Should safely fall back to PENDING)
  }
];

async function runSeed() {
  console.log('🚀 Starting local simulation seed to Supabase...');
  
  for (const tx of mockPayloads) {
    try {
      await ingestTransaction(tx);
    } catch (err) {
      console.error(`Failed to ingest transaction ${tx.id}`);
    }
  }

  console.log('✅ Simulation seed complete!');
  process.exit(0);
}

runSeed();
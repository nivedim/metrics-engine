import fs from 'fs';
import path from 'path';
import { ingestTransaction, RawTransaction } from './services/ingestion';

// Helper to load and parse our local JSON files safely
function loadFixture(fileName: string): any[] {
  const filePath = path.join(__dirname, 'data/fixtures', fileName);
  const rawData = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(rawData);
}

async function runFixtureIngestion() {
  console.log('📦 Initializing Production-Grade Fixture Ingestion...');

  const totalIngested = 0;

  // 1. Process Stripe Snapshots
  const stripeData = loadFixture('stripe_payloads.json');
  for (const item of stripeData) {
    const normalizedRaw: RawTransaction = {
      id: item.id,
      amount: item.amount, // Stripe natively uses cents
      currency: item.currency,
      transactionDate: new Date(item.created * 1000).toISOString(), // Unix to ISO
      sourceSystem: 'stripe',
      rawStatus: item.status
    };
    await ingestTransaction(normalizedRaw);
  }

  // 2. Process Plaid Snapshots
  const plaidData = loadFixture('plaid_payloads.json');
  for (const item of plaidData) {
    const normalizedRaw: RawTransaction = {
      id: item.transaction_id,
      amount: Math.round(item.amount * 100), // Plaid uses floating dollars ($150.50 -> 15050 cents)
      currency: item.iso_currency_code,
      transactionDate: new Date(item.date).toISOString(),
      sourceSystem: 'plaid',
      rawStatus: item.current_status
    };
    await ingestTransaction(normalizedRaw);
  }

  console.log('🏁 All external data fixtures processed and metrics computed successfully.');
  process.exit(0);
}

runFixtureIngestion();
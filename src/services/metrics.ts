import { supabase } from '../config/supabase';

export interface BreakdownResponse {
  [date: string]: number; // e.g., { "2026-06-19": 2500 }
}

export interface SummaryResponse {
  total: number;
}

export class RevenueMetricsService {
  
  /**
   * THE SINGLE SOURCE OF TRUTH
   * Fetches data matching our strict canonical 'COLLECTED' status and maps it to a UTC day-by-day breakdown.
   */
  public async getDailyBreakdown(startDateISO: string, endDateISO: string): Promise<BreakdownResponse> {
    // Ensure inputs are cleanly parsed as UTC ISO bounds
    const start = new Date(startDateISO).toISOString();
    const end = new Date(endDateISO).toISOString();

    // Query Supabase using our indexed column strategy
    const { data, error } = await supabase
      .from('transactions')
      .select('amount, transaction_date')
      .eq('status', 'COLLECTED') // Strict allow-list enforced at ingestion
      .gte('transaction_date', start)
      .lte('transaction_date', end);

    if (error) {
      console.error('[Metrics Error] Failed to fetch revenue breakdown:', error.message);
      throw error;
    }

    const breakdown: BreakdownResponse = {};

    if (!data) return breakdown;

    // Aggregate values using strict UTC date strings
    for (const tx of data) {
      const txDate = new Date(tx.transaction_date);
      
      // CRITICAL: Use UTC methods to eliminate server-dependent timezone drift!
      const utcDateKey = txDate.toISOString().split('T')[0]; // Yields purely "YYYY-MM-DD"

      if (!breakdown[utcDateKey]) {
        breakdown[utcDateKey] = 0;
      }
      breakdown[utcDateKey] += tx.amount;
    }

    return breakdown;
  }

  /**
   * ZERO DRIFT SUMMARY
   * This endpoint mathematically CANNOT drift because it computes its total directly
   * by summing up the pieces returned from the Daily Breakdown logic.
   */
  public async getTotalSummary(startDateISO: string, endDateISO: string): Promise<SummaryResponse> {
    // Call the single source of truth method
    const dailyBreakdown = await this.getDailyBreakdown(startDateISO, endDateISO);

    // Sum up the daily totals
    const totalCollectedCents = Object.values(dailyBreakdown).reduce(
      (sum, dailyAmount) => sum + dailyAmount, 
      0
    );

    return {
      total: totalCollectedCents
    };
  }
}
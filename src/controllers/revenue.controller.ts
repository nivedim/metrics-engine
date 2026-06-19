import { Request, Response } from 'express';
import { RevenueMetricsService } from '../services/metrics';

const metricsService = new RevenueMetricsService();

/**
 * Helper to validate query params and ensure ISO fallback if missing
 */
function getDateRange(req: Request) {
  // Fallback default: past 30 days if parameters aren't provided
  const fallbackStart = new Date();
  fallbackStart.setDate(fallbackStart.getDate() - 30);

  const startDate = (req.query.startDate as string) || fallbackStart.toISOString();
  const endDate = (req.query.endDate as string) || new Date().toISOString();

  return { startDate, endDate };
}

export async function getSummary(req: Request, res: Response): Promise<void> {
  try {
    const { startDate, endDate } = getDateRange(req);
    const summary = await metricsService.getTotalSummary(startDate, endDate);
    
    res.json({
      success: true,
      meta: { startDate, endDate, unit: 'cents' },
      data: summary,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getBreakdown(req: Request, res: Response): Promise<void> {
  try {
    const { startDate, endDate } = getDateRange(req);
    const breakdown = await metricsService.getDailyBreakdown(startDate, endDate);
    
    res.json({
      success: true,
      meta: { startDate, endDate, unit: 'cents' },
      data: breakdown,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}
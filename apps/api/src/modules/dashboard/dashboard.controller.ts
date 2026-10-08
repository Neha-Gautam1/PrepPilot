import { Request, Response } from 'express';
import { getDashboardSummary } from './dashboard.service';

export async function getSummary(req: Request, res: Response) {
  const summary = await getDashboardSummary(req.user!.id);
  return res.status(200).json(summary);
}
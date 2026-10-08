import { Request, Response } from 'express';
import { getRecommendations } from './recommendations.service';

export async function getMyRecommendations(req: Request, res: Response) {
  const recommendations = await getRecommendations(req.user!.id);
  return res.status(200).json(recommendations);
}
import { Request, Response } from 'express';
import { recomputeSkillProfiles, getSkillProfilesForUser } from './analysis.service';

export async function recompute(req: Request, res: Response) {
  const count = await recomputeSkillProfiles(req.user!.id);
  return res.status(200).json({ topicsUpdated: count });
}

export async function getMyProfiles(req: Request, res: Response) {
  const profiles = await getSkillProfilesForUser(req.user!.id);
  return res.status(200).json(profiles);
}
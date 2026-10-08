import { Router } from 'express';
import { listTopics, listQuestionsForTopic, listSqlExercisesForTopic, listDsaProblemsForTopic } from './topics.controller';

const router = Router();

router.get('/', listTopics);
router.get('/:id/questions', listQuestionsForTopic);
router.get('/:id/sql-exercises', listSqlExercisesForTopic);
router.get('/:id/dsa-problems', listDsaProblemsForTopic);

export default router;
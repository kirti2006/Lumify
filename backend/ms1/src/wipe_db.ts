import { db } from './database/client.js';
import { 
  aiEvaluations, 
  candidateResponses, 
  interviewQuestions, 
  interviewSessions, 
  interviews,
  aiAgentLogs,
  reports,
  recommendedResources,
  interviewState
} from './database/schema.js';

async function wipe() {
  console.log('Wiping database...');
  try {
    await db.delete(recommendedResources);
    await db.delete(reports);
    await db.delete(aiAgentLogs);
    await db.delete(interviewState);
    await db.delete(aiEvaluations);
    await db.delete(candidateResponses);
    await db.delete(interviewQuestions);
    await db.delete(interviewSessions);
    await db.delete(interviews);
    console.log('Database successfully wiped!');
  } catch (error) {
    console.error('Error wiping db:', error);
  } finally {
    process.exit(0);
  }
}

wipe();

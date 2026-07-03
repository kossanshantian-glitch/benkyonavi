import { neon } from '@neondatabase/serverless';
const db = neon(process.env.DATABASE_URL);
const queries = [
  "INSERT INTO question_summary (qid, category, difficulty) VALUES (0, 'webdev', 'beginner') ON CONFLICT (qid) DO UPDATE SET category = EXCLUDED.category, difficulty = EXCLUDED.difficulty;",
  "INSERT INTO question_summary (qid, category, difficulty) VALUES (1, 'webdev', 'beginner') ON CONFLICT (qid) DO UPDATE SET category = EXCLUDED.category, difficulty = EXCLUDED.difficulty;",
  "INSERT INTO question_summary (qid, category, difficulty) VALUES (4, 'webdev', 'beginner') ON CONFLICT (qid) DO UPDATE SET category = EXCLUDED.category, difficulty = EXCLUDED.difficulty;",
  "INSERT INTO question_summary (qid, category, difficulty) VALUES (5, 'webdev', 'beginner') ON CONFLICT (qid) DO UPDATE SET category = EXCLUDED.category, difficulty = EXCLUDED.difficulty;",
  "INSERT INTO question_summary (qid, category, difficulty) VALUES (6, 'webdev', 'beginner') ON CONFLICT (qid) DO UPDATE SET category = EXCLUDED.category, difficulty = EXCLUDED.difficulty;",
  "INSERT INTO question_summary (qid, category, difficulty) VALUES (2, 'webdev', 'intermediate') ON CONFLICT (qid) DO UPDATE SET category = EXCLUDED.category, difficulty = EXCLUDED.difficulty;",
  "INSERT INTO question_summary (qid, category, difficulty) VALUES (3, 'webdev', 'intermediate') ON CONFLICT (qid) DO UPDATE SET category = EXCLUDED.category, difficulty = EXCLUDED.difficulty;",
];
for (const q of queries) {
  await db.query(q);
}
const rows = await db.query('SELECT qid, category, difficulty FROM question_summary ORDER BY qid');
console.log(JSON.stringify(rows, null, 2));

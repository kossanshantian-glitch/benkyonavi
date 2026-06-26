import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
const sql = () => neon(process.env.DATABASE_URL!);
export async function GET() {
  try {
    const db = sql();
    const rows = await db`SELECT * FROM question_summary`;
    return NextResponse.json({ questions: rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
export async function POST(req: NextRequest) {
  try {
    const { qid, rank, attemptCount, correctCount, lastAttempt } = await req.json();
    const db = sql();
    await db`INSERT INTO question_summary (qid,rank,attempt_count,correct_count,last_attempt) VALUES (${qid},${rank},${attemptCount},${correctCount},${lastAttempt}) ON CONFLICT (qid) DO UPDATE SET rank=EXCLUDED.rank, attempt_count=EXCLUDED.attempt_count, correct_count=EXCLUDED.correct_count, last_attempt=EXCLUDED.last_attempt`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
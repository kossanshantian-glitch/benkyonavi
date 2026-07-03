import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = () => neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    const db = sql();
    const rows = await db`SELECT qid, question_text, choices, correct_index, category, difficulty FROM questions ORDER BY qid`;
    return NextResponse.json({ questions: rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}

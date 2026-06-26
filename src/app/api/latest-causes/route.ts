import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
const sql = () => neon(process.env.DATABASE_URL!);
export async function GET() {
  try {
    const db = sql();
    const rows = await db`SELECT * FROM latest_causes`;
    return NextResponse.json({ latestCauses: rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
export async function POST(req: NextRequest) {
  try {
    const { qid, isCorrect, causes } = await req.json();
    const db = sql();
    await db`INSERT INTO latest_causes (qid,is_correct,causes) VALUES (${qid},${isCorrect},${causes}) ON CONFLICT (qid) DO UPDATE SET is_correct=EXCLUDED.is_correct, causes=EXCLUDED.causes`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
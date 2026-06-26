import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
const sql = () => neon(process.env.DATABASE_URL!);
export async function GET() {
  try {
    const db = sql();
    const rows = await db`SELECT * FROM history ORDER BY timestamp DESC LIMIT 10000`;
    return NextResponse.json({ history: rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
export async function POST(req: NextRequest) {
  try {
    const { id, qid, timestamp, isCorrect, causes, memo, actions, rank } = await req.json();
    const db = sql();
    await db`INSERT INTO history (id,qid,timestamp,is_correct,causes,memo,actions,rank) VALUES (${id},${qid},${timestamp},${isCorrect},${causes},${memo},${actions},${rank}) ON CONFLICT (id) DO NOTHING`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
export async function DELETE(req: NextRequest) {
  try {
    const { ids } = await req.json();
    const db = sql();
    await db`DELETE FROM history WHERE id = ANY(${ids})`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
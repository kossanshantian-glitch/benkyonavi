import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = () => neon(process.env.DATABASE_URL!);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ qid: string }> },
) {
  try {
    const { qid } = await params;
    const qidNum = Number(qid);
    if (!Number.isInteger(qidNum) || qidNum < 0) {
      return NextResponse.json({ error: 'Invalid qid' }, { status: 400 });
    }

    const db = sql();
    const rows = await db`
      SELECT timestamp, is_correct, causes, memo, rank, actions
      FROM history
      WHERE qid = ${qidNum}
      ORDER BY timestamp DESC
      LIMIT 3
    `;

    return NextResponse.json({
      history: rows.map((r) => ({
        timestamp: r.timestamp,
        isCorrect: r.is_correct,
        causes: r.causes,
        memo: r.memo,
        rank: r.rank,
        actions: r.actions,
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}

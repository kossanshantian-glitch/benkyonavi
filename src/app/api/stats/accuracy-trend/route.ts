import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = () => neon(process.env.DATABASE_URL!);

function parsePeriod(period: string | null): { interval: 'day' | 'week'; limit: number | null } {
  switch (period) {
    case '7d':
      return { interval: 'day', limit: 7 };
    case '30d':
      return { interval: 'day', limit: 30 };
    default:
      return { interval: 'week', limit: null };
  }
}

export async function GET(req: Request) {
  try {
    const { period } = Object.fromEntries(new URL(req.url).searchParams.entries()) as { period?: string };
    const { interval, limit } = parsePeriod(period ?? null);
    const db = sql();

    const rows = await db`
      SELECT
        to_char(date_trunc(${interval === 'week' ? 'week' : 'day'}, timestamp), 'YYYY-MM-DD') AS date,
        SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) AS correct,
        COUNT(*) AS total
      FROM history
      GROUP BY date
      ORDER BY date ASC
    `;

    const data = (rows ?? []).map((row: any) => ({
      date: String(row.date),
      correct: Number(row.correct ?? 0),
      total: Number(row.total ?? 0),
      rate: Number(row.total) === 0 ? 0 : Number(row.correct) / Number(row.total),
    }));

    const filtered = limit ? data.slice(-limit) : data;
    return NextResponse.json(filtered);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}

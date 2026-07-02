import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = () => neon(process.env.DATABASE_URL!);

function parsePeriod(period: string | null): { limit: number | null } {
  switch (period) {
    case '7d':
      return { limit: 7 };
    case '30d':
      return { limit: 30 };
    default:
      return { limit: null };
  }
}

export async function GET(req: Request) {
  try {
    const { period } = Object.fromEntries(new URL(req.url).searchParams.entries()) as { period?: string };
    const { limit } = parsePeriod(period ?? null);
    const db = sql();

    const since = limit ? new Date(Date.now() - limit * 24 * 60 * 60 * 1000).toISOString() : null;
    const rows = limit
      ? await db`
          SELECT cause, COUNT(*) AS count
          FROM history, unnest(coalesce(causes, ARRAY[]::text[])) AS cause
          WHERE NOT is_correct AND timestamp >= ${since}
          GROUP BY cause
          ORDER BY count DESC
        `
      : await db`
          SELECT cause, COUNT(*) AS count
          FROM history, unnest(coalesce(causes, ARRAY[]::text[])) AS cause
          WHERE NOT is_correct
          GROUP BY cause
          ORDER BY count DESC
        `;

    const data = (rows ?? []).map((row: any) => ({
      cause: String(row.cause),
      count: Number(row.count ?? 0),
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { QUESTION_IDS } from '@/lib/questions';
import { addDaysToDateStr, computeStudyStreak, todayDateStr } from '@/lib/study-streak';
import type { Rank, TodayPlan } from '@/lib/today-plan';

const sql = () => neon(process.env.DATABASE_URL!);

function toDateStr(value: unknown): string {
  if (!value) return '';
  return String(value).slice(0, 10);
}

export async function GET() {
  try {
    const db = sql();
    const today = todayDateStr();
    const tomorrow = addDaysToDateStr(today, 1);

    const reviewRows = await db`
      SELECT qid, next_review_date, rank,
             COALESCE(last_attempt_date, last_attempt::date) AS last_attempt_date
      FROM question_summary
      WHERE next_review_date <= CURRENT_DATE
        AND attempt_count > 0
      ORDER BY next_review_date ASC,
        CASE rank WHEN 'C' THEN 0 WHEN 'B' THEN 1 WHEN 'A' THEN 2 END ASC
    `;

    const attemptedRows = await db`
      SELECT qid FROM question_summary WHERE attempt_count > 0
    `;
    const attemptedSet = new Set(attemptedRows.map((r) => Number(r.qid)));

    const reviewQuestions = reviewRows.map((r) => ({
      qid: Number(r.qid),
      nextReviewDate: toDateStr(r.next_review_date),
      rank: r.rank as Rank,
      lastAttemptDate: toDateStr(r.last_attempt_date),
    }));

    const newQuestions = QUESTION_IDS.filter((id) => !attemptedSet.has(id)).map(
      (qid) => ({ qid }),
    );

    const dueOverdueCount = reviewQuestions.filter(
      (q) => q.nextReviewDate < today,
    ).length;

    const reviewCount = reviewQuestions.length;
    const newCount = newQuestions.length;
    const total = reviewCount + newCount;

    const tomorrowRows = await db`
      SELECT COUNT(*)::int AS count
      FROM question_summary
      WHERE next_review_date = ${tomorrow}::date
        AND attempt_count > 0
    `;

    const historyRows = await db`
      SELECT timestamp FROM history ORDER BY timestamp DESC LIMIT 10000
    `;
    const streakDays = computeStudyStreak(
      historyRows.map((r) => String(r.timestamp)),
    );

    const plan: TodayPlan = {
      reviewQuestions,
      newQuestions,
      estimatedMinutes: total * 2,
      summary: {
        reviewCount,
        newCount,
        dueOverdueCount,
      },
    };

    return NextResponse.json({
      plan,
      isComplete: total === 0,
      nextReviewTomorrow: Number(tomorrowRows[0]?.count ?? 0),
      streakDays,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}

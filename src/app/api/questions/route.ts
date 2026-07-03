import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { computeSm2, type Rank } from '@/lib/sm2';

const sql = () => neon(process.env.DATABASE_URL!);

const SM2_DEFAULTS = {
  easinessFactor: 2.5,
  intervalDays: 1,
  repetitions: 0,
  nextReviewDate: new Date().toISOString().slice(0, 10),
};

function toDateString(value: unknown): string {
  if (!value) return SM2_DEFAULTS.nextReviewDate;
  return String(value).slice(0, 10);
}

export async function GET(req: NextRequest) {
  try {
    const db = sql();
    const url = new URL(req.url);
    const category = url.searchParams.get('category');
    const difficulty = url.searchParams.get('difficulty');

    let rows;
    if (category && difficulty) {
      rows = await db`
        SELECT * FROM question_summary
        WHERE category = ${category} AND difficulty = ${difficulty}
      `;
    } else if (category) {
      rows = await db`
        SELECT * FROM question_summary
        WHERE category = ${category}
      `;
    } else if (difficulty) {
      rows = await db`
        SELECT * FROM question_summary
        WHERE difficulty = ${difficulty}
      `;
    } else {
      rows = await db`SELECT * FROM question_summary`;
    }

    return NextResponse.json({ questions: rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { qid, rank, attemptCount, correctCount, lastAttempt, isCorrect, category, difficulty } = await req.json();
    const db = sql();

    const existing = await db`
      SELECT easiness_factor, interval_days, repetitions, next_review_date,
             consecutive_correct, consecutive_wrong, last_attempt_date
      FROM question_summary WHERE qid = ${qid}
    `;

    let easinessFactor = Number(existing[0]?.easiness_factor ?? SM2_DEFAULTS.easinessFactor);
    let intervalDays = Number(existing[0]?.interval_days ?? SM2_DEFAULTS.intervalDays);
    let repetitions = Number(existing[0]?.repetitions ?? SM2_DEFAULTS.repetitions);
    let nextReviewDate = toDateString(existing[0]?.next_review_date);
    let consecutiveCorrect = Number(existing[0]?.consecutive_correct ?? 0);
    let consecutiveWrong = Number(existing[0]?.consecutive_wrong ?? 0);
    let lastAttemptDate = existing[0]?.last_attempt_date
      ? toDateString(existing[0].last_attempt_date)
      : null;

    if (typeof isCorrect === 'boolean') {
      const sm2 = computeSm2({
        isCorrect,
        rank: rank as Rank,
        easinessFactor,
        intervalDays,
        repetitions,
      });
      easinessFactor = sm2.easinessFactor;
      intervalDays = sm2.intervalDays;
      repetitions = sm2.repetitions;
      nextReviewDate = sm2.nextReviewDate;
      lastAttemptDate = new Date().toISOString().slice(0, 10);

      if (isCorrect) {
        consecutiveCorrect += 1;
        consecutiveWrong = 0;
      } else {
        consecutiveWrong += 1;
        consecutiveCorrect = 0;
      }
    }

    await db`
      INSERT INTO question_summary (
        qid, rank, category, difficulty, attempt_count, correct_count, last_attempt,
        easiness_factor, interval_days, repetitions, next_review_date,
        consecutive_correct, consecutive_wrong, last_attempt_date
      ) VALUES (
        ${qid}, ${rank}, ${category}, ${difficulty}, ${attemptCount}, ${correctCount}, ${lastAttempt},
        ${easinessFactor}, ${intervalDays}, ${repetitions}, ${nextReviewDate},
        ${consecutiveCorrect}, ${consecutiveWrong}, ${lastAttemptDate}
      )
      ON CONFLICT (qid) DO UPDATE SET
        rank = EXCLUDED.rank,
        category = EXCLUDED.category,
        difficulty = EXCLUDED.difficulty,
        attempt_count = EXCLUDED.attempt_count,
        correct_count = EXCLUDED.correct_count,
        last_attempt = EXCLUDED.last_attempt,
        easiness_factor = EXCLUDED.easiness_factor,
        interval_days = EXCLUDED.interval_days,
        repetitions = EXCLUDED.repetitions,
        next_review_date = EXCLUDED.next_review_date,
        consecutive_correct = EXCLUDED.consecutive_correct,
        consecutive_wrong = EXCLUDED.consecutive_wrong,
        last_attempt_date = EXCLUDED.last_attempt_date
    `;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = () => neon(process.env.DATABASE_URL!);

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question_text, choices, correct_index, category, difficulty } = body;

    if (!isString(question_text) || question_text.trim().length === 0) {
      return NextResponse.json({ error: 'question_text is required' }, { status: 400 });
    }
    if (!isStringArray(choices) || choices.length < 2) {
      return NextResponse.json({ error: 'choices must be an array of at least 2 strings' }, { status: 400 });
    }
    if (typeof correct_index !== 'number' || correct_index < 0 || correct_index >= choices.length) {
      return NextResponse.json({ error: 'correct_index must be a valid index in choices' }, { status: 400 });
    }

    const db = sql();

    const maxRow = await db`SELECT MAX(qid) AS max_qid FROM questions`;
    const nextQid = (Number(maxRow[0]?.max_qid) || 0) + 1;

    await db`
      INSERT INTO questions (qid, question_text, choices, correct_index, category, difficulty)
      VALUES (${nextQid}, ${question_text.trim()}, ${choices}, ${correct_index}, ${category ?? null}, ${difficulty ?? null})
    `;

    await db`
      INSERT INTO question_summary (
        qid, rank, category, difficulty, attempt_count, correct_count, last_attempt,
        easiness_factor, interval_days, repetitions, next_review_date,
        consecutive_correct, consecutive_wrong, last_attempt_date
      ) VALUES (
        ${nextQid}, 'C', ${category ?? null}, ${difficulty ?? null}, 0, 0, null,
        2.5, 1, 0, CURRENT_DATE,
        0, 0, null
      ) ON CONFLICT (qid) DO NOTHING;
    `;

    return NextResponse.json({ ok: true, qid: nextQid });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}

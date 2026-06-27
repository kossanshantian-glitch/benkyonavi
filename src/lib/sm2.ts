export type Rank = 'A' | 'B' | 'C';

export interface Sm2Input {
  isCorrect: boolean;
  rank: Rank;
  easinessFactor: number;
  intervalDays: number;
  repetitions: number;
  today?: Date;
}

export interface Sm2Output {
  easinessFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewDate: string;
  quality: number;
}

const MIN_EASINESS_FACTOR = 1.3;

/** rank と正誤から SM-2 の quality (0〜5) を算出する */
export function rankToQuality(isCorrect: boolean, rank: Rank): number {
  if (isCorrect) {
    if (rank === 'A') return 5;
    if (rank === 'B') return 4;
    return 3;
  }
  if (rank === 'C') return 1;
  return 2;
}

function addDays(date: Date, days: number): string {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

/** SM-2 アルゴリズムで次回復習パラメータを更新する */
export function computeSm2(input: Sm2Input): Sm2Output {
  const quality = rankToQuality(input.isCorrect, input.rank);
  let easinessFactor = input.easinessFactor;
  let intervalDays = input.intervalDays;
  let repetitions = input.repetitions;

  if (quality >= 3) {
    if (repetitions === 0) {
      intervalDays = 1;
    } else if (repetitions === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * easinessFactor);
    }
    repetitions += 1;
  } else {
    repetitions = 0;
    intervalDays = 1;
  }

  easinessFactor += 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  if (easinessFactor < MIN_EASINESS_FACTOR) {
    easinessFactor = MIN_EASINESS_FACTOR;
  }

  const today = input.today ?? new Date();
  return {
    easinessFactor: Math.round(easinessFactor * 100) / 100,
    intervalDays,
    repetitions,
    nextReviewDate: addDays(today, intervalDays),
    quality,
  };
}

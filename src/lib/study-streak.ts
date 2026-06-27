export function todayDateStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** history の timestamp から連続学習日数を計算する */
export function computeStudyStreak(timestamps: string[]): number {
  if (timestamps.length === 0) return 0;

  const days = new Set(timestamps.map((t) => String(t).slice(0, 10)));
  const today = todayDateStr();
  const cursor = new Date(`${today}T00:00:00`);

  if (!days.has(today)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function addDaysToDateStr(base: string, days: number): string {
  const d = new Date(`${base}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export interface AccuracyTrendPoint {
  date: string;
  correct: number;
  total: number;
  rate: number;
}

function average(points: AccuracyTrendPoint[]): number {
  if (points.length === 0) return 0;
  return points.reduce((sum, p) => sum + p.rate, 0) / points.length;
}

export function generateAccuracyInsights(trendData: AccuracyTrendPoint[]): string[] {
  if (!trendData || trendData.length === 0) {
    return ['データがありません。学習を記録すると傾向が見えるようになります。'];
  }

  const insights: string[] = [];
  const sorted = [...trendData].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];

  const getWindow = (days: number) => sorted.slice(Math.max(0, sorted.length - days));
  const last3 = getWindow(3);
  const last7 = getWindow(7);
  const prev3 = sorted.slice(Math.max(0, sorted.length - 6), Math.max(0, sorted.length - 3));
  const prev7 = sorted.slice(Math.max(0, sorted.length - 14), Math.max(0, sorted.length - 7));

  const avg3 = average(last3);
  const avg7 = average(last7);
  const avgPrev3 = average(prev3);
  const avgPrev7 = average(prev7);

  if (prev3.length === 3 && avg3 - avgPrev3 >= 0.1) {
    insights.push('直近3日で正答率が上昇傾向にあります。好調を維持しましょう。');
  } else if (prev3.length === 3 && avgPrev3 - avg3 >= 0.1) {
    insights.push('直近3日で正答率が低下しています。復習の方法を見直しましょう。');
  }

  if (prev7.length === 7 && avg7 - avgPrev7 >= 0.1) {
    insights.push('直近7日で着実に正答率が改善しています。継続するとさらに効果的です。');
  } else if (prev7.length === 7 && avgPrev7 - avg7 >= 0.1) {
    insights.push('直近7日で正答率が下降傾向です。学習量や復習内容を確認しましょう。');
  }

  const decliningStreak = sorted.reduce((count, point, index) => {
    if (index === 0) return 0;
    return point.rate < sorted[index - 1].rate ? count + 1 : 0;
  }, 0);
  if (decliningStreak >= 3) {
    insights.push('正答率が連続して下がっています。直近の学習内容を振り返りましょう。');
  }

  const minRate = Math.min(...sorted.map((p) => p.rate));
  const minPoint = sorted.find((p) => p.rate === minRate);
  if (minPoint) {
    insights.push(`要注意日: ${minPoint.date.slice(5)} は正答率が最も低い日です。復習の優先度を上げましょう。`);
  }

  const lowVolumeDays = sorted.filter((p) => p.total <= 1).length;
  if (lowVolumeDays >= 3) {
    insights.push('最近は解答数が少なめです。学習量を増やして習熟度を安定させましょう。');
  }

  if (insights.length === 0) {
    insights.push('安定して学習できています。継続して学習習慣を維持しましょう。');
  }

  return insights.slice(0, 3);
}

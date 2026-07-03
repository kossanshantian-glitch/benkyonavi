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
    return ['データがありません。問題を解いて記録すると、傾向が見えてきます。'];
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
    insights.push('最近、正解が増えてきました！この調子で続けましょう。');
  } else if (prev3.length === 3 && avgPrev3 - avg3 >= 0.1) {
    insights.push('少し正解が減ってきています。復習してみましょう。');
  }

  if (prev7.length === 7 && avg7 - avgPrev7 >= 0.1) {
    insights.push('直近7日で正解が増えています！いい流れです。');
  } else if (prev7.length === 7 && avgPrev7 - avg7 >= 0.1) {
    insights.push('直近7日で少し正解が減っています。もう一度復習しよう。');
  }

  const decliningStreak = sorted.reduce((count, point, index) => {
    if (index === 0) return 0;
    return point.rate < sorted[index - 1].rate ? count + 1 : 0;
  }, 0);
  if (decliningStreak >= 3) {
    insights.push(`${decliningStreak}日連続で正解が減っています。要注意です。`);
  }

  const minRate = Math.min(...sorted.map((p) => p.rate));
  const minPoint = sorted.find((p) => p.rate === minRate);
  if (minPoint) {
    insights.push(`要注意: ${minPoint.date.slice(5)} は正答率が低めです。復習しましょう。`);
  }

  const lowVolumeDays = sorted.filter((p) => p.total <= 1).length;
  if (lowVolumeDays >= 3) {
    insights.push('最近あまり問題を解けていないようです。もう少しチャレンジしてみましょう。');
  }

  if (insights.length === 0) {
    insights.push('こつこつ続けられています。引き続き学習を続けましょう。');
  }

  return insights.slice(0, 3);
}

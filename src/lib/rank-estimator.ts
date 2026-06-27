export type Rank = 'A' | 'B' | 'C';

export interface RankEstimatorInput {
  isCorrect: boolean;
  causes: string[];
  consecutiveCorrect: number;
  consecutiveWrong: number;
  previousRank: Rank | null;
  totalAttempts: number;
}

export interface RankEstimatorOutput {
  suggestedRank: Rank;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

function hasCause(causes: string[], label: string): boolean {
  return causes.includes(label);
}

function onlyCarelessOrSkip(causes: string[]): boolean {
  return (
    causes.length > 0 &&
    causes.every((c) => c === 'ケアレスミス' || c === '読み飛ばし')
  );
}

function estimateWrongRank(input: RankEstimatorInput): RankEstimatorOutput {
  const { causes, consecutiveWrong } = input;

  if (consecutiveWrong >= 2) {
    return {
      suggestedRank: 'C',
      reason: `${consecutiveWrong}回連続不正解です。基礎から見直しましょう`,
      confidence: 'high',
    };
  }

  if (hasCause(causes, '知識不足') || hasCause(causes, '理解不足')) {
    return {
      suggestedRank: 'C',
      reason: '知識・理解の定着が不十分です',
      confidence: 'high',
    };
  }

  if (onlyCarelessOrSkip(causes)) {
    return {
      suggestedRank: 'B',
      reason: '内容は理解できています。注意力の問題です',
      confidence: 'medium',
    };
  }

  return {
    suggestedRank: 'C',
    reason: '不正解のため、復習を推奨します',
    confidence: 'medium',
  };
}

function estimateCorrectRank(input: RankEstimatorInput): RankEstimatorOutput {
  const { causes, consecutiveCorrect, previousRank } = input;

  if (consecutiveCorrect >= 3 && previousRank === 'A') {
    return {
      suggestedRank: 'A',
      reason: `${consecutiveCorrect}回連続正解で安定しています`,
      confidence: 'high',
    };
  }

  if (consecutiveCorrect >= 2) {
    return {
      suggestedRank: 'A',
      reason: '連続正解しています。定着していると判断できます',
      confidence: 'medium',
    };
  }

  if (hasCause(causes, '知識が定着していた')) {
    return {
      suggestedRank: 'A',
      reason: '自信を持って正解できています',
      confidence: 'high',
    };
  }

  if (previousRank === 'C') {
    return {
      suggestedRank: 'B',
      reason: '前回Cでしたが正解できました。もう一度確認しましょう',
      confidence: 'medium',
    };
  }

  return {
    suggestedRank: 'B',
    reason: '正解しましたが、定着確認のためBを推奨します',
    confidence: 'low',
  };
}

/** 解答結果と履歴から推奨理解度ランクを推定する（純粋関数） */
export function estimateRank(input: RankEstimatorInput): RankEstimatorOutput {
  if (input.isCorrect) {
    return estimateCorrectRank(input);
  }
  return estimateWrongRank(input);
}

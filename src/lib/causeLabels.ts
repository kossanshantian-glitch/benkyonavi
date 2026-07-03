export type CauseMeta = { label: string; emoji: string; sub?: string; hint?: string };

export const causeLabelMap: Record<string, CauseMeta> = {
  time: { label: '時間が足りなかった', emoji: '⏰', sub: '解く時間が不足していた', hint: '解く時間が不足していた' },
  careless: { label: 'うっかりミス', emoji: '😅', sub: '注意不足や抜けがあった', hint: '注意不足や抜けがあった' },
  careless_mistake: { label: 'うっかりミス', emoji: '😅', sub: '注意不足や抜けがあった', hint: '注意不足や抜けがあった' },
  knowledge: { label: '知識が足りなかった', emoji: '📚', sub: '必要な用語や公式を知らなかった', hint: '必要な用語や公式を知らなかった' },
  knowledge_gap: { label: '知識が足りなかった', emoji: '📚', sub: '必要な用語や公式を知らなかった', hint: '必要な用語や公式を知らなかった' },
  calc: { label: '計算ミス', emoji: '🔢', sub: '計算過程で誤りがあった', hint: '計算過程で誤りがあった' },
  skip: { label: '読み飛ばし', emoji: '👁', sub: '問題文や条件を見落とした', hint: '問題文や条件を見落とした' },
  understanding: { label: '理解が不十分', emoji: '💡', sub: '概念がうまく理解できていなかった', hint: '概念がうまく理解できていなかった' },
  solid_knowledge: { label: '知識が定着していた', emoji: '📚', sub: '用語・定義を正確に覚えていた', hint: '用語・定義を正確に覚えていた' },
  deep_understanding: { label: '深い理解ができていた', emoji: '🧠', sub: '概念をしっかり理解していた', hint: '概念をしっかり理解していた' },
  good_elimination: { label: 'うまく選択肢を絞れた', emoji: '✅', sub: '選択肢を比較して自然に絞り込めた', hint: '選択肢を比較して自然に絞り込めた' },
  past_review: { label: '過去の復習が活きた', emoji: '🔁', sub: '前に学んだことを思い出せた', hint: '前に学んだことを思い出せた' },
  careful_read: { label: '注意深く読めた', emoji: '🔍', sub: '問題文を丁寧に読み取れた', hint: '問題文を丁寧に読み取れた' },
  intuition: { label: '直感が当たった', emoji: '✨', sub: '直感的な判断が正しかった', hint: '直感的な判断が正しかった' },
  other: { label: 'その他', emoji: '❓', sub: 'その他の原因', hint: 'その他の原因' },
};

export function getCauseMeta(code: string): CauseMeta {
  return causeLabelMap[code] ?? { label: code, emoji: '', sub: '', hint: '' };
}

export function knownCauseCodes(): string[] {
  return Object.keys(causeLabelMap);
}

export function getCauseOption(code: string) {
  const meta = getCauseMeta(code);
  return { id: code, label: meta.label, sub: meta.sub ?? '', ico: meta.emoji };
}

const wrongCauseCodes = ['knowledge', 'understanding', 'skip', 'calc', 'careless', 'time'];
const rightCauseCodes = ['solid_knowledge', 'deep_understanding', 'good_elimination', 'past_review', 'careful_read', 'intuition'];

export function getCauseOptions(isCorrect: boolean) {
  return (isCorrect ? rightCauseCodes : wrongCauseCodes).map(getCauseOption);
}

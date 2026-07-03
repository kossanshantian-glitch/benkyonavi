export type DifficultyMeta = { label: string; emoji: string; order: number };

export const difficultyLabelMap: Record<string, DifficultyMeta> = {
  beginner: { label: '初級', emoji: '🌱', order: 1 },
  intermediate: { label: '中級', emoji: '🌿', order: 2 },
  advanced: { label: '上級', emoji: '🌳', order: 3 },
};

export function getDifficultyMeta(code: string): DifficultyMeta {
  return difficultyLabelMap[code] ?? { label: code, emoji: '', order: 999 };
}

export function getDifficultyOptions() {
  return Object.keys(difficultyLabelMap)
    .map((code) => {
      const meta = getDifficultyMeta(code);
      return { id: code, label: meta.label, emoji: meta.emoji, order: meta.order };
    })
    .sort((a, b) => a.order - b.order);
}

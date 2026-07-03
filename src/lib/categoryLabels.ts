export type CategoryMeta = { label: string; emoji: string };

export const categoryLabelMap: Record<string, CategoryMeta> = {
  nextjs: { label: 'Next.js基礎', emoji: '🚀' },
  deploy: { label: 'デプロイの基本', emoji: '📦' },
  database: { label: 'データベースの仕組み', emoji: '🗄️' },
  webdev: { label: 'ウェブ開発の基本', emoji: '🌐' },
  other: { label: 'その他', emoji: '❓' },
};

export function getCategoryMeta(code: string): CategoryMeta {
  return categoryLabelMap[code] ?? { label: code, emoji: '' };
}

export function getCategoryOptions() {
  return Object.keys(categoryLabelMap).map((code) => {
    const meta = getCategoryMeta(code);
    return { id: code, label: meta.label, emoji: meta.emoji };
  });
}

import { neon } from '@neondatabase/serverless';
const db = neon(process.env.DATABASE_URL);

const queries = [
  `INSERT INTO questions (qid, question_text, choices, correct_index, category, difficulty) VALUES (0, '「システム状態の視認性」とは、ユーザーに現在の状態を常に知らせることを意味する。', ARRAY['○','×'], 0, 'webdev', 'beginner') ON CONFLICT (qid) DO NOTHING;`,
  `INSERT INTO questions (qid, question_text, choices, correct_index, category, difficulty) VALUES (1, '「エラー防止」の原則は「エラーメッセージ」の原則よりも優先度が低い。', ARRAY['○','×'], 1, 'webdev', 'beginner') ON CONFLICT (qid) DO NOTHING;`,
  `INSERT INTO questions (qid, question_text, choices, correct_index, category, difficulty) VALUES (2, 'ユーザーの記憶負荷を最小化するために行うべきことはどれか？', ARRAY['すべての情報を一画面に表示する','オブジェクト・行動・選択肢を可視化する','テキストのみのインターフェースを使用する','ショートカットキーを廃止する'], 1, 'webdev', 'intermediate') ON CONFLICT (qid) DO NOTHING;`,
  `INSERT INTO questions (qid, question_text, choices, correct_index, category, difficulty) VALUES (3, '「柔軟性と効率性」において、初心者には見えない機能を上級者向けに提供することは適切である。', ARRAY['○','×'], 0, 'webdev', 'intermediate') ON CONFLICT (qid) DO NOTHING;`,
  `INSERT INTO questions (qid, question_text, choices, correct_index, category, difficulty) VALUES (4, '「一貫性と標準」においてメタファーが重要な理由はどれか？', ARRAY['デザインを美しく見せるため','現実世界の概念をUI操作に活用するため','システムの処理速度を上げるため','ユーザーのログインを簡単にするため'], 1, 'webdev', 'beginner') ON CONFLICT (qid) DO NOTHING;`,
  `INSERT INTO questions (qid, question_text, choices, correct_index, category, difficulty) VALUES (5, '「ユーザーの制御と自由」は、誤操作の際に簡単に元に戻せることを保証する。', ARRAY['○','×'], 0, 'webdev', 'beginner') ON CONFLICT (qid) DO NOTHING;`,
  `INSERT INTO questions (qid, question_text, choices, correct_index, category, difficulty) VALUES (6, '「審美的で最小限のデザイン」において適切でない行為はどれか？', ARRAY['不要な情報を削除する','重要な情報を強調する','すべての機能を一画面に詰め込む','白いスペースを活用する'], 2, 'webdev', 'beginner') ON CONFLICT (qid) DO NOTHING;`,
];

for (const q of queries) {
  await db.query(q);
}
const rows = await db.query('SELECT qid, question_text, choices, correct_index, category, difficulty FROM questions ORDER BY qid');
console.log(JSON.stringify(rows, null, 2));

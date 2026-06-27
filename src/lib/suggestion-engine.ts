export interface SuggestionInput {
  isCorrect: boolean;
  causes: string[];
  rank: 'A' | 'B' | 'C';
  consecutiveWrong: number;
  intervalDays: number;
}

export interface SuggestionOutput {
  message: string;
  actions: string[];
  nextFocus: string;
}

function hasCause(causes: string[], label: string): boolean {
  return causes.includes(label);
}

function wrongSuggestion(
  input: SuggestionInput,
): SuggestionOutput | null {
  const { causes, consecutiveWrong } = input;

  if (hasCause(causes, '知識不足')) {
    return {
      message:
        'この問題の基礎知識が定着していません。まず用語・定義を確認しましょう。',
      actions: [
        '教科書・資料で該当箇所を読む',
        '用語をノートにまとめる',
        '明日もう一度この問題を解く',
      ],
      nextFocus: '用語の定義を確認しよう',
    };
  }

  if (hasCause(causes, '理解不足')) {
    return {
      message:
        '知識はあるが概念の理解が浅い状態です。「なぜそうなるか」を説明できるか確認しましょう。',
      actions: [
        '概念を自分の言葉で説明してみる',
        '具体例を考えてみる',
        '類題を探して解いてみる',
      ],
      nextFocus: 'なぜそうなるか説明してみよう',
    };
  }

  if (hasCause(causes, '読み飛ばし')) {
    return {
      message:
        '問題文を最後まで丁寧に読む習慣をつけましょう。キーワードに印をつけながら読むのが効果的です。',
      actions: [
        '次回は問題文のキーワードに下線を引く',
        '解答前に問題文を2回読む',
      ],
      nextFocus: '問題文を丁寧に読もう',
    };
  }

  if (hasCause(causes, '勘違い・思い込み')) {
    return {
      message:
        '自分の思い込みが正解を遠ざけています。「本当にそうか？」と一度立ち止まる習慣をつけましょう。',
      actions: [
        '選択肢を消去法で検討する',
        '根拠を言語化してから解答する',
      ],
      nextFocus: '根拠を確認してから答えよう',
    };
  }

  if (hasCause(causes, 'ケアレスミス') || hasCause(causes, '計算ミス')) {
    return {
      message: '内容は理解できています。解答前の見直しを習慣にしましょう。',
      actions: ['解答後に30秒見直す', 'ミスのパターンをメモしておく'],
      nextFocus: '解答前に見直そう',
    };
  }

  if (consecutiveWrong >= 3) {
    return {
      message:
        'この問題を3回以上連続で間違えています。一度立ち止まって、解説をゆっくり読み直しましょう。',
      actions: ['解説をノートに写す', '誰かに説明してみる', '類似問題を探す'],
      nextFocus: '解説を読み直そう',
    };
  }

  return {
    message: '間違いは学びのチャンスです。解説をよく読んで、次回につなげましょう。',
    actions: ['解説を読み直す', '明日もう一度挑戦する'],
    nextFocus: '解説から学びを拾おう',
  };
}

function correctSuggestion(input: SuggestionInput): SuggestionOutput {
  const { rank, intervalDays } = input;

  if (rank === 'A') {
    return {
      message: '完璧に定着しています！この調子で他の問題も進めましょう。',
      actions: ['次の未挑戦問題へ進む', '苦手なCランク問題を復習する'],
      nextFocus: 'この調子で進もう',
    };
  }

  if (rank === 'B') {
    return {
      message: `だいたい理解できていますが、まだ少し不安があります。${intervalDays}日後に再確認しましょう。`,
      actions: [
        `${intervalDays}日後に再挑戦（SM-2スケジュール通り）`,
        '不安な部分をメモしておく',
      ],
      nextFocus: 'SM-2スケジュールで定着させよう',
    };
  }

  return {
    message:
      '今回は正解しましたが、まだ不安が残っているようです。近いうちに復習しましょう。',
    actions: ['明日もう一度解く', 'なぜ正解できたか言語化する'],
    nextFocus: '不安な点を言語化しよう',
  };
}

/** ルールベースで改善提案と推奨アクションを生成する（純粋関数） */
export function generateSuggestion(input: SuggestionInput): SuggestionOutput {
  if (input.isCorrect) {
    return correctSuggestion(input);
  }
  return wrongSuggestion(input)!;
}

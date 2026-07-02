# AI_START

## プロジェクト概要

`benkyonavi3` は、学習改善支援アプリケーションです。ユーザーが問題に回答し、正誤や原因、メモを登録することで、復習プランを自動生成し、SM-2 ベースで次回復習日を算出します。

## 使用技術

- Next.js 16.2.9
- React 19.2.4
- TypeScript 5
- Tailwind CSS 4（PostCSS 経由）
- Neon Database (`@neondatabase/serverless`)

## ディレクトリ構成（主要部分のみ）

- `src/app/` - Next.js のページと API ルート
  - `api/` - バックエンド API エンドポイント
  - `page.tsx` - メインのクライアント UI
  - `layout.tsx` - ルートレイアウト
- `src/components/` - 再利用コンポーネント
  - `HomeScreen.tsx` - 学習プラン画面コンポーネント
- `src/lib/` - アプリケーションロジック
  - `db.ts` - Neon DB への接続
  - `questions.ts` - 問題 ID 定義
  - `sm2.ts` - SM-2 計算ロジック
  - `study-streak.ts` - 学習連続日数計算
  - `rank-estimator.ts` - 推定ランクロジック
  - `suggestion-engine.ts` - 改善提案ロジック
  - `today-plan.ts` - 今日の計画型定義
- `sql/migrations/` - DB マイグレーション SQL

## 主要ファイルの役割

- `src/app/api/history/route.ts`
  - 履歴の一覧取得、登録、削除を提供する API
- `src/app/api/history/[qid]/route.ts`
  - 指定問題の直近履歴を取得する API
- `src/app/api/latest-causes/route.ts`
  - 最新の原因データを保存／取得する API
- `src/app/api/questions/route.ts`
  - `question_summary` を取得・更新する API
- `src/app/api/today-plan/route.ts`
  - 今日の学習プランと進捗情報を生成する API
- `src/app/page.tsx`
  - 学習画面・履歴・統計を表示するメイン UI
- `src/components/HomeScreen.tsx`
  - 今日の学習プランの表示と「学習開始」ボタン
- `src/lib/sm2.ts`
  - SM-2 アルゴリズムによる次回復習日と間隔の算出
- `src/lib/study-streak.ts`
  - 学習連続日数と日付ユーティリティ
- `src/lib/rank-estimator.ts`
  - 正誤と原因からランクを推定するロジック
- `src/lib/suggestion-engine.ts`
  - 正誤に応じた改善アクションを生成するロジック

## 実装ルール

- API ルートは `src/app/api/*` に実装
- DB 接続は `@neondatabase/serverless` で `DATABASE_URL` を参照
- フロントエンドは基本的にクライアントコンポーネントとして実装
- 可能な限り型定義を利用し、`src/lib` 内の型を共有
- UI はシンプルなインラインスタイルで構築されている
- `causes` / `actions` は配列として扱われる

## 起動方法

1. ルートフォルダに移動
   ```bash
   cd c:\Users\Tara\Downloads\benkyonavi_1\benkyonavi3
   ```
2. 依存をインストール
   ```bash
   npm install
   ```
3. 環境変数を設定
   - `DATABASE_URL` を `.env.local` に設定
4. 開発サーバを起動

   ```bash
   npm run dev
   ```

5. ブラウザで `http://localhost:3000` を開く

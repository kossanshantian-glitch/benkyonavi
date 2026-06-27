'use client';

import { useEffect, useState } from 'react';
import type { TodayPlanResponse } from '@/lib/today-plan';

interface HomeScreenProps {
  onStartLearning: (sortOrder: number[]) => void;
}

function fmtTodayHeader(): string {
  const d = new Date();
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${days[d.getDay()]}）`;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function fmtDueLabel(nextReviewDate: string): string {
  const today = todayStr();
  if (nextReviewDate >= today) return '今日';
  const diff = Math.floor(
    (new Date(`${today}T00:00:00`).getTime() -
      new Date(`${nextReviewDate}T00:00:00`).getTime()) /
      86400000,
  );
  return `${diff}日前`;
}

function PlanSkeleton() {
  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 20px' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{
            height: i === 1 ? 48 : 36,
            background: '#e5e7eb',
            borderRadius: 8,
            marginBottom: 12,
            width: `${100 - i * 8}%`,
          }}
        />
      ))}
    </div>
  );
}

export default function HomeScreen({ onStartLearning }: HomeScreenProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TodayPlanResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/today-plan')
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <PlanSkeleton />;
  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: '#6b7280', fontSize: 13 }}>
        プランの取得に失敗しました
      </div>
    );
  }

  const { plan, isComplete, nextReviewTomorrow, streakDays } = data;
  const total = plan.summary.reviewCount + plan.summary.newCount;
  const sortOrder = [
    ...plan.reviewQuestions.map((q) => q.qid),
    ...plan.newQuestions.map((q) => q.qid),
  ];

  const rankStyle = (r: 'A' | 'B' | 'C') => ({
    background: r === 'A' ? '#d1fae5' : r === 'B' ? '#fef3c7' : '#fee2e2',
    color: r === 'A' ? '#059669' : r === 'B' ? '#d97706' : '#dc2626',
    fontSize: 9,
    fontWeight: 700 as const,
    padding: '2px 6px',
    borderRadius: 4,
  });

  if (isComplete) {
    return (
      <div
        style={{
          maxWidth: 560,
          margin: '0 auto',
          padding: '48px 20px',
          textAlign: 'center',
          fontFamily: "'Noto Sans JP', sans-serif",
        }}
      >
        <div
          style={{
            border: '1.5px solid #e5e7eb',
            borderRadius: 16,
            padding: 32,
            background: '#f8f9fc',
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 12 }}>🎉</div>
          <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 16 }}>
            今日の学習は完了です！
          </div>
          <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.8 }}>
            <div>次の復習予定: 明日 {nextReviewTomorrow}問</div>
            <div>
              連続学習日数: {streakDays}日目 🔥
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 560,
        margin: '0 auto',
        padding: '24px 20px',
        fontFamily: "'Noto Sans JP', sans-serif",
        color: '#0f1117',
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>
          📚 今日の学習プラン
        </div>
        <div style={{ fontSize: 13, color: '#6b7280' }}>{fmtTodayHeader()}</div>
      </div>

      <div
        style={{
          border: '1.5px solid #e5e7eb',
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
          background: '#fff',
        }}
      >
        <div style={{ display: 'grid', gap: 8, fontSize: 14, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>🔴 期限超過</span>
            <span style={{ fontWeight: 700 }}>{plan.summary.dueOverdueCount}問</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>📅 今日の復習</span>
            <span style={{ fontWeight: 700 }}>{plan.summary.reviewCount}問</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>🆕 新規問題</span>
            <span style={{ fontWeight: 700 }}>{plan.summary.newCount}問</span>
          </div>
        </div>
        <div
          style={{
            borderTop: '1px solid #e5e7eb',
            paddingTop: 12,
            fontSize: 13,
            color: '#374151',
            fontWeight: 700,
            marginBottom: 16,
          }}
        >
          合計 {total}問 ／ 約{plan.estimatedMinutes}分
        </div>
        <button
          type="button"
          onClick={() => onStartLearning(sortOrder)}
          style={{
            width: '100%',
            padding: 14,
            borderRadius: 10,
            border: 'none',
            background: '#2563eb',
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          🚀 今すぐ学習をはじめる
        </button>
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>今日やること</div>
      <div
        style={{
          border: '1.5px solid #e5e7eb',
          borderRadius: 12,
          overflow: 'hidden',
          background: '#fff',
        }}
      >
        {plan.reviewQuestions.map((q) => {
          const overdue = q.nextReviewDate < todayStr();
          return (
            <div
              key={`r-${q.qid}`}
              style={{
                padding: '10px 14px',
                borderBottom: '1px solid #e5e7eb',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <span>{overdue ? '🔴' : '📅'}</span>
              <span style={{ fontWeight: 700, minWidth: 28 }}>Q{q.qid + 1}</span>
              <span style={{ color: '#6b7280', flex: 1 }}>
                次回予定: {fmtDueLabel(q.nextReviewDate)}
              </span>
              <span style={rankStyle(q.rank)}>ランク: {q.rank}</span>
            </div>
          );
        })}
        {plan.newQuestions.map((q) => (
          <div
            key={`n-${q.qid}`}
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid #e5e7eb',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>🆕</span>
            <span style={{ fontWeight: 700 }}>Q{q.qid + 1}</span>
            <span style={{ color: '#6b7280' }}>未挑戦</span>
          </div>
        ))}
      </div>
    </div>
  );
}

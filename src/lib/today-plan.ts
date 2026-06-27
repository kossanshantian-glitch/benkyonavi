export type Rank = 'A' | 'B' | 'C';

export interface TodayPlan {
  reviewQuestions: {
    qid: number;
    nextReviewDate: string;
    rank: Rank;
    lastAttemptDate: string;
  }[];
  newQuestions: { qid: number }[];
  estimatedMinutes: number;
  summary: {
    reviewCount: number;
    newCount: number;
    dueOverdueCount: number;
  };
}

export interface TodayPlanResponse {
  plan: TodayPlan;
  isComplete: boolean;
  nextReviewTomorrow: number;
  streakDays: number;
}

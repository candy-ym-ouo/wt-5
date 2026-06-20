import type { RatingGrade, RatingResult, RatingInput, RatingScoreBreakdown } from '../types/game';
import { getDifficultyConfig } from './difficulty';

const GRADE_THRESHOLDS: Record<RatingGrade, number> = {
  'S+': 95,
  'S': 85,
  'A': 70,
  'B': 55,
  'C': 40,
  'D': 0,
};

const GRADE_INFO: Record<RatingGrade, {
  title: string;
  icon: string;
  color: string;
  rewardMultiplier: number;
}> = {
  'S+': {
    title: '完美大师',
    icon: '👑',
    color: '#ffd700',
    rewardMultiplier: 2.0,
  },
  'S': {
    title: '传奇藏书家',
    icon: '🏆',
    color: '#fbbf24',
    rewardMultiplier: 1.75,
  },
  'A': {
    title: '资深书虫',
    icon: '💎',
    color: '#a78bfa',
    rewardMultiplier: 1.5,
  },
  'B': {
    title: '勤勉读者',
    icon: '📚',
    color: '#60a5fa',
    rewardMultiplier: 1.25,
  },
  'C': {
    title: '初级探索者',
    icon: '📖',
    color: '#34d399',
    rewardMultiplier: 1.1,
  },
  'D': {
    title: '新书上架',
    icon: '🌱',
    color: '#9ca3af',
    rewardMultiplier: 1.0,
  },
};

const GRADE_ORDER: RatingGrade[] = ['S+', 'S', 'A', 'B', 'C', 'D'];

export const getGradeInfo = (grade: RatingGrade) => GRADE_INFO[grade];
export const getAllGrades = (): RatingGrade[] => GRADE_ORDER;

const calculateTimeScore = (input: RatingInput): { score: number; feedback: string } => {
  const config = getDifficultyConfig(input.difficultyLevel);
  const expectedTimePerBook = config.gameTime / Math.max(input.totalBooksFound || 1, 1);
  const avgFind = input.avgFindTime || expectedTimePerBook;

  let score = 100;

  if (avgFind < 10) {
    score = 100;
  } else if (avgFind < 20) {
    score = 90;
  } else if (avgFind < 30) {
    score = 80;
  } else if (avgFind < 45) {
    score = 65;
  } else if (avgFind < 60) {
    score = 50;
  } else if (avgFind < 90) {
    score = 35;
  } else {
    score = 20;
  }

  const timeUsageRatio = input.totalGameTime > 0
    ? input.totalTimeUsed / input.totalGameTime
    : 0;

  if (input.completed && timeUsageRatio < 0.5) {
    score = Math.min(100, score + 10);
  }

  let feedback: string;
  if (score >= 90) {
    feedback = '⚡ 闪电般的速度！你对书籍位置的判断简直神准！';
  } else if (score >= 70) {
    feedback = '⏱️ 速度不错，找书效率很高！';
  } else if (score >= 50) {
    feedback = '⌛ 速度中规中矩，多熟悉书架布局可以更快哦。';
  } else {
    feedback = '🐢 还有提升空间，试着更快地判断书籍位置吧。';
  }

  return { score, feedback };
};

const calculateHintScore = (input: RatingInput): { score: number; feedback: string } => {
  const booksFound = Math.max(input.totalBooksFound || 1, 1);
  const hintsPerBook = input.totalHintsUsed / booksFound;

  let score = 100;

  if (input.totalHintsUsed === 0) {
    score = 100;
  } else if (hintsPerBook <= 0.5) {
    score = 90;
  } else if (hintsPerBook <= 1) {
    score = 75;
  } else if (hintsPerBook <= 2) {
    score = 60;
  } else if (hintsPerBook <= 3) {
    score = 45;
  } else if (hintsPerBook <= 4) {
    score = 30;
  } else {
    score = 15;
  }

  let feedback: string;
  if (score >= 90) {
    feedback = '🧠 独立思考！你很少依赖提示，推理能力超强！';
  } else if (score >= 70) {
    feedback = '💡 提示使用得当，有自己的思考节奏。';
  } else if (score >= 50) {
    feedback = '🔍 尝试先根据已有线索推理，再使用提示会更好。';
  } else {
    feedback = '📝 试着少用提示，挑战一下自己的推理能力吧！';
  }

  return { score, feedback };
};

const calculateAccuracyScore = (input: RatingInput): { score: number; feedback: string } => {
  const booksFound = Math.max(input.totalBooksFound || 1, 1);
  const wrongPerBook = input.totalWrongPicks / booksFound;

  let score = 100;

  if (input.totalWrongPicks === 0) {
    score = 100;
  } else if (wrongPerBook <= 0.3) {
    score = 90;
  } else if (wrongPerBook <= 0.6) {
    score = 75;
  } else if (wrongPerBook <= 1) {
    score = 60;
  } else if (wrongPerBook <= 1.5) {
    score = 45;
  } else if (wrongPerBook <= 2) {
    score = 30;
  } else {
    score = 15;
  }

  let feedback: string;
  if (score >= 90) {
    feedback = '🎯 百步穿杨！你的判断几乎不会出错！';
  } else if (score >= 70) {
    feedback = '✅ 准确率很高，偶尔的小失误不影响大局。';
  } else if (score >= 50) {
    feedback = '🔎 多加练习，提高对书籍特征的识别能力。';
  } else {
    feedback = '📌 仔细比对线索和书籍特征，别急着点击哦。';
  }

  return { score, feedback };
};

const calculateStreakScore = (input: RatingInput): { score: number; feedback: string } => {
  const streak = input.bestStreak || input.currentStreak || 0;

  let score: number;

  if (streak >= 20) {
    score = 100;
  } else if (streak >= 12) {
    score = 90;
  } else if (streak >= 8) {
    score = 80;
  } else if (streak >= 5) {
    score = 65;
  } else if (streak >= 3) {
    score = 50;
  } else if (streak >= 1) {
    score = 35;
  } else {
    score = 20;
  }

  let feedback: string;
  if (score >= 90) {
    feedback = '🔥 连胜达人！你的状态火热，势不可挡！';
  } else if (score >= 70) {
    feedback = '⚡ 连胜表现出色，保持这个状态！';
  } else if (score >= 50) {
    feedback = '📈 有进步的势头，争取更高的连胜记录！';
  } else {
    feedback = '💪 不要气馁，专注每一局，连胜会越来越长！';
  }

  return { score, feedback };
};

const calculateGrade = (totalScore: number): RatingGrade => {
  for (const grade of GRADE_ORDER) {
    if (totalScore >= GRADE_THRESHOLDS[grade]) {
      return grade;
    }
  }
  return 'D';
};

const generateOverallDescription = (
  grade: RatingGrade,
  input: RatingInput
): string => {
  if (!input.completed && input.totalBooksFound === 0) {
    return '新的尝试，每一次开始都是进步的起点！整理好思路，再来一局吧！';
  }

  switch (grade) {
    case 'S+':
      return '难以置信的完美表现！你已经完全掌握了找书的艺术，是真正的旧书店传奇！';
    case 'S':
      return '卓越的表现！你对书籍的了解和敏锐的判断力令人印象深刻！';
    case 'A':
      return '非常出色的成绩！你已经是一名经验丰富的寻书人了！';
    case 'B':
      return '表现稳定，继续保持这个节奏，你会变得更强！';
    case 'C':
      return '不错的起步，还有很大的提升空间，加油！';
    case 'D':
    default:
      return '每一次尝试都是学习的过程，熟悉线索和书架后会越来越得心应手的！';
  }
};

export const calculateRating = (input: RatingInput): RatingResult => {
  const timeResult = calculateTimeScore(input);
  const hintResult = calculateHintScore(input);
  const accuracyResult = calculateAccuracyScore(input);
  const streakResult = calculateStreakScore(input);

  const weights = {
    time: 0.25,
    hints: 0.25,
    accuracy: 0.3,
    streak: 0.2,
  };

  const weightedTotal =
    timeResult.score * weights.time +
    hintResult.score * weights.hints +
    accuracyResult.score * weights.accuracy +
    streakResult.score * weights.streak;

  const breakdown: RatingScoreBreakdown = {
    timeScore: Math.round(timeResult.score),
    hintScore: Math.round(hintResult.score),
    accuracyScore: Math.round(accuracyResult.score),
    streakScore: Math.round(streakResult.score),
    totalScore: Math.round(weightedTotal),
  };

  const grade = calculateGrade(weightedTotal);
  const gradeInfo = GRADE_INFO[grade];

  const baseBonus = 100;
  const bonusScore = Math.floor(
    baseBonus * gradeInfo.rewardMultiplier * Math.max(input.totalBooksFound, 1)
  );

  return {
    grade,
    score: breakdown.totalScore,
    breakdown,
    title: gradeInfo.title,
    description: generateOverallDescription(grade, input),
    detailedFeedback: {
      time: timeResult.feedback,
      hints: hintResult.feedback,
      accuracy: accuracyResult.feedback,
      streak: streakResult.feedback,
    },
    rewardMultiplier: gradeInfo.rewardMultiplier,
    bonusScore,
  };
};

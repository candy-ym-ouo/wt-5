import type { LeaderboardEntry } from '../types/game';

export const LEADERBOARD_KEY = 'old_bookstore_leaderboard';
export const ACHIEVEMENTS_KEY = 'old_bookstore_achievements';
export const GAME_STATS_KEY = 'old_bookstore_stats';

export const getLeaderboard = (): LeaderboardEntry[] => {
  try {
    const data = localStorage.getItem(LEADERBOARD_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveLeaderboardEntry = (entry: LeaderboardEntry): LeaderboardEntry[] => {
  const leaderboard = getLeaderboard();
  leaderboard.push(entry);
  leaderboard.sort((a, b) => b.score - a.score);
  const topTen = leaderboard.slice(0, 10);
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(topTen));
  return topTen;
};

export const getUnlockedAchievements = (): string[] => {
  try {
    const data = localStorage.getItem(ACHIEVEMENTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveUnlockedAchievements = (ids: string[]): void => {
  localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(ids));
};

export const getGamesPlayed = (): number => {
  try {
    const data = localStorage.getItem(GAME_STATS_KEY);
    if (data) {
      const stats = JSON.parse(data);
      return stats.gamesPlayed || 0;
    }
    return 0;
  } catch {
    return 0;
  }
};

export const incrementGamesPlayed = (): number => {
  const current = getGamesPlayed();
  const newCount = current + 1;
  localStorage.setItem(GAME_STATS_KEY, JSON.stringify({ gamesPlayed: newCount }));
  return newCount;
};

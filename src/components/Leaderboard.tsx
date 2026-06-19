import { createSignal, createMemo, For } from 'solid-js';
import type { LeaderboardTab } from '../types/game';
import {
  getLeaderboard,
  saveLeaderboardEntry,
  getWeeklyLeaderboard,
  getSeasonLeaderboard,
  getPersonalBest,
  getCurrentSeason,
  getCurrentWeekNumber,
} from '../utils/storage';
import { ACHIEVEMENTS } from '../data/achievements';
import { gameState, checkAchievements } from '../store/gameStore';

interface LeaderboardProps {
  onClose: () => void;
  initialTab?: LeaderboardTab;
}

export default function Leaderboard(props: LeaderboardProps) {
  const [activeTab, setActiveTab] = createSignal<LeaderboardTab>(props.initialTab || 'weekly');
  const [playerName, setPlayerName] = createSignal('');
  const [hasSubmitted, setHasSubmitted] = createSignal(false);
  const [, setLeaderboardVersion] = createSignal(0);
  const state = createMemo(() => gameState());
  const currentScore = createMemo(() => state().score);
  const unlockedIds = createMemo(() => state().unlockedAchievements);
  const season = createMemo(() => getCurrentSeason());
  const weekNum = createMemo(() => getCurrentWeekNumber());
  const personalBest = createMemo(() => getPersonalBest());

  const getRankClass = (index: number): string => {
    if (index === 0) return 'gold';
    if (index === 1) return 'silver';
    if (index === 2) return 'bronze';
    return '';
  };

  const getDisplayEntries = createMemo(() => {
    const tab = activeTab();
    if (tab === 'weekly') return getWeeklyLeaderboard();
    if (tab === 'overall') return getSeasonLeaderboard();
    return getLeaderboard();
  });

  const handleSubmit = () => {
    if (!playerName().trim() || hasSubmitted()) return;

    const entry = {
      id: Date.now().toString(),
      playerName: playerName().trim(),
      score: currentScore(),
      timeUsed: 180 - state().timeRemaining,
      hintsUsed: state().hintsUsed,
      date: Date.now(),
      difficulty: state().difficultyLevel,
      streak: state().streak?.currentStreak || 0,
      bestStreak: state().streak?.bestStreak || 0,
    };

    saveLeaderboardEntry(entry);
    setLeaderboardVersion(v => v + 1);
    setHasSubmitted(true);
    setTimeout(() => checkAchievements(), 0);
  };

  const formatDate = (timestamp: number): string => {
    const d = new Date(timestamp);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return '-';
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    return `${Math.floor(seconds / 60)}m${Math.floor(seconds % 60)}s`;
  };

  const unlockedCount = createMemo(() => unlockedIds().length);

  return (
    <div class="modal-overlay" onClick={props.onClose}>
      <div class="modal-content season-leaderboard-modal" onClick={(e) => e.stopPropagation()}>
        <div class="season-header">
          <div class="season-title">{season().name} 赛季</div>
          <div class="season-info">第 {weekNum()} 周</div>
        </div>

        <div class="tabs season-tabs">
          <button
            class={`tab-button ${activeTab() === 'weekly' ? 'active' : ''}`}
            onClick={() => setActiveTab('weekly')}
          >
            📅 周榜
          </button>
          <button
            class={`tab-button ${activeTab() === 'overall' ? 'active' : ''}`}
            onClick={() => setActiveTab('overall')}
          >
            🏆 赛季总榜
          </button>
          <button
            class={`tab-button ${activeTab() === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            👤 个人最佳
          </button>
          <button
            class={`tab-button ${activeTab() === 'achievements' ? 'active' : ''}`}
            onClick={() => setActiveTab('achievements')}
          >
            🎖️ 成就
          </button>
        </div>

        {activeTab() === 'weekly' && (
          <>
            <div class="modal-title modal-title-sm">本周排行榜</div>
            <div class="leaderboard-list">
              <For each={getDisplayEntries()}>
                {(entry, index) => (
                  <div class="leaderboard-item">
                    <span class={`leaderboard-rank ${getRankClass(index())}`}>
                      #{index() + 1}
                    </span>
                    <span class="leaderboard-name">
                      {entry.playerName}
                      {entry.streak && entry.streak >= 3 && (
                        <span class="leaderboard-streak"> 🔥 {entry.streak}</span>
                      )}
                    </span>
                    <span class="leaderboard-meta">{formatDate(entry.date)}</span>
                    <span class="leaderboard-score">{entry.score} 分</span>
                  </div>
                )}
              </For>
              {getDisplayEntries().length === 0 && (
                <div class="leaderboard-empty">本周暂无记录，快来挑战吧！</div>
              )}
            </div>

            {currentScore() > 0 && !hasSubmitted() && (
              <div class="section-sm">
                <div class="text-gold">你的分数：{currentScore()} 分</div>
                {state().streak?.currentStreak > 0 && (
                  <div class="text-orange">当前连胜：{state().streak.currentStreak} 局 🔥</div>
                )}
                <input
                  type="text"
                  class="input-field"
                  placeholder="输入你的名字"
                  value={playerName()}
                  onInput={(e) => setPlayerName(e.currentTarget.value)}
                  maxlength={12}
                />
                <button class="modal-button" onClick={handleSubmit}>提交分数</button>
              </div>
            )}
          </>
        )}

        {activeTab() === 'overall' && (
          <>
            <div class="modal-title modal-title-sm">{season().name} 赛季总榜</div>
            <div class="leaderboard-list">
              <For each={getDisplayEntries()}>
                {(entry, index) => (
                  <div class="leaderboard-item">
                    <span class={`leaderboard-rank ${getRankClass(index())}`}>
                      #{index() + 1}
                    </span>
                    <span class="leaderboard-name">
                      {entry.playerName}
                      {entry.bestStreak && entry.bestStreak >= 5 && (
                        <span class="leaderboard-best-streak"> 🏆 {entry.bestStreak}</span>
                      )}
                    </span>
                    <span class="leaderboard-meta">
                      W{entry.weekNumber ?? '-'}
                    </span>
                    <span class="leaderboard-score">{entry.score} 分</span>
                  </div>
                )}
              </For>
              {getDisplayEntries().length === 0 && (
                <div class="leaderboard-empty">赛季暂无记录，成为第一个上榜的人吧！</div>
              )}
            </div>

            {currentScore() > 0 && !hasSubmitted() && (
              <div class="section-sm">
                <div class="text-gold">你的分数：{currentScore()} 分</div>
                {state().streak?.bestStreak > 0 && (
                  <div class="text-purple">最高连胜：{state().streak.bestStreak} 局 🏆</div>
                )}
                <input
                  type="text"
                  class="input-field"
                  placeholder="输入你的名字"
                  value={playerName()}
                  onInput={(e) => setPlayerName(e.currentTarget.value)}
                  maxlength={12}
                />
                <button class="modal-button" onClick={handleSubmit}>提交分数</button>
              </div>
            )}
          </>
        )}

        {activeTab() === 'personal' && (
          <>
            <div class="modal-title modal-title-sm">个人最佳记录</div>
            <div class="personal-best-grid">
              <div class="personal-best-card highlight">
                <div class="pb-icon">🏆</div>
                <div class="pb-label">最高得分</div>
                <div class="pb-value">{personalBest().highestScore}</div>
                {personalBest().highestScoreDate > 0 && (
                  <div class="pb-date">{formatDate(personalBest().highestScoreDate)}</div>
                )}
              </div>
              <div class="personal-best-card">
                <div class="pb-icon">⚡</div>
                <div class="pb-label">最快找到</div>
                <div class="pb-value">{formatTime(personalBest().fastestFind)}</div>
                {personalBest().fastestFindDate > 0 && (
                  <div class="pb-date">{formatDate(personalBest().fastestFindDate)}</div>
                )}
              </div>
              <div class="personal-best-card">
                <div class="pb-icon">🎯</div>
                <div class="pb-label">最少提示</div>
                <div class="pb-value">{personalBest().fewestHintsCount < 0 ? '-' : personalBest().fewestHintsCount + '次'}</div>
                {personalBest().fewestHintsDate > 0 && (
                  <div class="pb-date">{formatDate(personalBest().fewestHintsDate)}</div>
                )}
              </div>
              <div class="personal-best-card">
                <div class="pb-icon">🔥</div>
                <div class="pb-label">最长连对</div>
                <div class="pb-value">{personalBest().longestStreak} 局</div>
                {personalBest().longestStreakDate > 0 && (
                  <div class="pb-date">{formatDate(personalBest().longestStreakDate)}</div>
                )}
              </div>
              <div class="personal-best-card">
                <div class="pb-icon">🎮</div>
                <div class="pb-label">累计游玩</div>
                <div class="pb-value">{personalBest().totalGamesPlayed} 局</div>
              </div>
              <div class="personal-best-card">
                <div class="pb-icon">📚</div>
                <div class="pb-label">累计找书</div>
                <div class="pb-value">{personalBest().totalBooksFound} 本</div>
              </div>
            </div>

            <div class="personal-season-weekly">
              <div class="psw-section">
                <div class="psw-title">📅 本周最佳</div>
                <div class="psw-value">{personalBest().weeklyBestScores[weekNum()] ?? 0} 分</div>
              </div>
              <div class="psw-section">
                <div class="psw-title">🏆 赛季最佳</div>
                <div class="psw-value">{personalBest().seasonBestScores[season().id] ?? 0} 分</div>
              </div>
            </div>
          </>
        )}

        {activeTab() === 'achievements' && (
          <>
            <div class="modal-title modal-title-sm">成就列表</div>
            <div class="achievements-stats-bar">
              <div class="ach-stat">
                <div class="ach-stat-value">{unlockedCount()}/{ACHIEVEMENTS.length}</div>
                <div class="ach-stat-label">已解锁</div>
              </div>
              <div class="ach-stat">
                <div class="ach-stat-value">{Math.round(unlockedCount() / ACHIEVEMENTS.length * 100)}%</div>
                <div class="ach-stat-label">完成度</div>
              </div>
              <div class="ach-progress-bar">
                <div
                  class="ach-progress-fill"
                  style={{ width: `${unlockedCount() / ACHIEVEMENTS.length * 100}%` }}
                />
              </div>
            </div>
            <div class="achievements-grid">
              <For each={ACHIEVEMENTS}>
                {(achievement) => {
                  const isUnlocked = createMemo(() => unlockedIds().includes(achievement.id));
                  return (
                    <div class={`achievement-item ${isUnlocked() ? 'unlocked' : 'locked'}`}>
                      <div class="achievement-icon">{achievement.icon}</div>
                      <div class="achievement-name">{achievement.title}</div>
                      <div class="achievement-desc">{achievement.description}</div>
                    </div>
                  );
                }}
              </For>
            </div>
          </>
        )}

        <button class="modal-button secondary" onClick={props.onClose}>
          关闭
        </button>
      </div>
    </div>
  );
}

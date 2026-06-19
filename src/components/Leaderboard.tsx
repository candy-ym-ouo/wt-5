import { createSignal, createMemo, For } from 'solid-js';
import { getLeaderboard, saveLeaderboardEntry } from '../utils/storage';
import { ACHIEVEMENTS } from '../data/achievements';
import { gameState } from '../store/gameStore';

interface LeaderboardProps {
  onClose: () => void;
}

export default function Leaderboard(props: LeaderboardProps) {
  const [activeTab, setActiveTab] = createSignal<'leaderboard' | 'achievements'>('leaderboard');
  const [leaderboard, setLeaderboard] = createSignal(getLeaderboard());
  const [playerName, setPlayerName] = createSignal('');
  const [hasSubmitted, setHasSubmitted] = createSignal(false);
  const state = createMemo(() => gameState());
  const currentScore = createMemo(() => state().score);
  const unlockedIds = createMemo(() => state().unlockedAchievements);

  const getRankClass = (index: number): string => {
    if (index === 0) return 'gold';
    if (index === 1) return 'silver';
    if (index === 2) return 'bronze';
    return '';
  };

  const handleSubmit = () => {
    if (!playerName().trim() || hasSubmitted()) return;

    const entry = {
      id: Date.now().toString(),
      playerName: playerName().trim(),
      score: currentScore(),
      timeUsed: 180 - state().timeRemaining,
      hintsUsed: state().hintsUsed,
      date: Date.now(),
    };

    const newLeaderboard = saveLeaderboardEntry(entry);
    setLeaderboard(newLeaderboard);
    setHasSubmitted(true);
  };

  return (
    <div class="modal-overlay" onClick={props.onClose}>
      <div class="modal-content" onClick={(e) => e.stopPropagation()}>
        <div class="tabs">
          <button
            class={`tab-button ${activeTab() === 'leaderboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('leaderboard')}
          >
            🏆 排行榜
          </button>
          <button
            class={`tab-button ${activeTab() === 'achievements' ? 'active' : ''}`}
            onClick={() => setActiveTab('achievements')}
          >
            🎖️ 成就
          </button>
        </div>

        {activeTab() === 'leaderboard' ? (
          <>
            <div class="modal-title modal-title-sm">本地排行榜</div>
            <div class="leaderboard-list">
              <For each={leaderboard()}>
                {(entry, index) => (
                  <div class="leaderboard-item">
                    <span class={`leaderboard-rank ${getRankClass(index())}`}>
                      #{index() + 1}
                    </span>
                    <span class="leaderboard-name">{entry.playerName}</span>
                    <span class="leaderboard-score">{entry.score} 分</span>
                  </div>
                )}
              </For>
              {leaderboard().length === 0 && (
                <div class="leaderboard-empty">
                  暂无记录，成为第一个上榜的人吧！
                </div>
              )}
            </div>

            {currentScore() > 0 && !hasSubmitted() && (
              <div class="section-sm">
                <div class="text-gold">你的分数：{currentScore()} 分</div>
                <input
                  type="text"
                  class="input-field"
                  placeholder="输入你的名字"
                  value={playerName()}
                  onInput={(e) => setPlayerName(e.currentTarget.value)}
                  maxlength={12}
                />
                <button class="modal-button" onClick={handleSubmit}>
                  提交分数
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div class="modal-title modal-title-sm">成就列表</div>
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

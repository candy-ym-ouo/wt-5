import { ACHIEVEMENTS } from '../data/achievements';
import { gameState } from '../store/gameStore';
import { For } from 'solid-js';

export default function AchievementList() {
  const state = gameState();
  const unlockedIds = state.unlockedAchievements;

  return (
    <div class="sidebar-section">
      <div class="section-title achievement-section-title">
        <span>🏆</span>
        <span>成就</span>
        <span class="achievement-count">
          {unlockedIds.length}/{ACHIEVEMENTS.length}
        </span>
      </div>
      <div class="achievements-container">
        <For each={ACHIEVEMENTS}>
          {(achievement) => {
            const isUnlocked = unlockedIds.includes(achievement.id);
            return (
              <div
                class={`achievement-icon-item ${isUnlocked ? '' : 'locked'}`}
                title={`${achievement.title} - ${achievement.description}`}
              >
                {achievement.icon}
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
}

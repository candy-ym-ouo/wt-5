import { createMemo } from 'solid-js';
import { ACHIEVEMENTS } from '../data/achievements';
import { gameState } from '../store/gameStore';
import { For } from 'solid-js';

export default function AchievementList() {
  const unlockedIds = createMemo(() => gameState().unlockedAchievements);
  const unlockedCount = createMemo(() => unlockedIds().length);

  return (
    <div class="sidebar-section">
      <div class="section-title achievement-section-title">
        <span>🏆</span>
        <span>成就</span>
        <span class="achievement-count">
          {unlockedCount()}/{ACHIEVEMENTS.length}
        </span>
      </div>
      <div class="achievements-container">
        <For each={ACHIEVEMENTS}>
          {(achievement) => {
            const isUnlocked = createMemo(() => unlockedIds().includes(achievement.id));
            return (
              <div
                class={`achievement-icon-item ${isUnlocked() ? '' : 'locked'}`}
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

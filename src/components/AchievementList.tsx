import { createMemo, createSignal } from 'solid-js';
import { ACHIEVEMENTS } from '../data/achievements';
import { gameState, achievementProgress } from '../store/gameStore';
import { For } from 'solid-js';
import type { Achievement, AchievementProgress } from '../types/game';

function formatDate(timestamp?: number): string {
  if (!timestamp) return '未完成';
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getProgressPercent(achievement: Achievement, progress: AchievementProgress | undefined): number {
  if (achievement.type === 'single') {
    return progress?.completedAt ? 100 : 0;
  }
  if (!achievement.maxProgress || !progress) return 0;
  return Math.min(100, (progress.currentProgress / achievement.maxProgress) * 100);
}

function AchievementDetailModal(props: { achievement: Achievement; onClose: () => void }) {
  const progress = createMemo(() => achievementProgress()[props.achievement.id]);
  const progressPercent = createMemo(() => getProgressPercent(props.achievement, progress()));
  const isUnlocked = createMemo(() => gameState().unlockedAchievements.includes(props.achievement.id));

  return (
    <div class="achievement-detail-overlay" onClick={props.onClose}>
      <div class="achievement-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div class="achievement-detail-header">
          <div class="achievement-detail-icon">{props.achievement.icon}</div>
          <div class="achievement-detail-info">
            <h3 class="achievement-detail-title">{props.achievement.title}</h3>
            <p class="achievement-detail-desc">{props.achievement.description}</p>
          </div>
          <button class="achievement-detail-close" onClick={props.onClose}>×</button>
        </div>

        <div class="achievement-detail-progress">
          <div class="progress-bar-container">
            <div 
              class="progress-bar-fill" 
              style={{ width: `${progressPercent()}%` }}
            ></div>
          </div>
          <div class="progress-text">
            {props.achievement.type === 'progressive' 
              ? `${progress()?.currentProgress || 0} / ${props.achievement.maxProgress || 0}`
              : isUnlocked() ? '已完成' : '未完成'
            }
          </div>
        </div>

        {props.achievement.type === 'progressive' && props.achievement.stages && (
          <div class="achievement-stages">
            <h4 class="stages-title">阶段成就</h4>
            <div class="stages-list">
              <For each={props.achievement.stages}>
                {(stage) => {
                  const isStageUnlocked = progress()?.unlockedStages.includes(stage.id);
                  const stageTime = progress()?.stageUnlockTimes?.[stage.id];
                  return (
                    <div class={`stage-item ${isStageUnlocked ? 'unlocked' : 'locked'}`}>
                      <div class="stage-icon">
                        {isStageUnlocked ? '✓' : '○'}
                      </div>
                      <div class="stage-info">
                        <div class="stage-title">{stage.title}</div>
                        <div class="stage-desc">{stage.description}</div>
                        {isStageUnlocked && stageTime && (
                          <div class="stage-time">完成于 {formatDate(stageTime)}</div>
                        )}
                      </div>
                      <div class="stage-threshold">{stage.threshold}</div>
                    </div>
                  );
                }}
              </For>
            </div>
          </div>
        )}

        {isUnlocked() && (
          <div class="achievement-unlock-time">
            <span>解锁时间：</span>
            <span>{formatDate(progress()?.unlockedAt || progress()?.completedAt)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AchievementList() {
  const unlockedIds = createMemo(() => gameState().unlockedAchievements);
  const unlockedCount = createMemo(() => unlockedIds().length);
  const [selectedAchievement, setSelectedAchievement] = createSignal<Achievement | null>(null);

  const openDetail = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
  };

  const closeDetail = () => {
    setSelectedAchievement(null);
  };

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
            const progress = createMemo(() => achievementProgress()[achievement.id]);
            const progressPercent = createMemo(() => getProgressPercent(achievement, progress()));
            
            return (
              <div
                class={`achievement-icon-item ${isUnlocked() ? '' : 'locked'}`}
                title={`${achievement.title} - ${achievement.description}`}
                onClick={() => openDetail(achievement)}
              >
                {achievement.icon}
                {achievement.type === 'progressive' && (
                  <div class="achievement-mini-progress">
                    <div 
                      class="achievement-mini-progress-fill"
                      style={{ width: `${progressPercent()}%` }}
                    ></div>
                  </div>
                )}
              </div>
            );
          }}
        </For>
      </div>

      {selectedAchievement() && (
        <AchievementDetailModal 
          achievement={selectedAchievement()!} 
          onClose={closeDetail} 
        />
      )}
    </div>
  );
}

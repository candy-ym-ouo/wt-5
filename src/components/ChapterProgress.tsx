import { createMemo } from 'solid-js';
import { gameState, chapterTasks, currentTask, getCurrentChapter } from '../store/gameStore';

export default function ChapterProgress() {
  const state = createMemo(() => gameState());
  const chapter = createMemo(() => getCurrentChapter());
  const tasks = createMemo(() => chapterTasks());
  const task = createMemo(() => currentTask());

  const isChapterMode = createMemo(() => state().gameMode === 'chapter');

  if (!isChapterMode()) return null;

  const progressPercent = tasks().length > 0
    ? ((state().currentTaskIndex + (state().state === 'won' ? 1 : 0)) / tasks().length) * 100
    : 0;

  return (
    <div class="chapter-progress-section">
      <div class="section-title">
        <span>📖</span>
        <span>章节进度</span>
      </div>
      
      <div class="chapter-info-card">
        <div class="chapter-info-header">
          <span class="chapter-info-icon">{chapter()?.icon}</span>
          <div>
            <div class="chapter-info-subtitle">{chapter()?.subtitle}</div>
            <div class="chapter-info-title">{chapter()?.title}</div>
          </div>
        </div>

        <div class="progress-bar-container">
          <div class="progress-bar-bg">
            <div 
              class="progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div class="progress-text">
            {state().currentTaskIndex + (state().state === 'won' ? 1 : 0)} / {tasks().length} 任务
          </div>
        </div>
      </div>

      {task() && (
        <div class="current-task-info">
          <div class="task-label">当前任务</div>
          <div class="task-name">
            第 {state().currentLevel} 关：{task()?.title}
          </div>
          <div class="task-desc">{task()?.description}</div>
        </div>
      )}

      <div class="chapter-stats-row">
        <div class="chapter-stat">
          <div class="chapter-stat-value">{state().chapterScore}</div>
          <div class="chapter-stat-label">章节得分</div>
        </div>
        <div class="chapter-stat">
          <div class="chapter-stat-value">{Math.floor(state().chapterTimeUsed)}s</div>
          <div class="chapter-stat-label">用时</div>
        </div>
        <div class="chapter-stat">
          <div class="chapter-stat-value">{state().chapterHintsUsed}</div>
          <div class="chapter-stat-label">提示使用</div>
        </div>
      </div>

      {chapter()?.bonusScore && (
        <div class="bonus-hint">
          ⭐ 完成全部任务可获得额外 {chapter()?.bonusScore} 分奖励
        </div>
      )}
    </div>
  );
}

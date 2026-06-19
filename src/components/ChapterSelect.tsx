import { createSignal, createMemo, onMount } from 'solid-js';
import { CHAPTERS } from '../data/chapters';
import { startChapterGame, resetGame } from '../store/gameStore';
import {
  getChapterProgress,
  getUnlockedChapterIds,
  getCompletedChaptersCount,
  getAllChapterProgress,
} from '../utils/storage';
import type { Chapter } from '../types/game';

interface ChapterSelectProps {
  onBack: () => void;
}

export default function ChapterSelect(props: ChapterSelectProps) {
  const [selectedChapter, setSelectedChapter] = createSignal<Chapter | null>(null);
  const [unlockedIds, setUnlockedIds] = createSignal<string[]>([]);

  onMount(() => {
    setUnlockedIds(getUnlockedChapterIds());
  });

  const chaptersWithProgress = createMemo(() => {
    const allProgress = getAllChapterProgress();
    return CHAPTERS.map(chapter => {
      const progress = allProgress[chapter.id];
      const isUnlocked = unlockedIds().includes(chapter.id);
      const isCompleted = !!progress?.completedAt;
      const progressPercent = progress
        ? (progress.completedTasks.length / chapter.tasks.length) * 100
        : 0;

      return {
        ...chapter,
        isUnlocked,
        isCompleted,
        progressPercent,
        currentTask: progress?.currentTaskIndex || 0,
        totalScore: progress?.totalScore || 0,
      };
    });
  });

  const handleSelectChapter = (chapter: Chapter & { isUnlocked: boolean; isCompleted: boolean }) => {
    if (!chapter.isUnlocked) return;
    setSelectedChapter(chapter);
  };

  const handleStartChapter = () => {
    const chapter = selectedChapter();
    if (!chapter) return;

    resetGame();
    setTimeout(() => {
      startChapterGame(chapter.id);
      props.onBack();
    }, 100);
  };

  const handleContinue = () => {
    const chapter = selectedChapter();
    if (!chapter) return;

    resetGame();
    setTimeout(() => {
      startChapterGame(chapter.id);
      props.onBack();
    }, 100);
  };

  return (
    <div class="chapter-select-overlay">
      <div class="chapter-select-content">
        <div class="chapter-select-header">
          <button class="back-button" onClick={props.onBack}>
            ← 返回
          </button>
          <h2 class="chapter-select-title">📚 章节任务</h2>
          <div class="chapter-stats">
            已完成 {getCompletedChaptersCount()}/{CHAPTERS.length}
          </div>
        </div>

        <div class="chapters-grid">
          {chaptersWithProgress().map(chapter => (
            <div
              class={`chapter-card ${chapter.isUnlocked ? '' : 'locked'} ${
                chapter.isCompleted ? 'completed' : ''
              } ${selectedChapter()?.id === chapter.id ? 'selected' : ''}`}
              onClick={() => handleSelectChapter(chapter as any)}
            >
              <div class="chapter-icon">{chapter.icon}</div>
              <div class="chapter-subtitle">{chapter.subtitle}</div>
              <div class="chapter-title">{chapter.title}</div>
              <div class="chapter-theme">主题：{chapter.theme}</div>
              
              <div class="chapter-progress-bar">
                <div 
                  class="chapter-progress-fill"
                  style={{ width: `${chapter.progressPercent}%` }}
                />
              </div>
              
              <div class="chapter-tasks-count">
                {chapter.tasks.length} 个任务
                {chapter.isCompleted && <span class="completed-badge">✓ 已完成</span>}
              </div>

              {!chapter.isUnlocked && (
                <div class="locked-overlay">
                  <span class="lock-icon">🔒</span>
                  <span class="lock-text">未解锁</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {selectedChapter() && (
          <div class="chapter-detail-panel">
            <div class="detail-header">
              <span class="detail-icon">{selectedChapter()?.icon}</span>
              <div>
                <div class="detail-subtitle">{selectedChapter()?.subtitle}</div>
                <div class="detail-title">{selectedChapter()?.title}</div>
              </div>
            </div>
            
            <div class="detail-description">
              {selectedChapter()?.description}
            </div>

            <div class="detail-info">
              <div class="info-item">
                <span class="info-label">任务数量</span>
                <span class="info-value">{selectedChapter()?.tasks.length} 个</span>
              </div>
              <div class="info-item">
                <span class="info-label">通关奖励</span>
                <span class="info-value bonus">+{selectedChapter()?.bonusScore} 分</span>
              </div>
            </div>

            <div class="detail-tasks">
              <div class="tasks-title">任务列表</div>
              <div class="tasks-list">
                {(selectedChapter() as any)?.tasks?.map((task: any, index: number) => {
                  const progress = getChapterProgress(selectedChapter()!.id);
                  const isCompleted = progress?.completedTasks.includes(task.id);
                  return (
                    <div class={`task-item ${isCompleted ? 'done' : ''}`}>
                      <span class="task-number">{index + 1}</span>
                      <span class="task-title">{task.title}</span>
                      {isCompleted && <span class="task-check">✓</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div class="detail-actions">
              {(selectedChapter() as any)?.isCompleted ? (
                <button class="detail-button primary" onClick={handleStartChapter}>
                  重新挑战
                </button>
              ) : (selectedChapter() as any)?.currentTask > 0 ? (
                <>
                  <button class="detail-button primary" onClick={handleContinue}>
                    继续游戏
                  </button>
                  <button class="detail-button secondary" onClick={handleStartChapter}>
                    重新开始
                  </button>
                </>
              ) : (
                <button class="detail-button primary" onClick={handleStartChapter}>
                  开始挑战
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

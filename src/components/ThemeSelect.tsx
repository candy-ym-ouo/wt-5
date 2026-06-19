import { createSignal, createMemo } from 'solid-js';
import { THEMES, RARITY_CONFIG } from '../data/themes';
import { BOOKS } from '../data/books';
import { startThemeGame, resetGame, hasThemeProgress, continueThemeGame } from '../store/gameStore';
import {
  getAllThemeProgress,
  getCompletedThemesCount,
} from '../utils/storage';
import type { ThemeChallenge } from '../types/game';

interface ThemeSelectProps {
  onBack: () => void;
}

export default function ThemeSelect(props: ThemeSelectProps) {
  const [selectedTheme, setSelectedTheme] = createSignal<ThemeChallenge | null>(null);

  const themesWithProgress = createMemo(() => {
    const allProgress = getAllThemeProgress();
    
    return THEMES.map(theme => {
      const progress = allProgress[theme.id];
      const isCompleted = !!progress?.completedAt;
      const progressPercent = progress
        ? (progress.completedBookIds.length / (theme.requiredBooks || theme.bookIds.length)) * 100
        : 0;

      return {
        ...theme,
        isCompleted,
        progressPercent,
        currentTask: progress?.completedBookIds.length || 0,
        totalScore: progress?.totalScore || 0,
      };
    });
  });

  const handleSelectTheme = (theme: ThemeChallenge & { isCompleted: boolean; isUnlocked: boolean }) => {
    if (!theme.unlocked) return;
    setSelectedTheme(theme);
  };

  const handleStartTheme = () => {
    const theme = selectedTheme();
    if (!theme) return;

    resetGame();
    setTimeout(() => {
      startThemeGame(theme.id);
      props.onBack();
    }, 100);
  };

  const handleContinue = () => {
    const theme = selectedTheme();
    if (!theme) return;

    resetGame();
    setTimeout(() => {
      continueThemeGame(theme.id);
      props.onBack();
    }, 100);
  };

  return (
    <div class="theme-select-overlay">
      <div class="theme-select-content">
        <div class="theme-select-header">
          <button class="back-button" onClick={props.onBack}>
            ← 返回
          </button>
          <h2 class="theme-select-title">🎯 主题挑战</h2>
          <div class="theme-stats">
            已完成 {getCompletedThemesCount()}/{THEMES.length}
          </div>
        </div>

        <div class="themes-grid">
          {themesWithProgress().map(theme => (
            <div
              class={`theme-card ${theme.unlocked ? '' : 'locked'} ${
                theme.isCompleted ? 'completed' : ''
              } ${selectedTheme()?.id === theme.id ? 'selected' : ''}`}
              onClick={() => handleSelectTheme(theme as any)}
            >
              <div class="theme-icon">{theme.icon}</div>
              <div class="theme-title">{theme.title}</div>
              <div class="theme-theme">主题：{theme.theme}</div>
              
              <div class="theme-progress-bar">
                <div 
                  class="theme-progress-fill"
                  style={{ width: `${theme.progressPercent}%` }}
                />
              </div>
              
              <div class="theme-books-count">
                {theme.currentTask}/{theme.requiredBooks || theme.bookIds.length} 本书籍
                {theme.isCompleted && <span class="completed-badge">✓ 已完成</span>}
              </div>

              {!theme.unlocked && (
                <div class="locked-overlay">
                  <span class="lock-icon">🔒</span>
                  <span class="lock-text">未解锁</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {selectedTheme() && (
          <div class="theme-detail-panel">
            <div class="detail-header">
              <span class="detail-icon">{selectedTheme()?.icon}</span>
              <div>
                <div class="detail-title">{selectedTheme()?.title}</div>
                <div class="detail-theme">主题：{selectedTheme()?.theme}</div>
              </div>
            </div>
            
            <div class="detail-description">
              {selectedTheme()?.description}
            </div>

            <div class="detail-info">
              <div class="info-item">
                <span class="info-label">目标书籍</span>
                <span class="info-value">{selectedTheme()?.bookIds.length} 本</span>
              </div>
              <div class="info-item">
                <span class="info-label">通关奖励</span>
                <span class="info-value bonus">+{selectedTheme()?.bonusScore} 分</span>
              </div>
            </div>

            <div class="detail-books">
              <div class="books-title">包含书籍</div>
              <div class="books-list">
                {selectedTheme()?.bookIds?.map((bookId: string) => {
                  const progress = getAllThemeProgress()[selectedTheme()!.id];
                  const isFound = progress?.completedBookIds.includes(bookId);
                  const book = BOOKS.find((b: any) => b.id === bookId);
                  return (
                    <div class={`book-item ${isFound ? 'found' : ''}`}>
                      <span class="book-rarity" style={{ color: book ? RARITY_CONFIG[book.rarity].color : '#999' }}>
                        {book ? RARITY_CONFIG[book.rarity].icon : '📄'}
                      </span>
                      <span class="book-title">{book?.title || bookId}</span>
                      {isFound && <span class="book-check">✓</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div class="detail-actions">
              {(selectedTheme() as any)?.isCompleted ? (
                <button class="detail-button primary" onClick={handleStartTheme}>
                  重新挑战
                </button>
              ) : hasThemeProgress(selectedTheme()!.id) ? (
                <>
                  <button class="detail-button primary" onClick={handleContinue}>
                    继续游戏
                  </button>
                  <button class="detail-button secondary" onClick={handleStartTheme}>
                    重新开始
                  </button>
                </>
              ) : (
                <button class="detail-button primary" onClick={handleStartTheme}>
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

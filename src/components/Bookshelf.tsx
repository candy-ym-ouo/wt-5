import { onMount, onCleanup, createSignal, createEffect, createMemo, For } from 'solid-js';
import * as PIXI from 'pixi.js';
import { BOOKS, SHELF_COUNT } from '../data/books';
import { 
  selectBookWithRarity, 
  gameState, 
  showWrongWarning, 
  lastPenaltyInfo, 
  getWrongPenaltyInfo, 
  getThemeFilterInfo, 
  activateThemeFilter, 
  judgeThemeFilter, 
  currentClues,
  obscuredBookIds,
  falselyHighlightedBookIds,
  shuffledBookPositions,
} from '../store/gameStore';
import { getThemeById } from '../data/themes';
import type { Book, PenaltyLevel, ClueType } from '../types/game';
import { RandomEventActiveIndicator } from './RandomEventDisplay';
import { getUnlockedWorkshopRewardIds } from '../utils/workshopStorage';

export default function Bookshelf() {
  let containerRef: HTMLDivElement | undefined;
  let app: PIXI.Application | null = null;
  let bookSprites: Map<string, PIXI.Graphics> = new Map();
  let shelfContainers: PIXI.Container[] = [];
  
  const [hoveredBook, setHoveredBook] = createSignal<Book | null>(null);
  const [shakeTrigger, setShakeTrigger] = createSignal(0);

  const isWorkshopRewardUnlocked = (bookId: string): boolean => {
    return getUnlockedWorkshopRewardIds().has(bookId);
  };

  const unlockedClueTypes = createMemo<Set<ClueType>>(() => {
    return new Set(currentClues().filter(c => c.unlocked).map(c => c.type));
  });

  const penaltyLevelText = (level: PenaltyLevel): string => {
    switch (level) {
      case 'warning': return '⚠️ 警告';
      case 'caution': return '⚡ 注意';
      case 'danger': return '🔥 危险';
      case 'critical': return '💀 严重';
    }
  };

  const penaltyLevelDescription = (): string => {
    const info = lastPenaltyInfo();
    if (!info) return '';
    const parts = [`-${info.timePenalty}秒`];
    if (info.scorePenalty > 0) parts.push(`-${info.scorePenalty}分`);
    if (info.hintFrozen) parts.push(`提示冻结${Math.ceil(info.hintFreezeDuration / 1000)}秒`);
    return parts.join(' · ');
  };

  const themeHighlightedBookIds = createMemo(() => {
    const tfInfo = getThemeFilterInfo();
    if (!tfInfo.active || !tfInfo.displayThemeId) return new Set<string>();
    const theme = getThemeById(tfInfo.displayThemeId);
    if (!theme) return new Set<string>();
    return new Set(theme.bookIds);
  });

  const updateBookVisuals = () => {
    if (!app) return;
    const state = gameState();
    const targetId = state.targetBookId;
    const peekActive = state.powerUps.peekActive;
    const eliminatedIds = state.powerUps.eliminatedBookIds;
    const highlightedIds = themeHighlightedBookIds();
    const themeFilterActive = state.themeFilter.active;
    const obscuredIds = obscuredBookIds();
    const falseHighlightIds = falselyHighlightedBookIds();

    bookSprites.forEach((sprite, bookId) => {
      const book = BOOKS.find(b => b.id === bookId);
      if (!book) return;

      if (eliminatedIds.includes(bookId)) {
        sprite.alpha = 0.2;
        sprite.tint = 0x888888;
        sprite.interactive = false;
        sprite.buttonMode = false;
      } else if (obscuredIds.has(bookId)) {
        sprite.alpha = 0.2;
        sprite.tint = 0x222222;
        sprite.interactive = false;
        sprite.buttonMode = false;
      } else if (peekActive && bookId === targetId) {
        sprite.alpha = 1;
        sprite.tint = 0xffff00;
        sprite.interactive = true;
        sprite.buttonMode = true;
      } else if (falseHighlightIds.has(bookId)) {
        sprite.alpha = 1;
        sprite.tint = 0xffd700;
        sprite.interactive = true;
        sprite.buttonMode = true;
      } else if (themeFilterActive) {
        if (highlightedIds.has(bookId)) {
          sprite.alpha = 1;
          sprite.tint = state.themeFilter.isGenuine ? 0x00ff88 : 0xff6688;
        } else {
          sprite.alpha = 0.35;
          sprite.tint = 0x444444;
        }
        sprite.interactive = true;
        sprite.buttonMode = true;
      } else {
        sprite.alpha = 1;
        sprite.tint = 0xffffff;
        sprite.interactive = true;
        sprite.buttonMode = true;
      }
    });
  };

  onMount(() => {
    if (!containerRef) return;

    const width = containerRef.clientWidth;
    const height = containerRef.clientHeight;

    app = new PIXI.Application({
      width,
      height,
      transparent: true,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
    });

    containerRef.appendChild(app.view as HTMLCanvasElement);

    createBookshelf(width, height);

    const handleResize = () => {
      if (!app || !containerRef) return;
      const newWidth = containerRef.clientWidth;
      const newHeight = containerRef.clientHeight;
      app.renderer.resize(newWidth, newHeight);
      updateBookshelf(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    onCleanup(() => {
      window.removeEventListener('resize', handleResize);
      if (app) {
        app.destroy(true);
      }
    });
  });

  const createBookshelf = (width: number, height: number) => {
    if (!app) return;

    const bgGraphics = createBackgroundGraphics(width, height);
    const bgTexture = app.renderer.generateTexture(bgGraphics);
    const bg = new PIXI.Sprite(bgTexture);
    app.stage.addChild(bg);

    const shelfHeight = (height - 60) / SHELF_COUNT;
    const shelfY = 30;

    for (let i = 0; i < SHELF_COUNT; i++) {
      const shelfContainer = new PIXI.Container();
      shelfContainer.y = shelfY + i * shelfHeight;
      shelfContainers.push(shelfContainer);
      app.stage.addChild(shelfContainer);

      const shelfBoard = createShelfBoard(width);
      shelfBoard.y = shelfHeight - 30;
      shelfContainer.addChild(shelfBoard);

      const shelfBooks = BOOKS.filter(b => b.shelf === i);
      placeBooksOnShelf(shelfContainer, shelfBooks, width, shelfHeight);
    }
  };

  const createBackgroundGraphics = (width: number, height: number): PIXI.Graphics => {
    const graphics = new PIXI.Graphics();
    
    graphics.beginFill(0x1a0f0a);
    graphics.drawRect(0, 0, width, height);
    graphics.endFill();

    for (let i = 0; i < 50; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 30 + 10;
      graphics.beginFill(0x2c1810, Math.random() * 0.3 + 0.1);
      graphics.drawCircle(x, y, size);
      graphics.endFill();
    }

    return graphics;
  };

  const createShelfBoard = (width: number): PIXI.Graphics => {
    const graphics = new PIXI.Graphics();
    
    graphics.beginFill(0x654321);
    graphics.drawRect(0, 0, width, 30);
    graphics.endFill();

    graphics.beginFill(0x8B4513);
    for (let i = 0; i < width; i += 40) {
      graphics.drawRect(i, 0, 2, 30);
    }
    graphics.endFill();

    graphics.beginFill(0x5c3a21, 0.5);
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * width;
      const w = Math.random() * 60 + 20;
      graphics.drawRect(x, 5, w, 3);
    }
    graphics.endFill();

    return graphics;
  };

  const placeBooksOnShelf = (
    container: PIXI.Container,
    books: Book[],
    shelfWidth: number,
    shelfHeight: number,
    layoutAffected: boolean = false
  ) => {
    const totalBookWidth = books.reduce((sum, b) => sum + b.width, 0);
    const baseSpacing = (shelfWidth - totalBookWidth - 40) / (books.length + 1);
    let x = 20 + baseSpacing;

    const tfInfo = getThemeFilterInfo();
    const themeBookIds = layoutAffected && tfInfo.displayTheme 
      ? new Set(tfInfo.displayTheme.bookIds)
      : new Set<string>();

    books.forEach((book, index) => {
      const bookSprite = createBookSprite(book);
      const isThemeBook = themeBookIds.has(book.id);
      
      let extraSpacing = 0;
      if (layoutAffected && themeBookIds.size > 0) {
        if (index > 0) {
          const prevIsTheme = themeBookIds.has(books[index - 1].id);
          if (prevIsTheme !== isThemeBook) {
            extraSpacing = 25;
          }
        }
      }
      
      bookSprite.x = x + extraSpacing;
      bookSprite.y = shelfHeight - 30 - book.height;
      bookSprite.interactive = true;
      bookSprite.buttonMode = true;

      if (layoutAffected && isThemeBook) {
        bookSprite.scale.y = 1.08;
        bookSprite.y = shelfHeight - 30 - book.height * 1.08;
      }

      bookSprite.on('pointerover', () => {
        setHoveredBook(book);
        scaleBook(bookSprite, layoutAffected && isThemeBook ? 1.18 : 1.1, book.height);
      });

      bookSprite.on('pointerout', () => {
        setHoveredBook(null);
        scaleBook(bookSprite, layoutAffected && isThemeBook ? 1.08 : 1, book.height);
      });

      bookSprite.on('click', () => {
        handleBookClick(book, bookSprite);
      });

      container.addChild(bookSprite);
      bookSprites.set(book.id, bookSprite);

      x += book.width + baseSpacing + extraSpacing;
    });
  };

  const createBookSprite = (book: Book): PIXI.Graphics => {
    const graphics = new PIXI.Graphics();
    const isWorkshopLocked = book.workshopReward && !isWorkshopRewardUnlocked(book.id);
    const color = isWorkshopLocked ? 0x444444 : parseInt(book.color.replace('#', ''), 16);

    graphics.beginFill(color);
    graphics.drawRoundedRect(0, 0, book.width, book.height, 2);
    graphics.endFill();

    graphics.beginFill(0x000000, 0.2);
    graphics.drawRect(0, 0, 4, book.height);
    graphics.endFill();

    graphics.beginFill(0x000000, 0.1);
    for (let i = 0; i < 5; i++) {
      const y = (book.height / 6) * (i + 1);
      graphics.drawRect(4, y, book.width - 4, 1);
    }
    graphics.endFill();

    if (isWorkshopLocked) {
      graphics.beginFill(0x888888, 0.4);
      graphics.drawRect(0, 0, book.width, book.height);
      graphics.endFill();

      const lockX = book.width / 2;
      const lockY = book.height / 2;
      graphics.lineStyle(1.5, 0xcccccc);
      graphics.drawCircle(lockX, lockY - 3, 5);
      graphics.endFill();
      graphics.beginFill(0xcccccc);
      graphics.drawRect(lockX - 4, lockY, 8, 6);
      graphics.endFill();
    } else {
      graphics.beginFill(0xffd700, 0.6);
      graphics.drawRect(2, 8, book.width - 4, 4);
      graphics.endFill();

      graphics.beginFill(0xffd700, 0.6);
      graphics.drawRect(2, book.height - 12, book.width - 4, 4);
      graphics.endFill();
    }

    graphics.beginFill(0x000000, 0.15);
    graphics.drawRect(book.width - 3, 0, 3, book.height);
    graphics.endFill();

    return graphics;
  };

  const scaleBook = (sprite: PIXI.Graphics, scale: number, originalHeight: number) => {
    sprite.scale.y = scale;
    sprite.y += (originalHeight - originalHeight * scale) / 2;
  };

  const handleBookClick = (book: Book, sprite: PIXI.Graphics) => {
    const gameStatus = gameState().state;
    if (gameStatus !== 'playing') return;

    if (book.workshopReward && !isWorkshopRewardUnlocked(book.id)) return;

    const eliminatedIds = gameState().powerUps.eliminatedBookIds;
    if (eliminatedIds.includes(book.id)) return;

    const isCorrect = selectBookWithRarity(book.id);

    if (isCorrect) {
      sprite.tint = 0x00ff00;
      setTimeout(() => {
        sprite.tint = 0xffffff;
      }, 500);
    } else {
      sprite.tint = 0xff0000;
      setShakeTrigger(prev => prev + 1);
      setTimeout(() => {
        sprite.tint = 0xffffff;
      }, 500);
    }
  };

  const updateBookshelf = (width: number, height: number) => {
    if (!app) return;
    
    bookSprites.clear();
    shelfContainers.forEach(c => app!.stage.removeChild(c));
    shelfContainers = [];
    
    if (app.stage.children.length > 0) {
      const bg = app.stage.children[0];
      app.stage.removeChild(bg);
      bg.destroy();
    }

    const bgGraphics = createBackgroundGraphics(width, height);
    const bgTexture = app.renderer.generateTexture(bgGraphics);
    const bgSprite = new PIXI.Sprite(bgTexture);
    app.stage.addChildAt(bgSprite, 0);

    const shelfHeight = (height - 60) / SHELF_COUNT;
    const shelfY = 30;

    const tfInfo = getThemeFilterInfo();
    const themeBookIds = tfInfo.layoutAffected && tfInfo.displayTheme 
      ? new Set(tfInfo.displayTheme.bookIds)
      : new Set<string>();

    for (let i = 0; i < SHELF_COUNT; i++) {
      const shelfContainer = new PIXI.Container();
      shelfContainer.y = shelfY + i * shelfHeight;
      shelfContainers.push(shelfContainer);
      app.stage.addChild(shelfContainer);

      const shelfBoard = createShelfBoard(width);
      shelfBoard.y = shelfHeight - 30;
      shelfContainer.addChild(shelfBoard);

      let shelfBooks = BOOKS.filter(b => b.shelf === i);
      
      if (tfInfo.layoutAffected && themeBookIds.size > 0) {
        const themeBooks = shelfBooks.filter(b => themeBookIds.has(b.id));
        const otherBooks = shelfBooks.filter(b => !themeBookIds.has(b.id));
        shelfBooks = [...themeBooks, ...otherBooks];
      }

      placeBooksOnShelf(shelfContainer, shelfBooks, width, shelfHeight, tfInfo.layoutAffected);
    }
    
    updateBookVisuals();
  };

  createEffect(() => {
    const state = gameState();
    if (state.state === 'won' && state.targetBookId) {
      const targetSprite = bookSprites.get(state.targetBookId);
      if (targetSprite) {
        targetSprite.tint = 0x00ff00;
      }
    }
  });

  createEffect(() => {
    gameState();
    updateBookVisuals();
  });

  createEffect(() => {
    const tfInfo = getThemeFilterInfo();
    if (tfInfo.layoutAffected && containerRef) {
      const width = containerRef.clientWidth;
      const height = containerRef.clientHeight;
      updateBookshelf(width, height);
    }
  });

  createEffect(() => {
    obscuredBookIds();
    falselyHighlightedBookIds();
    shuffledBookPositions();
    updateBookVisuals();
  });

  createEffect(() => {
    const positions = shuffledBookPositions();
    if (positions && containerRef) {
      const width = containerRef.clientWidth;
      const height = containerRef.clientHeight;
      updateBookshelf(width, height);
    }
  });

  const themeFilterInfo = createMemo(() => getThemeFilterInfo());
  const isPlaying = createMemo(() => gameState().state === 'playing');
  
  const activeRandomEvent = createMemo(() => gameState().randomEvent.activeEvent);
  const bookshelfClass = createMemo(() => {
    const classes: string[] = ['bookshelf-section'];
    if (showWrongWarning()) {
      classes.push(`penalty-overlay penalty-${showWrongWarning()}`);
    }
    if (shakeTrigger() > 0) {
      classes.push('shake');
    }
    if (activeRandomEvent()) {
      const eventType = activeRandomEvent()!.event.type;
      if (eventType === 'power_outage') {
        classes.push('bookshelf-power-outage');
      } else if (eventType === 'fog_of_war') {
        classes.push('bookshelf-fog');
      }
    }
    return classes.join(' ');
  });

  return (
    <div 
      ref={containerRef} 
      class={bookshelfClass()}
      data-shake={shakeTrigger()}
    >
      <RandomEventActiveIndicator />
      <div class="theme-filter-panel">
        <div class="theme-filter-header">
          <span class="theme-filter-icon">🎭</span>
          <span class="theme-filter-title">分类提示（真伪难辨）</span>
          <span class="clue-progress-badge">
            🔍 {themeFilterInfo().unlockedClueCount}/7 线索
          </span>
        </div>
        
        {themeFilterInfo().available && themeFilterInfo().displayTheme && (
          <div class="theme-filter-content">
            <div class="theme-filter-suggestion">
              <span class="suggestion-label">系统猜测：</span>
              <span class="suggestion-theme-icon">{themeFilterInfo().displayTheme?.icon}</span>
              <span class="suggestion-theme-title">{themeFilterInfo().displayTheme?.title}</span>
              <span class="suggestion-theme-name">（{themeFilterInfo().displayTheme?.theme}）</span>
            </div>
            
            {!themeFilterInfo().usedThisRound && isPlaying() && (
              <div class="theme-filter-actions">
                <button 
                  class="theme-filter-btn activate-btn"
                  onClick={() => activateThemeFilter()}
                  disabled={themeFilterInfo().usedThisRound || !isPlaying()}
                >
                  启用此分类提示
                  <span class="btn-cost">
                    （-{themeFilterInfo().activationCost.timePenalty}s / -{themeFilterInfo().activationCost.scorePenalty}分）
                  </span>
                </button>
              </div>
            )}

            {themeFilterInfo().usedThisRound && isPlaying() && themeFilterInfo().judgment === null && (
              <div class="theme-filter-judgment">
                <div class="judgment-prompt">⚠️ 请判断此分类提示的真伪：</div>
                <div class="judgment-buttons">
                  <button 
                    class="judgment-btn trust-btn"
                    onClick={() => judgeThemeFilter('trusted')}
                  >
                    ✅ 信任此提示
                  </button>
                  <button 
                    class="judgment-btn distrust-btn"
                    onClick={() => judgeThemeFilter('distrusted')}
                  >
                    ❌ 怀疑此提示
                  </button>
                </div>
              </div>
            )}

            {themeFilterInfo().usedThisRound && themeFilterInfo().judgment !== null && (
              <div class={`judgment-result ${themeFilterInfo().judgment}`}>
                {themeFilterInfo().judgment === 'trusted' ? '✅ 你选择了信任此提示' : '❌ 你选择了怀疑此提示'}
              </div>
            )}
          </div>
        )}

        {!themeFilterInfo().available && !themeFilterInfo().usedThisRound && (
          <div class="theme-filter-locked">
            <div class="locked-icon">🔒</div>
            <div class="locked-text">
              解锁更多线索后可使用分类提示
            </div>
            <div class="locked-progress">
              <div class="progress-bar-bg">
                <div 
                  class="progress-bar-fill"
                  style={`width: ${Math.min(themeFilterInfo().unlockedClueCount / 3 * 100, 100)}%`}
                />
              </div>
              <span class="progress-text">
                {themeFilterInfo().unlockedClueCount}/3 线索解锁
              </span>
            </div>
          </div>
        )}

        <div class="theme-filter-footer">
          <span class="hint-text">💡 提示可能为真也可能为假，请结合线索判断！</span>
        </div>
      </div>

      {showWrongWarning() && (
        <div class={`penalty-warning-banner penalty-banner-${showWrongWarning()}`}>
          <div class="penalty-warning-title">
            {penaltyLevelText(showWrongWarning()!)}
          </div>
          <div class="penalty-warning-desc">
            {penaltyLevelDescription()}
          </div>
          <div class="penalty-warning-count">
            连续错误：{getWrongPenaltyInfo().consecutiveWrong} 次
          </div>
        </div>
      )}
      {hoveredBook() && (
        <div class="book-info-popup book-info-popup-large" style="position: absolute; top: 20px; left: 20px;">
          <div class="book-popup-title-row">
            <div class="book-popup-title">{hoveredBook()?.title}</div>
            <div class={`book-popup-rarity rarity-badge-${hoveredBook()?.rarity}`}>
              {hoveredBook()?.rarity === 'legendary' ? '🏆 传说' :
               hoveredBook()?.rarity === 'epic' ? '💎 史诗' :
               hoveredBook()?.rarity === 'rare' ? '✨ 稀有' :
               hoveredBook()?.rarity === 'uncommon' ? '📗 精良' : '📕 普通'}
            </div>
          </div>
          <div class="book-popup-meta-grid">
            <div class="book-popup-meta"><span class="meta-label">✍️ 作者</span>{hoveredBook()?.author}</div>
            <div class="book-popup-meta"><span class="meta-label">🕰️ 年份</span>{(() => { const y = hoveredBook()?.year ?? 0; return y < 0 ? `公元前${Math.abs(y)}年` : `${y}年`; })()}</div>
            <div class="book-popup-meta"><span class="meta-label">📚 分类</span>{hoveredBook()?.genre}</div>
            <div class="book-popup-meta"><span class="meta-label">🪜 书架</span>第{(hoveredBook()?.shelf ?? 0) + 1}层</div>
          </div>
          {unlockedClueTypes().has('description') ? (
            <div class="book-popup-section">
              <div class="popup-section-title">📖 简介</div>
              <div class="book-popup-desc">{hoveredBook()?.description}</div>
            </div>
          ) : (
            <div class="book-popup-section">
              <div class="popup-section-title">📖 简介</div>
              <div class="book-popup-locked">🔒 解锁「描述」线索后可见</div>
            </div>
          )}
          {unlockedClueTypes().has('background') ? (
            <div class="book-popup-section">
              <div class="popup-section-title">✨ 背景故事</div>
              <div class="book-popup-story">{hoveredBook()?.backgroundStory}</div>
            </div>
          ) : (
            <div class="book-popup-section">
              <div class="popup-section-title">✨ 背景故事</div>
              <div class="book-popup-locked">🔒 解锁「背景故事」线索后可见</div>
            </div>
          )}
          {unlockedClueTypes().has('description') ? (
            <div class="book-popup-section">
              <div class="popup-section-title">🔍 描述线索</div>
              <div class="book-popup-clues">
                <For each={hoveredBook()?.descriptionClues}>
                  {(clue) => (
                    <div class="popup-clue-item">
                      <span class="clue-bullet">•</span>
                      <span>{clue}</span>
                    </div>
                  )}
                </For>
              </div>
            </div>
          ) : (
            <div class="book-popup-section">
              <div class="popup-section-title">🔍 描述线索</div>
              <div class="book-popup-locked">🔒 解锁「描述」线索后可见</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

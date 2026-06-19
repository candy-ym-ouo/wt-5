import { onMount, onCleanup, createSignal, createEffect } from 'solid-js';
import * as PIXI from 'pixi.js';
import { BOOKS, SHELF_COUNT } from '../data/books';
import { selectBook, gameState } from '../store/gameStore';
import type { Book } from '../types/game';

export default function Bookshelf() {
  let containerRef: HTMLDivElement | undefined;
  let app: PIXI.Application | null = null;
  let bookSprites: Map<string, PIXI.Graphics> = new Map();
  let shelfContainers: PIXI.Container[] = [];
  
  const [hoveredBook, setHoveredBook] = createSignal<Book | null>(null);

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
    shelfHeight: number
  ) => {
    const totalBookWidth = books.reduce((sum, b) => sum + b.width, 0);
    const spacing = (shelfWidth - totalBookWidth - 40) / (books.length + 1);
    let x = 20 + spacing;

    books.forEach(book => {
      const bookSprite = createBookSprite(book);
      bookSprite.x = x;
      bookSprite.y = shelfHeight - 30 - book.height;
      bookSprite.interactive = true;
      bookSprite.buttonMode = true;

      bookSprite.on('pointerover', () => {
        setHoveredBook(book);
        scaleBook(bookSprite, 1.1, book.height);
      });

      bookSprite.on('pointerout', () => {
        setHoveredBook(null);
        scaleBook(bookSprite, 1, book.height);
      });

      bookSprite.on('click', () => {
        handleBookClick(book, bookSprite);
      });

      container.addChild(bookSprite);
      bookSprites.set(book.id, bookSprite);

      x += book.width + spacing;
    });
  };

  const createBookSprite = (book: Book): PIXI.Graphics => {
    const graphics = new PIXI.Graphics();
    const color = parseInt(book.color.replace('#', ''), 16);

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

    graphics.beginFill(0xffd700, 0.6);
    graphics.drawRect(2, 8, book.width - 4, 4);
    graphics.endFill();

    graphics.beginFill(0xffd700, 0.6);
    graphics.drawRect(2, book.height - 12, book.width - 4, 4);
    graphics.endFill();

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
    if (gameState().state !== 'playing') return;

    const isCorrect = selectBook(book.id);

    if (isCorrect) {
      sprite.tint = 0x00ff00;
      setTimeout(() => {
        sprite.tint = 0xffffff;
      }, 500);
    } else {
      sprite.tint = 0xff0000;
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

  createEffect(() => {
    const state = gameState();
    if (state.state === 'won' && state.targetBookId) {
      const targetSprite = bookSprites.get(state.targetBookId);
      if (targetSprite) {
        targetSprite.tint = 0x00ff00;
      }
    }
  });

  return (
    <div ref={containerRef} class="bookshelf-section">
      {hoveredBook() && (
        <div class="book-info-popup" style="position: absolute; top: 20px; left: 20px;">
          <div class="book-popup-title">{hoveredBook()?.title}</div>
          <div class="book-popup-meta">作者：{hoveredBook()?.author}</div>
          <div class="book-popup-meta">出版年份：{hoveredBook()?.year}</div>
          <div class="book-popup-meta">分类：{hoveredBook()?.genre}</div>
        </div>
      )}
    </div>
  );
}

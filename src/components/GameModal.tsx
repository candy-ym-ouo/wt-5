import { createSignal, createMemo } from 'solid-js';
import { startGame, resetGame, gameState, nextRound, targetBook } from '../store/gameStore';
import Leaderboard from './Leaderboard';

export default function GameModal() {
  const [showLeaderboard, setShowLeaderboard] = createSignal(false);
  const state = createMemo(() => gameState());
  const book = createMemo(() => targetBook());
  const gameStatus = createMemo(() => state().state);

  return (
    <>
      {gameStatus() === 'idle' && (
        <div class="modal-overlay">
          <div class="modal-content">
            <div class="modal-title">📚 旧书店寻物</div>
            <div class="modal-subtitle">
              欢迎来到神秘的旧书店！<br />
              根据线索卡片的提示，在书架上找到指定的书籍。<br />
              使用提示可以解锁更多线索，但会扣除分数。<br />
              时间有限，越快找到得分越高！
            </div>
            
            <div class="game-stats">
              <div class="game-stat">
                <div class="game-stat-value">⏱️</div>
                <div class="game-stat-label">3分钟限时</div>
              </div>
              <div class="game-stat">
                <div class="game-stat-value">💡</div>
                <div class="game-stat-label">5次提示</div>
              </div>
              <div class="game-stat">
                <div class="game-stat-value">🎯</div>
                <div class="game-stat-label">找书挑战</div>
              </div>
            </div>

            <button class="modal-button" onClick={startGame}>
              开始游戏
            </button>
            <button class="modal-button secondary" onClick={() => setShowLeaderboard(true)}>
              排行榜
            </button>
          </div>
          {showLeaderboard() && (
            <Leaderboard onClose={() => setShowLeaderboard(false)} />
          )}
        </div>
      )}

      {gameStatus() === 'won' && (
        <div class="modal-overlay">
          <div class="modal-content">
            <div class="modal-title">🎉 恭喜你！</div>
            <div class="modal-subtitle">
              你找到了《{book()?.title}》！
            </div>
            
            <div class="score-big">+{state().score} 分</div>
            
            <div class="game-stats">
              <div class="game-stat">
                <div class="game-stat-value">{state().foundBooks.length}</div>
                <div class="game-stat-label">已找到</div>
              </div>
              <div class="game-stat">
                <div class="game-stat-value">{state().hintsUsed}</div>
                <div class="game-stat-label">使用提示</div>
              </div>
              <div class="game-stat">
                <div class="game-stat-value">{state().currentLevel}</div>
                <div class="game-stat-label">当前关卡</div>
              </div>
            </div>

            <button class="modal-button" onClick={nextRound}>
              下一本书
            </button>
            <button class="modal-button secondary" onClick={() => setShowLeaderboard(true)}>
              排行榜
            </button>
            <button class="modal-button secondary" onClick={resetGame}>
              返回主页
            </button>
          </div>
          {showLeaderboard() && (
            <Leaderboard onClose={() => setShowLeaderboard(false)} />
          )}
        </div>
      )}

      {gameStatus() === 'lost' && (
        <div class="modal-overlay">
          <div class="modal-content">
            <div class="modal-title">⏰ 时间到！</div>
            <div class="modal-subtitle">
              很遗憾，时间用完了。<br />
              你要找的书是《{book()?.title}》。
            </div>
            
            <div class="score-big">{state().score} 分</div>
            
            <div class="game-stats">
              <div class="game-stat">
                <div class="game-stat-value">{state().foundBooks.length}</div>
                <div class="game-stat-label">找到书籍</div>
              </div>
              <div class="game-stat">
                <div class="game-stat-value">{state().currentLevel}</div>
                <div class="game-stat-label">到达关卡</div>
              </div>
              <div class="game-stat">
                <div class="game-stat-value">{state().hintsUsed}</div>
                <div class="game-stat-label">使用提示</div>
              </div>
            </div>

            <button class="modal-button" onClick={startGame}>
              再来一局
            </button>
            <button class="modal-button secondary" onClick={() => setShowLeaderboard(true)}>
              排行榜
            </button>
            <button class="modal-button secondary" onClick={resetGame}>
              返回主页
            </button>
          </div>
          {showLeaderboard() && (
            <Leaderboard onClose={() => setShowLeaderboard(false)} />
          )}
        </div>
      )}
    </>
  );
}

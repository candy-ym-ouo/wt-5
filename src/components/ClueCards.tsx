import { currentClues } from '../store/gameStore';
import { For } from 'solid-js';

export default function ClueCards() {
  const clues = currentClues();

  return (
    <div class="sidebar-section">
      <div class="section-title">
        <span>📜</span>
        <span>线索卡片</span>
      </div>
      <For each={clues}>
        {(clue) => (
          <div class={`clue-card ${clue.unlocked ? '' : 'locked'}`}>
            <div class="clue-title">{clue.title}</div>
            <div class="clue-content">
              {clue.unlocked ? clue.content : '??? 尚未解锁 ???'}
            </div>
          </div>
        )}
      </For>
    </div>
  );
}

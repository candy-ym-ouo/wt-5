import { createMemo } from 'solid-js';
import { currentClues } from '../store/gameStore';
import { For } from 'solid-js';
import { CLUE_TYPE_ICONS, CLUE_TYPE_NAMES } from '../data/clues';

export default function ClueCards() {
  const clues = createMemo(() => currentClues());

  return (
    <div class="sidebar-section">
      <div class="section-title">
        <span>📜</span>
        <span>线索卡片</span>
        <span class="section-count">{clues().filter(c => c.unlocked).length}/{clues().length}</span>
      </div>
      <For each={clues()}>
        {(clue) => (
          <div class={`clue-card clue-type-${clue.type} ${clue.unlocked ? '' : 'locked'}`}>
            <div class="clue-title">
              <span class="clue-icon">{CLUE_TYPE_ICONS[clue.type]}</span>
              <span>{clue.title}</span>
              <span class="clue-type-tag">{CLUE_TYPE_NAMES[clue.type]}</span>
            </div>
            <div class="clue-content">
              {clue.unlocked ? clue.content : '??? 尚未解锁 ???'}
            </div>
          </div>
        )}
      </For>
    </div>
  );
}

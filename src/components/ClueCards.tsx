import { createMemo } from 'solid-js';
import { currentClues, hiddenClueIds, lockedClueTypes } from '../store/gameStore';
import { For } from 'solid-js';
import { CLUE_TYPE_ICONS, CLUE_TYPE_NAMES } from '../data/clues';

export default function ClueCards() {
  const clues = createMemo(() => currentClues());
  const hiddenIds = createMemo(() => hiddenClueIds());
  const lockedTypes = createMemo(() => lockedClueTypes());

  const getClueClass = (clue: any) => {
    const classes: string[] = ['clue-card', `clue-type-${clue.type}`];
    if (!clue.unlocked) {
      classes.push('locked');
    }
    if (hiddenIds().has(clue.id)) {
      classes.push('clue-hidden');
    }
    if (lockedTypes().has(clue.type)) {
      classes.push('clue-locked');
    }
    return classes.join(' ');
  };

  const getClueContent = (clue: any) => {
    if (!clue.unlocked) {
      return '??? 尚未解锁 ???';
    }
    if (hiddenIds().has(clue.id)) {
      return '??? 线索被干扰 ???';
    }
    if (lockedTypes().has(clue.type)) {
      return '🔒 此线索类型暂时失效';
    }
    return clue.content;
  };

  return (
    <div class="sidebar-section">
      <div class="section-title">
        <span>📜</span>
        <span>线索卡片</span>
        <span class="section-count">{clues().filter(c => c.unlocked).length}/{clues().length}</span>
      </div>
      <For each={clues()}>
        {(clue) => (
          <div class={getClueClass(clue)}>
            <div class="clue-title">
              <span class="clue-icon">{CLUE_TYPE_ICONS[clue.type]}</span>
              <span>{clue.title}</span>
              <span class="clue-type-tag">{CLUE_TYPE_NAMES[clue.type]}</span>
            </div>
            <div class="clue-content">
              {getClueContent(clue)}
            </div>
          </div>
        )}
      </For>
    </div>
  );
}

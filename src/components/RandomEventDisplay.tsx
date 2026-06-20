import { createMemo, createSignal, onMount, onCleanup, For } from 'solid-js';
import { gameState, dismissRandomEvent } from '../store/gameStore';
import type { RandomEventEffect } from '../types/game';

function formatEffect(effect: RandomEventEffect): string {
  switch (effect.type) {
    case 'time_penalty':
      return `⏱️ 扣除 ${effect.value} 秒时间`;
    case 'time_bonus':
      return `⏱️ 增加 ${effect.value} 秒时间`;
    case 'score_penalty':
      return `📉 扣除 ${effect.value} 分`;
    case 'score_boost':
      return `📈 增加 ${effect.value} 分`;
    case 'book_obscure':
      return `🌑 书籍在 ${effect.duration! / 1000} 秒内难以辨认`;
    case 'clue_hide':
      return `🙈 随机隐藏 ${effect.value} 条线索`;
    case 'hint_lock':
      return `🔒 锁定 ${effect.value} 种线索类型`;
    case 'layout_shuffle':
      return `🔀 书架位置重排`;
    case 'book_false_highlight':
      return `💫 错误高亮 ${effect.value} 本假目标`;
    case 'clue_reveal':
      return `🔍 自动解锁 ${effect.value} 条线索`;
    case 'score_multiplier':
      return `✨ 得分 ${effect.value} 倍，持续 ${effect.duration! / 1000} 秒`;
    case 'time_multiplier':
      return `⏳ 时间流速 ${effect.value} 倍`;
    default:
      return effect.description || '未知效果';
  }
}

function getRemainingTime(expiresAt: number): number {
  return Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
}

export default function RandomEventDisplay() {
  const activeEvent = createMemo(() => gameState().randomEvent.activeEvent);
  const showPopup = createMemo(() => gameState().randomEvent.showEventPopup);
  const [remainingTime, setRemainingTime] = createSignal(0);
  const [isDismissing, setIsDismissing] = createSignal(false);

  let timerInterval: number | null = null;

  const updateRemainingTime = () => {
    const event = activeEvent();
    if (event?.expiresAt) {
      setRemainingTime(getRemainingTime(event.expiresAt));
    }
  };

  onMount(() => {
    updateRemainingTime();
    timerInterval = window.setInterval(updateRemainingTime, 1000);
  });

  onCleanup(() => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
  });

  const handleDismiss = () => {
    setIsDismissing(true);
    setTimeout(() => {
      dismissRandomEvent();
      setIsDismissing(false);
    }, 300);
  };

  if (!activeEvent() || !showPopup()) return null;

  const event = activeEvent()!;
  const isPositive = event.event.positive;

  return (
    <div class={`random-event-overlay ${isDismissing() ? 'fading-out' : ''}`}>
      <div class={`random-event-modal ${isPositive ? 'positive' : 'negative'}`}>
        <div class="random-event-header">
          <div class="random-event-icon">{event.event.icon}</div>
          <div class="random-event-type-badge">
            {isPositive ? '✨ 好运降临' : '⚠️ 突发事件'}
          </div>
        </div>

        <h2 class="random-event-title">{event.event.title}</h2>
        <p class="random-event-description">{event.event.description}</p>

        <div class="random-event-effects">
          <h4 class="effects-title">事件效果：</h4>
          <ul class="effects-list">
            <For each={event.event.effects}>
              {(effect) => (
                <li class="effect-item">{formatEffect(effect)}</li>
              )}
            </For>
          </ul>
        </div>

        {event.expiresAt && (
          <div class="random-event-timer">
            <span class="timer-icon">⏱️</span>
            <span class="timer-text">剩余时间：{remainingTime()} 秒</span>
            <div class="timer-progress-bar">
              <div 
                class="timer-progress-fill"
                style={{ 
                  width: `${(remainingTime() / (event.event.effects[0]?.duration || 10000) / 1000) * 100}%` 
                }}
              ></div>
            </div>
          </div>
        )}

        <button class="random-event-confirm-btn" onClick={handleDismiss}>
          我知道了
        </button>
      </div>
    </div>
  );
}

export function RandomEventActiveIndicator() {
  const activeEvent = createMemo(() => gameState().randomEvent.activeEvent);
  const [remainingTime, setRemainingTime] = createSignal(0);

  let timerInterval: number | null = null;

  const updateRemainingTime = () => {
    const event = activeEvent();
    if (event?.expiresAt) {
      setRemainingTime(getRemainingTime(event.expiresAt));
    }
  };

  onMount(() => {
    updateRemainingTime();
    timerInterval = window.setInterval(updateRemainingTime, 1000);
  });

  onCleanup(() => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
  });

  if (!activeEvent()) return null;

  const event = activeEvent()!;
  const isPositive = event.event.positive;

  return (
    <div class={`random-event-indicator ${isPositive ? 'positive' : 'negative'}`}>
      <div class="indicator-icon">{event.event.icon}</div>
      <div class="indicator-info">
        <div class="indicator-title">{event.event.title}</div>
        {event.expiresAt && (
          <div class="indicator-time">
            剩余 {remainingTime()} 秒
          </div>
        )}
      </div>
    </div>
  );
}

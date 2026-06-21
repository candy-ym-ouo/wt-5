import { createMemo, createSignal, onMount, onCleanup, For } from 'solid-js';
import { gameState, resolveAnomalyEvent, dismissAnomalyEventPopup } from '../store/gameStore';
import type { AnomalyEventEffect, AnomalyResolutionOption } from '../types/game';
import { getSeverityColor, getSeverityLabel } from '../data/anomalyEvents';

function formatEffect(effect: AnomalyEventEffect): string {
  switch (effect.type) {
    case 'time_penalty':
      return `⏱️ 扣除 ${effect.value} 秒时间`;
    case 'time_bonus':
      return `⏱️ 增加 ${effect.value} 秒时间`;
    case 'score_penalty':
      return `📉 扣除 ${effect.value} 分`;
    case 'score_boost':
      return `📈 增加 ${effect.value} 分`;
    case 'hint_lock':
      return `🔒 锁定 ${effect.value} 种线索类型${effect.duration ? `，持续 ${effect.duration / 1000} 秒` : ''}`;
    case 'hint_consume':
      return `💡 消耗 ${effect.value} 个提示`;
    case 'book_obscure':
      return `🌑 书籍难以辨认${effect.duration ? `，持续 ${effect.duration / 1000} 秒` : ''}`;
    case 'book_misplace':
      return `📚 ${effect.value} 本书位置错乱${effect.duration ? `，持续 ${effect.duration / 1000} 秒` : ''}`;
    case 'clue_damage':
      return `📝 ${effect.value} 个线索受损${effect.duration ? `，持续 ${effect.duration / 1000} 秒` : ''}`;
    case 'clue_hide':
      return `🙈 隐藏 ${effect.value} 条线索${effect.duration ? `，持续 ${effect.duration / 1000} 秒` : ''}`;
    case 'clue_reveal':
      return `🔍 自动解锁 ${effect.value} 条线索`;
    case 'layout_shuffle':
      return `🔀 书架布局被打乱`;
    case 'consecutive_reset':
      return `🔄 连续正确记录重置`;
    case 'streak_break':
      return `🔥 连击可能被打断`;
    case 'commission_fail':
      return `📋 委托失败风险`;
    case 'multiplier_decrease':
      return `📊 得分倍率降低 ${(effect.value * 100).toFixed(0)}%${effect.duration ? `，持续 ${effect.duration / 1000} 秒` : ''}`;
    case 'multiplier_increase':
      return `📊 得分倍率提升 ${(effect.value * 100).toFixed(0)}%${effect.duration ? `，持续 ${effect.duration / 1000} 秒` : ''}`;
    default:
      return effect.description || '未知效果';
  }
}

function formatResolutionCost(option: AnomalyResolutionOption): string {
  const parts: string[] = [];
  if (option.cost.time) parts.push(`⏱️ ${option.cost.time}秒`);
  if (option.cost.score) parts.push(`📉 ${option.cost.score}分`);
  if (option.cost.hints) parts.push(`💡 ${option.cost.hints}个提示`);
  return parts.length > 0 ? `消耗: ${parts.join(', ')}` : '无消耗';
}

function formatResolutionReward(option: AnomalyResolutionOption): string {
  const parts: string[] = [];
  if (option.reward.time) parts.push(`⏱️ +${option.reward.time}秒`);
  if (option.reward.score) parts.push(`📈 +${option.reward.score}分`);
  if (option.reward.hints) parts.push(`💡 +${option.reward.hints}个提示`);
  if (option.reward.streakBonus) parts.push(`🔥 保持连击`);
  return parts.length > 0 ? `奖励: ${parts.join(', ')}` : '无奖励';
}

function getRemainingTime(expiresAt: number): number {
  return Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
}

export default function AnomalyEventDisplay() {
  const activeEvent = createMemo(() => gameState().anomalyEvent.activeEvent);
  const showPopup = createMemo(() => gameState().anomalyEvent.showEventPopup);
  const [remainingTime, setRemainingTime] = createSignal(0);
  const [isDismissing, setIsDismissing] = createSignal(false);
  const [selectedOption, setSelectedOption] = createSignal<string | null>(null);

  let timerInterval: number | null = null;

  const updateRemainingTime = () => {
    const event = activeEvent();
    if (event?.autoResolveAt) {
      setRemainingTime(getRemainingTime(event.autoResolveAt));
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

  const handleResolve = (option: AnomalyResolutionOption) => {
    setSelectedOption(option.id);
    setIsDismissing(true);
    setTimeout(() => {
      resolveAnomalyEvent(option);
      setIsDismissing(false);
      setSelectedOption(null);
    }, 300);
  };

  const handleDismiss = () => {
    setIsDismissing(true);
    setTimeout(() => {
      dismissAnomalyEventPopup();
      setIsDismissing(false);
    }, 300);
  };

  if (!activeEvent() || !showPopup() || activeEvent()?.resolved) return null;

  const event = activeEvent()!;
  const severityColor = getSeverityColor(event.event.severity);
  const severityLabel = getSeverityLabel(event.event.severity);

  return (
    <div class={`anomaly-event-overlay ${isDismissing() ? 'fading-out' : ''}`}>
      <div class="anomaly-event-modal">
        <div class="anomaly-event-header">
          <div class="anomaly-event-icon" style={{ 'border-color': severityColor }}>
            {event.event.icon}
          </div>
          <div class="anomaly-event-type-badge" style={{ 'background-color': severityColor }}>
            ⚠️ {severityLabel}异常
          </div>
        </div>

        <h2 class="anomaly-event-title">{event.event.title}</h2>
        <p class="anomaly-event-description">{event.event.description}</p>

        <div class="anomaly-event-effects">
          <h4 class="effects-title">事件影响：</h4>
          <ul class="effects-list">
            <For each={event.event.effects}>
              {(effect) => (
                <li class="effect-item">{formatEffect(effect)}</li>
              )}
            </For>
          </ul>
        </div>

        <div class="anomaly-event-timer">
          <span class="timer-icon">⏱️</span>
          <span class="timer-text">处理剩余时间：{remainingTime()} 秒</span>
          <div class="timer-progress-bar">
            <div
              class="timer-progress-fill"
              style={{
                width: `${(remainingTime() / (event.event.autoResolveAfter / 1000)) * 100}%`,
                'background-color': severityColor,
              }}
            ></div>
          </div>
        </div>

        <div class="anomaly-event-resolutions">
          <h4 class="resolutions-title">选择处理方式：</h4>
          <div class="resolutions-list">
            <For each={event.event.resolutionOptions}>
              {(option) => (
                <button
                  class={`resolution-option ${selectedOption() === option.id ? 'selected' : ''}`}
                  onClick={() => handleResolve(option)}
                  disabled={selectedOption() !== null}
                >
                  <div class="option-header">
                    <span class="option-icon">{option.icon}</span>
                    <span class="option-label">{option.label}</span>
                    <span class="option-success-rate">
                      成功率: {Math.round(option.successRate * 100)}%
                    </span>
                  </div>
                  <div class="option-description">{option.description}</div>
                  <div class="option-cost-reward">
                    <span class="option-cost">{formatResolutionCost(option)}</span>
                    <span class="option-reward">{formatResolutionReward(option)}</span>
                  </div>
                </button>
              )}
            </For>
          </div>
        </div>

        <button class="anomaly-event-dismiss-btn" onClick={handleDismiss}>
          稍后处理
        </button>
      </div>
    </div>
  );
}

export function AnomalyEventResultPopup() {
  return null;
}

export function AnomalyEventActiveIndicator() {
  const activeEvent = createMemo(() => gameState().anomalyEvent.activeEvent);
  const [remainingTime, setRemainingTime] = createSignal(0);

  let timerInterval: number | null = null;

  const updateRemainingTime = () => {
    const event = activeEvent();
    if (event?.autoResolveAt && !event.resolved) {
      setRemainingTime(getRemainingTime(event.autoResolveAt));
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

  if (!activeEvent() || activeEvent()?.resolved) return null;

  const event = activeEvent()!;
  const severityColor = getSeverityColor(event.event.severity);

  return (
    <div
      class="anomaly-event-indicator"
      style={{ 'border-left-color': severityColor }}
      onClick={() => {
        dismissAnomalyEventPopup();
      }}
    >
      <div class="indicator-icon">{event.event.icon}</div>
      <div class="indicator-info">
        <div class="indicator-title">{event.event.title}</div>
        <div class="indicator-time">
          剩余 {remainingTime()} 秒处理
        </div>
      </div>
      <div class="indicator-pulse" style={{ 'background-color': severityColor }}></div>
    </div>
  );
}

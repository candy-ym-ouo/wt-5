import { createMemo, For } from 'solid-js';
import {
  decorationState,
  activeDecorationTab,
  setActiveDecorationTab,
  getDecorationInfo,
  buyShelfLayout,
  buyDecorationTheme,
  buyFurniture,
  setActiveShelfLayout,
  setActiveDecorationTheme,
  placeFurniture,
  removeFurniture,
} from '../store/decorationStore';
import type { DecorationTab } from '../types/decoration';
import { MAX_FURNITURE_SLOTS, DECORATION_RARITY_CONFIG } from '../data/decoration';
import { storeState } from '../store/storeManager';

const tabs: { id: DecorationTab; label: string; icon: string }[] = [
  { id: 'layout', label: '书架布局', icon: '🏗️' },
  { id: 'theme', label: '装饰风格', icon: '🎨' },
  { id: 'furniture', label: '功能摆件', icon: '🪑' },
  { id: 'preview', label: '效果总览', icon: '📊' },
];

interface DecorationManagerProps {
  onClose: () => void;
}

export default function DecorationManager(props: DecorationManagerProps) {
  const info = getDecorationInfo();
  const state = createMemo(() => decorationState());
  const coins = createMemo(() => storeState().coins);
  const reputation = createMemo(() => storeState().reputation);

  const formatNumber = (num: number): string => {
    return num.toLocaleString('zh-CN');
  };

  const renderEffectsSummary = (effects: {
    difficulty: any;
    bookDistribution: any;
    customerPreference: any;
  }, compact: boolean = false) => {
    const items: { icon: string; text: string; positive: boolean }[] = [];

    if (effects.difficulty.difficultyModifier !== 0) {
      items.push({
        icon: effects.difficulty.difficultyModifier > 0 ? '📈' : '📉',
        text: `难度 ${effects.difficulty.difficultyModifier > 0 ? '+' : ''}${effects.difficulty.difficultyModifier}%`,
        positive: effects.difficulty.difficultyModifier < 0,
      });
    }
    if (effects.difficulty.timeModifier !== 0) {
      items.push({
        icon: effects.difficulty.timeModifier > 0 ? '⏱️' : '⏰',
        text: `时间 ${effects.difficulty.timeModifier > 0 ? '+' : ''}${effects.difficulty.timeModifier}s`,
        positive: effects.difficulty.timeModifier > 0,
      });
    }
    if (effects.difficulty.hintModifier !== 0) {
      items.push({
        icon: effects.difficulty.hintModifier > 0 ? '💡' : '🚫',
        text: `提示 ${effects.difficulty.hintModifier > 0 ? '+' : ''}${effects.difficulty.hintModifier}次`,
        positive: effects.difficulty.hintModifier > 0,
      });
    }
    if (effects.difficulty.clueSpeedModifier !== 0) {
      items.push({
        icon: effects.difficulty.clueSpeedModifier > 0 ? '🔓' : '🔒',
        text: `线索速度 ${effects.difficulty.clueSpeedModifier > 0 ? '+' : ''}${effects.difficulty.clueSpeedModifier}%`,
        positive: effects.difficulty.clueSpeedModifier > 0,
      });
    }
    if (effects.difficulty.rareBookBonus !== 0) {
      items.push({
        icon: effects.difficulty.rareBookBonus > 0 ? '💎' : '📦',
        text: `稀有概率 ${effects.difficulty.rareBookBonus > 0 ? '+' : ''}${effects.difficulty.rareBookBonus}%`,
        positive: effects.difficulty.rareBookBonus > 0,
      });
    }
    if (effects.customerPreference.satisfactionBonus !== 0) {
      items.push({
        icon: '😊',
        text: `满意度 +${effects.customerPreference.satisfactionBonus}%`,
        positive: true,
      });
    }
    if (effects.customerPreference.visitFrequencyBonus !== 0) {
      items.push({
        icon: '👥',
        text: `来访频率 +${effects.customerPreference.visitFrequencyBonus}%`,
        positive: true,
      });
    }

    const genreBoosts = Object.entries<number>(effects.bookDistribution.genreWeights)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${k}+${v}%`);
    if (genreBoosts.length > 0) {
      items.push({
        icon: '📚',
        text: `类型偏好: ${genreBoosts.slice(0, compact ? 2 : 4).join('、')}${genreBoosts.length > (compact ? 2 : 4) ? '...' : ''}`,
        positive: true,
      });
    }

    const rarityBoosts = Object.entries<number>(effects.bookDistribution.rarityWeights)
      .filter(([, v]) => v > 0);
    if (rarityBoosts.length > 0) {
      items.push({
        icon: '✨',
        text: `稀有偏好: ${rarityBoosts.length}种`,
        positive: true,
      });
    }

    if (effects.bookDistribution.themeBoost.length > 0) {
      items.push({
        icon: '🎯',
        text: `主题加成: ${effects.bookDistribution.themeBoost.slice(0, compact ? 2 : 3).join('、')}${effects.bookDistribution.themeBoost.length > (compact ? 2 : 3) ? '...' : ''}`,
        positive: true,
      });
    }

    if (effects.customerPreference.customerBoostIds.length > 0) {
      items.push({
        icon: '👤',
        text: `顾客偏好: ${effects.customerPreference.customerBoostIds.length}位`,
        positive: true,
      });
    }

    if (items.length === 0) {
      return <div class="effects-none">无特殊加成</div>;
    }

    return (
      <div class={`effects-list ${compact ? 'compact' : ''}`}>
        {items.map((item) => (
          <div class={`effect-item ${item.positive ? 'positive' : 'negative'}`}>
            <span class="effect-icon">{item.icon}</span>
            <span class="effect-text">{item.text}</span>
          </div>
        ))}
      </div>
    );
  };

  const handleBuyLayout = (layoutId: string) => {
    buyShelfLayout(layoutId);
  };

  const handleActivateLayout = (layoutId: string) => {
    setActiveShelfLayout(layoutId);
  };

  const handleBuyTheme = (themeId: string) => {
    buyDecorationTheme(themeId);
  };

  const handleActivateTheme = (themeId: string) => {
    setActiveDecorationTheme(themeId);
  };

  const handleBuyFurniture = (furnitureId: string) => {
    buyFurniture(furnitureId);
  };

  const handlePlaceFurniture = (furnitureId: string) => {
    placeFurniture(furnitureId);
  };

  const handleRemoveFurniture = (furnitureId: string) => {
    removeFurniture(furnitureId);
  };

  return (
    <div class="decoration-overlay" onClick={props.onClose}>
      <div class="decoration-modal" onClick={(e) => e.stopPropagation()}>
        <div class="decoration-header">
          <div class="decoration-title">
            <span class="decoration-icon">🏪</span>
            <span>书店装修</span>
          </div>
          <div class="decoration-stats">
            <div class="deco-stat">
              <span>🪙</span>
              <span>{formatNumber(coins())}</span>
            </div>
            <div class="deco-stat">
              <span>⭐</span>
              <span>{formatNumber(reputation())}</span>
            </div>
          </div>
          <button class="close-button" onClick={props.onClose}>✕</button>
        </div>

        <div class="decoration-tabs">
          {tabs.map((tab) => (
            <button
              class={`deco-tab ${activeDecorationTab() === tab.id ? 'active' : ''}`}
              onClick={() => setActiveDecorationTab(tab.id)}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div class="decoration-tab-content">
          {activeDecorationTab() === 'layout' && (
            <div class="layout-tab">
              <div class="tab-header">
                <h3>🏗️ 书架布局</h3>
                <p class="tab-hint">不同的书架布局影响书籍分布和游戏难度</p>
              </div>
              <div class="card-grid">
                {info.layouts.map((layout) => {
                  const isActive = state().activeShelfLayoutId === layout.id;
                  const canUnlock = !layout.unlocked && layout.unlockReputation && reputation() >= layout.unlockReputation;
                  const canBuy = layout.unlocked && !layout.owned && coins() >= layout.cost;

                  return (
                    <div class={`deco-card layout-card ${layout.owned ? 'owned' : ''} ${isActive ? 'active' : ''} ${!layout.unlocked && !canUnlock ? 'locked' : ''}`}>
                      <div class="card-icon-large">{layout.icon}</div>
                      <div class="card-info">
                        <div class="card-name">
                          {layout.name}
                          {!layout.unlocked && <span class="card-lock">🔒</span>}
                          {isActive && <span class="card-active">✅ 使用中</span>}
                        </div>
                        <div class="card-desc">{layout.description}</div>
                        {!layout.unlocked && layout.unlockReputation && (
                          <div class="card-unlock">
                            解锁条件: {layout.unlockReputation} 声望 {canUnlock ? '✓' : `(${formatNumber(reputation())}/${layout.unlockReputation})`}
                          </div>
                        )}
                        <div class="card-effects">
                          {renderEffectsSummary(layout.effects, true)}
                        </div>
                      </div>
                      <div class="card-action">
                        {layout.owned ? (
                          <button
                            class="action-button activate"
                            disabled={isActive}
                            onClick={() => handleActivateLayout(layout.id)}
                          >
                            {isActive ? '使用中' : '使用'}
                          </button>
                        ) : (
                          <>
                            <div class="card-cost">
                              <span>💰</span>
                              <span>{layout.cost}</span>
                            </div>
                            <button
                              class="action-button buy"
                              disabled={!canBuy}
                              onClick={() => handleBuyLayout(layout.id)}
                            >
                              {!layout.unlocked ? '未解锁' : canBuy ? '购买' : '金币不足'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeDecorationTab() === 'theme' && (
            <div class="theme-tab">
              <div class="tab-header">
                <h3>🎨 装饰风格</h3>
                <p class="tab-hint">不同的装饰风格吸引不同类型的顾客</p>
              </div>
              <div class="card-grid">
                {info.themes.map((theme) => {
                  const isActive = state().activeThemeId === theme.id;
                  const canUnlock = !theme.unlocked && theme.unlockReputation && reputation() >= theme.unlockReputation;
                  const canBuy = theme.unlocked && !theme.owned && coins() >= theme.cost;

                  return (
                    <div
                      class={`deco-card theme-card ${theme.owned ? 'owned' : ''} ${isActive ? 'active' : ''} ${!theme.unlocked && !canUnlock ? 'locked' : ''}`}
                      style={{
                        'border-color': theme.owned ? theme.primaryColor : undefined,
                        'box-shadow': isActive ? `0 0 20px ${theme.accentColor}40` : undefined,
                      }}
                    >
                      <div
                        class="card-icon-large theme-preview"
                        style={{
                          background: `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.secondaryColor} 100%)`,
                          color: theme.accentColor,
                        }}
                      >
                        {theme.icon}
                      </div>
                      <div class="card-info">
                        <div class="card-name">
                          {theme.name}
                          {!theme.unlocked && <span class="card-lock">🔒</span>}
                          {isActive && <span class="card-active">✅ 使用中</span>}
                        </div>
                        <div class="card-desc">{theme.description}</div>
                        {!theme.unlocked && theme.unlockReputation && (
                          <div class="card-unlock">
                            解锁条件: {theme.unlockReputation} 声望 {canUnlock ? '✓' : `(${formatNumber(reputation())}/${theme.unlockReputation})`}
                          </div>
                        )}
                        <div class="card-effects">
                          {renderEffectsSummary(theme.effects, true)}
                        </div>
                      </div>
                      <div class="card-action">
                        {theme.owned ? (
                          <button
                            class="action-button activate"
                            disabled={isActive}
                            onClick={() => handleActivateTheme(theme.id)}
                          >
                            {isActive ? '使用中' : '使用'}
                          </button>
                        ) : (
                          <>
                            <div class="card-cost">
                              <span>💰</span>
                              <span>{theme.cost}</span>
                            </div>
                            <button
                              class="action-button buy"
                              disabled={!canBuy}
                              onClick={() => handleBuyTheme(theme.id)}
                            >
                              {!theme.unlocked ? '未解锁' : canBuy ? '购买' : '金币不足'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeDecorationTab() === 'furniture' && (
            <div class="furniture-tab">
              <div class="tab-header">
                <h3>🪑 功能摆件</h3>
                <p class="tab-hint">
                  放置各种摆件获得额外加成（已放置 {state().placedFurnitureIds.length}/{MAX_FURNITURE_SLOTS}）
                </p>
              </div>
              <div class="furniture-slots">
                <div class="slots-label">已放置摆件:</div>
                <div class="slots-row">
                  {Array.from({ length: MAX_FURNITURE_SLOTS }).map((_, index) => {
                    const furnitureId = state().placedFurnitureIds[index];
                    const furniture = furnitureId ? state().ownedFurniture[furnitureId] : null;
                    return (
                      <div class={`furniture-slot ${furniture ? 'filled' : 'empty'}`}>
                        {furniture ? (
                          <>
                            <div class="slot-icon">{furniture.icon}</div>
                            <div class="slot-name">{furniture.name}</div>
                            <button
                              class="slot-remove"
                              onClick={() => handleRemoveFurniture(furniture.id)}
                              title="移除摆件"
                            >
                              ✕
                            </button>
                          </>
                        ) : (
                          <>
                            <div class="slot-icon">➕</div>
                            <div class="slot-name">空位置</div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div class="card-grid">
                {info.furniture.map((furniture) => {
                  const rarityConfig = DECORATION_RARITY_CONFIG[furniture.rarity];
                  const isPlaced = furniture.placed;
                  const canUnlock = !furniture.unlocked && furniture.unlockReputation && reputation() >= furniture.unlockReputation;
                  const canBuy = furniture.unlocked && !furniture.owned && coins() >= furniture.cost;
                  const canPlace = furniture.owned && !furniture.placed && state().placedFurnitureIds.length < MAX_FURNITURE_SLOTS;

                  return (
                    <div
                      class={`deco-card furniture-card ${furniture.owned ? 'owned' : ''} ${isPlaced ? 'placed' : ''} ${!furniture.unlocked && !canUnlock ? 'locked' : ''}`}
                      style={{
                        'border-color': furniture.owned ? rarityConfig.color : undefined,
                      }}
                    >
                      <div class="card-icon-container">
                        <div class="card-icon-large">{furniture.icon}</div>
                        <div class="rarity-badge" style={{ background: rarityConfig.color }}>
                          {rarityConfig.name}
                        </div>
                      </div>
                      <div class="card-info">
                        <div class="card-name">
                          {furniture.name}
                          {!furniture.unlocked && <span class="card-lock">🔒</span>}
                          {isPlaced && <span class="card-active placed-badge">📍 已放置</span>}
                        </div>
                        <div class="card-desc">{furniture.description}</div>
                        {!furniture.unlocked && furniture.unlockReputation && (
                          <div class="card-unlock">
                            解锁条件: {furniture.unlockReputation} 声望 {canUnlock ? '✓' : `(${formatNumber(reputation())}/${furniture.unlockReputation})`}
                          </div>
                        )}
                        <div class="card-effects">
                          {renderEffectsSummary(furniture.effects, true)}
                        </div>
                      </div>
                      <div class="card-action">
                        {furniture.owned ? (
                          isPlaced ? (
                            <button
                              class="action-button remove"
                              onClick={() => handleRemoveFurniture(furniture.id)}
                            >
                              移除
                            </button>
                          ) : (
                            <button
                              class="action-button place"
                              disabled={!canPlace}
                              onClick={() => handlePlaceFurniture(furniture.id)}
                            >
                              {canPlace ? '放置' : '位置已满'}
                            </button>
                          )
                        ) : (
                          <>
                            <div class="card-cost">
                              <span>💰</span>
                              <span>{furniture.cost}</span>
                            </div>
                            <button
                              class="action-button buy"
                              disabled={!canBuy}
                              onClick={() => handleBuyFurniture(furniture.id)}
                            >
                              {!furniture.unlocked ? '未解锁' : canBuy ? '购买' : '金币不足'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeDecorationTab() === 'preview' && (
            <div class="preview-tab">
              <div class="tab-header">
                <h3>📊 效果总览</h3>
                <p class="tab-hint">当前所有装修配置的综合效果</p>
              </div>

              <div class="preview-section">
                <h4>📌 当前配置</h4>
                <div class="current-config">
                  <div class="config-item">
                    <span class="config-label">书架布局</span>
                    <span class="config-value">
                      {info.activeLayout ? `${info.activeLayout!.icon} ${info.activeLayout!.name}` : '未选择'}
                    </span>
                  </div>
                  <div class="config-item">
                    <span class="config-label">装饰风格</span>
                    <span class="config-value">
                      {info.activeTheme ? `${info.activeTheme!.icon} ${info.activeTheme!.name}` : '未选择'}
                    </span>
                  </div>
                  <div class="config-item">
                    <span class="config-label">功能摆件</span>
                    <span class="config-value">
                      {info.placedFurniture.length > 0
                        ? info.placedFurniture.map(f => f.icon).join(' ') + ` (${info.placedFurniture.length}/${MAX_FURNITURE_SLOTS})`
                        : `无 (0/${MAX_FURNITURE_SLOTS})`}
                    </span>
                  </div>
                </div>
              </div>

              <div class="preview-section">
                <h4>⚡ 综合效果</h4>
                <div class="total-effects">
                  {renderEffectsSummary(info.effects.totalEffects)}
                </div>
              </div>

              <div class="preview-section">
                <h4>📚 书籍分布影响</h4>
                <div class="distribution-effects">
                  {Object.keys(info.effects.totalEffects.bookDistribution.genreWeights).length > 0 ? (
                    <div class="distribution-group">
                      <div class="group-label">类型权重加成:</div>
                      <div class="weight-tags">
                        {Object.entries(info.effects.totalEffects.bookDistribution.genreWeights)
                          .filter(([, v]) => v > 0)
                          .sort(([, a], [, b]) => b - a)
                          .map(([genre, weight]) => (
                            <span class="weight-tag genre">
                              {genre} +{weight}%
                            </span>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <div class="no-effect">无类型偏好加成</div>
                  )}

                  {Object.keys(info.effects.totalEffects.bookDistribution.rarityWeights).length > 0 ? (
                    <div class="distribution-group">
                      <div class="group-label">稀有度权重加成:</div>
                      <div class="weight-tags">
                        {Object.entries(info.effects.totalEffects.bookDistribution.rarityWeights)
                          .filter(([, v]) => v > 0)
                          .sort(([, a], [, b]) => b - a)
                          .map(([rarity, weight]) => (
                            <span class={`weight-tag rarity-${rarity}`}>
                              {rarity === 'common' ? '普通' : rarity === 'uncommon' ? '精良' : rarity === 'rare' ? '稀有' : rarity === 'epic' ? '史诗' : '传说'} +{weight}%
                            </span>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <div class="no-effect">无稀有度偏好加成</div>
                  )}

                  {info.effects.totalEffects.bookDistribution.themeBoost.length > 0 && (
                    <div class="distribution-group">
                      <div class="group-label">主题加成:</div>
                      <div class="weight-tags">
                        <For each={info.effects.totalEffects.bookDistribution.themeBoost}>
                          {(theme: string) => (
                            <span class="weight-tag theme">
                              🎯 {theme}
                            </span>
                          )}
                        </For>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div class="preview-section">
                <h4>👥 顾客偏好影响</h4>
                <div class="customer-effects">
                  {info.effects.totalEffects.customerPreference.customerBoostIds.length > 0 ? (
                    <div class="boosted-customers">
                      <div class="customers-label">受益顾客:</div>
                      <div class="customer-tags">
                        <For each={info.effects.totalEffects.customerPreference.customerBoostIds}>
                          {(id: string) => {
                            const customer = storeState().customers[id];
                            return (
                              <span class="customer-tag">
                                {customer?.avatar || '👤'} {customer?.name || id}
                              </span>
                            );
                          }}
                        </For>
                      </div>
                    </div>
                  ) : (
                    <div class="no-effect">无特定顾客偏好加成</div>
                  )}
                  {(info.effects.totalEffects.customerPreference.satisfactionBonus > 0 || info.effects.totalEffects.customerPreference.visitFrequencyBonus > 0) && (
                    <div class="customer-bonuses">
                      {info.effects.totalEffects.customerPreference.satisfactionBonus > 0 && (
                        <div class="bonus-row">
                          <span>满意度加成:</span>
                          <span class="positive">+{info.effects.totalEffects.customerPreference.satisfactionBonus}%</span>
                        </div>
                      )}
                      {info.effects.totalEffects.customerPreference.visitFrequencyBonus > 0 && (
                        <div class="bonus-row">
                          <span>来访频率加成:</span>
                          <span class="positive">+{info.effects.totalEffects.customerPreference.visitFrequencyBonus}%</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div class="preview-section">
                <h4>🎮 游戏难度影响</h4>
                <div class="difficulty-effects">
                  <div class="difficulty-grid">
                    <div class="diff-item">
                      <span class="diff-label">难度调整</span>
                      <span class={`diff-value ${info.effects.totalEffects.difficulty.difficultyModifier < 0 ? 'positive' : info.effects.totalEffects.difficulty.difficultyModifier > 0 ? 'negative' : ''}`}>
                        {info.effects.totalEffects.difficulty.difficultyModifier > 0 ? '+' : ''}{info.effects.totalEffects.difficulty.difficultyModifier}%
                      </span>
                    </div>
                    <div class="diff-item">
                      <span class="diff-label">额外时间</span>
                      <span class={`diff-value ${info.effects.totalEffects.difficulty.timeModifier > 0 ? 'positive' : info.effects.totalEffects.difficulty.timeModifier < 0 ? 'negative' : ''}`}>
                        {info.effects.totalEffects.difficulty.timeModifier > 0 ? '+' : ''}{info.effects.totalEffects.difficulty.timeModifier}s
                      </span>
                    </div>
                    <div class="diff-item">
                      <span class="diff-label">额外提示</span>
                      <span class={`diff-value ${info.effects.totalEffects.difficulty.hintModifier > 0 ? 'positive' : info.effects.totalEffects.difficulty.hintModifier < 0 ? 'negative' : ''}`}>
                        {info.effects.totalEffects.difficulty.hintModifier > 0 ? '+' : ''}{info.effects.totalEffects.difficulty.hintModifier}次
                      </span>
                    </div>
                    <div class="diff-item">
                      <span class="diff-label">线索速度</span>
                      <span class={`diff-value ${info.effects.totalEffects.difficulty.clueSpeedModifier > 0 ? 'positive' : info.effects.totalEffects.difficulty.clueSpeedModifier < 0 ? 'negative' : ''}`}>
                        {info.effects.totalEffects.difficulty.clueSpeedModifier > 0 ? '+' : ''}{info.effects.totalEffects.difficulty.clueSpeedModifier}%
                      </span>
                    </div>
                    <div class="diff-item highlight">
                      <span class="diff-label">稀有书籍</span>
                      <span class={`diff-value ${info.effects.totalEffects.difficulty.rareBookBonus > 0 ? 'positive' : ''}`}>
                        {info.effects.totalEffects.difficulty.rareBookBonus > 0 ? '+' : ''}{info.effects.totalEffects.difficulty.rareBookBonus}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="preview-section contributions">
                <h4>📋 效果来源</h4>
                <div class="contribution-list">
                  {info.effects.layoutContribution && (
                    <div class="contribution-item">
                      <div class="contrib-header">
                        <span class="contrib-icon">{info.effects.layoutContribution!.icon}</span>
                        <span class="contrib-name">书架布局: {info.effects.layoutContribution!.name}</span>
                      </div>
                      <div class="contrib-effects">
                        {renderEffectsSummary(info.effects.layoutContribution!.effects, true)}
                      </div>
                    </div>
                  )}
                  {info.effects.themeContribution && (
                    <div class="contribution-item">
                      <div class="contrib-header">
                        <span class="contrib-icon">{info.effects.themeContribution!.icon}</span>
                        <span class="contrib-name">装饰风格: {info.effects.themeContribution!.name}</span>
                      </div>
                      <div class="contrib-effects">
                        {renderEffectsSummary(info.effects.themeContribution!.effects, true)}
                      </div>
                    </div>
                  )}
                  <For each={info.effects.furnitureContributions}>
                    {(furniture) => (
                      <div class="contribution-item">
                        <div class="contrib-header">
                          <span class="contrib-icon">{furniture.icon}</span>
                          <span class="contrib-name">摆件: {furniture.name}</span>
                        </div>
                        <div class="contrib-effects">
                          {renderEffectsSummary(furniture.effects, true)}
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { createMemo, For } from 'solid-js';
import { generateDifficultyRecommendation, getTrainingStats, getSkillLevels } from '../../store/trainingStore';
import { DIFFICULTY_CONFIGS, DIFFICULTY_LEVELS } from '../../data/difficulty';
import { CLUE_SKILL_NAMES } from '../../types/training';

export default function DifficultyRecommend() {
  const recommendation = createMemo(() => generateDifficultyRecommendation());
  const stats = createMemo(() => getTrainingStats());
  const skills = createMemo(() => getSkillLevels());

  const currentConfig = createMemo(() => {
    return DIFFICULTY_CONFIGS[recommendation().recommendedLevel];
  });

  const confidencePercent = createMemo(() => {
    return Math.round(recommendation().confidence * 100);
  });

  const overallSkillLevel = createMemo(() => {
    const skillList = skills();
    if (skillList.length === 0) return 1;
    const total = skillList.reduce((sum, s) => sum + s.level, 0);
    return Math.round(total / skillList.length);
  });

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}秒`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}分钟`;
  };

  return (
    <div class="difficulty-recommend-container">
      <div class="recommendation-card">
        <div class="recommend-header">
          <span class="recommend-icon">📈</span>
          <div>
            <h3 class="recommend-title">智能难度推荐</h3>
            <p class="recommend-subtitle">根据你的练习数据，为你推荐最合适的难度</p>
          </div>
        </div>

        <div class="recommended-difficulty">
          <div class="rec-diff-icon">{currentConfig().icon}</div>
          <div class="rec-diff-info">
            <span class="rec-diff-label">推荐难度</span>
            <span class="rec-diff-name">{currentConfig().name}</span>
          </div>
          <div class="rec-confidence">
            <span class="confidence-label">推荐置信度</span>
            <div class="confidence-bar">
              <div 
                class="confidence-fill" 
                style={{ width: `${confidencePercent()}%` }} 
              />
            </div>
            <span class="confidence-value">{confidencePercent()}%</span>
          </div>
        </div>

        <div class="recommend-reasons">
          <h4 class="section-title">💡 推荐理由</h4>
          <ul class="reasons-list">
            <For each={recommendation().reasons}>
              {(reason) => (
                <li class="reason-item">
                  <span class="reason-icon">✓</span>
                  <span class="reason-text">{reason}</span>
                </li>
              )}
            </For>
          </ul>
        </div>
      </div>

      <div class="difficulty-overview">
        <h4 class="section-title">🎚️ 难度概览</h4>
        <div class="difficulty-ladder">
          <For each={DIFFICULTY_LEVELS}>
            {(level, index) => {
              const config = DIFFICULTY_CONFIGS[level];
              const isRecommended = level === recommendation().recommendedLevel;
              const levelIndex = index();
              const recIndex = DIFFICULTY_LEVELS.indexOf(recommendation().recommendedLevel);
              const isUnlocked = levelIndex <= recIndex + 1;
              
              return (
                <div
                  class={`diff-ladder-item ${isRecommended ? 'recommended' : ''} ${isUnlocked ? 'unlocked' : 'locked'}`}
                >
                  <div class="ladder-level-num">Lv.{levelIndex + 1}</div>
                  <div class="ladder-icon">{config.icon}</div>
                  <div class="ladder-info">
                    <span class="ladder-name">{config.name}</span>
                    <span class="ladder-desc">{config.description}</span>
                  </div>
                  <div class="ladder-stats">
                    <div class="ladder-stat">
                      <span class="stat-label">时间</span>
                      <span class="stat-value">{Math.floor(config.gameTime / 60)}分</span>
                    </div>
                    <div class="ladder-stat">
                      <span class="stat-label">提示</span>
                      <span class="stat-value">{config.initialHints}次</span>
                    </div>
                    <div class="ladder-stat">
                      <span class="stat-label">倍率</span>
                      <span class="stat-value">x{config.scoreMultiplier}</span>
                    </div>
                  </div>
                  {isRecommended && (
                    <div class="recommended-badge">
                      ⭐ 推荐
                    </div>
                  )}
                  {!isUnlocked && (
                    <div class="locked-badge">
                      🔒 待解锁
                    </div>
                  )}
                </div>
              );
            }}
          </For>
        </div>
      </div>

      <div class="skill-analysis">
        <h4 class="section-title">📊 技能分析</h4>
        <div class="skill-analysis-grid">
          <For each={skills()}>
            {(skill) => (
              <div class="skill-analysis-card">
                <div class="skill-card-header">
                  <span class="skill-card-icon">{CLUE_SKILL_NAMES[skill.type].icon}</span>
                  <span class="skill-card-name">{CLUE_SKILL_NAMES[skill.type].name}</span>
                  <span class="skill-card-level">Lv.{skill.level}</span>
                </div>
                <div class="skill-card-progress">
                  <div 
                    class="skill-progress-fill" 
                    style={{ width: `${(skill.xpInLevel / 100) * 100}%` }} 
                  />
                </div>
                <div class="skill-card-footer">
                  <span class="skill-xp-text">经验：{skill.xp}</span>
                  <span class="skill-next-text">下一级还需 {skill.xpToNext} XP</span>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>

      <div class="next-level-goals">
        <h4 class="section-title">🎯 下一阶段目标</h4>
        {recommendation().nextLevelGoal.requirements.length > 0 ? (
          <div class="goals-list">
            <For each={recommendation().nextLevelGoal.requirements}>
              {(req) => {
                const percent = Math.min(100, (req.current / req.target) * 100);
                const isComplete = req.current >= req.target;
                
                return (
                  <div class={`goal-item ${isComplete ? 'complete' : ''}`}>
                    <div class="goal-icon">
                      {isComplete ? '✅' : '⏳'}
                    </div>
                    <div class="goal-info">
                      <span class="goal-name">{req.description}</span>
                      <div class="goal-progress">
                        <div class="goal-progress-bar">
                          <div 
                            class="goal-progress-fill" 
                            style={{ width: `${percent}%` }} 
                          />
                        </div>
                        <span class="goal-progress-text">
                          {req.current.toFixed(1)}{req.unit} / {req.target}{req.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        ) : (
          <div class="max-level-notice">
            <span class="max-icon">🏆</span>
            <p>你已经达到最高难度推荐等级！</p>
            <p class="sub-text">继续练习，挑战自我吧！</p>
          </div>
        )}
      </div>

      <div class="training-summary">
        <h4 class="section-title">📈 学习进度总览</h4>
        <div class="summary-cards">
          <div class="summary-card">
            <div class="summary-icon">📚</div>
            <div class="summary-info">
              <span class="summary-value">{stats().completedLessons}/{stats().totalLessons}</span>
              <span class="summary-label">课程完成</span>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-icon">🎯</div>
            <div class="summary-info">
              <span class="summary-value">{stats().totalCorrectAnswers}题</span>
              <span class="summary-label">正确答题</span>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-icon">⏱️</div>
            <div class="summary-info">
              <span class="summary-value">{formatTime(stats().totalPracticeTime)}</span>
              <span class="summary-label">累计练习</span>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-icon">🎖️</div>
            <div class="summary-info">
              <span class="summary-value">Lv.{overallSkillLevel()}</span>
              <span class="summary-label">综合等级</span>
            </div>
          </div>
        </div>
      </div>

      <div class="suggestions-section">
        <h4 class="section-title">💡 学习建议</h4>
        <div class="suggestions-list">
          <div class="suggestion-item">
            <span class="sug-icon">📖</span>
            <div class="sug-content">
              <span class="sug-title">循序渐进</span>
              <p class="sug-desc">从入门难度开始，逐步挑战更高难度，不要急于求成</p>
            </div>
          </div>
          <div class="suggestion-item">
            <span class="sug-icon">🔄</span>
            <div class="sug-content">
              <span class="sug-title">定期复习</span>
              <p class="sug-desc">定期回顾错题，巩固薄弱点，提高整体水平</p>
            </div>
          </div>
          <div class="suggestion-item">
            <span class="sug-icon">⏰</span>
            <div class="sug-content">
              <span class="sug-title">适度练习</span>
              <p class="sug-desc">每天保持适量练习，比一次性长时间练习效果更好</p>
            </div>
          </div>
          <div class="suggestion-item">
            <span class="sug-icon">🎯</span>
            <div class="sug-content">
              <span class="sug-title">针对训练</span>
              <p class="sug-desc">根据技能分析，重点练习薄弱的线索类型</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

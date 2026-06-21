import { createMemo, For } from 'solid-js';
import type { TrainingTab } from '../types/training';
import { getTrainingCenterState, setTrainingTab, closeTrainingCenter, getTrainingStats, getSkillLevels } from '../store/trainingStore';
import { CLUE_SKILL_NAMES } from '../types/training';
import RulesLearning from './training/RulesLearning';
import PracticeCenter from './training/PracticeCenter';
import WrongBookReview from './training/WrongBookReview';
import DifficultyRecommend from './training/DifficultyRecommend';

interface TrainingCenterProps {
  onClose: () => void;
}

const TABS: { id: TrainingTab; label: string; icon: string; description: string }[] = [
  { id: 'rules', label: '规则教学', icon: '📚', description: '系统学习游戏规则' },
  { id: 'practice', label: '专项练习', icon: '🎯', description: '针对性技能训练' },
  { id: 'wrongBook', label: '错题回放', icon: '📝', description: '复习巩固薄弱点' },
  { id: 'recommend', label: '难度推荐', icon: '📈', description: '智能推荐合适难度' },
];

export default function TrainingCenter(props: TrainingCenterProps) {
  const state = createMemo(() => getTrainingCenterState());
  const stats = createMemo(() => getTrainingStats());
  const skills = createMemo(() => getSkillLevels());

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}秒`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}分${secs > 0 ? secs + '秒' : ''}`;
  };

  const handleClose = () => {
    closeTrainingCenter();
    props.onClose();
  };

  return (
    <div class="modal-overlay training-center-overlay" onClick={handleClose}>
      <div class="modal-content training-center-modal" onClick={(e) => e.stopPropagation()}>
        <div class="training-center-header">
          <div class="training-header-left">
            <span class="training-header-icon">🎓</span>
            <div>
              <h2 class="training-header-title">教学与练习中心</h2>
              <p class="training-header-subtitle">循序渐进，成为寻物大师</p>
            </div>
          </div>
          <button class="modal-close-btn" onClick={handleClose}>✕</button>
        </div>

        <div class="training-stats-overview">
          <div class="training-stat-card">
            <div class="ts-icon">📚</div>
            <div class="ts-info">
              <div class="ts-value">{stats().completedLessons}/{stats().totalLessons}</div>
              <div class="ts-label">课程进度</div>
            </div>
            <div class="ts-progress-bar">
              <div class="ts-progress-fill" style={{ width: `${stats().lessonProgress}%` }} />
            </div>
          </div>
          
          <div class="training-stat-card">
            <div class="ts-icon">🎯</div>
            <div class="ts-info">
              <div class="ts-value">{stats().completedModules}/{stats().totalModules}</div>
              <div class="ts-label">练习模块</div>
            </div>
            <div class="ts-progress-bar">
              <div class="ts-progress-fill" style={{ width: `${stats().moduleProgress}%` }} />
            </div>
          </div>
          
          <div class="training-stat-card">
            <div class="ts-icon">✅</div>
            <div class="ts-info">
              <div class="ts-value">{stats().totalCorrectAnswers}</div>
              <div class="ts-label">正确答题</div>
            </div>
          </div>
          
          <div class="training-stat-card">
            <div class="ts-icon">⏱️</div>
            <div class="ts-info">
              <div class="ts-value">{formatTime(stats().totalPracticeTime)}</div>
              <div class="ts-label">练习时长</div>
            </div>
          </div>
          
          <div class="training-stat-card">
            <div class="ts-icon">🎯</div>
            <div class="ts-info">
              <div class="ts-value">{stats().accuracy.toFixed(1)}%</div>
              <div class="ts-label">准确率</div>
            </div>
          </div>
        </div>

        <div class="training-skills-overview">
          <div class="skills-title">
            <span>📊</span>
            <span>技能概览</span>
          </div>
          <div class="skills-grid">
            <For each={skills()}>
              {(skill) => (
                <div class="skill-mini-card">
                  <div class="skill-mini-icon">{CLUE_SKILL_NAMES[skill.type].icon}</div>
                  <div class="skill-mini-info">
                    <div class="skill-mini-name">{CLUE_SKILL_NAMES[skill.type].name}</div>
                    <div class="skill-mini-level">Lv.{skill.level}</div>
                  </div>
                  <div class="skill-mini-progress">
                    <div 
                      class="skill-mini-progress-fill" 
                      style={{ width: `${(skill.xpInLevel / 100) * 100}%` }} 
                    />
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>

        <div class="tabs training-tabs">
          <For each={TABS}>
            {(tab) => (
              <button
                class={`tab-button ${state().activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setTrainingTab(tab.id)}
                title={tab.description}
              >
                <span class="tab-icon">{tab.icon}</span>
                <span class="tab-label">{tab.label}</span>
              </button>
            )}
          </For>
        </div>

        <div class="training-content">
          {state().activeTab === 'rules' && <RulesLearning />}
          {state().activeTab === 'practice' && <PracticeCenter />}
          {state().activeTab === 'wrongBook' && <WrongBookReview />}
          {state().activeTab === 'recommend' && <DifficultyRecommend />}
        </div>
      </div>
    </div>
  );
}

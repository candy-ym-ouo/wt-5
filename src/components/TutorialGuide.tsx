import { createSignal, createEffect, For } from 'solid-js';
import {
  hasCompletedTutorial,
  markTutorialCompleted,
  getTutorialCurrentStep,
  saveTutorialStep,
} from '../utils/storage';

interface TutorialStep {
  id: number;
  title: string;
  icon: string;
  description: string;
  tips: string[];
  highlight?: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 0,
    title: '欢迎来到旧书店寻物',
    icon: '📚',
    description: '在这个神秘的旧书店里，你需要根据线索卡片的提示，在书架上找到指定的神秘藏书。让我们先来了解一下游戏的核心玩法吧！',
    tips: [
      '共有 7 类线索可以解锁',
      '使用提示可以获得更多线索',
      '时间有限，越快找到得分越高！',
    ],
  },
  {
    id: 1,
    title: '书架系统',
    icon: '📖',
    description: '这是游戏的核心区域——书架。书架共有 5 层，上面摆满了各种类型的书籍。你的任务是从中找到目标书籍。',
    tips: [
      '将鼠标悬停在书籍上可以查看书籍详情',
      '点击你认为正确的书籍进行确认',
      '每本书都有独特的颜色、大小和位置',
      '稀有书籍会有更高的得分倍率',
    ],
    highlight: 'bookshelf',
  },
  {
    id: 2,
    title: '线索卡片',
    icon: '📜',
    description: '右侧的线索卡片会为你提供目标书籍的关键信息。每局游戏会按顺序逐步解锁线索。',
    tips: [
      '🕰️ 年代：书籍的出版年份',
      '✍️ 作者：书籍的作者姓名',
      '📚 分类：书籍所属的题材类型',
      '🪜 书架：目标书籍所在的层号',
      '📖 描述：书籍的内容简介',
      '✨ 背景故事：书籍的神秘背景',
      '🎯 书名：目标书籍的完整名称',
    ],
    highlight: 'clues',
  },
  {
    id: 3,
    title: '提示系统',
    icon: '💡',
    description: '当你遇到困难时，可以使用提示来解锁更多线索。但每次使用提示都会扣除一定分数，请谨慎使用！',
    tips: [
      '点击「使用提示」按钮解锁下一条线索',
      '提示数量有限，用完就没有了',
      '还有免费道具可以使用：免费提示、时间透视、排除错误',
      '连续错误会触发提示冻结，请小心选择！',
    ],
    highlight: 'hints',
  },
  {
    id: 4,
    title: '结算规则',
    icon: '🏆',
    description: '当你成功找到书籍或时间用完时，会进入结算页面。让我们了解一下得分规则吧！',
    tips: [
      '基础分：根据难度等级决定',
      '时间奖励：剩余时间越多，得分越高',
      '稀有度倍率：稀有书籍得分更高',
      '难度倍率：挑战高难度获得更高倍率',
      '提示扣分：每使用一次提示扣除相应分数',
      '错误惩罚：选错书籍会扣时间和分数',
      '评级系统：S+/S/A/B/C/D，评级越高奖励越多',
    ],
    highlight: 'settlement',
  },
  {
    id: 5,
    title: '准备开始冒险',
    icon: '🎮',
    description: '恭喜！你已经了解了所有游戏规则。现在准备好开始你的旧书店寻物之旅了吗？',
    tips: [
      '建议从简单难度开始熟悉游戏',
      '尽量少用提示可以获得更高评分',
      '完成挑战解锁成就和收藏',
      '享受探索的乐趣，祝你好运！',
    ],
  },
];

interface TutorialGuideProps {
  onClose: () => void;
}

export default function TutorialGuide(props: TutorialGuideProps) {
  const [currentStep, setCurrentStep] = createSignal(
    hasCompletedTutorial() ? -1 : getTutorialCurrentStep()
  );
  const [visible, setVisible] = createSignal(!hasCompletedTutorial());
  const [isSkipping, setIsSkipping] = createSignal(false);

  createEffect(() => {
    if (currentStep() >= 0 && currentStep() < TUTORIAL_STEPS.length) {
      saveTutorialStep(currentStep());
    }
  });

  const stepData = () => TUTORIAL_STEPS[currentStep()];

  const goToNext = () => {
    const next = currentStep() + 1;
    if (next >= TUTORIAL_STEPS.length) {
      completeTutorial();
    } else {
      setCurrentStep(next);
    }
  };

  const goToPrev = () => {
    if (currentStep() > 0) {
      setCurrentStep(currentStep() - 1);
    }
  };

  const completeTutorial = () => {
    markTutorialCompleted();
    setVisible(false);
    props.onClose();
  };

  const skipTutorial = () => {
    setIsSkipping(true);
    setTimeout(() => {
      completeTutorial();
    }, 300);
  };

  if (!visible()) {
    return null;
  }

  return (
    <div class={`tutorial-overlay ${isSkipping() ? 'tutorial-fade-out' : ''}`}>
      <div class="tutorial-container">
        <button class="tutorial-skip-btn" onClick={skipTutorial}>
          跳过引导 ✕
        </button>

        <div class="tutorial-progress">
          {TUTORIAL_STEPS.map((_, index) => (
            <div
              class={`tutorial-progress-dot ${index <= currentStep() ? 'active' : ''} ${index === currentStep() ? 'current' : ''}`}
              onClick={() => index <= currentStep() && setCurrentStep(index)}
            />
          ))}
        </div>

        <div class="tutorial-icon">{stepData()?.icon}</div>

        <h2 class="tutorial-title">{stepData()?.title}</h2>

        <p class="tutorial-description">{stepData()?.description}</p>

        <div class="tutorial-tips">
          <For each={stepData()?.tips}>
            {(tip) => (
              <div class="tutorial-tip-item">
                <span class="tutorial-tip-bullet">•</span>
                <span class="tutorial-tip-text">{tip}</span>
              </div>
            )}
          </For>
        </div>

        {stepData()?.highlight && (
          <div class={`tutorial-highlight-tag highlight-${stepData()?.highlight}`}>
            <span class="highlight-icon">🎯</span>
            <span class="highlight-text">
              {stepData()?.highlight === 'bookshelf' && '关注左侧书架区域'}
              {stepData()?.highlight === 'clues' && '关注右侧线索卡片区域'}
              {stepData()?.highlight === 'hints' && '关注右侧提示系统区域'}
              {stepData()?.highlight === 'settlement' && '游戏结束后查看结算信息'}
            </span>
          </div>
        )}

        <div class="tutorial-actions">
          {currentStep() > 0 ? (
            <button class="tutorial-btn tutorial-btn-secondary" onClick={goToPrev}>
              ← 上一步
            </button>
          ) : (
            <div class="tutorial-btn-placeholder" />
          )}

          <div class="tutorial-step-indicator">
            {currentStep() + 1} / {TUTORIAL_STEPS.length}
          </div>

          {currentStep() === TUTORIAL_STEPS.length - 1 ? (
            <button class="tutorial-btn tutorial-btn-primary" onClick={completeTutorial}>
              🎉 开始游戏
            </button>
          ) : (
            <button class="tutorial-btn tutorial-btn-primary" onClick={goToNext}>
              下一步 →
            </button>
          )}
        </div>
      </div>

      {stepData()?.highlight === 'bookshelf' && <div class="tutorial-focus focus-bookshelf" />}
      {stepData()?.highlight === 'clues' && <div class="tutorial-focus focus-clues" />}
      {stepData()?.highlight === 'hints' && <div class="tutorial-focus focus-hints" />}
    </div>
  );
}

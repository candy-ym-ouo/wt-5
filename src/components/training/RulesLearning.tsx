import { createSignal, createMemo, For } from 'solid-js';
import type { RuleLesson } from '../../types/training';
import { getLessons, getSelectedLesson, selectLesson, completeLesson, passQuiz, startQuiz, endQuiz } from '../../store/trainingStore';
import { LESSON_CATEGORIES } from '../../data/training';

export default function RulesLearning() {
  const lessons = createMemo(() => getLessons());
  const selectedLesson = createMemo(() => getSelectedLesson());
  const [currentQuizIndex, setCurrentQuizIndex] = createSignal(0);
  const [quizAnswers, setQuizAnswers] = createSignal<number[]>([]);
  const [showResult, setShowResult] = createSignal(false);
  const [quizScore, setQuizScore] = createSignal(0);

  const lessonsByCategory = createMemo(() => {
    const result: Record<string, RuleLesson[]> = {};
    for (const lesson of lessons()) {
      if (!result[lesson.category]) {
        result[lesson.category] = [];
      }
      result[lesson.category].push(lesson);
    }
    return result;
  });

  const currentQuestion = createMemo(() => {
    const lesson = selectedLesson();
    if (!lesson?.quiz) return null;
    return lesson.quiz.questions[currentQuizIndex()] || null;
  });

  const handleSelectLesson = (lessonId: string) => {
    const lesson = lessons().find(l => l.id === lessonId);
    if (lesson?.unlocked) {
      selectLesson(lessonId);
      setCurrentQuizIndex(0);
      setQuizAnswers([]);
      setShowResult(false);
    }
  };

  const handleStartQuiz = () => {
    startQuiz();
    setCurrentQuizIndex(0);
    setQuizAnswers([]);
    setShowResult(false);
  };

  const handleSelectAnswer = (optionIndex: number) => {
    const question = currentQuestion();
    if (!question) return;

    if (question.type === 'single' || question.type === 'truefalse') {
      const newAnswers = [...quizAnswers()];
      newAnswers[currentQuizIndex()] = optionIndex;
      setQuizAnswers(newAnswers);
    } else {
      const newAnswers = [...quizAnswers()];
      const current = newAnswers[currentQuizIndex()];
      if (current === optionIndex) {
        newAnswers[currentQuizIndex()] = -1;
      } else {
        newAnswers[currentQuizIndex()] = optionIndex;
      }
      setQuizAnswers(newAnswers);
    }
  };

  const handleNextQuestion = () => {
    const lesson = selectedLesson();
    if (!lesson?.quiz) return;
    
    if (currentQuizIndex() < lesson.quiz.questions.length - 1) {
      setCurrentQuizIndex(currentQuizIndex() + 1);
    } else {
      calculateScore();
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuizIndex() > 0) {
      setCurrentQuizIndex(currentQuizIndex() - 1);
    }
  };

  const calculateScore = () => {
    const lesson = selectedLesson();
    if (!lesson?.quiz) return;

    let correctCount = 0;
    const questions = lesson.quiz.questions;
    
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const answer = quizAnswers()[i];
      if (q.type === 'single' || q.type === 'truefalse') {
        if (q.correctAnswers.includes(answer)) {
          correctCount++;
        }
      } else {
        const allCorrect = q.correctAnswers.every(ca => quizAnswers().includes(ca));
        const noWrong = !quizAnswers().some(a => !q.correctAnswers.includes(a) && a !== -1);
        if (allCorrect && noWrong) {
          correctCount++;
        }
      }
    }

    const score = Math.round((correctCount / questions.length) * 100);
    setQuizScore(score);
    setShowResult(true);

    if (score >= lesson.quiz.passingScore) {
      completeLesson(lesson.id);
      passQuiz(lesson.id, score);
    }
  };

  const handleBackToList = () => {
    selectLesson(null);
    endQuiz();
    setShowResult(false);
  };

  const handleRestartQuiz = () => {
    setCurrentQuizIndex(0);
    setQuizAnswers([]);
    setShowResult(false);
  };

  if (selectedLesson() && getSelectedLesson()?.quiz && showResult()) {
    const lesson = selectedLesson()!;
    const passed = quizScore() >= lesson.quiz!.passingScore;
    
    return (
      <div class="rules-quiz-result">
        <div class="quiz-result-icon">
          {passed ? '🎉' : '📚'}
        </div>
        <h3 class="quiz-result-title">
          {passed ? '恭喜通过测验！' : '继续加油！'}
        </h3>
        <div class="quiz-result-score">
          <span class="score-number">{quizScore()}</span>
          <span class="score-label">分</span>
        </div>
        <p class="quiz-result-desc">
          {passed 
            ? '你已掌握本课程内容，可以继续学习下一课！' 
            : `及格分数：${lesson.quiz!.passingScore}分，再试一次吧！`}
        </p>
        <div class="quiz-result-actions">
          <button class="modal-button secondary" onClick={handleRestartQuiz}>
            重新测验
          </button>
          <button class="modal-button primary" onClick={handleBackToList}>
            返回课程列表
          </button>
        </div>
      </div>
    );
  }

  if (selectedLesson() && getSelectedLesson()?.quiz && getTrainingCenterState()?.quizActive) {
    const lesson = selectedLesson()!;
    const question = currentQuestion()!;
    const totalQuestions = lesson.quiz!.questions.length;
    const isLastQuestion = currentQuizIndex() === totalQuestions - 1;
    
    return (
      <div class="rules-quiz">
        <div class="quiz-header">
          <button class="quiz-back-btn" onClick={handleBackToList}>
            ← 返回
          </button>
          <div class="quiz-progress">
            第 {currentQuizIndex() + 1} / {totalQuestions} 题
          </div>
          <div class="quiz-progress-bar">
            <div 
              class="quiz-progress-fill" 
              style={{ width: `${((currentQuizIndex() + 1) / totalQuestions) * 100}%` }} 
            />
          </div>
        </div>

        <div class="quiz-question-card">
          <div class="quiz-question-type">
            {question.type === 'single' && '单选题'}
            {question.type === 'multiple' && '多选题'}
            {question.type === 'truefalse' && '判断题'}
          </div>
          <h4 class="quiz-question-text">{question.question}</h4>
          
          <div class="quiz-options">
            <For each={question.options}>
              {(option, index) => (
                <button
                  class={`quiz-option ${quizAnswers()[currentQuizIndex()] === index() ? 'selected' : ''}`}
                  onClick={() => handleSelectAnswer(index())}
                >
                  <span class="option-index">{String.fromCharCode(65 + index())}</span>
                  <span class="option-text">{option}</span>
                </button>
              )}
            </For>
          </div>
        </div>

        <div class="quiz-actions">
          <button 
            class="modal-button secondary" 
            onClick={handlePrevQuestion}
            disabled={currentQuizIndex() === 0}
          >
            上一题
          </button>
          <button 
            class="modal-button primary" 
            onClick={handleNextQuestion}
            disabled={quizAnswers()[currentQuizIndex()] === undefined}
          >
            {isLastQuestion ? '提交答案' : '下一题'}
          </button>
        </div>
      </div>
    );
  }

  if (selectedLesson()) {
    const lesson = selectedLesson()!;
    
    return (
      <div class="rules-lesson-detail">
        <button class="lesson-back-btn" onClick={handleBackToList}>
          ← 返回课程列表
        </button>

        <div class="lesson-detail-header">
          <span class="lesson-detail-icon">{lesson.icon}</span>
          <div>
            <h3 class="lesson-detail-title">{lesson.title}</h3>
            <p class="lesson-detail-desc">{lesson.description}</p>
            <div class="lesson-detail-meta">
              <span class="lesson-time">⏱️ 约 {lesson.estimatedTime} 分钟</span>
              {lesson.completed && <span class="lesson-completed-badge">✓ 已完成</span>}
            </div>
          </div>
        </div>

        <div class="lesson-content">
          <For each={lesson.content.sections}>
            {(section) => (
              <div class="lesson-section">
                <h4 class="lesson-section-title">
                  {section.icon && <span class="section-icon">{section.icon}</span>}
                  {section.title}
                </h4>
                <div class="lesson-section-body">
                  <For each={section.paragraphs}>
                    {(para) => <p class="lesson-paragraph">{para}</p>}
                  </For>
                  
                  {section.tips && section.tips.length > 0 && (
                    <div class="lesson-tips">
                      <div class="tips-title">💡 小贴士</div>
                      <ul class="tips-list">
                        <For each={section.tips}>
                          {(tip) => <li class="tip-item">{tip}</li>}
                        </For>
                      </ul>
                    </div>
                  )}
                  
                  {section.warnings && section.warnings.length > 0 && (
                    <div class="lesson-warnings">
                      <div class="warnings-title">⚠️ 注意事项</div>
                      <ul class="warnings-list">
                        <For each={section.warnings}>
                          {(warning) => <li class="warning-item">{warning}</li>}
                        </For>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </For>
        </div>

        {lesson.quiz && lesson.quiz.questions.length > 0 && (
          <div class="lesson-quiz-section">
            <div class="quiz-banner">
              <span class="quiz-icon">📝</span>
              <div class="quiz-info">
                <h4 class="quiz-name">课后测验</h4>
                <p class="quiz-desc">
                  {lesson.quiz.questions.length} 道题 · 及格分 {lesson.quiz.passingScore} 分
                </p>
              </div>
              <button class="modal-button primary" onClick={handleStartQuiz}>
                开始测验
              </button>
            </div>
          </div>
        )}

        {!lesson.quiz && (
          <div class="lesson-complete-section">
            <button 
              class="modal-button primary" 
              onClick={() => {
                completeLesson(lesson.id);
                handleBackToList();
              }}
            >
              标记为已学习
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div class="rules-lessons-list">
      <For each={LESSON_CATEGORIES}>
        {(category) => {
          const categoryLessons = lessonsByCategory()[category.id] || [];
          if (categoryLessons.length === 0) return null;
          
          return (
            <div class="lesson-category">
              <div class="category-header">
                <span class="category-icon">{category.icon}</span>
                <div>
                  <h4 class="category-title">{category.name}</h4>
                  <p class="category-desc">{category.description}</p>
                </div>
                <span class="category-count">
                  {categoryLessons.filter(l => l.completed).length}/{categoryLessons.length}
                </span>
              </div>
              
              <div class="lesson-cards">
                <For each={categoryLessons}>
                  {(lesson) => (
                    <div
                      class={`lesson-card ${lesson.unlocked ? '' : 'locked'} ${lesson.completed ? 'completed' : ''}`}
                      onClick={() => handleSelectLesson(lesson.id)}
                    >
                      <div class="lesson-card-header">
                        <span class="lesson-card-icon">{lesson.icon}</span>
                        <div class="lesson-card-status">
                          {lesson.completed && <span class="status-badge completed">✓ 已完成</span>}
                          {!lesson.unlocked && <span class="status-badge locked">🔒 未解锁</span>}
                          {lesson.unlocked && !lesson.completed && <span class="status-badge available">可学习</span>}
                        </div>
                      </div>
                      <h5 class="lesson-card-title">{lesson.title}</h5>
                      <p class="lesson-card-desc">{lesson.description}</p>
                      <div class="lesson-card-footer">
                        <span class="lesson-difficulty">
                          {lesson.difficulty === 'beginner' && '🌱 入门'}
                          {lesson.difficulty === 'intermediate' && '📖 进阶'}
                          {lesson.difficulty === 'advanced' && '🎯 高级'}
                        </span>
                        <span class="lesson-time">⏱️ {lesson.estimatedTime}分钟</span>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </div>
          );
        }}
      </For>
    </div>
  );
}

function getTrainingCenterState() {
  return { quizActive: false };
}

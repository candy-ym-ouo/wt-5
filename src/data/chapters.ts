import type { Chapter, ChapterTask } from '../types/game';

const createTask = (
  id: string,
  bookId: string,
  title: string,
  description: string,
  order: number
): ChapterTask => ({
  id,
  bookId,
  title,
  description,
  order,
  completed: false,
});

export const CHAPTERS: Chapter[] = [
  {
    id: 'chapter_literature',
    title: '文学殿堂',
    subtitle: '第一章',
    description: '探索文学经典，感受文字的力量与魅力。从意识流到魔幻现实主义，领略文学大师的风采。',
    theme: '文学',
    icon: '📖',
    order: 1,
    totalScore: 0,
    bonusScore: 500,
    unlocked: true,
    status: 'locked',
    currentTaskIndex: 0,
    tasks: [
      createTask('task_lit_1', 'b001', '追忆似水年华', '寻找普鲁斯特的意识流巨著', 1),
      createTask('task_lit_2', 'b002', '百年孤独', '探索马尔克斯的魔幻世界', 2),
      createTask('task_lit_3', 'b009', '战争与和平', '托尔斯泰的史诗巨著', 3),
      createTask('task_lit_4', 'b015', '月亮与六便士', '追寻艺术理想的故事', 4),
    ],
  },
  {
    id: 'chapter_classics',
    title: '古典名著',
    subtitle: '第二章',
    description: '穿越时光，邂逅中国古典文学的瑰宝。四大名著、聊斋志异，领略古典文学的永恒魅力。',
    theme: '古典',
    icon: '🏯',
    order: 2,
    totalScore: 0,
    bonusScore: 600,
    unlocked: false,
    status: 'locked',
    currentTaskIndex: 0,
    tasks: [
      createTask('task_cls_1', 'b003', '红楼梦', '封建社会的百科全书', 1),
      createTask('task_cls_2', 'b017', '三国演义', '三国风云，英雄辈出', 2),
      createTask('task_cls_3', 'b023', '西游记', '师徒四人西天取经', 3),
      createTask('task_cls_4', 'b027', '水浒传', '梁山好汉的传奇', 4),
      createTask('task_cls_5', 'b031', '聊斋志异', '花妖狐魅的奇幻世界', 5),
    ],
  },
  {
    id: 'chapter_science',
    title: '科学探索',
    subtitle: '第三章',
    description: '踏上科学之旅，从宇宙起源到生命奥秘。探索时间、空间与万物的终极答案。',
    theme: '科普',
    icon: '🔬',
    order: 3,
    totalScore: 0,
    bonusScore: 550,
    unlocked: false,
    status: 'locked',
    currentTaskIndex: 0,
    tasks: [
      createTask('task_sci_1', 'b004', '时间简史', '探索时间和空间的奥秘', 1),
      createTask('task_sci_2', 'b016', '昆虫记', '法布尔的自然观察笔记', 2),
      createTask('task_sci_3', 'b022', '万物理论', '宇宙起源与命运的探索', 3),
      createTask('task_sci_4', 'b030', '宇宙的琴弦', '弦理论的通俗解释', 4),
    ],
  },
  {
    id: 'chapter_philosophy',
    title: '哲学智慧',
    subtitle: '第四章',
    description: '与古今哲人对话，探寻生命的意义。从道家思想到存在主义，品味智慧的结晶。',
    theme: '哲学',
    icon: '🧠',
    order: 4,
    totalScore: 0,
    bonusScore: 500,
    unlocked: false,
    status: 'locked',
    currentTaskIndex: 0,
    tasks: [
      createTask('task_phi_1', 'b010', '道德经', '道家思想的源头', 1),
      createTask('task_phi_2', 'b014', '资本论', '马克思主义政治经济学', 2),
      createTask('task_phi_3', 'b020', '理想国', '西方哲学的源头', 3),
      createTask('task_phi_4', 'b026', '沉思录', '罗马皇帝的自我对话', 4),
    ],
  },
  {
    id: 'chapter_tech',
    title: '技术匠心',
    subtitle: '第五章',
    description: '走进代码的世界，领略软件工程的艺术。从设计模式到代码重构，提升编程技艺。',
    theme: '技术',
    icon: '💻',
    order: 5,
    totalScore: 0,
    bonusScore: 700,
    unlocked: false,
    status: 'locked',
    currentTaskIndex: 0,
    tasks: [
      createTask('task_tech_1', 'b005', '代码大全', '软件开发的实用指南', 1),
      createTask('task_tech_2', 'b012', '设计模式', '23种设计模式的权威指南', 2),
      createTask('task_tech_3', 'b019', '算法导论', '算法领域的圣经', 3),
      createTask('task_tech_4', 'b028', '人月神话', '软件工程的经典', 4),
      createTask('task_tech_5', 'b032', '重构', '改善既有代码的设计', 5),
    ],
  },
];

export const getChapterById = (id: string): Chapter | undefined => {
  return CHAPTERS.find(ch => ch.id === id);
};

export const getNextChapter = (currentId: string): Chapter | undefined => {
  const currentIndex = CHAPTERS.findIndex(ch => ch.id === currentId);
  if (currentIndex >= 0 && currentIndex < CHAPTERS.length - 1) {
    return CHAPTERS[currentIndex + 1];
  }
  return undefined;
};

export const getChapterCount = (): number => CHAPTERS.length;

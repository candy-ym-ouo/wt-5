import type { Book } from '../types/game';

export const BOOKS: Book[] = [
  { id: 'b001', title: '追忆似水年华', author: '马塞尔·普鲁斯特', year: 1913, genre: '文学', shelf: 0, position: 0, color: '#8B4513', width: 22, height: 110, description: '意识流文学的巅峰之作，七卷本长篇小说。', isTarget: false, rarity: 'legendary', themes: ['时间与记忆', '文学经典'] },
  { id: 'b002', title: '百年孤独', author: '加西亚·马尔克斯', year: 1967, genre: '文学', shelf: 0, position: 1, color: '#CD853F', width: 20, height: 105, description: '魔幻现实主义经典，布恩迪亚家族七代人的传奇故事。', isTarget: false, rarity: 'epic', themes: ['文学经典'] },
  { id: 'b003', title: '红楼梦', author: '曹雪芹', year: 1791, genre: '古典', shelf: 0, position: 2, color: '#A0522D', width: 24, height: 115, description: '中国古典小说四大名著之首，封建社会的百科全书。', isTarget: false, rarity: 'legendary', themes: ['中国古典'] },
  { id: 'b004', title: '时间简史', author: '史蒂芬·霍金', year: 1988, genre: '科普', shelf: 0, position: 3, color: '#6B4423', width: 18, height: 100, description: '探索时间和空间奥秘的科普经典。', isTarget: false, rarity: 'epic', themes: ['时间与记忆', '科学探索'] },
  { id: 'b005', title: '代码大全', author: '史蒂夫·麦康奈尔', year: 1993, genre: '技术', shelf: 0, position: 4, color: '#8B7355', width: 26, height: 112, description: '软件开发的实用指南，编程智慧的宝库。', isTarget: false, rarity: 'rare', themes: ['技术匠心'] },
  { id: 'b006', title: '人类简史', author: '尤瓦尔·赫拉利', year: 2011, genre: '历史', shelf: 0, position: 5, color: '#D2691E', width: 21, height: 108, description: '从认知革命到科学革命，人类发展的宏大叙事。', isTarget: false, rarity: 'rare', themes: ['历史长河'] },
  { id: 'b007', title: '三体', author: '刘慈欣', year: 2008, genre: '科幻', shelf: 0, position: 6, color: '#5C4033', width: 23, height: 107, description: '中国科幻文学的里程碑，三体文明与地球的碰撞。', isTarget: false, rarity: 'epic', themes: ['冒险与探索', '科学探索'] },
  { id: 'b008', title: '瓦尔登湖', author: '梭罗', year: 1854, genre: '散文', shelf: 0, position: 7, color: '#8B6914', width: 19, height: 102, description: '自然主义文学经典，梭罗在瓦尔登湖畔的生活感悟。', isTarget: false, rarity: 'uncommon', themes: ['文学经典'] },

  { id: 'b009', title: '战争与和平', author: '列夫·托尔斯泰', year: 1869, genre: '文学', shelf: 1, position: 0, color: '#654321', width: 25, height: 115, description: '史诗级巨著，拿破仑时代俄国社会的全景画卷。', isTarget: false, rarity: 'legendary', themes: ['文学经典', '历史长河'] },
  { id: 'b010', title: '道德经', author: '老子', year: -500, genre: '哲学', shelf: 1, position: 1, color: '#B8860B', width: 16, height: 95, description: '道家思想的源头，五千言的智慧宝典。', isTarget: false, rarity: 'legendary', themes: ['哲学智慧', '中国古典'] },
  { id: 'b011', title: '史记', author: '司马迁', year: -91, genre: '历史', shelf: 1, position: 2, color: '#8B7765', width: 28, height: 118, description: '中国第一部纪传体通史，史家之绝唱。', isTarget: false, rarity: 'epic', themes: ['历史长河', '中国古典'] },
  { id: 'b012', title: '设计模式', author: 'GoF', year: 1994, genre: '技术', shelf: 1, position: 3, color: '#704214', width: 22, height: 108, description: '软件工程的经典，23种设计模式的权威指南。', isTarget: false, rarity: 'epic', themes: ['技术匠心'] },
  { id: 'b013', title: '小王子', author: '圣埃克苏佩里', year: 1943, genre: '童话', shelf: 1, position: 4, color: '#CDAA7D', width: 17, height: 98, description: '写给大人的童话，关于爱与责任的寓言。', isTarget: false, rarity: 'uncommon', themes: ['文学经典', '冒险与探索'] },
  { id: 'b014', title: '资本论', author: '卡尔·马克思', year: 1867, genre: '哲学', shelf: 1, position: 5, color: '#5C3317', width: 27, height: 120, description: '马克思主义政治经济学的奠基之作。', isTarget: false, rarity: 'epic', themes: ['哲学智慧'] },
  { id: 'b015', title: '月亮与六便士', author: '毛姆', year: 1919, genre: '文学', shelf: 1, position: 6, color: '#DAA520', width: 20, height: 104, description: '以画家高更为原型，追寻艺术理想的故事。', isTarget: false, rarity: 'rare', themes: ['文学经典'] },
  { id: 'b016', title: '昆虫记', author: '法布尔', year: 1879, genre: '科普', shelf: 1, position: 7, color: '#8B8682', width: 21, height: 106, description: '昆虫世界的百科全书，法布尔的自然观察笔记。', isTarget: false, rarity: 'uncommon', themes: ['科学探索'] },

  { id: 'b017', title: '三国演义', author: '罗贯中', year: 1522, genre: '古典', shelf: 2, position: 0, color: '#8B3A3A', width: 26, height: 114, description: '四大名著之一，三国时期的历史演义。', isTarget: false, rarity: 'epic', themes: ['中国古典', '历史长河', '冒险与探索'] },
  { id: 'b018', title: '局外人', author: '加缪', year: 1942, genre: '文学', shelf: 2, position: 1, color: '#2F4F4F', width: 18, height: 100, description: '存在主义文学的代表作，荒诞哲学的诠释。', isTarget: false, rarity: 'rare', themes: ['文学经典', '哲学智慧'] },
  { id: 'b019', title: '算法导论', author: 'Thomas H. Cormen', year: 1990, genre: '技术', shelf: 2, position: 2, color: '#4A3728', width: 28, height: 118, description: '算法领域的圣经，计算机科学经典教材。', isTarget: false, rarity: 'legendary', themes: ['技术匠心'] },
  { id: 'b020', title: '理想国', author: '柏拉图', year: -380, genre: '哲学', shelf: 2, position: 3, color: '#6B4423', width: 20, height: 105, description: '西方哲学的源头，探讨正义与理想城邦。', isTarget: false, rarity: 'epic', themes: ['哲学智慧'] },
  { id: 'b021', title: '鲁滨逊漂流记', author: '笛福', year: 1719, genre: '文学', shelf: 2, position: 4, color: '#8B6914', width: 22, height: 108, description: '英国现实主义小说的开山之作。', isTarget: false, rarity: 'rare', themes: ['文学经典', '冒险与探索'] },
  { id: 'b022', title: '万物理论', author: '史蒂芬·霍金', year: 2002, genre: '科普', shelf: 2, position: 5, color: '#5C4033', width: 19, height: 102, description: '宇宙起源与命运的终极探索。', isTarget: false, rarity: 'rare', themes: ['时间与记忆', '科学探索'] },
  { id: 'b023', title: '西游记', author: '吴承恩', year: 1592, genre: '古典', shelf: 2, position: 6, color: '#B8860B', width: 25, height: 112, description: '四大名著之一，唐僧师徒西天取经的神话。', isTarget: false, rarity: 'epic', themes: ['中国古典', '冒险与探索'] },
  { id: 'b024', title: '黑客与画家', author: '保罗·格雷厄姆', year: 2004, genre: '技术', shelf: 2, position: 7, color: '#704214', width: 21, height: 104, description: '硅谷创业之父的技术与创业随笔。', isTarget: false, rarity: 'rare', themes: ['技术匠心'] },

  { id: 'b025', title: '麦田里的守望者', author: '塞林格', year: 1951, genre: '文学', shelf: 3, position: 0, color: '#CD853F', width: 18, height: 100, description: '青少年成长的经典，反叛与彷徨的青春。', isTarget: false, rarity: 'rare', themes: ['文学经典'] },
  { id: 'b026', title: '沉思录', author: '马可·奥勒留', year: 180, genre: '哲学', shelf: 3, position: 1, color: '#8B7355', width: 17, height: 96, description: '罗马皇帝的自我对话，斯多葛学派的智慧。', isTarget: false, rarity: 'rare', themes: ['哲学智慧'] },
  { id: 'b027', title: '水浒传', author: '施耐庵', year: 1370, genre: '古典', shelf: 3, position: 2, color: '#5C3317', width: 26, height: 114, description: '四大名著之一，梁山好汉的传奇故事。', isTarget: false, rarity: 'epic', themes: ['中国古典', '冒险与探索'] },
  { id: 'b028', title: '人月神话', author: '弗雷德里克·布鲁克斯', year: 1975, genre: '技术', shelf: 3, position: 3, color: '#654321', width: 20, height: 102, description: '软件工程的经典，项目管理的智慧。', isTarget: false, rarity: 'epic', themes: ['技术匠心'] },
  { id: 'b029', title: '老人与海', author: '海明威', year: 1952, genre: '文学', shelf: 3, position: 4, color: '#A0522D', width: 16, height: 98, description: '硬汉精神的象征，人与自然的搏斗。', isTarget: false, rarity: 'epic', themes: ['文学经典', '冒险与探索'] },
  { id: 'b030', title: '宇宙的琴弦', author: '布莱恩·格林', year: 1999, genre: '科普', shelf: 3, position: 5, color: '#8B7765', width: 22, height: 106, description: '弦理论的通俗解释，探索宇宙的终极结构。', isTarget: false, rarity: 'rare', themes: ['时间与记忆', '科学探索'] },
  { id: 'b031', title: '聊斋志异', author: '蒲松龄', year: 1766, genre: '古典', shelf: 3, position: 6, color: '#D2691E', width: 23, height: 108, description: '清代文言短篇小说集，花妖狐魅的奇幻世界。', isTarget: false, rarity: 'rare', themes: ['中国古典'] },
  { id: 'b032', title: '重构', author: '马丁·福勒', year: 1999, genre: '技术', shelf: 3, position: 7, color: '#8B4513', width: 24, height: 110, description: '改善既有代码的设计，代码质量提升指南。', isTarget: false, rarity: 'rare', themes: ['技术匠心'] },
];

export const SHELF_COUNT = 4;
export const BOOKS_PER_SHELF = 8;

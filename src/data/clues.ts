import type { Clue, Book, ClueType } from '../types/game';

export const createCluesForBook = (book: Book): Clue[] => {
  return [
    {
      id: `${book.id}-clue-1`,
      title: '第一条线索',
      content: '这本书来自一个特定的年代，翻开书页，你能感受到那个时代的气息。',
      type: 'year',
      unlocked: true,
      order: 1,
    },
    {
      id: `${book.id}-clue-2`,
      title: '第二条线索',
      content: '它的作者是一位文坛巨匠，其作品影响了无数后来者。',
      type: 'author',
      unlocked: false,
      order: 2,
    },
    {
      id: `${book.id}-clue-3`,
      title: '第三条线索',
      content: '这本书属于某个特定的分类，书架上它的邻居们都有相似的灵魂。',
      type: 'genre',
      unlocked: false,
      order: 3,
    },
    {
      id: `${book.id}-clue-4`,
      title: '第四条线索',
      content: '它被放置在旧书店的某一层书架上，位置不算太高也不算太低。',
      type: 'shelf',
      unlocked: false,
      order: 4,
    },
    {
      id: `${book.id}-clue-5`,
      title: '第五条线索',
      content: '翻开书页，字里行间藏着作者的心意，这段描述或许能帮你找到答案。',
      type: 'description',
      unlocked: false,
      order: 5,
    },
    {
      id: `${book.id}-clue-6`,
      title: '第六条线索',
      content: '这本书的诞生有着鲜为人知的幕后故事，作者写下它时经历了许多。',
      type: 'background',
      unlocked: false,
      order: 6,
    },
    {
      id: `${book.id}-clue-7`,
      title: '第七条线索',
      content: '它的名字就藏在这最后一张卡片里，揭晓答案的时刻到了！',
      type: 'title',
      unlocked: false,
      order: 7,
    },
  ];
};

export const CLUE_TEMPLATES = {
  year: (year: number) => {
    const absYear = Math.abs(year);
    if (year < 0) {
      return `这本书成书于公元前${absYear}年左右，是跨越千年的智慧结晶。`;
    }
    if (year < 500) {
      return `这本书诞生于公元${year}年前后，见证了古典文明的兴衰起落。`;
    }
    if (year < 1800) {
      return `这本书初版于${year}年，那个风起云涌的年代孕育了无数经典。`;
    }
    if (year < 1950) {
      return `这本书出版于${year}年，是那个变革时代最具代表性的作品之一。`;
    }
    if (year < 2000) {
      return `这本书出版于${year}年，在世纪末的思潮中留下了深刻印记。`;
    }
    return `这本书首版于${year}年，是新世纪初最值得一读的作品之一。`;
  },
  author: (author: string) => `这本书的作者是${author}，其创作的笔触跨越了时代的边界。`,
  genre: (genre: string) => `在旧书店的分类目录里，这本书被归在"${genre}"类的分区。`,
  shelf: (shelf: number) => `它被摆放在第${shelf + 1}层书架上，目光扫过时记得多停留一会儿。`,
  title: (title: string) => `答案揭晓——你要找的书正是《${title}》，快去取下它吧！`,
  description: (book: Book) => {
    if (book.descriptionClues.length === 0) return `书中写道：${book.description}`;
    const randomClue = book.descriptionClues[Math.floor(Math.random() * book.descriptionClues.length)];
    return `细读简介能发现端倪——${randomClue}`;
  },
  background: (book: Book) => {
    const story = book.backgroundStory || book.description;
    if (story.length <= 45) return `关于这本书的幕后：${story}`;
    return `关于这本书的幕后故事：${story.slice(0, 45)}……`;
  },
};

export const buildClueContent = (type: ClueType, book: Book): string => {
  switch (type) {
    case 'year':
      return CLUE_TEMPLATES.year(book.year);
    case 'author':
      return CLUE_TEMPLATES.author(book.author);
    case 'genre':
      return CLUE_TEMPLATES.genre(book.genre);
    case 'shelf':
      return CLUE_TEMPLATES.shelf(book.shelf);
    case 'title':
      return CLUE_TEMPLATES.title(book.title);
    case 'description':
      return CLUE_TEMPLATES.description(book);
    case 'background':
      return CLUE_TEMPLATES.background(book);
    default:
      return '';
  }
};

export const CLUE_TYPE_ICONS: Record<ClueType, string> = {
  year: '🕰️',
  author: '✍️',
  genre: '📚',
  shelf: '🪜',
  description: '📖',
  background: '✨',
  title: '🏷️',
};

export const CLUE_TYPE_NAMES: Record<ClueType, string> = {
  year: '年代线索',
  author: '作者线索',
  genre: '分类线索',
  shelf: '位置线索',
  description: '描述线索',
  background: '背景故事',
  title: '书名线索',
};

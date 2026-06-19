import type { Clue } from '../types/game';

export const createCluesForBook = (bookId: string): Clue[] => {
  return [
    {
      id: `${bookId}-clue-1`,
      title: '第一条线索',
      content: '这本书来自一个特定的年代，翻开书页，你能感受到那个时代的气息。',
      type: 'year',
      unlocked: true,
      order: 1,
    },
    {
      id: `${bookId}-clue-2`,
      title: '第二条线索',
      content: '它的作者是一位文坛巨匠，其作品影响了无数后来者。',
      type: 'author',
      unlocked: false,
      order: 2,
    },
    {
      id: `${bookId}-clue-3`,
      title: '第三条线索',
      content: '这本书属于某个特定的分类，书架上它的邻居们都有相似的灵魂。',
      type: 'genre',
      unlocked: false,
      order: 3,
    },
    {
      id: `${bookId}-clue-4`,
      title: '第四条线索',
      content: '它被放置在旧书店的某一层书架上，位置不算太高也不算太低。',
      type: 'shelf',
      unlocked: false,
      order: 4,
    },
    {
      id: `${bookId}-clue-5`,
      title: '第五条线索',
      content: '这本书的名字藏着一个秘密，它和时间有关，也和记忆有关。',
      type: 'title',
      unlocked: false,
      order: 5,
    },
  ];
};

export const CLUE_TEMPLATES = {
  year: (year: number) => `这本书出版于${year}年，是那个年代的代表作之一。`,
  author: (author: string) => `它的作者是${author}，一位在文学史上留下浓墨重彩的作家。`,
  genre: (genre: string) => `这本书属于${genre}类，在书架的同类书籍中格外醒目。`,
  shelf: (shelf: number) => `它被摆放在第${shelf + 1}层书架上，需要你仔细寻找。`,
  title: (title: string) => `这本书的名字是《${title}》，快找到它吧！`,
  description: (desc: string) => `书中写道：${desc}`,
};

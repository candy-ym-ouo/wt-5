import type { StoryCharacter, BookshelfArea, BookshelfAreaStatus, SpecialBook, StoryChapter, Dialogue } from '../types/story';

export const STORY_CHARACTERS: StoryCharacter[] = [
  {
    id: 'char_grandpa',
    name: '陈老先生',
    avatar: '👴',
    title: '书店传承人',
    description: '旧书店的最后一位守护者，对每本书都如数家珍。他年事已高，希望找到有缘人继承这份事业。',
    personality: '慈祥而博学，说话喜欢引经据典，偶尔会陷入回忆。',
    firstAppearArea: 'area_entrance',
  },
  {
    id: 'char_librarian',
    name: '苏婉清',
    avatar: '👩‍🏫',
    title: '文学区守护者',
    description: '文学系毕业的图书管理员，负责文学殿堂区域的整理。她说话优雅，善于用文学意象表达情感。',
    personality: '温婉细腻，热爱文学，相信每本书都有自己的灵魂。',
    firstAppearArea: 'area_literature',
  },
  {
    id: 'char_historian',
    name: '李正源',
    avatar: '🧓',
    title: '古籍守护者',
    description: '退休的历史教授，守护着古典名著区域。他对古籍有着近乎偏执的热爱，认为古典是文明的根基。',
    personality: '严谨古板，实则内心温暖，对年轻人充满期待。',
    firstAppearArea: 'area_classics',
  },
  {
    id: 'char_scientist',
    name: '方晓宇',
    avatar: '👨‍🔬',
    title: '科学区守护者',
    description: '物理学博士，科学探索区域的守护者。他用科学的眼光看待一切，相信知识是改变世界的力量。',
    personality: '理性而幽默，喜欢用比喻解释复杂概念，偶尔犯点书呆子气。',
    firstAppearArea: 'area_science',
  },
  {
    id: 'char_philosopher',
    name: '周思远',
    avatar: '🧘',
    title: '哲学区守护者',
    description: '哲学系教授，智慧之塔区域的守护者。他沉默寡言，但说出的话总是发人深省。',
    personality: '深邃内敛，喜欢用提问引导思考，偶尔会开冷笑话。',
    firstAppearArea: 'area_philosophy',
  },
  {
    id: 'char_engineer',
    name: '林若溪',
    avatar: '👩‍💻',
    title: '技术区守护者',
    description: '资深软件工程师，匠人之坊区域的守护者。她务实高效，相信技术能让世界变得更好。',
    personality: '干练果断，说话直来直去，对代码和书籍有着同样的热情。',
    firstAppearArea: 'area_tech',
  },
];

export const BOOKSHELF_AREAS: BookshelfArea[] = [
  {
    id: 'area_entrance',
    name: '书店门厅',
    subtitle: '故事的起点',
    description: '旧书店的门厅，积满灰尘的书架和褪色的招牌。陈老先生在这里等待有缘人。',
    damagedDescription: '门厅昏暗，书架歪斜，空气中弥漫着陈旧纸张的气味。一盏油灯在角落里摇曳。',
    restoredDescription: '门厅焕然一新，温暖的光线照亮了整洁的书架。门口挂着新漆的招牌——"时光旧书店"。',
    icon: '🏚️',
    order: 0,
    status: 'damaged',
    relatedChapterId: '',
    shelfIndex: -1,
    restorationCost: 0,
    restorationRewards: [
      { type: 'unlock_area', value: 'area_literature', description: '解锁文学殿堂区域' },
    ],
    specialBookIds: ['special_book_letter'],
    characterId: 'char_grandpa',
    themeColor: '#8B7355',
    bgGradient: 'linear-gradient(135deg, #2c1810 0%, #4a3728 50%, #2c1810 100%)',
  },
  {
    id: 'area_literature',
    name: '文学殿堂',
    subtitle: '第一章',
    description: '曾经最辉煌的区域，如今书页散落、书架倾斜。文学的经典在等待被重新发现。',
    damagedDescription: '文学区的书架被水泡过，许多书页粘连在一起。苏婉清正在小心翼翼地分离它们。',
    restoredDescription: '文学殿堂重新焕发光彩，暖黄色的灯光下，每一本书都散发着墨香。苏婉清在整理书架时露出了微笑。',
    icon: '📖',
    order: 1,
    status: 'locked',
    relatedChapterId: 'chapter_literature',
    shelfIndex: 0,
    restorationCost: 100,
    restorationRewards: [
      { type: 'coins', value: 200, description: '获得200金币' },
      { type: 'score_bonus', value: 500, description: '章节通关奖励500分' },
      { type: 'special_book', value: 'special_book_poetry', description: '发现珍本：诗之书' },
      { type: 'unlock_area', value: 'area_classics', description: '解锁古典名著区域' },
    ],
    specialBookIds: ['special_book_poetry'],
    characterId: 'char_librarian',
    themeColor: '#CD853F',
    bgGradient: 'linear-gradient(135deg, #3d2b1f 0%, #5c3d2e 50%, #3d2b1f 100%)',
  },
  {
    id: 'area_classics',
    name: '古籍阁楼',
    subtitle: '第二章',
    description: '存放着千年经典的阁楼，古老的线装书在虫蛀和潮气中挣扎。李正源在这里日夜守护。',
    damagedDescription: '阁楼的地板吱呀作响，古籍被蛀虫侵蚀，书页泛黄卷曲。李正源在角落里叹息。',
    restoredDescription: '古籍阁楼恢复了庄严肃穆的氛围，防虫防潮措施完善，线装书在樟木匣中安然沉睡。',
    icon: '🏯',
    order: 2,
    status: 'locked',
    relatedChapterId: 'chapter_classics',
    shelfIndex: 1,
    restorationCost: 200,
    restorationRewards: [
      { type: 'coins', value: 350, description: '获得350金币' },
      { type: 'score_bonus', value: 600, description: '章节通关奖励600分' },
      { type: 'special_book', value: 'special_book_jade', description: '发现珍本：玉之书' },
      { type: 'unlock_area', value: 'area_science', description: '解锁科学探索区域' },
    ],
    specialBookIds: ['special_book_jade'],
    characterId: 'char_historian',
    themeColor: '#B8860B',
    bgGradient: 'linear-gradient(135deg, #1a1a2e 0%, #3d3d5c 50%, #1a1a2e 100%)',
  },
  {
    id: 'area_science',
    name: '探索书房',
    subtitle: '第三章',
    description: '科学探索的书房，曾摆满各种科学典籍。如今仪器蒙尘，书籍散乱。方晓宇正在努力复原。',
    damagedDescription: '书房里的地球仪歪倒在地，望远镜镜片碎裂，科普书籍被水浸泡。方晓宇正在修理一台旧显微镜。',
    restoredDescription: '探索书房重燃求知之火，天文望远镜重新对准星空，显微镜下是无限微观世界。',
    icon: '🔬',
    order: 3,
    status: 'locked',
    relatedChapterId: 'chapter_science',
    shelfIndex: 2,
    restorationCost: 300,
    restorationRewards: [
      { type: 'coins', value: 500, description: '获得500金币' },
      { type: 'score_bonus', value: 550, description: '章节通关奖励550分' },
      { type: 'special_book', value: 'special_book_star', description: '发现珍本：星之书' },
      { type: 'unlock_area', value: 'area_philosophy', description: '解锁哲学智慧区域' },
    ],
    specialBookIds: ['special_book_star'],
    characterId: 'char_scientist',
    themeColor: '#4682B4',
    bgGradient: 'linear-gradient(135deg, #0d1b2a 0%, #1b2838 50%, #0d1b2a 100%)',
  },
  {
    id: 'area_philosophy',
    name: '沉思庭院',
    subtitle: '第四章',
    description: '哲学之书所在的庭院，竹林掩映下有一间茶室。周思远常在此品茗冥想，与古人对话。',
    damagedDescription: '庭院杂草丛生，竹子枯黄，茶室的窗户纸破了几个洞。周思远依然安静地坐在蒲团上。',
    restoredDescription: '沉思庭院清幽雅致，新竹摇曳，茶室飘来清香。周思远说："万物有序，心自然安。"',
    icon: '🧠',
    order: 4,
    status: 'locked',
    relatedChapterId: 'chapter_philosophy',
    shelfIndex: 3,
    restorationCost: 400,
    restorationRewards: [
      { type: 'coins', value: 650, description: '获得650金币' },
      { type: 'score_bonus', value: 500, description: '章节通关奖励500分' },
      { type: 'special_book', value: 'special_book_wisdom', description: '发现珍本：慧之书' },
      { type: 'unlock_area', value: 'area_tech', description: '解锁技术匠心区域' },
    ],
    specialBookIds: ['special_book_wisdom'],
    characterId: 'char_philosopher',
    themeColor: '#6B8E23',
    bgGradient: 'linear-gradient(135deg, #1a2a1a 0%, #2d3d2d 50%, #1a2a1a 100%)',
  },
  {
    id: 'area_tech',
    name: '匠人之坊',
    subtitle: '第五章',
    description: '技术匠人的工作坊，曾是程序员们的精神圣地。林若溪在这里守护着技术书籍的最后堡垒。',
    damagedDescription: '工作坊的服务器风扇不再转动，显示器的屏幕上布满灰尘。林若溪正在清理一个锈迹斑斑的键盘。',
    restoredDescription: '匠人之坊重新亮起屏幕的光芒，代码在显示器上如流水般滚动。林若溪露出了久违的笑容。',
    icon: '💻',
    order: 5,
    status: 'locked',
    relatedChapterId: 'chapter_tech',
    shelfIndex: 3,
    restorationCost: 500,
    restorationRewards: [
      { type: 'coins', value: 800, description: '获得800金币' },
      { type: 'score_bonus', value: 700, description: '章节通关奖励700分' },
      { type: 'special_book', value: 'special_book_code', description: '发现珍本：码之书' },
    ],
    specialBookIds: ['special_book_code'],
    characterId: 'char_engineer',
    themeColor: '#4169E1',
    bgGradient: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0a0a1a 100%)',
  },
];

export const SPECIAL_BOOKS: SpecialBook[] = [
  {
    id: 'special_book_letter',
    title: '陈年书信',
    author: '陈老先生',
    description: '一封泛黄的书信，记录着旧书店的起源。',
    longDescription: '这封信是陈老先生年轻时写给妻子的。信中描绘了他对书籍的热爱，以及创办旧书店的梦想。他在信的末尾写道："每一本旧书，都是一个等待被唤醒的灵魂。愿这间书店，成为所有迷失故事的归处。"',
    icon: '✉️',
    rarity: 'unique',
    areaId: 'area_entrance',
    relatedBookId: 'b008',
    lore: '书店的起点，也是一切故事的起源。这封信奠定了旧书店的使命——为每一本被遗忘的书找到归宿。',
    unlockCondition: { type: 'dialogue_choice', value: 'intro_accept' },
    restored: false,
  },
  {
    id: 'special_book_poetry',
    title: '诗之书',
    author: '佚名',
    description: '一本用金线装订的诗集，据说能唤醒文字的力量。',
    longDescription: '这本诗集的封面用金丝线绣着藤蔓花纹，翻开时能闻到淡淡的花香。据说每一个阅读它的人，都能在字里行间找到属于自己的诗句。苏婉清说，这是书店最珍贵的文学藏品。',
    icon: '📜',
    rarity: 'unique',
    areaId: 'area_literature',
    relatedBookId: 'b002',
    lore: '传说这本诗集由一位失明的诗人所写，他用触摸文字的方式，将世界上最美的诗句编织在一起。',
    unlockCondition: { type: 'complete_area', areaId: 'area_literature' },
    restored: false,
  },
  {
    id: 'special_book_jade',
    title: '玉之书',
    author: '佚名',
    description: '一本以和田玉为封面的古籍，记载着失传的典籍目录。',
    longDescription: '这本古籍的封面由一块薄如蝉翼的和田玉片制成，轻轻叩击会发出清脆的玉鸣。书中记载了数百部已经失传的古籍目录和内容简介，每一部都附有精美的手绘插图。李正源说，这是他一生中见过的最珍贵的古籍。',
    icon: '💎',
    rarity: 'unique',
    areaId: 'area_classics',
    relatedBookId: 'b003',
    lore: '据传此书由古代藏书家编纂，他将毕生收集的珍本目录刻录于此，期望后人能循此目录重建文明之库。',
    unlockCondition: { type: 'complete_area', areaId: 'area_classics' },
    restored: false,
  },
  {
    id: 'special_book_star',
    title: '星之书',
    author: '佚名',
    description: '一本在暗处会发光的天文图谱，记录着千年星轨。',
    longDescription: '这本天文图谱的页面由一种特殊的夜光材料制成，在黑暗中会浮现出璀璨的星空。每一页对应一个星座，标注着从古代到现代的星轨变化。方晓宇说，这本书记录的某些星象变化，至今科学界仍在研究。',
    icon: '⭐',
    rarity: 'unique',
    areaId: 'area_science',
    relatedBookId: 'b004',
    lore: '相传此书由一位古代天文学家所著，他在一生中观测记录了三千年的星轨变化，以传承给后人。',
    unlockCondition: { type: 'complete_area', areaId: 'area_science' },
    restored: false,
  },
  {
    id: 'special_book_wisdom',
    title: '慧之书',
    author: '佚名',
    description: '一本空白书籍，据说只有内心平静时才能看到文字。',
    longDescription: '这本书的每一页看起来都是空白的，但当你的内心足够平静时，文字会像水中的倒影一样浮现。不同的人在不同的时刻看到的内容都不相同。周思远说，这其实是一面镜子——你看到的，是你自己的智慧。',
    icon: '🪷',
    rarity: 'unique',
    areaId: 'area_philosophy',
    relatedBookId: 'b010',
    lore: '此书无字，却能映照万物。据说读懂此书的人，将获得超越时空的洞察力。',
    unlockCondition: { type: 'complete_area', areaId: 'area_philosophy' },
    restored: false,
  },
  {
    id: 'special_book_code',
    title: '码之书',
    author: '佚名',
    description: '一本以代码写就的奇书，记录着完美算法的终极形态。',
    longDescription: '这本书用编程语言写成，但它的逻辑之美超越了任何已知的算法。书中描述的某些算法模式，与自然界的分形结构惊人地吻合。林若溪说，如果有人能完全理解这本书，就能写出完美的程序——但"完美"本身就是一个bug。',
    icon: '🔮',
    rarity: 'unique',
    areaId: 'area_tech',
    relatedBookId: 'b019',
    lore: '传说此书由一位天才程序员在顿悟时写下，他将宇宙的运行规律翻译成了代码。',
    unlockCondition: { type: 'complete_area', areaId: 'area_tech' },
    restored: false,
  },
];

export const STORY_CHAPTERS: StoryChapter[] = [
  {
    id: 'story_ch_entrance',
    areaId: 'area_entrance',
    title: '尘封的书店',
    subtitle: '序章',
    prologue: [],
    epilogue: [],
    introNarration: '在城市最古老的街巷深处，有一间被遗忘的旧书店。招牌上的字迹已经模糊不清，但透过布满灰尘的橱窗，依稀能看到成排的书脊。一个偶然的雨天，你推开了那扇吱呀作响的木门……',
    completionNarration: '门厅的灯光重新亮起，旧书店的第一缕温暖照亮了你的脸。陈老先生微笑着说："看来，你就是我一直等待的那个人。"',
  },
  {
    id: 'story_ch_literature',
    areaId: 'area_literature',
    title: '文学殿堂',
    subtitle: '第一章',
    prologue: [
      { id: 'lit_pro_1', speaker: 'character', characterId: 'char_librarian', text: '你来了……文学区需要你。这些书，每一本都是活着的灵魂。', emotion: '温柔' },
      { id: 'lit_pro_2', speaker: 'character', characterId: 'char_librarian', text: '水灾之后，许多书页粘连在一起。我试过很多办法，但独自一人实在力不从心。', emotion: '忧伤' },
      { id: 'lit_pro_3', speaker: 'character', characterId: 'char_librarian', text: '你能帮我找到那些散落的文学经典吗？它们是这个区域的根基。', emotion: '期待' },
    ],
    epilogue: [
      { id: 'lit_epi_1', speaker: 'character', characterId: 'char_librarian', text: '太美了……文学殿堂又恢复了往日的光彩。', emotion: '欣慰' },
      { id: 'lit_epi_2', speaker: 'character', characterId: 'char_librarian', text: '你知道吗？每一本被找回的书，都像一个迷路的孩子终于回了家。谢谢你。', emotion: '感动' },
      { id: 'lit_epi_3', speaker: 'narrator', text: '文学殿堂的光芒照亮了通往古籍阁楼的阶梯。那里，另一段故事正在等待。' },
    ],
    introNarration: '穿过门厅，你来到了文学殿堂。曾经最辉煌的区域如今满目疮痍，但苏婉清的眼睛里依然有光——那是文学赋予她的、永远不会熄灭的光。',
    completionNarration: '当最后一本文学经典被放回书架，整个殿堂仿佛活了过来。书页在微风中翻动，像是在低声吟唱。苏婉清轻轻地笑了，那笑容比任何诗句都美。',
  },
  {
    id: 'story_ch_classics',
    areaId: 'area_classics',
    title: '古籍阁楼',
    subtitle: '第二章',
    prologue: [
      { id: 'cls_pro_1', speaker: 'character', characterId: 'char_historian', text: '哼，年轻人。你以为整理古籍是那么容易的事？', emotion: '严厉' },
      { id: 'cls_pro_2', speaker: 'character', characterId: 'char_historian', text: '这些书承载了千年的文明。蛀虫啃食的不只是纸张，更是我们的根。', emotion: '沉重' },
      { id: 'cls_pro_3', speaker: 'character', characterId: 'char_historian', text: '……不过，既然你能修复文学区，也许你也能帮帮这些老家伙。', emotion: '松动' },
    ],
    epilogue: [
      { id: 'cls_epi_1', speaker: 'character', characterId: 'char_historian', text: '我活了这么大岁数，从未见过如此用心对待古籍的年轻人。', emotion: '感动' },
      { id: 'cls_epi_2', speaker: 'character', characterId: 'char_historian', text: '这本玉之书……我守护了它三十年。今天，我把它托付给你。', emotion: '郑重' },
      { id: 'cls_epi_3', speaker: 'narrator', text: '古籍阁楼的修复，让旧书店的历史根基重新稳固。楼梯深处传来科学的召唤。' },
    ],
    introNarration: '沿着文学殿堂旁的螺旋楼梯向上，你来到了古籍阁楼。空气中弥漫着樟木和旧纸的气息，李正源正端坐在一盏昏黄的灯下，守护着那些比他年纪还大的书。',
    completionNarration: '防虫防潮措施一一到位，线装书在樟木匣中安然沉睡。李正源第一次露出了笑容，那笑容里有欣慰，也有托付。他说："书归有缘人，你便是。"',
  },
  {
    id: 'story_ch_science',
    areaId: 'area_science',
    title: '探索书房',
    subtitle: '第三章',
    prologue: [
      { id: 'sci_pro_1', speaker: 'character', characterId: 'char_scientist', text: '嗨！终于来人了。你看这个显微镜——透镜碎了，但框架还能用。', emotion: '兴奋' },
      { id: 'sci_pro_2', speaker: 'character', characterId: 'char_scientist', text: '科学区的问题不只是物理损伤。这里需要的是——秩序。科学的秩序。', emotion: '认真' },
      { id: 'sci_pro_3', speaker: 'character', characterId: 'char_scientist', text: '帮我找回那些科学经典吧，我们需要重建知识的坐标系！', emotion: '坚定' },
    ],
    epilogue: [
      { id: 'sci_epi_1', speaker: 'character', characterId: 'char_scientist', text: '太不可思议了！你修复这些书的效率，简直比最优算法还精确！', emotion: '惊叹' },
      { id: 'sci_epi_2', speaker: 'character', characterId: 'char_scientist', text: '这本星之书……你知道吗？它的光谱分析和我在实验室观测到的数据完全吻合。', emotion: '震撼' },
      { id: 'sci_epi_3', speaker: 'narrator', text: '科学的理性之光重新照亮了这间书房。穿过书房，你听到了庭院中竹叶的沙沙声。' },
    ],
    introNarration: '从阁楼下来，穿过一条走廊，你来到了探索书房。方晓宇正埋头修理一台旧显微镜，他的白大褂上沾满了灰尘和机油。',
    completionNarration: '当最后一台仪器被修复，科学区的灯全部亮起。方晓宇透过望远镜望向夜空，忽然惊呼——他看到了书中记载的那颗千年前的星。',
  },
  {
    id: 'story_ch_philosophy',
    areaId: 'area_philosophy',
    title: '沉思庭院',
    subtitle: '第四章',
    prologue: [
      { id: 'phi_pro_1', speaker: 'character', characterId: 'char_philosopher', text: '……你来了。', emotion: '平静' },
      { id: 'phi_pro_2', speaker: 'character', characterId: 'char_philosopher', text: '竹林枯了，茶也凉了。但这些都不重要。', emotion: '淡然' },
      { id: 'phi_pro_3', speaker: 'character', characterId: 'char_philosopher', text: '重要的是——你是否愿意坐下来，与这些古老的智慧对话？', emotion: '深意' },
    ],
    epilogue: [
      { id: 'phi_epi_1', speaker: 'character', characterId: 'char_philosopher', text: '慧之书向你展示了什么？', emotion: '好奇' },
      { id: 'phi_epi_2', speaker: 'character', characterId: 'char_philosopher', text: '不管你看到了什么，那都是真实的。因为智慧不在书中，而在你的心里。', emotion: '微笑' },
      { id: 'phi_epi_3', speaker: 'narrator', text: '沉思庭院的竹叶在风中低语。在庭院的尽头，一扇通往地下工作坊的门缓缓开启。' },
    ],
    introNarration: '穿过书房后的小门，你走进了一座被竹林环绕的庭院。枯黄的竹叶铺满了石径，茶室的纸窗破了几个洞，但周思远依然安静地坐在蒲团上，仿佛外面的混乱与他无关。',
    completionNarration: '新竹抽出嫩芽，茶室飘来清香。周思远递给你一杯茶："万物有序，心自然安。你已经理解了旧书店最深的秘密——每一本书，都是一扇门。"',
  },
  {
    id: 'story_ch_tech',
    areaId: 'area_tech',
    title: '匠人之坊',
    subtitle: '第五章（终章）',
    prologue: [
      { id: 'tech_pro_1', speaker: 'character', characterId: 'char_engineer', text: '别碰那个键盘！……好吧，它已经坏了。随便碰。', emotion: '无奈' },
      { id: 'tech_pro_2', speaker: 'character', characterId: 'char_engineer', text: '技术区是最后被损坏的，也是最复杂的。服务器、显示器、键盘……全都需要修复。', emotion: '认真' },
      { id: 'tech_pro_3', speaker: 'character', characterId: 'char_engineer', text: '但最重要的是书。没有书的图书馆，就像没有代码的程序员——毫无意义。', emotion: '坚定' },
    ],
    epilogue: [
      { id: 'tech_epi_1', speaker: 'character', characterId: 'char_engineer', text: '所有系统……上线。', emotion: '激动' },
      { id: 'tech_epi_2', speaker: 'character', characterId: 'char_engineer', text: '码之书……它描述的算法，我从来没见过。这不是人类写的代码。这是——宇宙的代码。', emotion: '震撼' },
      { id: 'tech_epi_3', speaker: 'character', characterId: 'char_grandpa', text: '孩子们……旧书店，终于完整了。', emotion: '欣慰' },
      { id: 'tech_epi_4', speaker: 'narrator', text: '五位守护者齐聚在书店门厅。陈老先生拿出那封泛黄的信，念出了最后一行——"愿每一个故事，都有人倾听。"' },
    ],
    introNarration: '庭院地下的工作坊，是旧书店最后一个等待修复的区域。林若溪已经在这里守了很久，屏幕的光映照着她疲惫但坚定的脸。',
    completionNarration: '当最后一行代码在屏幕上运行成功，旧书店的所有灯同时亮起。五位守护者从各自的区域走来，聚在门厅。陈老先生看着焕然一新的书店，眼眶微微泛红。他轻声说："欢迎回家——所有的故事，欢迎回家。"',
  },
];

export const STORY_DIALOGUES: Dialogue[] = [
  {
    id: 'dlg_entrance_intro',
    areaId: 'area_entrance',
    trigger: 'on_enter',
    lines: [
      { id: 'ei_1', speaker: 'narrator', text: '你推开吱呀作响的木门，走进了一间昏暗的旧书店。空气中弥漫着旧纸张的气味，灰尘在光线中飞舞。' },
      { id: 'ei_2', speaker: 'character', characterId: 'char_grandpa', text: '……你是谁？', emotion: '警惕' },
      { id: 'ei_3', speaker: 'character', characterId: 'char_grandpa', text: '哦，是被雨赶进来的吧。外面的雨下得可真大。', emotion: '释然' },
      { id: 'ei_4', speaker: 'character', characterId: 'char_grandpa', text: '我叫陈守正，这间书店是我一辈子心血。可惜啊，老了，修不动了……', emotion: '叹惜' },
      { id: 'ei_5', speaker: 'character', characterId: 'char_grandpa', text: '这间书店有五个区域，每一个都住着一位守护者。他们和书一样，都需要有人来照料。', emotion: '认真' },
      { id: 'ei_6', speaker: 'character', characterId: 'char_grandpa', text: '年轻人，你愿意帮我修复这间旧书店吗？', emotion: '期待',
        choices: [
          { id: 'intro_accept', text: '我愿意，请让我试试。', nextDialogueId: 'dlg_entrance_accept', effect: { type: 'reveal_secret', targetId: 'special_book_letter' } },
          { id: 'intro_curious', text: '能先告诉我更多吗？', nextDialogueId: 'dlg_entrance_curious' },
        ]
      },
    ],
    priority: 100,
    repeatable: false,
  },
  {
    id: 'dlg_entrance_accept',
    areaId: 'area_entrance',
    trigger: 'on_interact',
    lines: [
      { id: 'ea_1', speaker: 'character', characterId: 'char_grandpa', text: '好！好孩子！', emotion: '欣慰' },
      { id: 'ea_2', speaker: 'character', characterId: 'char_grandpa', text: '这封信给你——这是我当年创办书店时写给妻子的信。它记录了这间书店的初心。', emotion: '郑重' },
      { id: 'ea_3', speaker: 'character', characterId: 'char_grandpa', text: '从文学殿堂开始吧。那里有一位叫苏婉清的姑娘，她会告诉你该怎么做。', emotion: '指引' },
      { id: 'ea_4', speaker: 'narrator', text: '你收下了那封泛黄的信。旧书店的修复之旅，正式开始。' },
    ],
    priority: 90,
    repeatable: false,
  },
  {
    id: 'dlg_entrance_curious',
    areaId: 'area_entrance',
    trigger: 'on_interact',
    lines: [
      { id: 'ec_1', speaker: 'character', characterId: 'char_grandpa', text: '好奇心……这是最好的品质。', emotion: '微笑' },
      { id: 'ec_2', speaker: 'character', characterId: 'char_grandpa', text: '三十年前，我在这里发现了第一本书。那是一本被遗忘在角落的诗集，书页已经发黄，但翻开它的时候，文字仿佛活了过来。', emotion: '追忆' },
      { id: 'ec_3', speaker: 'character', characterId: 'char_grandpa', text: '从那以后，我就决定——要让每一本被遗忘的书，都重新被人看见。', emotion: '坚定' },
      { id: 'ec_4', speaker: 'character', characterId: 'char_grandpa', text: '现在，我老了。但我相信，总会有像你这样的人出现。', emotion: '期待',
        choices: [
          { id: 'intro_accept_late', text: '我明白了，我愿意帮忙。', nextDialogueId: 'dlg_entrance_accept', effect: { type: 'reveal_secret', targetId: 'special_book_letter' } },
        ]
      },
    ],
    priority: 85,
    repeatable: false,
  },
  {
    id: 'dlg_entrance_return',
    areaId: 'area_entrance',
    trigger: 'on_enter',
    lines: [
      { id: 'er_1', speaker: 'character', characterId: 'char_grandpa', text: '回来了？辛苦了。书店每天都在变得更好。', emotion: '慈祥' },
    ],
    priority: 10,
    repeatable: true,
    condition: { areasRestored: 1 },
  },
  {
    id: 'dlg_entrance_mid',
    areaId: 'area_entrance',
    trigger: 'on_enter',
    lines: [
      { id: 'em_1', speaker: 'character', characterId: 'char_grandpa', text: '你已经修复了好几个区域了。守护者们都很感激你。', emotion: '欣慰' },
      { id: 'em_2', speaker: 'character', characterId: 'char_grandpa', text: '继续加油。书店的每一个角落，都值得被认真对待。', emotion: '鼓励' },
    ],
    priority: 10,
    repeatable: true,
    condition: { areasRestored: 3 },
  },
  {
    id: 'dlg_finale',
    areaId: 'area_entrance',
    trigger: 'on_restore',
    triggerTarget: 'area_tech',
    lines: [
      { id: 'fin_1', speaker: 'narrator', text: '当匠人之坊的最后一盏灯亮起，整个旧书店都沐浴在温暖的光芒中。' },
      { id: 'fin_2', speaker: 'character', characterId: 'char_grandpa', text: '谢谢你，孩子。', emotion: '感动' },
      { id: 'fin_3', speaker: 'character', characterId: 'char_librarian', text: '文学殿堂永远不会忘记你的付出。', emotion: '温柔' },
      { id: 'fin_4', speaker: 'character', characterId: 'char_historian', text: '古籍阁楼因你而重生。', emotion: '庄重' },
      { id: 'fin_5', speaker: 'character', characterId: 'char_scientist', text: '探索书房的未来，因为你而充满可能！', emotion: '兴奋' },
      { id: 'fin_6', speaker: 'character', characterId: 'char_philosopher', text: '沉思庭院的宁静，是你赐予的。', emotion: '淡然' },
      { id: 'fin_7', speaker: 'character', characterId: 'char_engineer', text: '匠人之坊再次运转……这一切都是真的。', emotion: '激动' },
      { id: 'fin_8', speaker: 'character', characterId: 'char_grandpa', text: '从今天起，这间书店……交给你了。', emotion: '郑重' },
      { id: 'fin_9', speaker: 'narrator', text: '旧书店完成了修复。所有的故事都找到了归宿，所有的守护者都露出了笑容。而你，成为了这间书店新的传承人。' },
      { id: 'fin_10', speaker: 'narrator', text: '窗外的雨停了。阳光透过橱窗照进来，照亮了每一本书的书脊。这是一个新的开始。' },
    ],
    priority: 1000,
    repeatable: false,
    condition: { specificAreaRestored: 'area_tech' },
  },
];

export const getCharacterById = (id: string): StoryCharacter | undefined => {
  return STORY_CHARACTERS.find(c => c.id === id);
};

export const getAreaById = (id: string): BookshelfArea | undefined => {
  return BOOKSHELF_AREAS.find(a => a.id === id);
};

export const getSpecialBookById = (id: string): SpecialBook | undefined => {
  return SPECIAL_BOOKS.find(b => b.id === id);
};

export const getStoryChapterByAreaId = (areaId: string): StoryChapter | undefined => {
  return STORY_CHAPTERS.find(c => c.areaId === areaId);
};

export const getDialoguesForArea = (areaId: string): Dialogue[] => {
  return STORY_DIALOGUES.filter(d => d.areaId === areaId);
};

export const getDialogueById = (id: string): Dialogue | undefined => {
  return STORY_DIALOGUES.find(d => d.id === id);
};

export const getAreasRestoredCount = (areasStatus: Record<string, BookshelfAreaStatus>): number => {
  return Object.values(areasStatus).filter(s => s === 'restored').length;
};

export const calculateStoryRating = (save: {
  totalAreasRestored: number;
  totalSpecialBooks: number;
  totalDialoguesViewed: number;
  completionTime: number;
}): { grade: 'S' | 'A' | 'B' | 'C' | 'D'; title: string; description: string; score: number; bonusScore: number } => {
  const totalAreas = BOOKSHELF_AREAS.length;
  const totalSpecials = SPECIAL_BOOKS.length;
  
  let score = 0;
  score += (save.totalAreasRestored / totalAreas) * 50;
  score += (save.totalSpecialBooks / totalSpecials) * 30;
  score += Math.min(save.totalDialoguesViewed / 20, 1) * 20;
  
  if (save.completionTime > 0 && save.completionTime < 3600000) {
    score += 10;
  }
  
  score = Math.min(100, score);
  
  if (score >= 90) return { grade: 'S', title: '书店传承人', description: '你完美修复了旧书店，所有故事都找到了归宿。', score, bonusScore: 3000 };
  if (score >= 75) return { grade: 'A', title: '忠实守护者', description: '你用心修复了大部分区域，书店焕然一新。', score, bonusScore: 2000 };
  if (score >= 60) return { grade: 'B', title: '热忱修复者', description: '你付出了很多努力，书店正在恢复生机。', score, bonusScore: 1000 };
  if (score >= 40) return { grade: 'C', title: '初入门径', description: '修复之路刚刚开始，继续加油。', score, bonusScore: 500 };
  return { grade: 'D', title: '初来乍到', description: '旧书店还有很长的路要走。', score, bonusScore: 200 };
};

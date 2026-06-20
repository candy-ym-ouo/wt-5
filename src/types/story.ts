export type BookshelfAreaStatus = 'locked' | 'damaged' | 'restoring' | 'restored';
export type DialogueSpeaker = 'narrator' | 'character' | 'player';
export type StoryPhase = 'intro' | 'exploring' | 'dialogue' | 'challenge' | 'completion' | 'finale';

export interface StoryCharacter {
  id: string;
  name: string;
  avatar: string;
  title: string;
  description: string;
  personality: string;
  firstAppearArea: string;
}

export interface DialogueLine {
  id: string;
  speaker: DialogueSpeaker;
  characterId?: string;
  text: string;
  emotion?: string;
  choices?: DialogueChoice[];
}

export interface DialogueChoice {
  id: string;
  text: string;
  nextDialogueId: string;
  effect?: DialogueEffect;
}

export interface DialogueEffect {
  type: 'unlock_hint' | 'reveal_secret' | 'change_relationship' | 'trigger_event';
  targetId?: string;
  value?: number;
}

export interface Dialogue {
  id: string;
  areaId: string;
  trigger: 'on_enter' | 'on_complete' | 'on_book_found' | 'on_interact' | 'on_restore';
  triggerTarget?: string;
  lines: DialogueLine[];
  condition?: DialogueCondition;
  priority: number;
  repeatable: boolean;
}

export interface DialogueCondition {
  areasRestored?: number;
  specificAreaRestored?: string;
  booksFound?: number;
  hasItem?: string;
}

export interface BookshelfArea {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  damagedDescription: string;
  restoredDescription: string;
  icon: string;
  order: number;
  status: BookshelfAreaStatus;
  relatedChapterId: string;
  shelfIndex: number;
  restorationCost: number;
  restorationRewards: AreaReward[];
  specialBookIds: string[];
  characterId: string;
  themeColor: string;
  bgGradient: string;
}

export interface AreaReward {
  type: 'coins' | 'score_bonus' | 'hint_bonus' | 'special_book' | 'unlock_area';
  value: number | string;
  description: string;
}

export interface SpecialBook {
  id: string;
  title: string;
  author: string;
  description: string;
  longDescription: string;
  icon: string;
  rarity: 'unique';
  areaId: string;
  relatedBookId: string;
  lore: string;
  unlockCondition: SpecialBookCondition;
  restored: boolean;
  restoredAt?: number;
}

export interface SpecialBookCondition {
  type: 'complete_area' | 'find_books' | 'dialogue_choice' | 'all_areas_restored';
  value?: number | string;
  areaId?: string;
}

export interface StoryChapter {
  id: string;
  areaId: string;
  title: string;
  subtitle: string;
  prologue: DialogueLine[];
  epilogue: DialogueLine[];
  introNarration: string;
  completionNarration: string;
}

export interface StorySave {
  currentAreaId: string | null;
  areasStatus: Record<string, BookshelfAreaStatus>;
  completedDialogues: string[];
  restoredSpecialBooks: string[];
  storyPhase: StoryPhase;
  totalAreasRestored: number;
  storyStarted: boolean;
  storyCompleted: boolean;
  startedAt: number;
  completedAt?: number;
  dialogueHistory: DialogueHistoryEntry[];
  unlockedSecrets: string[];
  characterRelationships: Record<string, number>;
}

export interface DialogueHistoryEntry {
  dialogueId: string;
  selectedChoiceId?: string;
  timestamp: number;
}

export interface StorySettlement {
  totalAreasRestored: number;
  totalSpecialBooks: number;
  totalDialoguesViewed: number;
  totalCoinsSpent: number;
  totalPlayTime: number;
  completionTime: number;
  storyRating: StoryRating;
}

export interface StoryRating {
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  title: string;
  description: string;
  score: number;
  bonusScore: number;
}

export interface StoryState {
  save: StorySave;
  activeDialogue: Dialogue | null;
  currentDialogueLineIndex: number;
  showAreaMap: boolean;
  selectedAreaId: string | null;
  showSpecialBookDetail: string | null;
  showStoryNarration: boolean;
  currentNarrationText: string;
  transitioning: boolean;
  transitionTarget: string | null;
}

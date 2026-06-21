export type CharacterRole = 'regular_customer' | 'clerk' | 'special_guest';

export type RelationshipLevel = 'stranger' | 'acquaintance' | 'familiar' | 'trusted' | 'confidant';

export type DialogueNodeType = 'greeting' | 'chat' | 'quest_offer' | 'quest_progress' | 'quest_complete' | 'booklist_unlock' | 'story_reveal' | 'farewell' | 'special_event';

export interface CharacterDialogueNode {
  id: string;
  type: DialogueNodeType;
  text: string;
  speaker: 'character' | 'player';
  emotion?: string;
  choices?: CharacterDialogueChoice[];
  nextNodeId?: string;
  effects?: CharacterDialogueEffect[];
  condition?: CharacterDialogueCondition;
}

export interface CharacterDialogueChoice {
  id: string;
  text: string;
  nextNodeId: string;
  effects?: CharacterDialogueEffect[];
  requiredRelationship?: RelationshipLevel;
}

export interface CharacterDialogueEffect {
  type: 'relationship_change' | 'unlock_booklist' | 'unlock_achievement' | 'unlock_sidequest' | 'trigger_event' | 'grant_reward';
  targetId?: string;
  value?: number;
  description?: string;
}

export interface CharacterDialogueCondition {
  minRelationship?: RelationshipLevel;
  completedQuestIds?: string[];
  completedDialogueIds?: string[];
  hasBooklist?: string;
  currentHourRange?: [number, number];
}

export interface CharacterDialogueTree {
  id: string;
  characterId: string;
  title: string;
  description: string;
  startNodeId: string;
  nodes: Record<string, CharacterDialogueNode>;
  condition?: CharacterDialogueCondition;
  repeatable: boolean;
  priority: number;
  relationshipRequired: RelationshipLevel;
}

export interface ExclusiveBookList {
  id: string;
  characterId: string;
  title: string;
  description: string;
  icon: string;
  bookIds: string[];
  unlockRelationshipLevel: RelationshipLevel;
  unlocked: boolean;
  unlockedAt?: number;
  reward: {
    coins: number;
    score: number;
    achievementId?: string;
  };
}

export interface CharacterSideQuest {
  id: string;
  characterId: string;
  title: string;
  description: string;
  icon: string;
  objectives: CharacterQuestObjective[];
  rewards: CharacterQuestReward[];
  status: 'locked' | 'available' | 'in_progress' | 'completed' | 'claimed';
  unlockRelationshipLevel: RelationshipLevel;
  prerequisiteQuestId?: string;
  dialogueTreeId?: string;
  progressKey: string;
  maxProgress: number;
}

export interface CharacterQuestObjective {
  type: 'find_books' | 'complete_dialogues' | 'reach_relationship' | 'find_specific_books' | 'complete_commissions' | 'play_games';
  target: number;
  params?: Record<string, unknown>;
  description: string;
}

export interface CharacterQuestReward {
  type: 'coins' | 'score' | 'achievement' | 'booklist' | 'relationship' | 'decoration' | 'hints';
  value: number;
  description?: string;
  targetId?: string;
}

export interface CharacterAchievement {
  id: string;
  characterId: string;
  title: string;
  description: string;
  icon: string;
  condition: string;
  type: 'single' | 'progressive';
  progressKey?: string;
  maxProgress?: number;
  stages?: CharacterAchievementStage[];
  unlocked: boolean;
  unlockedAt?: number;
  reward?: CharacterQuestReward;
}

export interface CharacterAchievementStage {
  id: string;
  title: string;
  description: string;
  threshold: number;
  reward?: CharacterQuestReward;
}

export interface GameCharacter {
  id: string;
  name: string;
  avatar: string;
  role: CharacterRole;
  title: string;
  description: string;
  personality: string;
  likes: string[];
  dislikes: string[];
  scheduleNote: string;
  defaultLocation: string;
  greetingLines: string[];
  farewellLines: string[];
  themeColor: string;
}

export interface CharacterRelationship {
  characterId: string;
  level: RelationshipLevel;
  affinity: number;
  totalDialogues: number;
  lastDialogueAt: number;
  unlockedBooklistIds: string[];
  unlockedQuestIds: string[];
  unlockedAchievementIds: string[];
  completedDialogueTreeIds: string[];
  metAt: number;
}

export const RELATIONSHIP_THRESHOLDS: Record<RelationshipLevel, { min: number; max: number; label: string; color: string }> = {
  stranger: { min: 0, max: 19, label: '陌生人', color: '#888' },
  acquaintance: { min: 20, max: 49, label: '相识', color: '#4CAF50' },
  familiar: { min: 50, max: 79, label: '熟悉', color: '#2196F3' },
  trusted: { min: 80, max: 119, label: '信赖', color: '#9C27B0' },
  confidant: { min: 120, max: 999, label: '知己', color: '#FFD700' },
};

export const RELATIONSHIP_ORDER: RelationshipLevel[] = ['stranger', 'acquaintance', 'familiar', 'trusted', 'confidant'];

export const RELATIONSHIP_LEVEL_ICONS: Record<RelationshipLevel, string> = {
  stranger: '❓',
  acquaintance: '👋',
  familiar: '😊',
  trusted: '🤝',
  confidant: '💎',
};

export interface CharacterState {
  relationships: Record<string, CharacterRelationship>;
  activeDialogueTreeId: string | null;
  currentDialogueNodeId: string | null;
  showCharacterPanel: boolean;
  selectedCharacterId: string | null;
  dialogueHistory: CharacterDialogueHistoryEntry[];
  showRelationshipPopup: { characterId: string; newLevel: RelationshipLevel } | null;
  showBooklistUnlockPopup: string | null;
  showAchievementUnlockPopup: string | null;
  showQuestUnlockPopup: string | null;
  activeTab: 'characters' | 'booklists' | 'sidequests' | 'achievements';
}

export interface CharacterDialogueHistoryEntry {
  dialogueTreeId: string;
  selectedChoiceIds: string[];
  timestamp: number;
}

export const DEFAULT_CHARACTER_STATE: CharacterState = {
  relationships: {},
  activeDialogueTreeId: null,
  currentDialogueNodeId: null,
  showCharacterPanel: false,
  selectedCharacterId: null,
  dialogueHistory: [],
  showRelationshipPopup: null,
  showBooklistUnlockPopup: null,
  showAchievementUnlockPopup: null,
  showQuestUnlockPopup: null,
  activeTab: 'characters',
};

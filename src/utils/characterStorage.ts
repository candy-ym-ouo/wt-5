import type { CharacterRelationship, CharacterDialogueHistoryEntry, RelationshipLevel } from '../types/character';
import { RELATIONSHIP_THRESHOLDS, RELATIONSHIP_ORDER } from '../types/character';
import { GAME_CHARACTERS } from '../data/characters';

const RELATIONSHIPS_KEY = 'old_bookstore_character_relationships';
const DIALOGUE_HISTORY_KEY = 'old_bookstore_character_dialogue_history';
const SIDEQUEST_PROGRESS_KEY = 'old_bookstore_character_sidequest_progress';
const ACHIEVEMENT_PROGRESS_KEY = 'old_bookstore_character_achievement_progress';
const BOOKLIST_UNLOCK_KEY = 'old_bookstore_character_booklist_unlock';

function _readJSON<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    if (data === null) return defaultValue;
    return JSON.parse(data) as T;
  } catch {
    return defaultValue;
  }
}

function _writeJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full - silently fail
  }
}

export function getCharacterRelationships(): Record<string, CharacterRelationship> {
  const stored = _readJSON<Record<string, CharacterRelationship>>(RELATIONSHIPS_KEY, {});
  for (const char of GAME_CHARACTERS) {
    if (!stored[char.id]) {
      stored[char.id] = {
        characterId: char.id,
        level: 'stranger',
        affinity: 0,
        totalDialogues: 0,
        lastDialogueAt: 0,
        unlockedBooklistIds: [],
        unlockedQuestIds: [],
        unlockedAchievementIds: [],
        completedDialogueTreeIds: [],
        metAt: 0,
      };
    }
  }
  return stored;
}

export function saveCharacterRelationships(relationships: Record<string, CharacterRelationship>): void {
  _writeJSON(RELATIONSHIPS_KEY, relationships);
}

export function updateCharacterAffinity(characterId: string, delta: number): CharacterRelationship | null {
  const relationships = getCharacterRelationships();
  const rel = relationships[characterId];
  if (!rel) return null;

  const wasMet = rel.metAt > 0;
  if (!wasMet) {
    rel.metAt = Date.now();
  }

  rel.affinity = Math.max(0, rel.affinity + delta);

  const newLevel = calculateRelationshipLevel(rel.affinity);
  if (RELATIONSHIP_ORDER.indexOf(newLevel) > RELATIONSHIP_ORDER.indexOf(rel.level)) {
    rel.level = newLevel;
  }

  saveCharacterRelationships(relationships);
  return rel;
}

export function calculateRelationshipLevel(affinity: number): RelationshipLevel {
  for (const level of RELATIONSHIP_ORDER) {
    const threshold = RELATIONSHIP_THRESHOLDS[level];
    if (affinity >= threshold.min && affinity <= threshold.max) {
      return level;
    }
  }
  return 'confidant';
}

export function incrementDialogueCount(characterId: string): void {
  const relationships = getCharacterRelationships();
  const rel = relationships[characterId];
  if (!rel) return;
  rel.totalDialogues += 1;
  rel.lastDialogueAt = Date.now();
  saveCharacterRelationships(relationships);
}

export function addCompletedDialogueTree(characterId: string, treeId: string): void {
  const relationships = getCharacterRelationships();
  const rel = relationships[characterId];
  if (!rel) return;
  if (!rel.completedDialogueTreeIds.includes(treeId)) {
    rel.completedDialogueTreeIds.push(treeId);
  }
  saveCharacterRelationships(relationships);
}

export function addUnlockedBooklist(characterId: string, booklistId: string): void {
  const relationships = getCharacterRelationships();
  const rel = relationships[characterId];
  if (!rel) return;
  if (!rel.unlockedBooklistIds.includes(booklistId)) {
    rel.unlockedBooklistIds.push(booklistId);
  }
  saveCharacterRelationships(relationships);

  const unlocks = _readJSON<Record<string, boolean>>(BOOKLIST_UNLOCK_KEY, {});
  unlocks[booklistId] = true;
  _writeJSON(BOOKLIST_UNLOCK_KEY, unlocks);
}

export function addUnlockedSideQuest(characterId: string, questId: string): void {
  const relationships = getCharacterRelationships();
  const rel = relationships[characterId];
  if (!rel) return;
  if (!rel.unlockedQuestIds.includes(questId)) {
    rel.unlockedQuestIds.push(questId);
  }
  saveCharacterRelationships(relationships);
}

export function addUnlockedAchievement(characterId: string, achievementId: string): void {
  const relationships = getCharacterRelationships();
  const rel = relationships[characterId];
  if (!rel) return;
  if (!rel.unlockedAchievementIds.includes(achievementId)) {
    rel.unlockedAchievementIds.push(achievementId);
  }
  saveCharacterRelationships(relationships);
}

export function getDialogueHistory(): CharacterDialogueHistoryEntry[] {
  return _readJSON<CharacterDialogueHistoryEntry[]>(DIALOGUE_HISTORY_KEY, []);
}

export function addDialogueHistory(entry: CharacterDialogueHistoryEntry): void {
  const history = getDialogueHistory();
  history.push(entry);
  if (history.length > 200) {
    history.splice(0, history.length - 200);
  }
  _writeJSON(DIALOGUE_HISTORY_KEY, history);
}

export function getSideQuestProgress(): Record<string, { progress: number; status: string; completedAt?: number }> {
  return _readJSON(SIDEQUEST_PROGRESS_KEY, {});
}

export function saveSideQuestProgress(questId: string, progress: number, status: string): void {
  const allProgress = getSideQuestProgress();
  allProgress[questId] = {
    progress,
    status,
    ...(status === 'completed' ? { completedAt: Date.now() } : {}),
  };
  _writeJSON(SIDEQUEST_PROGRESS_KEY, allProgress);
}

export function getCharacterAchievementProgress(): Record<string, { unlocked: boolean; unlockedAt?: number; currentProgress: number; unlockedStages: string[] }> {
  return _readJSON(ACHIEVEMENT_PROGRESS_KEY, {});
}

export function saveCharacterAchievementProgress(achievementId: string, data: { unlocked: boolean; unlockedAt?: number; currentProgress: number; unlockedStages: string[] }): void {
  const allProgress = getCharacterAchievementProgress();
  allProgress[achievementId] = data;
  _writeJSON(ACHIEVEMENT_PROGRESS_KEY, allProgress);
}

export function getUnlockedBooklistIds(): Set<string> {
  const unlocks = _readJSON<Record<string, boolean>>(BOOKLIST_UNLOCK_KEY, {});
  return new Set(Object.keys(unlocks).filter(k => unlocks[k]));
}

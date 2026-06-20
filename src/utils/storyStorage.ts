import type { StorySave, BookshelfAreaStatus, DialogueHistoryEntry } from '../types/story';
import { BOOKSHELF_AREAS } from '../data/story';

export const STORY_SAVE_KEY = 'old_bookstore_story_save';

const createDefaultSave = (): StorySave => ({
  currentAreaId: 'area_entrance',
  areasStatus: Object.fromEntries(
    BOOKSHELF_AREAS.map(a => [a.id, a.id === 'area_entrance' ? 'damaged' : 'locked'] as [string, BookshelfAreaStatus])
  ),
  completedDialogues: [],
  restoredSpecialBooks: [],
  storyPhase: 'intro',
  totalAreasRestored: 0,
  storyStarted: false,
  storyCompleted: false,
  startedAt: 0,
  dialogueHistory: [],
  unlockedSecrets: [],
  characterRelationships: Object.fromEntries(
    ['char_grandpa', 'char_librarian', 'char_historian', 'char_scientist', 'char_philosopher', 'char_engineer']
      .map(id => [id, 0])
  ),
});

export const getStorySave = (): StorySave => {
  try {
    const data = localStorage.getItem(STORY_SAVE_KEY);
    if (data) {
      const parsed = JSON.parse(data) as StorySave;
      const defaultSave = createDefaultSave();
      return {
        ...defaultSave,
        ...parsed,
        areasStatus: { ...defaultSave.areasStatus, ...parsed.areasStatus },
        characterRelationships: { ...defaultSave.characterRelationships, ...parsed.characterRelationships },
      };
    }
  } catch {}
  return createDefaultSave();
};

export const saveStorySave = (save: StorySave): void => {
  try {
    localStorage.setItem(STORY_SAVE_KEY, JSON.stringify(save));
  } catch {}
};

export const resetStorySave = (): void => {
  localStorage.removeItem(STORY_SAVE_KEY);
};

export const updateAreaStatus = (areaId: string, status: BookshelfAreaStatus): StorySave => {
  const save = getStorySave();
  save.areasStatus[areaId] = status;
  if (status === 'restored') {
    save.totalAreasRestored = Object.values(save.areasStatus).filter(s => s === 'restored').length;
    if (save.totalAreasRestored >= BOOKSHELF_AREAS.length) {
      save.storyCompleted = true;
      save.completedAt = Date.now();
      save.storyPhase = 'finale';
    }
  }
  saveStorySave(save);
  return save;
};

export const markDialogueCompleted = (dialogueId: string, selectedChoiceId?: string): StorySave => {
  const save = getStorySave();
  if (!save.completedDialogues.includes(dialogueId)) {
    save.completedDialogues.push(dialogueId);
  }
  const entry: DialogueHistoryEntry = {
    dialogueId,
    selectedChoiceId,
    timestamp: Date.now(),
  };
  save.dialogueHistory.push(entry);
  saveStorySave(save);
  return save;
};

export const markSpecialBookRestored = (bookId: string): StorySave => {
  const save = getStorySave();
  if (!save.restoredSpecialBooks.includes(bookId)) {
    save.restoredSpecialBooks.push(bookId);
  }
  saveStorySave(save);
  return save;
};

export const unlockSecret = (secretId: string): StorySave => {
  const save = getStorySave();
  if (!save.unlockedSecrets.includes(secretId)) {
    save.unlockedSecrets.push(secretId);
  }
  saveStorySave(save);
  return save;
};

export const updateCharacterRelationship = (characterId: string, delta: number): StorySave => {
  const save = getStorySave();
  save.characterRelationships[characterId] = Math.max(0, Math.min(100, (save.characterRelationships[characterId] || 0) + delta));
  saveStorySave(save);
  return save;
};

export const startStory = (): StorySave => {
  const save = getStorySave();
  save.storyStarted = true;
  save.storyPhase = 'exploring';
  save.startedAt = Date.now();
  saveStorySave(save);
  return save;
};

export const isStoryStarted = (): boolean => {
  return getStorySave().storyStarted;
};

export const isStoryCompleted = (): boolean => {
  return getStorySave().storyCompleted;
};

export const getRestoredAreasCount = (): number => {
  return getStorySave().totalAreasRestored;
};

export const getRestoredSpecialBooksCount = (): number => {
  return getStorySave().restoredSpecialBooks.length;
};

export const getAreaStatus = (areaId: string): BookshelfAreaStatus => {
  const save = getStorySave();
  return save.areasStatus[areaId] || 'locked';
};

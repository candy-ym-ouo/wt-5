import { createSignal, createMemo } from 'solid-js';
import type { CharacterState, CharacterDialogueNode, CharacterDialogueTree, CharacterSideQuest, CharacterAchievement, ExclusiveBookList } from '../types/character';
import { RELATIONSHIP_THRESHOLDS, RELATIONSHIP_ORDER, DEFAULT_CHARACTER_STATE } from '../types/character';
import {
  GAME_CHARACTERS,
  EXCLUSIVE_BOOKLISTS,
  CHARACTER_SIDE_QUESTS,
  CHARACTER_ACHIEVEMENTS,
  getCharacterById,
  getDialogueTreeById,
  getAvailableDialogueTree,
} from '../data/characters';
import {
  getCharacterRelationships,
  updateCharacterAffinity,
  incrementDialogueCount,
  addCompletedDialogueTree,
  addUnlockedBooklist,
  addUnlockedSideQuest,
  addUnlockedAchievement,
  addDialogueHistory,
  getSideQuestProgress,
  saveSideQuestProgress,
  getCharacterAchievementProgress,
  saveCharacterAchievementProgress,
  getUnlockedBooklistIds,
} from '../utils/characterStorage';

export const [characterState, setCharacterState] = createSignal<CharacterState>({
  ...DEFAULT_CHARACTER_STATE,
  relationships: getCharacterRelationships(),
});

export const openCharacterPanel = (characterId?: string): void => {
  setCharacterState(prev => ({
    ...prev,
    showCharacterPanel: true,
    selectedCharacterId: characterId || null,
    activeTab: 'characters',
  }));
};

export const closeCharacterPanel = (): void => {
  setCharacterState(prev => ({
    ...prev,
    showCharacterPanel: false,
    selectedCharacterId: null,
    activeDialogueTreeId: null,
    currentDialogueNodeId: null,
  }));
};

export const selectCharacter = (characterId: string): void => {
  setCharacterState(prev => ({
    ...prev,
    selectedCharacterId: characterId,
    activeDialogueTreeId: null,
    currentDialogueNodeId: null,
  }));
};

export const setActiveTab = (tab: CharacterState['activeTab']): void => {
  setCharacterState(prev => ({ ...prev, activeTab: tab }));
};

export const startDialogue = (treeId: string): void => {
  const tree = getDialogueTreeById(treeId);
  if (!tree) return;

  const relationships = getCharacterRelationships();
  const rel = relationships[tree.characterId];
  if (!rel) return;

  const curLevelIdx = RELATIONSHIP_ORDER.indexOf(rel.level);
  const reqLevelIdx = RELATIONSHIP_ORDER.indexOf(tree.relationshipRequired);
  if (curLevelIdx < reqLevelIdx) return;

  if (!tree.repeatable && rel.completedDialogueTreeIds.includes(treeId)) return;

  setCharacterState(prev => ({
    ...prev,
    activeDialogueTreeId: treeId,
    currentDialogueNodeId: tree.startNodeId,
  }));
};

export const advanceDialogueNode = (nextNodeId?: string): void => {
  const state = characterState();
  if (!state.activeDialogueTreeId || !state.currentDialogueNodeId) return;

  if (nextNodeId) {
    setCharacterState(prev => ({
      ...prev,
      currentDialogueNodeId: nextNodeId,
    }));
  } else {
    const tree = getDialogueTreeById(state.activeDialogueTreeId);
    if (!tree) return;
    const currentNode = tree.nodes[state.currentDialogueNodeId];
    if (currentNode?.nextNodeId) {
      setCharacterState(prev => ({
        ...prev,
        currentDialogueNodeId: currentNode.nextNodeId!,
      }));
    }
  }
};

export const selectDialogueChoice = (choiceId: string): void => {
  const state = characterState();
  if (!state.activeDialogueTreeId || !state.currentDialogueNodeId) return;

  const tree = getDialogueTreeById(state.activeDialogueTreeId);
  if (!tree) return;

  const currentNode = tree.nodes[state.currentDialogueNodeId];
  if (!currentNode?.choices) return;

  const choice = currentNode.choices.find(c => c.id === choiceId);
  if (!choice) return;

  if (choice.effects) {
    applyDialogueEffects(tree.characterId, choice.effects);
  }

  addDialogueHistory({
    dialogueTreeId: state.activeDialogueTreeId,
    selectedChoiceIds: [choiceId],
    timestamp: Date.now(),
  });

  if (choice.nextNodeId) {
    const nextNode = tree.nodes[choice.nextNodeId];
    if (nextNode?.effects) {
      applyDialogueEffects(tree.characterId, nextNode.effects);
    }
    setCharacterState(prev => ({
      ...prev,
      currentDialogueNodeId: choice.nextNodeId,
    }));
  }
};

function applyDialogueEffects(characterId: string, effects: Array<{ type: string; targetId?: string; value?: number; description?: string }>): void {
  for (const effect of effects) {
    switch (effect.type) {
      case 'relationship_change': {
        if (effect.value) {
          const prevRel = getCharacterRelationships()[characterId];
          const oldLevel = prevRel?.level || 'stranger';
          const newRel = updateCharacterAffinity(characterId, effect.value);
          if (newRel && RELATIONSHIP_ORDER.indexOf(newRel.level) > RELATIONSHIP_ORDER.indexOf(oldLevel)) {
            setCharacterState(prev => ({
              ...prev,
              showRelationshipPopup: { characterId, newLevel: newRel.level },
            }));
            setTimeout(() => {
              setCharacterState(prev => ({ ...prev, showRelationshipPopup: null }));
            }, 3000);
          }
          setCharacterState(prev => ({
            ...prev,
            relationships: getCharacterRelationships(),
          }));
        }
        break;
      }
      case 'unlock_booklist': {
        if (effect.targetId) {
          addUnlockedBooklist(characterId, effect.targetId);
          setCharacterState(prev => ({
            ...prev,
            showBooklistUnlockPopup: effect.targetId!,
            relationships: getCharacterRelationships(),
          }));
          setTimeout(() => {
            setCharacterState(prev => ({ ...prev, showBooklistUnlockPopup: null }));
          }, 3000);
        }
        break;
      }
      case 'unlock_sidequest': {
        if (effect.targetId) {
          addUnlockedSideQuest(characterId, effect.targetId);
          saveSideQuestProgress(effect.targetId, 0, 'available');
          setCharacterState(prev => ({
            ...prev,
            showQuestUnlockPopup: effect.targetId!,
            relationships: getCharacterRelationships(),
          }));
          setTimeout(() => {
            setCharacterState(prev => ({ ...prev, showQuestUnlockPopup: null }));
          }, 3000);
        }
        break;
      }
      case 'unlock_achievement': {
        if (effect.targetId) {
          addUnlockedAchievement(characterId, effect.targetId);
          saveCharacterAchievementProgress(effect.targetId, {
            unlocked: true,
            unlockedAt: Date.now(),
            currentProgress: 1,
            unlockedStages: [],
          });
          setCharacterState(prev => ({
            ...prev,
            showAchievementUnlockPopup: effect.targetId!,
            relationships: getCharacterRelationships(),
          }));
          setTimeout(() => {
            setCharacterState(prev => ({ ...prev, showAchievementUnlockPopup: null }));
          }, 3000);
        }
        break;
      }
      case 'grant_reward': {
        break;
      }
      case 'trigger_event': {
        break;
      }
    }
  }
}

export const endDialogue = (): void => {
  const state = characterState();
  if (!state.activeDialogueTreeId) return;

  const tree = getDialogueTreeById(state.activeDialogueTreeId);
  if (tree) {
    incrementDialogueCount(tree.characterId);
    addCompletedDialogueTree(tree.characterId, tree.id);
  }

  setCharacterState(prev => ({
    ...prev,
    activeDialogueTreeId: null,
    currentDialogueNodeId: null,
    relationships: getCharacterRelationships(),
  }));
};

export const dismissRelationshipPopup = (): void => {
  setCharacterState(prev => ({ ...prev, showRelationshipPopup: null }));
};

export const dismissBooklistUnlockPopup = (): void => {
  setCharacterState(prev => ({ ...prev, showBooklistUnlockPopup: null }));
};

export const dismissAchievementUnlockPopup = (): void => {
  setCharacterState(prev => ({ ...prev, showAchievementUnlockPopup: null }));
};

export const dismissQuestUnlockPopup = (): void => {
  setCharacterState(prev => ({ ...prev, showQuestUnlockPopup: null }));
};

export const getCurrentDialogueNode = createMemo((): CharacterDialogueNode | null => {
  const state = characterState();
  if (!state.activeDialogueTreeId || !state.currentDialogueNodeId) return null;
  const tree = getDialogueTreeById(state.activeDialogueTreeId);
  if (!tree) return null;
  return tree.nodes[state.currentDialogueNodeId] || null;
});

export const getSelectedCharacter = createMemo(() => {
  const state = characterState();
  if (!state.selectedCharacterId) return null;
  return getCharacterById(state.selectedCharacterId) || null;
});

export const getAvailableDialogues = createMemo(() => {
  const state = characterState();
  const result: Array<{ characterId: string; tree: CharacterDialogueTree }> = [];
  for (const char of GAME_CHARACTERS) {
    const rel = state.relationships[char.id];
    if (!rel) continue;
    const tree = getAvailableDialogueTree(char.id, rel.completedDialogueTreeIds, rel.level);
    if (tree) {
      result.push({ characterId: char.id, tree });
    }
  }
  return result;
});

export const getCharacterBooklists = createMemo((): ExclusiveBookList[] => {
  const unlockedIds = getUnlockedBooklistIds();
  return EXCLUSIVE_BOOKLISTS.map(bl => ({
    ...bl,
    unlocked: unlockedIds.has(bl.id),
  }));
});

export const getCharacterSideQuests = createMemo((): CharacterSideQuest[] => {
  const questProgress = getSideQuestProgress();
  return CHARACTER_SIDE_QUESTS.map(sq => {
    const progress = questProgress[sq.id];
    return {
      ...sq,
      status: (progress?.status as CharacterSideQuest['status']) || 'locked',
    };
  });
});

export const getCharacterAchievementsList = createMemo((): CharacterAchievement[] => {
  const achProgress = getCharacterAchievementProgress();
  return CHARACTER_ACHIEVEMENTS.map(ach => {
    const progress = achProgress[ach.id];
    return {
      ...ach,
      unlocked: progress?.unlocked || false,
      unlockedAt: progress?.unlockedAt,
    };
  });
});

export const getRelationshipInfo = (characterId: string) => {
  const state = characterState();
  const rel = state.relationships[characterId];
  if (!rel) return null;
  const threshold = RELATIONSHIP_THRESHOLDS[rel.level];
  const nextLevelIdx = RELATIONSHIP_ORDER.indexOf(rel.level) + 1;
  const nextLevel = nextLevelIdx < RELATIONSHIP_ORDER.length ? RELATIONSHIP_ORDER[nextLevelIdx] : null;
  const nextThreshold = nextLevel ? RELATIONSHIP_THRESHOLDS[nextLevel] : null;
  const progressInLevel = nextThreshold
    ? (rel.affinity - threshold.min) / (nextThreshold.min - threshold.min)
    : 1;
  return {
    level: rel.level,
    label: threshold.label,
    color: threshold.color,
    affinity: rel.affinity,
    progressInLevel: Math.min(1, Math.max(0, progressInLevel)),
    nextLevel,
    nextLevelAffinity: nextThreshold ? nextThreshold.min : null,
    totalDialogues: rel.totalDialogues,
    lastDialogueAt: rel.lastDialogueAt,
  };
};

export const getCharacterPanelInfo = createMemo(() => {
  const state = characterState();
  const availableDialogues = getAvailableDialogues();
  const booklists = getCharacterBooklists();
  const sideQuests = getCharacterSideQuests();
  const achievements = getCharacterAchievementsList();

  const charactersWithNewDialogue = availableDialogues.map(d => d.characterId);

  return {
    isVisible: state.showCharacterPanel,
    selectedCharacterId: state.selectedCharacterId,
    activeTab: state.activeTab,
    charactersWithNewDialogue,
    availableDialogueCount: availableDialogues.length,
    unlockedBooklistCount: booklists.filter(b => b.unlocked).length,
    totalBooklistCount: booklists.length,
    availableQuestCount: sideQuests.filter(q => q.status === 'available' || q.status === 'in_progress').length,
    totalQuestCount: sideQuests.length,
    unlockedAchievementCount: achievements.filter(a => a.unlocked).length,
    totalAchievementCount: achievements.length,
  };
});

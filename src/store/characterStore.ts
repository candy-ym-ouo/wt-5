import { createSignal, createMemo } from 'solid-js';
import type { CharacterState, CharacterDialogueNode, CharacterDialogueTree, CharacterSideQuest, CharacterAchievement, ExclusiveBookList, CharacterQuestReward } from '../types/character';
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
  getCompletedDialogueCountForCharacter,
  getUnlockedSideQuestIds,
  getUnlockedCharacterAchievementIds,
} from '../utils/characterStorage';
import { awardActivityRewards } from './storeManager';
import { grantCharacterGameplayRewards, awardActivityPowerUps, triggerRandomEvent } from './gameStore';

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
        const rewardKind = (effect.targetId as string) || 'coins';
        const val = effect.value || 0;
        switch (rewardKind) {
          case 'coins':
            awardActivityRewards(val, 0, effect.description || '对话奖励');
            break;
          case 'score':
            grantCharacterGameplayRewards(val, 0);
            break;
          case 'hints':
            grantCharacterGameplayRewards(0, val);
            break;
          case 'freeHints':
            awardActivityPowerUps(val, 0, 0);
            break;
          case 'timePeeks':
            awardActivityPowerUps(0, val, 0);
            break;
          case 'eliminateWrongs':
            awardActivityPowerUps(0, 0, val);
            break;
        }
        break;
      }
      case 'trigger_event': {
        triggerRandomEvent();
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

export const getUnlockedCharacterBookIds = (): string[] => {
  const unlockedIds = getUnlockedBooklistIds();
  const result: string[] = [];
  for (const bl of EXCLUSIVE_BOOKLISTS) {
    if (unlockedIds.has(bl.id)) {
      result.push(...bl.bookIds);
    }
  }
  return result;
};

export interface SideQuestProgressContext {
  foundBookIds?: string[];
  foundBookGenres?: string[];
  commissionsCompleted?: number;
  gamesPlayed?: number;
}

const checkObjectiveMet = (
  obj: CharacterSideQuest['objectives'][number],
  ctx: SideQuestProgressContext & { dialogueCtx?: { [key: string]: number } }
): { met: boolean; progress: number } => {
  switch (obj.type) {
    case 'find_books': {
      const count = ctx.foundBookIds?.length || 0;
      return { met: count >= obj.target, progress: Math.min(count, obj.target) };
    }
    case 'find_specific_books': {
      const requiredIds = (obj.params?.bookIds as string[]) || [];
      const found = (ctx.foundBookIds || []).filter(id => requiredIds.includes(id));
      return { met: found.length >= obj.target, progress: Math.min(found.length, obj.target) };
    }
    case 'complete_dialogues': {
      const characterId = (obj.params?.characterId as string) || '';
      let count = 0;
      if (characterId && ctx.dialogueCtx?.[characterId] !== undefined) {
        count = ctx.dialogueCtx[characterId];
      } else if (ctx.dialogueCtx) {
        count = Object.values(ctx.dialogueCtx).reduce((s, v) => s + v, 0);
      }
      return { met: count >= obj.target, progress: Math.min(count, obj.target) };
    }
    case 'reach_relationship': {
      const characterId = (obj.params?.characterId as string) || '';
      const requiredLevel = (obj.params?.level as string) || 'familiar';
      const rels = getCharacterRelationships();
      const rel = rels[characterId];
      if (!rel) return { met: false, progress: 0 };
      const currentIdx = RELATIONSHIP_ORDER.indexOf(rel.level);
      const targetIdx = RELATIONSHIP_ORDER.indexOf(requiredLevel as any);
      const met = currentIdx >= targetIdx;
      const progress = met ? 1 : Math.min(1, (currentIdx + 1) / Math.max(1, targetIdx + 1));
      return { met, progress };
    }
    case 'complete_commissions': {
      const count = ctx.commissionsCompleted || 0;
      return { met: count >= obj.target, progress: Math.min(count, obj.target) };
    }
    case 'play_games': {
      const count = ctx.gamesPlayed || 0;
      return { met: count >= obj.target, progress: Math.min(count, obj.target) };
    }
    default:
      return { met: false, progress: 0 };
  }
};

export const updateCharacterSideQuestProgress = (
  context: SideQuestProgressContext
): { newlyCompleted: string[]; newlyProgressed: string[] } => {
  const allProgress = getSideQuestProgress();
  const updated = { ...allProgress };
  const newlyCompleted: string[] = [];
  const newlyProgressed: string[] = [];

  const dialogueCtx: { [key: string]: number } = {};
  for (const char of GAME_CHARACTERS) {
    dialogueCtx[char.id] = getCompletedDialogueCountForCharacter(char.id);
  }
  const fullCtx = { ...context, dialogueCtx };

  for (const quest of CHARACTER_SIDE_QUESTS) {
    const prev = updated[quest.id] || { progress: 0, status: 'locked', completedAt: undefined };
    if (prev.status === 'claimed' || prev.status === 'completed') continue;

    const unlockedIds = getUnlockedSideQuestIds();
    if (!unlockedIds.has(quest.id) && prev.status === 'locked') continue;

    let totalProgress = 0;
    let allMet = true;
    for (const obj of quest.objectives) {
      const result = checkObjectiveMet(obj, fullCtx);
      totalProgress += result.progress;
      if (!result.met) allMet = false;
    }
    const normalizedProgress = quest.maxProgress > 0
      ? Math.min(quest.maxProgress, Math.round((totalProgress / quest.objectives.length) * quest.maxProgress))
      : quest.objectives.length;

    let newStatus = prev.status;
    if (newStatus === 'locked') newStatus = 'available';
    if (normalizedProgress > 0 && newStatus === 'available') newStatus = 'in_progress';
    if (allMet) newStatus = 'completed';

    if (normalizedProgress !== prev.progress || newStatus !== prev.status) {
      updated[quest.id] = {
        progress: normalizedProgress,
        status: newStatus,
        completedAt: newStatus === 'completed' && prev.status !== 'completed' ? Date.now() : prev.completedAt,
      };
      saveSideQuestProgress(quest.id, normalizedProgress, newStatus);
      if (normalizedProgress > (prev.progress || 0)) newlyProgressed.push(quest.id);
      if (newStatus === 'completed' && prev.status !== 'completed') newlyCompleted.push(quest.id);
    }
  }

  if (newlyCompleted.length > 0) {
    setCharacterState(prev => ({ ...prev }));
  }

  return { newlyCompleted, newlyProgressed };
};

export const claimCharacterSideQuestReward = (questId: string): CharacterQuestReward[] | null => {
  const quest = CHARACTER_SIDE_QUESTS.find(q => q.id === questId);
  if (!quest) return null;

  const allProgress = getSideQuestProgress();
  const prog = allProgress[questId];
  if (!prog || prog.status !== 'completed') return null;

  saveSideQuestProgress(questId, prog.progress, 'claimed');

  for (const reward of quest.rewards) {
    switch (reward.type) {
      case 'coins':
        awardActivityRewards(reward.value, 0, `支线任务奖励: ${quest.title}`);
        break;
      case 'score':
        grantCharacterGameplayRewards(reward.value, 0);
        break;
      case 'hints':
        grantCharacterGameplayRewards(0, reward.value);
        break;
      case 'relationship':
        if (reward.targetId) {
          updateCharacterAffinity(reward.targetId, reward.value);
        }
        break;
      case 'achievement':
        if (reward.targetId) {
          addUnlockedAchievement(quest.characterId, reward.targetId);
          saveCharacterAchievementProgress(reward.targetId, {
            unlocked: true,
            unlockedAt: Date.now(),
            currentProgress: 1,
            unlockedStages: [],
          });
          setCharacterState(prev => ({
            ...prev,
            showAchievementUnlockPopup: reward.targetId!,
          }));
          setTimeout(() => {
            setCharacterState(prev => ({ ...prev, showAchievementUnlockPopup: null }));
          }, 3000);
        }
        break;
    }
  }

  setCharacterState(prev => ({
    ...prev,
    relationships: getCharacterRelationships(),
  }));

  return quest.rewards;
};

export const checkCharacterRelationshipQuests = (): void => {
  updateCharacterSideQuestProgress({});
};

export interface CharacterAchievementCheckResult {
  newlyUnlocked: string[];
  newStagesUnlocked: Record<string, string[]>;
}

const evaluateAchievementCondition = (ach: CharacterAchievement): { unlocked: boolean; progress: number; unlockedStages: string[] } => {
  const getStageValue = (val: number, thresholds: number[]): string[] => {
    const stages: string[] = [];
    for (let i = 0; i < thresholds.length; i++) {
      if (val >= thresholds[i]) {
        stages.push(`stage_${i}`);
      }
    }
    return stages;
  };

  switch (ach.condition) {
    case 'all_relationship_familiar': {
      const rels = getCharacterRelationships();
      let familiarCount = 0;
      const familiarIdx = RELATIONSHIP_ORDER.indexOf('familiar');
      for (const char of GAME_CHARACTERS) {
        const rel = rels[char.id];
        const levelIdx = RELATIONSHIP_ORDER.indexOf(rel?.level || 'stranger');
        if (levelIdx >= familiarIdx) familiarCount++;
      }
      const thresholds = [1, 2, 3, 4, 5, 6];
      const unlockedStages = getStageValue(familiarCount, thresholds);
      return { unlocked: familiarCount >= 6, progress: familiarCount, unlockedStages };
    }
    case 'any_relationship_confidant': {
      const rels = getCharacterRelationships();
      const confidantIdx = RELATIONSHIP_ORDER.indexOf('confidant');
      for (const char of GAME_CHARACTERS) {
        const rel = rels[char.id];
        const levelIdx = RELATIONSHIP_ORDER.indexOf(rel?.level || 'stranger');
        if (levelIdx >= confidantIdx) {
          return { unlocked: true, progress: 1, unlockedStages: ['stage_0'] };
        }
      }
      return { unlocked: false, progress: 0, unlockedStages: [] };
    }
    case 'unlock_all_booklists': {
      const unlockedIds = getUnlockedBooklistIds();
      const totalBooklists = EXCLUSIVE_BOOKLISTS.length;
      const count = EXCLUSIVE_BOOKLISTS.filter(bl => unlockedIds.has(bl.id)).length;
      const thresholds = [1, 2, 3, 4, 5, 6];
      const unlockedStages = getStageValue(count, thresholds);
      return { unlocked: count >= totalBooklists, progress: count, unlockedStages };
    }
    default: {
      if (ach.condition.startsWith('complete_sidequest_')) {
        const questId = ach.condition.replace('complete_sidequest_', '');
        const prog = getSideQuestProgress()[questId];
        const met = prog?.status === 'completed' || prog?.status === 'claimed';
        return { unlocked: met, progress: met ? 1 : 0, unlockedStages: met ? ['stage_0'] : [] };
      }
      if (ach.condition.startsWith('unlock_booklist_')) {
        const booklistId = ach.condition.replace('unlock_booklist_', '');
        const unlockedIds = getUnlockedBooklistIds();
        const met = unlockedIds.has(booklistId);
        return { unlocked: met, progress: met ? 1 : 0, unlockedStages: met ? ['stage_0'] : [] };
      }
      if (ach.condition.startsWith('complete_dialogue_')) {
        const dialogueId = ach.condition.replace('complete_dialogue_', '');
        const rels = getCharacterRelationships();
        let met = false;
        for (const rel of Object.values(rels)) {
          if (rel.completedDialogueTreeIds?.includes(dialogueId)) {
            met = true;
            break;
          }
        }
        return { unlocked: met, progress: met ? 1 : 0, unlockedStages: met ? ['stage_0'] : [] };
      }
      return { unlocked: false, progress: 0, unlockedStages: [] };
    }
  }
};

export const checkCharacterAchievements = (): CharacterAchievementCheckResult => {
  const result: CharacterAchievementCheckResult = { newlyUnlocked: [], newStagesUnlocked: {} };
  const unlockedAchievementIds = getUnlockedCharacterAchievementIds();
  const allProgress = getCharacterAchievementProgress();

  for (const ach of CHARACTER_ACHIEVEMENTS) {
    const evaluation = evaluateAchievementCondition(ach);
    const prev = allProgress[ach.id] || { unlocked: false, unlockedAt: undefined, currentProgress: 0, unlockedStages: [] };

    const newStages = evaluation.unlockedStages.filter(s => !prev.unlockedStages.includes(s));
    if (newStages.length > 0) {
      result.newStagesUnlocked[ach.id] = newStages;
    }

    if (evaluation.unlocked && !prev.unlocked) {
      result.newlyUnlocked.push(ach.id);
      saveCharacterAchievementProgress(ach.id, {
        unlocked: true,
        unlockedAt: Date.now(),
        currentProgress: evaluation.progress,
        unlockedStages: evaluation.unlockedStages,
      });
      if (!unlockedAchievementIds.has(ach.id)) {
        addUnlockedAchievement(ach.characterId, ach.id);
      }
    } else if (evaluation.progress !== prev.currentProgress || newStages.length > 0) {
      saveCharacterAchievementProgress(ach.id, {
        unlocked: prev.unlocked || evaluation.unlocked,
        unlockedAt: prev.unlockedAt,
        currentProgress: evaluation.progress,
        unlockedStages: evaluation.unlockedStages,
      });
    }
  }

  if (result.newlyUnlocked.length > 0) {
    setCharacterState(p => ({
      ...p,
      relationships: getCharacterRelationships(),
    }));
  }

  return result;
};

export const awardCharacterAchievementReward = (achievementId: string): boolean => {
  const ach = CHARACTER_ACHIEVEMENTS.find(a => a.id === achievementId);
  if (!ach?.reward) return false;

  const allProgress = getCharacterAchievementProgress();
  const prog = allProgress[achievementId];
  if (!prog?.unlocked) return false;

  const reward = ach.reward;
  switch (reward.type) {
    case 'coins':
      awardActivityRewards(reward.value, 0, `成就奖励: ${ach.title}`);
      return true;
    case 'score':
      grantCharacterGameplayRewards(reward.value, 0);
      return true;
    case 'hints':
      awardActivityPowerUps(reward.value, 0, 0);
      return true;
    default:
      return false;
  }
};

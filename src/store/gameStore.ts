'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, PathId, Difficulty, FeedEntry, ActionData, ActiveDebuff, ActiveBuff, RecurringItem } from '@/lib/types';
import {
  clamp, uid, getBehaviorById, getDebuffById, getBuffById,
  checkBehaviorExecutable, resolveBehaviorOutcome,
  executeSettlement, checkKillLines, getAllBehaviors, checkUnlockCondition,
} from '@/lib/engine';
import constantsData from '@/data/constants.json';
import actionsData from '@/data/actions.json';
import storiesIndex from '@/data/stories.json';

// 动态加载故事数据
const storyModules: Record<string, unknown> = {
  story1: require('@/data/stories/story1.json'),
  story2: require('@/data/stories/story2.json'),
  story3: require('@/data/stories/story3.json'),
};

function getStoryData(storyId: string | null): Record<string, unknown> {
  if (!storyId) return storyModules.story1 as Record<string, unknown>;
  return (storyModules[storyId] || storyModules.story1) as Record<string, unknown>;
}

// ============ 默认状态 ============

function createDefaultState(): GameState {
  return {
    stage: 'STORY_SELECT',
    storyId: null,
    pathId: null,
    difficulty: 'normal',
    money: 2000,
    attributes: { health: 80, san: 100, credit: 620, luck: 50 },
    housing: { type: '无固定住所', rent: 0 },
    housingLevel: '2',
    dietLevel: '1',
    currentRound: 1,
    roundPhase: 'action',
    maxSan: 110,
    activeDebuffs: [],
    activeBuffs: [],
    behaviorCooldowns: {},
    behaviorUseCount: {},
    usedOneTimeBehaviors: [],
    recurringItems: [],
    tutorialStep: 0,
    tutorialDone: false,
    bgLineIdx: 0,
    s02bSceneIdx: 0,
    feed: [],
    fullGameLog: [],
    roundBehaviors: [],
    roundFinancials: { income: 0, expense: 0 },
    death: { active: false, type: null, reason: '' },
    startedAt: Date.now(),
    lastSavedAt: Date.now(),
  };
}

// ============ Store 接口 ============

interface GameStore {
  state: GameState;

  // 故事选择
  selectStory: (storyId: string) => void;
  randomStory: () => void;
  getStoryData: () => Record<string, unknown>;

  // 阶段流转
  setStage: (stage: GameState['stage']) => void;
  nextS00Line: () => void;
  nextS02bScene: () => void;
  selectPath: (pathId: PathId) => void;
  setDifficulty: (d: Difficulty) => void;
  startGame: () => void;
  advanceTutorial: () => void;

  // 属性操作
  modifyMoney: (delta: number, reason?: string) => void;
  modifyAttribute: (attr: keyof GameState['attributes'], delta: number, reason?: string) => void;

  // 行为系统
  getAvailableBehaviors: () => Array<ActionData & { unlocked: boolean; canExecute: boolean; lockReason: string | null }>;
  executeBehavior: (actionId: string) => { success: boolean; result?: Record<string, unknown>; error?: string };

  // 回合管理
  endRound: () => { killLine: ReturnType<typeof checkKillLines> };
  nextRound: () => void;

  // 住房/饮食
  switchHousing: (level: string) => { success: boolean; error?: string };
  switchDiet: (level: string) => void;

  // 持续性项目
  removeRecurringItem: (itemId: string) => void;

  // 日志
  pushFeed: (text: string, kind?: FeedEntry['kind']) => void;

  // 重置
  resetGame: () => void;

  // 死亡
  triggerDeath: (type: string, reason: string) => void;
}

// ============ 创建 Store ============

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      state: createDefaultState(),

      // ---- 故事选择 ----
      selectStory: (storyId) => set((s) => ({
        state: { ...s.state, storyId, stage: 'S00' },
      })),

      randomStory: () => {
        const stories = storiesIndex.stories;
        const idx = Math.floor(Math.random() * stories.length);
        const storyId = stories[idx].id;
        set((s) => ({
          state: { ...s.state, storyId, stage: 'S00' },
        }));
      },

      getStoryData: () => {
        const s = get().state;
        return getStoryData(s.storyId);
      },

      // ---- 阶段流转 ----
      setStage: (stage) => set((s) => ({
        state: { ...s.state, stage },
      })),

      nextS00Line: () => set((s) => ({
        state: { ...s.state, bgLineIdx: s.state.bgLineIdx + 1 },
      })),

      nextS02bScene: () => set((s) => ({
        state: { ...s.state, s02bSceneIdx: s.state.s02bSceneIdx + 1 },
      })),

      selectPath: (pathId) => set((s) => {
        // 根据路线从当前故事数据查找对应的初始属性
        const stagesData = getStoryData(s.state.storyId) as Record<string, { identityOptions?: Array<{ id: string; stats: Record<string, number> }> }>;
        const identity = stagesData.S02?.identityOptions?.find((o) => o.id === pathId);
        const stats = identity?.stats || {};
        return {
          state: {
            ...s.state,
            pathId,
            money: stats.money ?? s.state.money,
            attributes: {
              health: stats.health ?? s.state.attributes.health,
              san: stats.san ?? s.state.attributes.san,
              credit: stats.credit ?? s.state.attributes.credit,
              luck: 50,
            },
          },
        };
      }),

      setDifficulty: (d) => set((s) => {
        const base = constantsData.initialStats[d as keyof typeof constantsData.initialStats];
        return {
          state: {
            ...s.state,
            difficulty: d,
            money: base?.money ?? s.state.money,
            attributes: {
              health: base?.health ?? s.state.attributes.health,
              san: base?.san ?? s.state.attributes.san,
              credit: base?.credit ?? s.state.attributes.credit,
              luck: 50,
            },
          },
        };
      }),

      startGame: () => set((s) => ({
        state: {
          ...s.state,
          stage: 'GAME',
          currentRound: 1,
          roundPhase: 'action',
          roundBehaviors: [],
          roundFinancials: { income: 0, expense: 0 },
        },
      })),

      advanceTutorial: () => set((s) => {
        interface TutorialEffect { stat: string; delta: number; type?: string; rent?: number; reason?: string }
        interface TutorialScript { day: number; text: string; effects?: TutorialEffect[]; spotlight?: { key: string; tip: string } }
        const stagesData = getStoryData(s.state.storyId) as Record<string, { tutorialByPath?: Record<string, { script: TutorialScript[] }> }>;
        const pathId = s.state.pathId || 'A';
        const tutorial = stagesData.S05?.tutorialByPath?.[pathId];
        const script: TutorialScript[] = tutorial?.script || [];
        const nextStep = s.state.tutorialStep + 1;

        // 应用当前步骤的效果
        const currentScript = script[s.state.tutorialStep];
        let newState = { ...s.state };

        if (currentScript?.effects) {
          for (const eff of currentScript.effects) {
            if (eff.stat === 'money') newState.money += eff.delta;
            else if (eff.stat === 'health') newState.attributes = { ...newState.attributes, health: clamp(newState.attributes.health + eff.delta, 0, 100) };
            else if (eff.stat === 'san') newState.attributes = { ...newState.attributes, san: clamp(newState.attributes.san + eff.delta, 0, 100) };
            else if (eff.stat === 'housing') {
              newState.housing = { type: eff.type || '', rent: eff.rent || 0 };
            }
          }
        }

        if (nextStep >= script.length) {
          newState.tutorialDone = true;
          newState.stage = 'GAME';
          newState.tutorialStep = nextStep;
        } else {
          newState.tutorialStep = nextStep;
        }

        return { state: newState };
      }),

      // ---- 属性操作 ----
      modifyMoney: (delta, reason) => set((s) => {
        const newMoney = s.state.money + delta;
        if (delta > 0) {
          s.state.roundFinancials.income += delta;
        } else {
          s.state.roundFinancials.expense += Math.abs(delta);
        }
        return { state: { ...s.state, money: newMoney } };
      }),

      modifyAttribute: (attr, delta) => set((s) => {
        const maxVal = attr === 'san' ? s.state.maxSan : 100;
        const newVal = attr === 'credit'
          ? s.state.attributes[attr] + delta
          : clamp(s.state.attributes[attr] + delta, 0, maxVal);
        return {
          state: {
            ...s.state,
            attributes: { ...s.state.attributes, [attr]: newVal },
          },
        };
      }),

      // ---- 行为系统 ----
      getAvailableBehaviors: () => {
        const s = get().state;
        const all = getAllBehaviors();
        return all.map((action) => {
          const { unlocked, reason } = checkUnlockCondition(action, s);
          const { canExecute, reasons } = checkBehaviorExecutable(action, s);
          return {
            ...action,
            unlocked,
            canExecute: unlocked && canExecute,
            lockReason: reason || reasons[0] || null,
          };
        });
      },

      executeBehavior: (actionId) => {
        const s = get().state;
        const action = getBehaviorById(actionId);
        if (!action) return { success: false, error: '该行动不存在' };

        const check = checkBehaviorExecutable(action, s);
        if (!check.canExecute) return { success: false, error: check.reasons.join('; ') };

        // 找到类别信息
        const categoryInfo = actionsData.categories.find(c => c.id === action.category);

        // 扣除消耗
        const sanCost = action.cost?.san || 0;
        const moneyCost = action.cost?.money || 0;
        const healthCost = action.cost?.health || 0;

        if (sanCost > 0) s.attributes.san = clamp(s.attributes.san - sanCost, 0, s.maxSan);
        if (moneyCost > 0) s.money -= moneyCost;
        if (healthCost > 0) s.attributes.health = clamp(s.attributes.health - healthCost, 0, 100);

        // 计算结果
        const luck = (s.attributes.luck || 50) / 100;
        const outcome = resolveBehaviorOutcome(action, luck);

        // 应用收益
        const effectSummary: string[] = [];
        if (outcome.gain) {
          for (const [key, val] of Object.entries(outcome.gain)) {
            if (typeof val !== 'number' || val === 0) continue;
            if (key === 'money') {
              s.money += val;
              if (val > 0) s.roundFinancials.income += val;
              else s.roundFinancials.expense += Math.abs(val);
              effectSummary.push(`资金${val >= 0 ? '+' : ''}${val}`);
            } else if (['health', 'san', 'credit', 'luck'].includes(key)) {
              const maxVal = key === 'san' ? s.maxSan : (key === 'credit' ? 850 : 100);
              (s.attributes as unknown as Record<string, number>)[key] = clamp(
                ((s.attributes as unknown as Record<string, number>)[key] || 0) + val,
                0,
                maxVal
              );
              const names: Record<string, string> = { health: '体力', san: 'SAN', credit: '评分', luck: '运势' };
              effectSummary.push(`${names[key]}${val >= 0 ? '+' : ''}${val}`);
            }
          }
        }

        // 应用setCreditTo
        if (action.setCreditTo !== undefined) {
          s.attributes.credit = action.setCreditTo;
          effectSummary.push(`信用评分重置为${action.setCreditTo}`);
        }

        // 应用clearAllDebuffs
        if (action.clearAllDebuffs) {
          s.activeDebuffs = [];
          effectSummary.push('移除全部负面状态');
        }

        // 应用debuff
        if (outcome.debuff || action.debuff) {
          const debuffDef = outcome.debuff || action.debuff;
          if (debuffDef) {
            const defData = getDebuffById(debuffDef.id);
            if (defData) {
              s.activeDebuffs.push({
                id: debuffDef.id,
                name: defData.name,
                icon: defData.icon,
                effect: defData.effect as unknown as Record<string, number>,
                remainingDuration: debuffDef.duration || defData.duration,
                canClearEarly: defData.canClearEarly,
                clearCost: defData.clearCost || 0,
              });
              effectSummary.push(`触发[${defData.name}]`);
            }
          }
        }

        // 应用buff
        if (action.buff) {
          const buffData = getBuffById(action.buff.id);
          if (buffData) {
            s.activeBuffs.push({
              id: action.buff.id,
              name: buffData.name,
              icon: buffData.icon,
              effect: buffData.effect as unknown as Record<string, number>,
              remainingDuration: action.buff.duration || buffData.duration,
            });
            effectSummary.push(`激活[${buffData.name}]`);
          }
        }

        // 记录行为使用
        s.roundBehaviors.push({ id: action.id, name: action.name, category: action.category });
        s.behaviorUseCount[action.id] = (s.behaviorUseCount[action.id] || 0) + 1;
        if (action.limit?.cooldown) {
          s.behaviorCooldowns[action.id] = action.limit.cooldown;
        }
        if (action.limit?.usesPerGame === 1) {
          s.usedOneTimeBehaviors.push(action.id);
        }

        // 添加日志
        const feedEntry: FeedEntry = {
          id: uid(),
          text: `【${action.name}】${outcome.text || action.quote || ''} ${effectSummary.join(' ')}`,
          kind: 'scene',
          timestamp: Date.now(),
        };
        s.feed.push(feedEntry);
        s.fullGameLog.push(feedEntry);

        // 处理持续性项目（工作/投资）
        const actionAny = action as unknown as Record<string, unknown>;
        if (actionAny.recurring && outcome.success) {
          const templateId = actionAny.recurring as string;
          const templates = (actionsData as unknown as Record<string, Record<string, unknown>>).recurringTemplates as Record<string, Record<string, unknown>> | undefined;
          const template = templates?.[templateId];
          if (template) {
            // 如果是工作类型，先检查是否已经有同类工作
            if (template.type === 'work') {
              const existingWork = s.recurringItems.find(r => r.type === 'work');
              if (existingWork) {
                // 替换旧工作
                s.recurringItems = s.recurringItems.filter(r => r.type !== 'work');
                effectSummary.push(`辞去[${existingWork.name}]`);
              }
            }
            const newItem: RecurringItem = {
              id: `${templateId}_${uid()}`,
              sourceActionId: action.id,
              type: template.type as RecurringItem['type'],
              name: template.name as string,
              icon: template.icon as string,
              description: template.description as string,
              monthlyIncome: template.monthlyIncome as number,
              monthlyHealthCost: template.monthlyHealthCost as number,
              monthlySanCost: template.monthlySanCost as number,
              monthlyCreditChange: template.monthlyCreditChange as number,
              loseChance: template.loseChance as number,
              loseText: template.loseText as string,
              permanent: template.type === 'work',
              remainingMonths: template.type === 'loan' ? 6 : -1,
              startRound: s.currentRound,
            };
            s.recurringItems.push(newItem);
            effectSummary.push(`获得持续性${template.type === 'work' ? '工作' : template.type === 'invest' ? '投资' : '项目'}[${template.name}]`);
          }
        }

        // 处理辞职
        if (actionAny.quitWork) {
          const workItem = s.recurringItems.find(r => r.type === 'work');
          if (workItem) {
            effectSummary.push(`辞去了[${workItem.name}]`);
            s.recurringItems = s.recurringItems.filter(r => r.type !== 'work');
          } else {
            return { success: false, error: '你目前没有工作可辞' };
          }
        }

        // 检查斩杀线
        const killLine = checkKillLines(s);
        if (killLine) {
          s.death = { active: true, type: killLine.type, reason: killLine.reason };
          s.stage = 'DEATH';
        }

        set({ state: { ...s } });

        return {
          success: true,
          result: {
            behavior: { id: action.id, name: action.name, category: action.category, icon: categoryInfo?.icon || '📌', type: action.type },
            gain: outcome.gain,
            narrative: outcome.text || action.quote || '',
            effectSummary: effectSummary.join(' '),
          },
        };
      },

      // ---- 回合管理 ----
      endRound: () => {
        const s = get().state;
        s.roundPhase = 'settlement';

        const result = executeSettlement(s);

        // 添加结算日志
        const summaryParts: string[] = [];
        if (result.rentPaid > 0) summaryParts.push(`租金-$${result.rentPaid}`);
        if (result.dietCost > 0) summaryParts.push(`伙食-$${result.dietCost}`);

        // 持续性项目结算日志
        if (result.recurringEffects.length > 0) {
          result.recurringEffects.forEach(e => summaryParts.push(e));
        }
        if (result.lostRecurring.length > 0) {
          result.lostRecurring.forEach(e => summaryParts.push(`⚠️${e}`));
        }

        if (result.healthChange !== 0) {
          const sign = result.healthChange > 0 ? '+' : '';
          summaryParts.push(`❤️体力${sign}${result.healthChange}`);
        }
        if (result.sanChange !== 0) {
          const sign = result.sanChange > 0 ? '+' : '';
          summaryParts.push(`🧠精神${sign}${result.sanChange}`);
        }
        result.debuffEffects.forEach(e => summaryParts.push(e));
        result.buffExpired.forEach(name => summaryParts.push(`${name}已失效`));

        const feedEntry: FeedEntry = {
          id: uid(),
          text: `【本月结算】${summaryParts.join(' | ')}`,
          kind: 'system',
          timestamp: Date.now(),
        };
        s.feed.push(feedEntry);
        s.fullGameLog.push(feedEntry);

        if (result.killLine) {
          s.death = { active: true, type: result.killLine.type, reason: result.killLine.reason };
          s.stage = 'DEATH';
        }

        // 将结算的租金和伙食费计入本月支出
        s.roundFinancials.expense += result.rentPaid + result.dietCost + result.recurringExpense;
        s.roundFinancials.income += result.recurringIncome;

        s.roundPhase = 'result';
        set({ state: { ...s } });
        return { killLine: result.killLine };
      },

      nextRound: () => set((s) => {
        const newRound = s.state.currentRound + 1;
        return {
          state: {
            ...s.state,
            currentRound: newRound,
            roundPhase: 'action',
            roundBehaviors: [],
            roundFinancials: { income: 0, expense: 0 },
          },
        };
      }),

      // ---- 住房/饮食 ----
      switchHousing: (level) => {
        const s = get().state;
        const housingData = constantsData.housing[level as keyof typeof constantsData.housing];
        if (!housingData) return { success: false, error: '该住所类型不存在' };

        s.housingLevel = level;
        s.housing = { type: housingData.name, rent: housingData.cost };
        s.maxSan = housingData.sanMax;

        const feedEntry: FeedEntry = {
          id: uid(),
          text: `搬迁至：${housingData.name}（$${housingData.cost}/月）`,
          kind: 'log',
          timestamp: Date.now(),
        };
        s.feed.push(feedEntry);

        set({ state: { ...s } });
        return { success: true };
      },

      switchDiet: (level) => set((s) => {
        return { state: { ...s.state, dietLevel: level } };
      }),

      // ---- 持续性项目 ----
      removeRecurringItem: (itemId) => {
        const s = get().state;
        const item = s.recurringItems.find(r => r.id === itemId);
        if (item) {
          s.recurringItems = s.recurringItems.filter(r => r.id !== itemId);
          const feedEntry: FeedEntry = {
            id: uid(),
            text: `${item.icon} ${item.name} 已终止`,
            kind: 'log',
            timestamp: Date.now(),
          };
          s.feed.push(feedEntry);
          set({ state: { ...s } });
        }
      },

      // ---- 日志 ----
      pushFeed: (text, kind = 'log') => set((s) => {
        const entry: FeedEntry = { id: uid(), text, kind, timestamp: Date.now() };
        return {
          state: {
            ...s.state,
            feed: [...s.state.feed, entry].slice(-80),
            fullGameLog: [...s.state.fullGameLog, entry],
          },
        };
      }),

      // ---- 重置 ----
      resetGame: () => set({ state: createDefaultState() }),

      // ---- 死亡 ----
      triggerDeath: (type, reason) => set((s) => ({
        state: {
          ...s.state,
          stage: 'DEATH',
          death: { active: true, type, reason },
        },
      })),
    }),
    {
      name: 'american-dream-game',
      version: 3,
      partialize: (state) => ({ state: state.state }),
      migrate: (persistedState: unknown, version: number) => {
        if (version < 3) {
          // 旧版存档缺少 recurringItems，直接重置
          return { state: createDefaultState() };
        }
        return persistedState;
      },
    }
  )
);

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, PathId, Difficulty, FeedEntry, ActionData, ActiveDebuff, ActiveBuff, RecurringItem, RandomEvent, DilemmaEvent } from '@/lib/types';
import {
  clamp, uid, getBehaviorById, getDebuffById, getBuffById,
  checkBehaviorExecutable, resolveBehaviorOutcome,
  executeSettlement, checkKillLines, getAllBehaviors, checkUnlockCondition,
} from '@/lib/engine';
import { checkMilestones } from '@/data/milestones';
import { rollRandomEvent } from '@/data/randomEvents';
import { rollDilemma } from '@/data/dilemmaEvents';
import { calculateClassLevel, calculateNetWorth } from '@/lib/classSystem';
import { generateWorldNews } from '@/data/worldNews';
import constantsData from '@/data/constants.json';
import actionsData from '@/data/actions.json';
import storiesIndex from '@/data/stories.json';

// 简单的种子随机：基于回合号生成本回合可见的行为ID列表
function generateVisibleBehaviors(round: number): string[] {
  const all = getAllBehaviors();
  const seed = round * 2654435761; // Knuth multiplicative hash
  function seededRandom(i: number): number {
    let x = ((seed + i * 6364136223846793005) >>> 0) % 2147483647;
    x = ((x * 48271) >>> 0) % 2147483647;
    return (x % 10000) / 10000;
  }
  const visible: string[] = [];
  all.forEach((action, idx) => {
    const chance = (action as unknown as Record<string, number>).showChance;
    if (chance === undefined || chance === null || chance >= 1) {
      visible.push(action.id); // 无showChance字段=必定出现
    } else if (seededRandom(idx) < chance) {
      visible.push(action.id);
    }
  });
  return visible;
}

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
    education: { level: 0, schoolName: '', graduated: false, skills: 10, influence: 5 },
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
    graduatedSchools: [],
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
    visibleBehaviorIds: [],
    // 爽感系统
    achievedMilestones: [],
    pendingMilestones: [],
    wealthHistory: [],
    classLevel: 0,
    pendingRandomEvent: null,
    pendingDilemma: null,
    // 暗黑系统
    currentWorldNews: [],
    totalDeathsSeen: 0,
    totalRuinsSeen: 0,
    totalDeportsSeen: 0,
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
  sellRecurringItem: (itemId: string) => { success: boolean; message: string };

  // 日志
  pushFeed: (text: string, kind?: FeedEntry['kind']) => void;

  // 重置
  resetGame: () => void;

  // 跳过剧情直接进入游戏
  skipToGame: () => void;

  // 死亡
  triggerDeath: (type: string, reason: string) => void;

  // 爽感系统
  dismissMilestone: () => void;
  resolveDilemma: (choice: 'A' | 'B') => { text: string; effects: Record<string, number> };
  dismissRandomEvent: () => void;
  applyEffects: (effects: Record<string, number>) => void;
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
          visibleBehaviorIds: generateVisibleBehaviors(1),
        },
      })),

      // 一键跳过所有剧情，随机角色直接进入游戏
      skipToGame: () => {
        const stories = storiesIndex.stories;
        const storyIdx = Math.floor(Math.random() * stories.length);
        const storyId = stories[storyIdx].id;
        const stagesData = getStoryData(storyId) as Record<string, { identityOptions?: Array<{ id: string; stats: Record<string, number> }> }>;
        const paths: PathId[] = ['A', 'B', 'C', 'D'];
        const pathId = paths[Math.floor(Math.random() * paths.length)];
        const identity = stagesData.S02?.identityOptions?.find((o) => o.id === pathId);
        const stats = identity?.stats || {};
        set((s) => ({
          state: {
            ...s.state,
            storyId,
            pathId,
            money: stats.money ?? s.state.money,
            attributes: {
              health: stats.health ?? s.state.attributes.health,
              san: stats.san ?? s.state.attributes.san,
              credit: stats.credit ?? s.state.attributes.credit,
              luck: 50,
            },
            stage: 'GAME',
            currentRound: 1,
            roundPhase: 'action',
            tutorialDone: true,
            roundBehaviors: [],
            roundFinancials: { income: 0, expense: 0 },
            visibleBehaviorIds: generateVisibleBehaviors(1),
          },
        }));
      },

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
        const visibleSet = s.visibleBehaviorIds?.length > 0 ? new Set(s.visibleBehaviorIds) : null;
        return all
          .filter((action) => {
            // 如果有随机可见列表，过滤掉不在列表中的行为
            if (visibleSet && !visibleSet.has(action.id)) return false;
            return true;
          })
          .map((action) => {
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
            } else if (key === 'skills') {
              s.education.skills = clamp(s.education.skills + val, 0, 100);
              effectSummary.push(`技能${val >= 0 ? '+' : ''}${val}`);
            } else if (key === 'influence') {
              s.education.influence = clamp(s.education.influence + val, 0, 100);
              effectSummary.push(`影响力${val >= 0 ? '+' : ''}${val}`);
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
        if (action.recurring && outcome.success) {
          const templateId = action.recurring;
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
            // 如果是教育类型，先检查是否已在读
            if (template.type === 'education') {
              const existingEdu = s.recurringItems.find(r => r.type === 'education');
              if (existingEdu) {
                s.recurringItems = s.recurringItems.filter(r => r.type !== 'education');
                effectSummary.push(`退出[${existingEdu.name}]`);
              }
            }
            const newItem: RecurringItem = {
              id: `${templateId}_${uid()}`,
              sourceActionId: action.id,
              type: template.type as RecurringItem['type'],
              subType: (template.subType as RecurringItem['subType']) || undefined,
              name: template.name as string,
              icon: template.icon as string,
              description: template.description as string,
              monthlyIncome: template.monthlyIncome as number || 0,
              monthlyCost: (template.monthlyCost as number) || 0,
              monthlyHealthCost: template.monthlyHealthCost as number || 0,
              monthlySanCost: template.monthlySanCost as number || 0,
              monthlyCreditChange: template.monthlyCreditChange as number || 0,
              monthlyInfluenceChange: (template.monthlyInfluenceChange as number) || undefined,
              loseChance: template.loseChance as number || 0,
              loseText: template.loseText as string || '',
              permanent: template.type === 'work',
              remainingMonths: (template.remainingMonths as number) || (template.type === 'loan' ? 6 : -1),
              startRound: s.currentRound,
              // 资金类投资字段
              accumulatedGain: template.subType === 'fund' ? 0 : undefined,
              investPrincipal: template.subType === 'fund' ? (action.cost?.money || 0) : undefined,
              // 可操作性
              canSell: (template.canSell as boolean) || false,
              sellText: (template.sellText as string) || undefined,
              // 教育毕业奖励
              graduateBonus: template.graduateBonus ? {
                educationLevel: (template.graduateBonus as Record<string, number>).educationLevel || 0,
                skills: (template.graduateBonus as Record<string, number>).skills || 0,
                influence: (template.graduateBonus as Record<string, number>).influence || 0,
              } : undefined,
            };
            s.recurringItems.push(newItem);
            const typeLabel = template.type === 'work' ? '工作' : template.type === 'invest' ? '投资' : template.type === 'education' ? '学业' : '项目';
            effectSummary.push(`获得持续性${typeLabel}[${template.name}]`);
          }
        }

        // 处理辞职
        if (action.quitWork) {
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

        // 检查里程碑（行为执行后实时检查）
        const newMs = checkMilestones(s);
        if (newMs.length > 0) {
          s.achievedMilestones = [...s.achievedMilestones, ...newMs];
          s.pendingMilestones = [...s.pendingMilestones, ...newMs];
        }

        // 更新阶层
        s.classLevel = calculateClassLevel(s);

        set({ state: { ...s } });

        return {
          success: true,
          result: {
            behavior: { id: action.id, name: action.name, category: action.category, icon: categoryInfo?.icon || '📌', type: action.type },
            gain: outcome.gain,
            narrative: outcome.text || action.quote || '',
            effectSummary: effectSummary.join(' '),
            outcomeSuccess: outcome.success,
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

        // === 爽感系统：随机事件 ===
        const randomEvent = rollRandomEvent(s);
        if (randomEvent) {
          s.pendingRandomEvent = randomEvent;
          // 立即应用随机事件效果
          for (const [key, val] of Object.entries(randomEvent.effects)) {
            if (typeof val !== 'number' || val === 0) continue;
            if (key === 'money') {
              s.money += val;
              if (val > 0) s.roundFinancials.income += val;
              else s.roundFinancials.expense += Math.abs(val);
            } else if (key === 'skills') {
              s.education.skills = clamp(s.education.skills + val, 0, 100);
            } else if (key === 'influence') {
              s.education.influence = clamp(s.education.influence + val, 0, 100);
            } else if (['health', 'san', 'credit', 'luck'].includes(key)) {
              const maxV = key === 'san' ? s.maxSan : (key === 'credit' ? 850 : 100);
              (s.attributes as unknown as Record<string, number>)[key] = clamp(
                ((s.attributes as unknown as Record<string, number>)[key] || 0) + val, 0, maxV
              );
            }
          }
          // 添加日志
          const eventFeed: FeedEntry = {
            id: uid(),
            text: `【随机事件】${randomEvent.text}`,
            kind: randomEvent.tone === 'positive' ? 'effect' : 'danger',
            timestamp: Date.now(),
          };
          s.feed.push(eventFeed);
          s.fullGameLog.push(eventFeed);
        }

        // === 暗黑系统：世界新闻播报 ===
        const worldNews = generateWorldNews(s.classLevel, s.currentRound);
        s.currentWorldNews = worldNews;
        // 统计死亡/破产/遣返数
        for (const n of worldNews) {
          if (n.tone === 'death') s.totalDeathsSeen++;
          else if (n.tone === 'ruin') s.totalRuinsSeen++;
          else if (n.tone === 'deport') s.totalDeportsSeen++;
          // 应用玩家收益
          if (n.playerGain) {
            for (const [key, val] of Object.entries(n.playerGain)) {
              if (typeof val !== 'number' || val === 0) continue;
              if (key === 'money') {
                s.money += val;
                s.roundFinancials.income += val;
              } else if (key === 'skills') {
                s.education.skills = clamp(s.education.skills + val, 0, 100);
              } else if (key === 'influence') {
                s.education.influence = clamp(s.education.influence + val, 0, 100);
              } else if (['health', 'san', 'credit', 'luck'].includes(key)) {
                const maxV = key === 'san' ? s.maxSan : (key === 'credit' ? 850 : 100);
                (s.attributes as unknown as Record<string, number>)[key] = clamp(
                  ((s.attributes as unknown as Record<string, number>)[key] || 0) + val, 0, maxV
                );
              }
            }
          }
        }

        // === 爽感系统：里程碑检查 ===
        const newMilestones = checkMilestones(s);
        if (newMilestones.length > 0) {
          s.achievedMilestones = [...s.achievedMilestones, ...newMilestones];
          s.pendingMilestones = [...s.pendingMilestones, ...newMilestones];
        }

        // === 爽感系统：阶层更新 ===
        s.classLevel = calculateClassLevel(s);

        // === 爽感系统：资产历史 ===
        s.wealthHistory = [...s.wealthHistory, {
          round: s.currentRound,
          money: s.money,
          netWorth: calculateNetWorth(s),
          classLevel: s.classLevel,
        }];

        // === 爽感系统：抉择事件（在随机事件之后） ===
        if (!s.pendingRandomEvent) {
          const dilemma = rollDilemma(s);
          if (dilemma) {
            s.pendingDilemma = dilemma;
          }
        }

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
            visibleBehaviorIds: generateVisibleBehaviors(newRound),
            pendingRandomEvent: null,
            pendingDilemma: null,
            currentWorldNews: [],
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

      sellRecurringItem: (itemId) => {
        const s = get().state;
        const item = s.recurringItems.find(r => r.id === itemId);
        if (!item || !item.canSell) return { success: false, message: '该项目不可出售' };

        const effects: string[] = [];

        if (item.subType === 'fund' && item.accumulatedGain !== undefined) {
          // 资金类投资：抛售结算累计浮动盈亏
          const principal = item.investPrincipal || 0;
          const totalReturn = principal + item.accumulatedGain;
          s.money += totalReturn;
          effects.push(`收回本金+收益 $${totalReturn.toLocaleString()}`);
        } else if (item.subType === 'business') {
          // 开店类投资：关店退出，不退本金
          effects.push('店面已关闭，停止运营');
        } else if (item.type === 'education') {
          // 退学
          effects.push('已退学');
          s.attributes.san = clamp(s.attributes.san - 10, 0, s.maxSan);
        }

        s.recurringItems = s.recurringItems.filter(r => r.id !== itemId);
        const msg = `${item.icon} ${item.sellText || '已终止'}: ${effects.join(' ')}`;
        const feedEntry: FeedEntry = {
          id: uid(),
          text: msg,
          kind: 'log',
          timestamp: Date.now(),
        };
        s.feed.push(feedEntry);
        s.fullGameLog.push(feedEntry);
        set({ state: { ...s } });
        return { success: true, message: msg };
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

      // ---- 爽感系统 ----
      dismissMilestone: () => set((s) => ({
        state: {
          ...s.state,
          pendingMilestones: s.state.pendingMilestones.slice(1),
        },
      })),

      dismissRandomEvent: () => set((s) => ({
        state: { ...s.state, pendingRandomEvent: null },
      })),

      resolveDilemma: (choice) => {
        const s = get().state;
        const dilemma = s.pendingDilemma;
        if (!dilemma) return { text: '', effects: {} };

        let text: string;
        let effects: Record<string, number>;

        if (choice === 'A') {
          const option = dilemma.optionA;
          const successChance = option.successChance ?? 1;
          const success = Math.random() < successChance;

          if (success || !option.failText) {
            text = option.successText;
            effects = option.effects;
          } else {
            text = option.failText;
            effects = option.failEffects || option.effects;
          }
        } else {
          const option = dilemma.optionB;
          text = option.successText;
          effects = option.effects;
        }

        // 应用效果
        for (const [key, val] of Object.entries(effects)) {
          if (typeof val !== 'number' || val === 0) continue;
          if (key === 'money') {
            s.money += val;
          } else if (key === 'skills') {
            s.education.skills = clamp(s.education.skills + val, 0, 100);
          } else if (key === 'influence') {
            s.education.influence = clamp(s.education.influence + val, 0, 100);
          } else if (['health', 'san', 'credit', 'luck'].includes(key)) {
            const maxV = key === 'san' ? s.maxSan : (key === 'credit' ? 850 : 100);
            (s.attributes as unknown as Record<string, number>)[key] = clamp(
              ((s.attributes as unknown as Record<string, number>)[key] || 0) + val, 0, maxV
            );
          }
        }

        // 日志
        const feedEntry: FeedEntry = {
          id: uid(),
          text: `【抉择】${dilemma.title} → ${text}`,
          kind: 'scene',
          timestamp: Date.now(),
        };
        s.feed.push(feedEntry);
        s.fullGameLog.push(feedEntry);

        s.pendingDilemma = null;
        set({ state: { ...s } });
        return { text, effects };
      },

      applyEffects: (effects) => {
        const s = get().state;
        for (const [key, val] of Object.entries(effects)) {
          if (typeof val !== 'number' || val === 0) continue;
          if (key === 'money') s.money += val;
          else if (key === 'skills') s.education.skills = clamp(s.education.skills + val, 0, 100);
          else if (key === 'influence') s.education.influence = clamp(s.education.influence + val, 0, 100);
          else if (['health', 'san', 'credit', 'luck'].includes(key)) {
            const maxV = key === 'san' ? s.maxSan : (key === 'credit' ? 850 : 100);
            (s.attributes as unknown as Record<string, number>)[key] = clamp(
              ((s.attributes as unknown as Record<string, number>)[key] || 0) + val, 0, maxV
            );
          }
        }
        set({ state: { ...s } });
      },
    }),
    {
      name: 'american-dream-game',
      version: 7,
      partialize: (state) => ({ state: state.state }),
      migrate: (persistedState: unknown, version: number) => {
        if (version < 7) {
          // 旧版存档不兼容，直接重置
          return { state: createDefaultState() };
        }
        return persistedState;
      },
    }
  )
);

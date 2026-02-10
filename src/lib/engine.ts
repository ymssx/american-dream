// 游戏逻辑引擎 - 行为系统、结算系统、斩杀线检测

import type { ActionData, Attributes, GameState, BehaviorResult, ActiveDebuff, ActiveBuff, RecurringItem } from './types';
import actionsData from '@/data/actions.json';
import constantsData from '@/data/constants.json';

// ============ 工具函数 ============

/** 限制值在范围内 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** 生成唯一ID */
export function uid(): string {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

// ============ 行为数据加载 ============

/** 获取所有行为（扁平化） */
export function getAllBehaviors(): ActionData[] {
  const result: ActionData[] = [];
  const actions = actionsData.actions as unknown as Record<string, ActionData[]>;
  for (const category of Object.keys(actions)) {
    for (const action of actions[category]) {
      result.push(action);
    }
  }
  return result;
}

/** 按ID查找行为 */
export function getBehaviorById(id: string): ActionData | null {
  return getAllBehaviors().find(b => b.id === id) || null;
}

/** 获取debuff定义 */
export function getDebuffById(id: string) {
  return actionsData.debuffs.find(d => d.id === id) || null;
}

/** 获取buff定义 */
export function getBuffById(id: string) {
  return actionsData.buffs.find(b => b.id === id) || null;
}

// ============ 条件判断 ============

/** 解析条件字符串，如 "money > 50000" */
function parseCondition(cond: string): { stat: string; op: string; value: number } | null {
  const m = cond.match(/^(\w+)\s*([<>=!]+)\s*(\d+)$/);
  if (!m) return null;
  return { stat: m[1], op: m[2], value: parseInt(m[3], 10) };
}

/** 评估条件 */
export function evaluateCondition(cond: string, state: GameState): boolean {
  const parsed = parseCondition(cond);
  if (!parsed) return true;

  let val: number;
  if (parsed.stat === 'money') val = state.money;
  else val = (state.attributes as unknown as Record<string, number>)[parsed.stat] ?? 0;

  switch (parsed.op) {
    case '<': return val < parsed.value;
    case '<=': return val <= parsed.value;
    case '>': return val > parsed.value;
    case '>=': return val >= parsed.value;
    case '==': case '=': return val === parsed.value;
    case '!=': return val !== parsed.value;
    default: return true;
  }
}

/** 检查行为是否已解锁 */
export function checkUnlockCondition(action: ActionData, state: GameState): { unlocked: boolean; reason: string | null } {
  const unlock = action.unlock;
  if (!unlock || unlock.type === 'default') return { unlocked: true, reason: null };

  if (unlock.type === 'round' && unlock.round) {
    if (state.currentRound < unlock.round) {
      return { unlocked: false, reason: `第${unlock.round}回合解锁` };
    }
    return { unlocked: true, reason: null };
  }

  if (unlock.type === 'condition' && unlock.condition) {
    const met = evaluateCondition(unlock.condition, state);
    return { unlocked: met, reason: met ? null : (unlock.conditionText || unlock.condition) };
  }

  return { unlocked: true, reason: null };
}

/** 检查行为是否可执行 */
export function checkBehaviorExecutable(action: ActionData, state: GameState): { canExecute: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // 检查解锁
  const { unlocked, reason } = checkUnlockCondition(action, state);
  if (!unlocked) reasons.push(reason || '未解锁');

  // 检查SAN消耗
  const sanCost = action.cost?.san || 0;
  if (sanCost > 0 && state.attributes.san < sanCost) {
    reasons.push(`SAN不足（需要${sanCost}，当前${state.attributes.san}）`);
  }

  // 检查金钱消耗
  const moneyCost = action.cost?.money || 0;
  if (moneyCost > 0 && state.money < moneyCost) {
    reasons.push(`金钱不足（需要$${moneyCost}，当前$${state.money}）`);
  }

  // 检查健康消耗
  const healthCost = action.cost?.health || 0;
  if (healthCost > 0 && state.attributes.health <= healthCost) {
    reasons.push(`健康不足`);
  }

  // 检查冷却
  if (action.limit?.cooldown) {
    const cd = state.behaviorCooldowns[action.id] || 0;
    if (cd > 0) reasons.push(`冷却中（还需${cd}回合）`);
  }

  // 检查使用次数限制
  if (action.limit?.usesPerGame) {
    const used = state.behaviorUseCount[action.id] || 0;
    if (used >= action.limit.usesPerGame) reasons.push('已达使用次数上限');
  }

  // 检查一次性行为
  if (state.usedOneTimeBehaviors.includes(action.id)) {
    reasons.push('已使用过');
  }

  // 检查辞职行为：必须有工作才能辞职
  const actionAny = action as unknown as Record<string, unknown>;
  if (actionAny.quitWork) {
    const hasWork = state.recurringItems.some(r => r.type === 'work');
    if (!hasWork) reasons.push('你目前没有工作');
  }

  // 检查工作/投资类行为：如果已有同类型持续项目且来源相同，不能重复
  if (actionAny.recurring) {
    const templateId = actionAny.recurring as string;
    const existing = state.recurringItems.find(r => r.sourceActionId === action.id);
    if (existing) reasons.push(`已有[${existing.name}]运行中`);
  }

  return { canExecute: reasons.length === 0, reasons };
}

// ============ 行为结果计算 ============

/** 根据行为类型解析结果 */
export function resolveBehaviorOutcome(action: ActionData, luck: number = 0.5) {
  const type = action.type;

  if (type === 'fixed') {
    return { success: true, gain: action.gain || {}, text: action.quote };
  }

  if (type === 'random' || type === 'lottery') {
    const outcomes = action.outcomes || [];
    let roll = Math.random();
    // 幸运值微调
    roll = roll * (1 - luck * 0.1);

    let cumulative = 0;
    for (const outcome of outcomes) {
      cumulative += outcome.chance;
      if (roll <= cumulative) {
        return { success: true, gain: outcome.gain, text: outcome.text };
      }
    }
    // 如果没命中，返回最后一个
    const last = outcomes[outcomes.length - 1];
    return { success: true, gain: last?.gain || {}, text: last?.text || '' };
  }

  if (type === 'risky') {
    const baseGain = action.baseGain || {};
    const risk = action.risk;
    if (risk && Math.random() < risk.chance) {
      // 触发风险
      const combined = { ...baseGain };
      for (const [k, v] of Object.entries(risk.penalty)) {
        combined[k] = (combined[k] || 0) + v;
      }
      return {
        success: false,
        gain: combined,
        text: risk.text,
        debuff: risk.debuff,
      };
    }
    return { success: true, gain: baseGain, text: action.quote };
  }

  return { success: true, gain: action.gain || {}, text: action.quote };
}

// ============ 斩杀线检测 ============

export interface KillLineResult {
  triggered: boolean;
  type: string;
  reason: string;
}

export function checkKillLines(state: GameState): KillLineResult | null {
  if (state.attributes.health <= 0) {
    return { triggered: true, type: 'health', reason: '你的身体终于罢工了。那些年透支的健康一次性来讨债。' };
  }
  if (state.attributes.san <= 0) {
    return { triggered: true, type: 'sanity', reason: '脑子里那根弦断了。你再也分不清梦境和现实。' };
  }
  return null;
}

// ============ 回合结算 ============

export interface SettlementResult {
  rentPaid: number;
  dietCost: number;
  debuffEffects: string[];
  buffExpired: string[];
  healthChange: number;
  sanChange: number;
  moneyChange: number;
  recurringEffects: string[];   // 持续性项目结算日志
  recurringIncome: number;      // 持续性项目总收入
  recurringExpense: number;     // 持续性项目总支出
  lostRecurring: string[];      // 本月失去的持续性项目
  killLine: KillLineResult | null;
}

/** 执行月度结算 */
export function executeSettlement(state: GameState): SettlementResult {
  const result: SettlementResult = {
    rentPaid: 0,
    dietCost: 0,
    debuffEffects: [],
    buffExpired: [],
    healthChange: 0,
    sanChange: 0,
    moneyChange: 0,
    recurringEffects: [],
    recurringIncome: 0,
    recurringExpense: 0,
    lostRecurring: [],
    killLine: null,
  };

  // 1. 扣房租
  const housingData = constantsData.housing[state.housingLevel as keyof typeof constantsData.housing];
  if (housingData) {
    const rent = housingData.cost;
    if (state.money >= rent) {
      state.money -= rent;
      result.rentPaid = rent;
      result.moneyChange -= rent;
    } else {
      // 付不起房租，降级为露宿
      state.housingLevel = '1';
      state.housing = { type: '睡大街', rent: 0 };
    }
  }

  // 2. 扣饮食费
  const dietData = constantsData.diet[state.dietLevel as keyof typeof constantsData.diet];
  if (dietData) {
    state.money -= dietData.moneyCost;
    result.dietCost = dietData.moneyCost;
    result.moneyChange -= dietData.moneyCost;

    // 饮食影响健康
    state.attributes.health = clamp(state.attributes.health + dietData.healthChange, 0, 100);
    result.healthChange += dietData.healthChange;

    // 饮食影响SAN（正值消耗SAN，负值恢复SAN）
    if (dietData.sanCost !== undefined && dietData.sanCost !== 0) {
      const prevSan = state.attributes.san;
      state.attributes.san = clamp(state.attributes.san - dietData.sanCost, 0, state.maxSan);
      result.sanChange += state.attributes.san - prevSan;
    }
  }

  // 3. 处理Debuff
  const newDebuffs: ActiveDebuff[] = [];
  for (const debuff of state.activeDebuffs) {
    const effect = debuff.effect;
    if (effect.moneyPerRound) {
      state.money += effect.moneyPerRound;
      result.moneyChange += effect.moneyPerRound;
      result.debuffEffects.push(`${debuff.icon} ${debuff.name}: $${effect.moneyPerRound}`);
    }
    if (effect.healthPerRound) {
      state.attributes.health = clamp(state.attributes.health + effect.healthPerRound, 0, 100);
      result.healthChange += effect.healthPerRound;
      result.debuffEffects.push(`${debuff.icon} ${debuff.name}: 体力${effect.healthPerRound}`);
    }
    if (effect.creditPerRound) {
      state.attributes.credit += effect.creditPerRound;
      result.debuffEffects.push(`${debuff.icon} ${debuff.name}: 评分${effect.creditPerRound}`);
    }
    debuff.remainingDuration -= 1;
    if (debuff.remainingDuration > 0) {
      newDebuffs.push(debuff);
    }
  }
  state.activeDebuffs = newDebuffs;

  // 4. 处理Buff
  const newBuffs: ActiveBuff[] = [];
  for (const buff of state.activeBuffs) {
    buff.remainingDuration -= 1;
    if (buff.remainingDuration > 0) {
      newBuffs.push(buff);
    } else {
      result.buffExpired.push(buff.name);
    }
  }
  state.activeBuffs = newBuffs;

  // 5. 更新冷却
  for (const key of Object.keys(state.behaviorCooldowns)) {
    if (state.behaviorCooldowns[key] > 0) {
      state.behaviorCooldowns[key] -= 1;
    }
  }

  // 5.5 处理持续性项目（工作/投资/借贷）
  const survivingRecurring: RecurringItem[] = [];
  for (const item of state.recurringItems) {
    // 检查是否失去（被裁员/投资失败等）
    if (item.loseChance > 0 && Math.random() < item.loseChance) {
      result.lostRecurring.push(`${item.icon} ${item.name}: ${item.loseText}`);
      continue; // 不保留
    }

    // 处理月收入/支出
    if (item.monthlyIncome !== 0) {
      state.money += item.monthlyIncome;
      result.moneyChange += item.monthlyIncome;
      if (item.monthlyIncome > 0) {
        result.recurringIncome += item.monthlyIncome;
      } else {
        result.recurringExpense += Math.abs(item.monthlyIncome);
      }
    }

    // 处理健康消耗
    if (item.monthlyHealthCost > 0) {
      state.attributes.health = clamp(state.attributes.health - item.monthlyHealthCost, 0, 100);
      result.healthChange -= item.monthlyHealthCost;
    }

    // 处理SAN消耗
    if (item.monthlySanCost > 0) {
      state.attributes.san = clamp(state.attributes.san - item.monthlySanCost, 0, state.maxSan);
      result.sanChange -= item.monthlySanCost;
    }

    // 处理信用变化
    if (item.monthlyCreditChange !== 0) {
      state.attributes.credit += item.monthlyCreditChange;
    }

    // 生成日志
    const parts: string[] = [];
    if (item.monthlyIncome > 0) parts.push(`+$${item.monthlyIncome}`);
    if (item.monthlyIncome < 0) parts.push(`-$${Math.abs(item.monthlyIncome)}`);
    if (item.monthlyHealthCost > 0) parts.push(`❤️-${item.monthlyHealthCost}`);
    if (item.monthlySanCost > 0) parts.push(`🧠-${item.monthlySanCost}`);
    result.recurringEffects.push(`${item.icon} ${item.name}: ${parts.join(' ')}`);

    // 处理剩余月数
    if (!item.permanent && item.remainingMonths > 0) {
      item.remainingMonths -= 1;
      if (item.remainingMonths <= 0) {
        result.lostRecurring.push(`${item.icon} ${item.name} 已到期`);
        continue; // 不保留
      }
    }

    survivingRecurring.push(item);
  }
  state.recurringItems = survivingRecurring;

  // 6. 信用自然衰减
  state.attributes.credit += constantsData.creditDecay;

  // 6.5 健康自然衰减（模拟生活压力、缺乏运动、美国饮食环境等）
  // 基础每月-3，住得越差额外衰减越多（睡大街额外-3，地下室额外-2，独立单间0）
  const healthDecayBase = -3;
  const housingHealthPenalty = housingData ? Math.max(0, Math.floor((130 - housingData.sanMax) * 0.1)) : 3;
  const totalHealthDecay = healthDecayBase - housingHealthPenalty;
  state.attributes.health = clamp(state.attributes.health + totalHealthDecay, 0, 100);
  result.healthChange += totalHealthDecay;

  // 7. 更新SAN上限（基于住房）并恢复SAN值
  if (housingData) {
    state.maxSan = housingData.sanMax;

    // 住房每月恢复SAN（住得越好恢复越多）
    // 睡大街(sanMax=100)恢复4，地下室(110)恢复7，独立单间(130)恢复13
    // 正经公寓(160)恢复21，郊区独栋(200)恢复31，海景豪宅(250)恢复43
    const sanRecovery = Math.floor((housingData.sanMax - 80) * 0.25 + 4);
    const prevSan = state.attributes.san;
    state.attributes.san = clamp(state.attributes.san + sanRecovery, 0, state.maxSan);
    const actualRecovery = state.attributes.san - prevSan;
    if (actualRecovery !== 0) {
      result.sanChange += actualRecovery;
    }
  }

  // 8. 检查斩杀线
  result.killLine = checkKillLines(state);

  return result;
}

// ============ 年份阶段文本 ============
export function getYearPhaseText(month: number): string {
  if (month <= 12) return '第一年：苟活（Survival Mode）';
  if (month <= 24) return '第二年：挣扎（Breaking Ground）';
  if (month <= 36) return '第三年：爬坡（Climbing Up）';
  if (month <= 48) return '第四年：撕开裂缝（Tearing Through）';
  if (month <= 60) return '第五年：站上去（Reaching The Top）';
  return `第${Math.ceil(month / 12)}年：传奇（Legend）`;
}

export function getRoundTitle(round: number): string {
  const titles = constantsData.loopConfig.roundTitles as Record<string, string>;
  return titles[String(round)] || `第${round}月`;
}

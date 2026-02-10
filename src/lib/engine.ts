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
  else if (parsed.stat === 'skills') val = state.education?.skills ?? 0;
  else if (parsed.stat === 'influence') val = state.education?.influence ?? 0;
  else if (parsed.stat === 'educationLevel') val = state.education?.level ?? 0;
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
  if (action.quitWork) {
    const hasWork = state.recurringItems.some(r => r.type === 'work');
    if (!hasWork) reasons.push('你目前没有工作');
  }

  // 检查工作/投资类行为：如果已有同类型持续项目且来源相同，不能重复
  if (action.recurring) {
    const existing = state.recurringItems.find(r => r.sourceActionId === action.id);
    if (existing) reasons.push(`已有[${existing.name}]运行中`);
  }

  // 检查门槛要求（学历、技能、影响力）
  const req = action.requirements;
  if (req) {
    if (req.educationLevel !== undefined && state.education.level < req.educationLevel) {
      const levelNames = ['无', '语言学校', '社区大学', '州立大学', '常春藤'];
      reasons.push(`需要学历≥${levelNames[req.educationLevel] || req.educationLevel}`);
    }
    if (req.skills !== undefined && state.education.skills < req.skills) {
      reasons.push(`需要技能≥${req.skills}（当前${state.education.skills}）`);
    }
    if (req.influence !== undefined && state.education.influence < req.influence) {
      reasons.push(`需要影响力≥${req.influence}（当前${state.education.influence}）`);
    }
    if (req.credit !== undefined && state.attributes.credit < req.credit) {
      reasons.push(`需要信用分≥${req.credit}（当前${state.attributes.credit}）`);
    }
  }

  // 检查教育类行为：不能同时读两个学校
  if (action.category === 'education' && action.recurring) {
    const existingEdu = state.recurringItems.find(r => r.type === 'education');
    if (existingEdu) reasons.push(`已在就读[${existingEdu.name}]，需先退学`);
  }

  // 检查教育类行为：已毕业的学校不能重复报考
  if (action.category === 'education' && action.recurring && state.graduatedSchools?.length) {
    if (state.graduatedSchools.includes(action.recurring)) {
      reasons.push(`已从该校毕业，不能重复报考`);
    }
  }

  // 检查治疗疾病行为：没有疾病时不可用
  if (action.clearDisease) {
    const hasDiseases = state.activeDebuffs.some(d => d.isDisease);
    if (!hasDiseases) {
      reasons.push('你当前没有疾病需要治疗');
    }
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

  // 1. 扣房租（拥有房产则免租）
  const housingData = constantsData.housing[state.housingLevel as keyof typeof constantsData.housing];
  // 检查是否拥有房产：购买过投资公寓/曼哈顿公寓/比弗利别墅
  const ownedPropertyIds = ['LUX20', 'LUX21', 'LUX22'];
  const ownsProperty = ownedPropertyIds.some(id => 
    state.usedOneTimeBehaviors.includes(id) || (state.behaviorUseCount[id] || 0) > 0
  );
  if (housingData) {
    const rent = housingData.cost;
    if (ownsProperty && rent > 0) {
      // 拥有房产，免除房租
      result.rentPaid = 0;
    } else if (state.money >= rent) {
      state.money -= rent;
      result.rentPaid = rent;
      result.moneyChange -= rent;
    } else {
      // 付不起房租，降级为露宿
      state.housingLevel = '1';
      state.housing = { type: '睡大街', rent: 0 };
    }

    // 高级住房每月增加影响力（住得越好社会地位越高）
    // 正经公寓(4)+1, 郊区独栋(5)+3, 海景豪宅(6)+5
    const housingLevel = parseInt(state.housingLevel);
    if (housingLevel >= 4) {
      const influenceGain = housingLevel === 4 ? 1 : housingLevel === 5 ? 3 : 5;
      state.education.influence = Math.min(state.education.influence + influenceGain, 999);
      result.recurringEffects.push(`🏠住房影响力+${influenceGain}`);
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

  // 3. 处理Debuff（包括疾病）
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
    if (effect.sanPerRound) {
      state.attributes.san = clamp(state.attributes.san + effect.sanPerRound, 0, state.maxSan);
      result.sanChange += effect.sanPerRound;
      result.debuffEffects.push(`${debuff.icon} ${debuff.name}: 精神${effect.sanPerRound}`);
    }
    if (effect.creditPerRound) {
      state.attributes.credit += effect.creditPerRound;
      result.debuffEffects.push(`${debuff.icon} ${debuff.name}: 评分${effect.creditPerRound}`);
    }
    // 长期疾病(isChronic)不减duration，永远不会自愈
    if (!debuff.isChronic) {
      debuff.remainingDuration -= 1;
    }
    if (debuff.isChronic || debuff.remainingDuration > 0) {
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

  // 5.5 处理持续性项目（工作/投资/借贷/教育）
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
      // 资金类投资累计盈亏
      if (item.subType === 'fund' && item.accumulatedGain !== undefined) {
        item.accumulatedGain += item.monthlyIncome;
      }
    }

    // 处理固定成本（开店类投资、学费等）
    if (item.monthlyCost > 0) {
      state.money -= item.monthlyCost;
      result.moneyChange -= item.monthlyCost;
      result.recurringExpense += item.monthlyCost;
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

    // 处理影响力变化（慈善/政治类持续项目）
    if (item.monthlyInfluenceChange && item.monthlyInfluenceChange !== 0) {
      state.education.influence = clamp(state.education.influence + item.monthlyInfluenceChange, 0, 100);
    }

    // 生成日志
    const parts: string[] = [];
    if (item.monthlyIncome > 0) parts.push(`+$${item.monthlyIncome}`);
    if (item.monthlyIncome < 0) parts.push(`-$${Math.abs(item.monthlyIncome)}`);
    if (item.monthlyCost > 0) parts.push(`成本-$${item.monthlyCost}`);
    if (item.monthlyHealthCost > 0) parts.push(`❤️-${item.monthlyHealthCost}`);
    if (item.monthlySanCost > 0) parts.push(`🧠-${item.monthlySanCost}`);
    if (item.monthlyInfluenceChange && item.monthlyInfluenceChange > 0) parts.push(`🌟+${item.monthlyInfluenceChange}`);
    result.recurringEffects.push(`${item.icon} ${item.name}: ${parts.join(' ')}`);

    // 处理剩余月数
    if (!item.permanent && item.remainingMonths > 0) {
      item.remainingMonths -= 1;
      if (item.remainingMonths <= 0) {
        // 教育类到期 = 毕业
        if (item.type === 'education' && item.graduateBonus) {
          state.education.level = Math.max(state.education.level, item.graduateBonus.educationLevel);
          state.education.skills = clamp(state.education.skills + item.graduateBonus.skills, 0, 100);
          state.education.influence = clamp(state.education.influence + item.graduateBonus.influence, 0, 100);
          state.education.schoolName = item.name;
          state.education.graduated = true;
          // 记录已毕业的学校（通过sourceActionId反查action的recurring模板ID）
          const sourceAction = getBehaviorById(item.sourceActionId);
          const graduateTemplateId = sourceAction?.recurring;
          if (!state.graduatedSchools) state.graduatedSchools = [];
          if (graduateTemplateId && !state.graduatedSchools.includes(graduateTemplateId)) {
            state.graduatedSchools.push(graduateTemplateId);
          }
          result.lostRecurring.push(`🎓 毕业了！${item.name} —— 学历提升，技能+${item.graduateBonus.skills}，影响力+${item.graduateBonus.influence}`);        } else {
          result.lostRecurring.push(`${item.icon} ${item.name} 已到期`);
        }
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

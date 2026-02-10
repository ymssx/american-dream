// 阶层系统 — 暗黑资本家版
// 不是"社会阶层"，而是"食物链位置"
import type { GameState, ClassLevel } from '@/lib/types';

export interface ClassInfo {
  level: ClassLevel;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
}

export const classDefinitions: ClassInfo[] = [
  {
    level: 0,
    name: '蝼蚁',
    icon: '🐜',
    color: 'text-gray-500',
    bgColor: 'bg-gray-800',
    description: '随时会被踩死的存在。',
  },
  {
    level: 1,
    name: '耗材',
    icon: '⚙️',
    color: 'text-orange-400',
    bgColor: 'bg-orange-900/40',
    description: '有用，但可替换。用完就扔。',
  },
  {
    level: 2,
    name: '食肉者',
    icon: '🐺',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/40',
    description: '开始吃人了。不再是猎物，而是猎手。',
  },
  {
    level: 3,
    name: '收割者',
    icon: '⚔️',
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/40',
    description: '别人的不幸就是你的商机。你已经学会了这个游戏的规则。',
  },
  {
    level: 4,
    name: '食物链之巅',
    icon: '👑',
    color: 'text-amber-400',
    bgColor: 'bg-amber-900/40',
    description: '你就是规则本身。蝼蚁们仰望着你，就像你曾经仰望别人。',
  },
];

/** 根据游戏状态计算当前阶层 */
export function calculateClassLevel(state: GameState): ClassLevel {
  const { money, attributes, education, recurringItems, housingLevel } = state;
  const jobs = recurringItems.filter(r => r.type === 'work');
  const investments = recurringItems.filter(r => r.type === 'invest');
  const totalIncome = jobs.reduce((s, j) => s + j.monthlyIncome, 0);
  const hl = parseInt(housingLevel);

  let score = 0;

  // 资金（0-40分）
  if (money >= 1000000) score += 40;
  else if (money >= 500000) score += 35;
  else if (money >= 100000) score += 28;
  else if (money >= 50000) score += 22;
  else if (money >= 20000) score += 16;
  else if (money >= 5000) score += 10;
  else if (money >= 1000) score += 5;
  else if (money >= 0) score += 2;

  // 收入（0-25分）
  if (totalIncome >= 15000) score += 25;
  else if (totalIncome >= 8000) score += 20;
  else if (totalIncome >= 5000) score += 16;
  else if (totalIncome >= 3000) score += 12;
  else if (totalIncome >= 1500) score += 8;
  else if (totalIncome > 0) score += 4;

  // 住房（0-15分）
  score += Math.min(hl * 2.5, 15);

  // 教育（0-10分）
  if (education.graduated && education.level >= 4) score += 10;
  else if (education.graduated && education.level >= 3) score += 8;
  else if (education.graduated) score += 5;
  else if (education.level >= 1) score += 2;

  // 投资（0-10分）
  score += Math.min(investments.length * 3, 10);

  // 信用
  if (attributes.credit >= 750) score += 3;
  if (attributes.credit < 500) score -= 5;

  // 影响力
  if (education.influence >= 60) score += 3;

  // 阶层判定
  if (score >= 75) return 4;
  if (score >= 50) return 3;
  if (score >= 28) return 2;
  if (score >= 12) return 1;
  return 0;
}

/** 获取阶层信息 */
export function getClassInfo(level: ClassLevel): ClassInfo {
  return classDefinitions[level] || classDefinitions[0];
}

/** 计算净资产 */
export function calculateNetWorth(state: GameState): number {
  let netWorth = state.money;
  for (const item of state.recurringItems) {
    if (item.subType === 'fund' && item.investPrincipal !== undefined && item.accumulatedGain !== undefined) {
      netWorth += item.investPrincipal + item.accumulatedGain;
    }
  }
  return netWorth;
}

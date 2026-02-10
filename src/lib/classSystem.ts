// 阶层系统 — 根据综合条件判定玩家所处的社会阶层
import type { GameState, ClassLevel } from '@/lib/types';

export interface ClassInfo {
  level: ClassLevel;
  name: string;
  icon: string;
  color: string;     // tailwind 文本颜色类
  bgColor: string;   // tailwind 背景颜色类
  description: string;
}

export const classDefinitions: ClassInfo[] = [
  {
    level: 0,
    name: '流浪者',
    icon: '🏚️',
    color: 'text-gray-500',
    bgColor: 'bg-gray-800',
    description: '没有固定住所，食不果腹。社会的最底层。',
  },
  {
    level: 1,
    name: '底层打工人',
    icon: '🔧',
    color: 'text-orange-400',
    bgColor: 'bg-orange-900/40',
    description: '有一份工作，勉强维持生存。但离安全还很远。',
  },
  {
    level: 2,
    name: '中产阶级',
    icon: '🏠',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/40',
    description: '有稳定收入和住所，生活开始正常化。',
  },
  {
    level: 3,
    name: '上流阶层',
    icon: '🥂',
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/40',
    description: '高收入、高学历、有投资。你已经超过了大多数人。',
  },
  {
    level: 4,
    name: '顶层精英',
    icon: '👑',
    color: 'text-amber-400',
    bgColor: 'bg-amber-900/40',
    description: '百万身家，影响力和资源都在顶端。美国梦的终极形态。',
  },
];

/** 根据游戏状态计算当前阶层 */
export function calculateClassLevel(state: GameState): ClassLevel {
  const { money, attributes, education, recurringItems, housingLevel } = state;
  const jobs = recurringItems.filter(r => r.type === 'work');
  const investments = recurringItems.filter(r => r.type === 'invest');
  const totalIncome = jobs.reduce((s, j) => s + j.monthlyIncome, 0);
  const hl = parseInt(housingLevel);

  // 打分系统
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

  // 信用（惩罚/加分）
  if (attributes.credit >= 750) score += 3;
  if (attributes.credit < 500) score -= 5;

  // 影响力加分
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
  // 加上投资估值
  for (const item of state.recurringItems) {
    if (item.subType === 'fund' && item.investPrincipal !== undefined && item.accumulatedGain !== undefined) {
      netWorth += item.investPrincipal + item.accumulatedGain;
    }
  }
  return netWorth;
}

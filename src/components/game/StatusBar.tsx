'use client';

import { useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getRoundTitle, getYearPhaseText } from '@/lib/engine';
import constantsData from '@/data/constants.json';

const EDU_NAMES = ['无学历', '语言学校', '社区大学', '州立大学', '常春藤'];

// ============ 实时点评系统 ============

interface CommentaryInput {
  money: number;
  health: number;
  san: number;
  credit: number;
  luck: number;
  eduLevel: number;
  graduated: boolean;
  skills: number;
  influence: number;
  currentRound: number;
  recurringItems: { type: string; subType?: string; name: string; monthlyIncome: number }[];
  housingLevel: string;
  dietLevel: string;
  activeDebuffs: { id: string; name: string }[];
  monthlyCost: number;
  monthlyNet: number;
}

/** 根据玩家当前状态生成一句实时点评 */
function generateCommentary(input: CommentaryInput): { text: string; tone: 'danger' | 'warn' | 'neutral' | 'good' | 'great' } {
  const { money, health, san, credit, luck, eduLevel, graduated, skills, influence, currentRound, recurringItems, housingLevel, dietLevel, activeDebuffs, monthlyCost, monthlyNet } = input;

  const jobs = recurringItems.filter(r => r.type === 'work');
  const investments = recurringItems.filter(r => r.type === 'invest');
  const loans = recurringItems.filter(r => r.type === 'loan');
  const education = recurringItems.filter(r => r.type === 'education');
  const totalIncome = jobs.reduce((s, j) => s + j.monthlyIncome, 0);

  // ---- 危险状态优先 ----
  if (health <= 10) return { text: '💀 你的身体已经在倒计时了，赶紧找医生。', tone: 'danger' };
  if (san <= 10) return { text: '🌀 你的精神即将崩溃，快去休整。', tone: 'danger' };
  if (health <= 20 && san <= 30) return { text: '⚠️ 身心俱疲，你正在走向终点。', tone: 'danger' };
  if (money < -5000 && credit < 400) return { text: '📉 负债累累信用破产，美国梦碎了一地。', tone: 'danger' };

  // ---- 警告状态 ----
  if (health <= 30) return { text: '🤒 身体亮红灯了，再扛下去就真倒了。', tone: 'warn' };
  if (san <= 30) return { text: '😵‍💫 精神状态堪忧，建议给自己放个假。', tone: 'warn' };
  if (money < 0 && jobs.length === 0) return { text: '💸 没工作还在亏钱，是打算当流浪汉吗？', tone: 'warn' };
  if (money < 0) return { text: '🔻 已经负债了，省点花吧。', tone: 'warn' };
  if (activeDebuffs.length >= 3) return { text: '🌧️ Debuff缠身，运气太差还是作太多了？', tone: 'warn' };
  if (credit < 500) return { text: '💳 信用分太低，银行看你跟看老赖一样。', tone: 'warn' };
  if (monthlyCost > 0 && money < monthlyCost * 2 && jobs.length === 0) return { text: '⏳ 账上的钱撑不过两个月了，找点活干吧。', tone: 'warn' };

  // ---- 正面状态 ----
  if (money >= 100000 && jobs.length > 0 && investments.length > 0) return { text: '🏆 有工作有投资有存款，美国梦初具雏形。', tone: 'great' };
  if (money >= 50000 && eduLevel >= 3 && graduated) return { text: '🎓💰 高学历+有存款，你在美国站稳脚跟了。', tone: 'great' };
  if (investments.length >= 2) return { text: '📊 多线投资，开始有资本家的味道了。', tone: 'good' };
  if (money >= 20000 && jobs.length > 0) return { text: '💪 有工作有存款，日子在慢慢变好。', tone: 'good' };
  if (totalIncome >= 3000) return { text: '💼 月入不菲，中产生活指日可待。', tone: 'good' };
  if (influence >= 50) return { text: '🌟 有一定影响力了，圈子里开始有人认识你。', tone: 'good' };

  // ---- 教育相关 ----
  if (education.length > 0 && !graduated) return { text: '📖 还在读书，前途是光明的——如果能毕业的话。', tone: 'neutral' };
  if (eduLevel >= 3 && graduated) return { text: '🎓 高学历毕业生，现在缺的是一个好机会。', tone: 'neutral' };
  if (eduLevel === 0 && currentRound > 12) return { text: '📋 一年了还没学历，很多门槛过不去的。', tone: 'warn' };

  // ---- 工作相关 ----
  if (jobs.length === 0 && currentRound > 3) return { text: '🚶 还在打零工？找份正经工作吧。', tone: 'warn' };
  if (jobs.length >= 2) return { text: '🏃 同时打几份工，卷王精神可嘉。', tone: 'neutral' };
  if (jobs.length === 1 && totalIncome < 1000) return { text: '💼 有工作了，虽然工资低点，但总比没有强。', tone: 'neutral' };

  // ---- 贷款相关 ----
  if (loans.length >= 2) return { text: '🏦 借了不止一笔，拆东墙补西墙啊。', tone: 'warn' };
  if (loans.length === 1) return { text: '📝 背着贷款讨生活，别忘了还。', tone: 'neutral' };

  // ---- 生活水平 ----
  if (housingLevel === '1') return { text: '🏚️ 连个像样的住处都没有，先解决温饱。', tone: 'warn' };
  if (housingLevel >= '5' && dietLevel >= '4') return { text: '🍾 住豪宅吃大餐，享受生活但别忘了赚钱。', tone: 'neutral' };

  // ---- 运气 ----
  if (luck >= 80) return { text: '🍀 运气爆棚，趁现在去搏一把？', tone: 'good' };
  if (luck <= 15) return { text: '🐦‍⬛ 运气差到离谱，最近别碰高风险操作。', tone: 'warn' };

  // ---- 回合阶段通用 ----
  if (currentRound <= 3) return { text: '🛬 刚到美国，一切从零开始。活下去。', tone: 'neutral' };
  if (currentRound <= 12) return { text: '📅 第一年，苟住就是胜利。', tone: 'neutral' };
  if (currentRound <= 24) return { text: '⛏️ 第二年了，该想想怎么往上爬了。', tone: 'neutral' };
  if (currentRound <= 36) return { text: '🧗 第三年，是时候拉开差距了。', tone: 'neutral' };
  if (currentRound <= 48) return { text: '🔥 第四年，成败在此一举。', tone: 'neutral' };

  return { text: '🇺🇸 在美国，每天都是新的战斗。', tone: 'neutral' };
}

/** 顶部状态栏 */
export function StatusBar() {
  const { state } = useGameStore();
  const { money, attributes, currentRound, housingLevel, dietLevel, maxSan, education, recurringItems, activeDebuffs, activeBuffs } = state;
  const housingData = constantsData.housing[housingLevel as keyof typeof constantsData.housing];
  const dietData = constantsData.diet[dietLevel as keyof typeof constantsData.diet];

  // 计算持续性项目月净收入
  const monthlyNet = recurringItems.reduce((sum, item) => sum + item.monthlyIncome, 0);
  const monthlyCost = (housingData?.cost || 0) + (dietData?.moneyCost || 0);

  // 实时点评
  const commentary = useMemo(() => generateCommentary({
    money,
    health: attributes.health,
    san: attributes.san,
    credit: attributes.credit,
    luck: attributes.luck,
    eduLevel: education.level,
    graduated: education.graduated,
    skills: education.skills,
    influence: education.influence,
    currentRound,
    recurringItems: recurringItems.map(r => ({ type: r.type, subType: r.subType, name: r.name, monthlyIncome: r.monthlyIncome })),
    housingLevel,
    dietLevel,
    activeDebuffs: activeDebuffs.map(d => ({ id: d.id, name: d.name })),
    monthlyCost,
    monthlyNet,
  }), [money, attributes, education, currentRound, recurringItems, housingLevel, dietLevel, activeDebuffs, monthlyCost, monthlyNet]);

  const toneStyles = {
    danger: 'bg-red-950/70 text-red-300 border-red-800/50',
    warn: 'bg-yellow-950/50 text-yellow-300 border-yellow-800/40',
    neutral: 'bg-gray-800/60 text-gray-400 border-gray-700/40',
    good: 'bg-emerald-950/50 text-emerald-300 border-emerald-800/40',
    great: 'bg-amber-950/50 text-amber-300 border-amber-800/40',
  };

  return (
    <div className="bg-gray-900 border-b border-gray-700/50">
      {/* 实时点评 */}
      <div className={`px-3 py-1.5 text-xs border-b ${toneStyles[commentary.tone]} transition-all duration-500`}>
        {commentary.text}
      </div>

      {/* 头部：回合 + 金钱 */}
      <div className="flex justify-between items-center px-3 py-2 border-b border-gray-800/60">
        <div className="flex items-center gap-2">
          <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-md font-mono font-medium">
            第{currentRound}月
          </span>
          <div>
            <span className="text-sm text-white font-bold">{getRoundTitle(currentRound)}</span>
            <span className="text-[11px] text-gray-500 ml-1.5">{getYearPhaseText(currentRound)}</span>
          </div>
        </div>
        <div className="text-right">
          <div className={`font-mono font-bold text-lg leading-tight ${money >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${money.toLocaleString()}
          </div>
          <div className="text-[10px] text-gray-600 leading-tight">
            月支出 ${monthlyCost.toLocaleString()}
            {monthlyNet !== 0 && (
              <span className={monthlyNet > 0 ? 'text-green-600' : 'text-red-600'}>
                {' '}· 持续 {monthlyNet > 0 ? '+' : ''}{monthlyNet.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 四维属性 - 文字标签 */}
      <div className="px-3 py-1.5 flex flex-wrap gap-x-3 gap-y-1 border-b border-gray-800/40">
        <StatText icon="❤️" label="生命" value={attributes.health} max={100} danger={attributes.health <= 20} color="text-red-400" />
        <StatText icon="🧠" label="精神" value={attributes.san} max={maxSan} danger={attributes.san <= 30} color="text-purple-400" />
        <StatText icon="💳" label="信用" value={attributes.credit} max={850} danger={attributes.credit < 500} color="text-blue-400" />
        <StatText icon="🍀" label="运气" value={attributes.luck} max={100} color="text-emerald-400" />
      </div>

      {/* 身份 + 生活水平 - 一行展示所有标签 */}
      <div className="px-3 pb-2 flex flex-wrap gap-1.5">
        <Tag
          color={education.level >= 3 ? 'indigo' : education.level >= 1 ? 'gray' : 'dim'}
          text={`🎓 ${education.level > 0 ? (education.schoolName || EDU_NAMES[education.level]) : EDU_NAMES[0]}${education.level > 0 && !education.graduated ? ' (在读)' : ''}`}
        />
        {education.skills > 0 && <Tag color="yellow" text={`⚡ ${education.skills}`} />}
        {education.influence > 0 && <Tag color="pink" text={`🌟 ${education.influence}`} />}
        <Tag color="slate" text={`🏠 ${housingData?.name || '流浪'}`} />
        <Tag color="slate" text={`🍜 ${dietData?.name || '省吃俭用'}`} />
      </div>

      {/* Buff / Debuff */}
      {(activeDebuffs.length > 0 || activeBuffs.length > 0) && (
        <div className="flex gap-1.5 px-3 pb-2 flex-wrap">
          {activeDebuffs.map(d => (
            <span key={d.id} className="bg-red-950/60 text-red-400 px-2 py-0.5 rounded text-[10px] border border-red-800/40 animate-pulse">
              {d.icon} {d.name} ({d.remainingDuration}月)
            </span>
          ))}
          {activeBuffs.map(b => (
            <span key={b.id} className="bg-green-950/60 text-green-400 px-2 py-0.5 rounded text-[10px] border border-green-800/40">
              {b.icon} {b.name} ({b.remainingDuration}月)
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** 标签颜色预设 */
function Tag({ color, text }: { color: string; text: string }) {
  const styles: Record<string, string> = {
    indigo: 'bg-indigo-900/40 text-indigo-300 border-indigo-700/50',
    yellow: 'bg-yellow-900/30 text-yellow-400 border-yellow-800/40',
    pink: 'bg-pink-900/30 text-pink-400 border-pink-800/40',
    gray: 'bg-gray-800 text-gray-400 border-gray-700',
    dim: 'bg-gray-800/50 text-gray-600 border-gray-800',
    slate: 'bg-gray-800/70 text-gray-400 border-gray-700/60',
  };
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded border ${styles[color] || styles.gray}`}>
      {text}
    </span>
  );
}

/** 文字版属性显示 */
function StatText({ icon, label, value, max, color, danger }: {
  icon: string;
  label: string;
  value: number;
  max: number;
  color: string;
  danger?: boolean;
}) {
  return (
    <span className={`text-[11px] ${danger ? 'animate-pulse' : ''}`}>
      <span className="text-gray-500">{icon}{label}</span>{' '}
      <span className={`font-mono font-bold ${danger ? 'text-red-400' : color}`}>
        {value}{max > 100 ? `/${max}` : ''}
      </span>
    </span>
  );
}

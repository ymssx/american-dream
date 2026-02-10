'use client';

import { useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getRoundTitle, getYearPhaseText } from '@/lib/engine';
import { getClassInfo } from '@/lib/classSystem';
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

/** 根据玩家当前状态生成一句实时点评 — 暗黑资本家视角 */
function generateCommentary(input: CommentaryInput): { text: string; tone: 'danger' | 'warn' | 'neutral' | 'good' | 'great' } {
  const { money, health, san, credit, luck, eduLevel, graduated, skills, influence, currentRound, recurringItems, housingLevel, dietLevel, activeDebuffs, monthlyCost, monthlyNet } = input;

  const jobs = recurringItems.filter(r => r.type === 'work');
  const investments = recurringItems.filter(r => r.type === 'invest');
  const loans = recurringItems.filter(r => r.type === 'loan');
  const education = recurringItems.filter(r => r.type === 'education');
  const totalIncome = jobs.reduce((s, j) => s + j.monthlyIncome, 0);

  // ---- 危险状态 ----
  if (health <= 10) return { text: '💀 快死了。在这里死掉只会变成一则没人关注的新闻。', tone: 'danger' };
  if (san <= 10) return { text: '🌀 精神快崩了。疯了的人连被剥削的价值都没有。', tone: 'danger' };
  if (health <= 20 && san <= 30) return { text: '⚠️ 身心俱废。你正在从食物链上滑落。', tone: 'danger' };
  if (money < -5000 && credit < 400) return { text: '📉 你现在和街上的流浪汉唯一的区别是：你还没睡在纸箱里。', tone: 'danger' };

  // ---- 警告 ----
  if (health <= 30) return { text: '🤒 身体在报警。在这个国家倒下就再也站不起来了。', tone: 'warn' };
  if (san <= 30) return { text: '😵‍💫 精神状态堪忧。别成为下一个从天桥上跳下去的人。', tone: 'warn' };
  if (money < 0 && jobs.length === 0) return { text: '💸 负债+无业。蛇头已经在找你了。', tone: 'warn' };
  if (money < 0) return { text: '🔻 负债了。在底层，欠钱的人比死人还不如。', tone: 'warn' };
  if (activeDebuffs.length >= 3) return { text: '🌧️ 浑身都是伤。弱者才会这样——赶紧变强。', tone: 'warn' };
  if (monthlyCost > 0 && money < monthlyCost * 2 && jobs.length === 0) return { text: '⏳ 再不搞钱就要成为下一条世界新闻了。', tone: 'warn' };

  // ---- 暗黑正面 ----
  if (money >= 500000 && investments.length > 0) return { text: '👑 食物链顶端。蝼蚁们看不到你了——但你能看到他们每一个。', tone: 'great' };
  if (money >= 100000 && jobs.length > 0 && investments.length > 0) return { text: '🦈 有工作有投资有存款。你不再是猎物了——你是猎手。', tone: 'great' };
  if (money >= 50000 && eduLevel >= 3 && graduated) return { text: '🎓💰 高学历高资产。下面的人还在为$500互相撕咬。', tone: 'great' };
  if (investments.length >= 2) return { text: '🐙 多线投资，触手伸向各处。钱在你睡觉的时候也在工作。', tone: 'good' };
  if (money >= 20000 && jobs.length > 0) return { text: '🐺 有钱有工作。你已经从羊变成了狼。', tone: 'good' };
  if (totalIncome >= 3000) return { text: '💼 月入不菲。而那些工资被拖欠的人还在排队讨薪。', tone: 'good' };
  if (influence >= 50) return { text: '🕸️ 人脉网络成型了。在这里，认识谁比你是谁更重要。', tone: 'good' };

  // ---- 中性 ----
  if (education.length > 0 && !graduated) return { text: '📖 在读书。知识是爬出底层的梯子——前提是你不被拖下去。', tone: 'neutral' };
  if (jobs.length === 0 && currentRound > 3) return { text: '🚶 还没找到正式工作？底层淘汰赛不等人的。', tone: 'warn' };
  if (housingLevel === '1') return { text: '🏚️ 连个住处都没有。在这里，无家可归只是死亡的前奏。', tone: 'warn' };
  if (housingLevel >= '5' && dietLevel >= '4') return { text: '🍾 住豪宅吃好的。窗外有人在垃圾桶翻食物——但那不关你的事。', tone: 'neutral' };
  if (luck >= 80) return { text: '🍀 运气不错。但在这里，好运只是延迟了坏运的到来。', tone: 'good' };
  if (luck <= 15) return { text: '🐦‍⬛ 运气差到离谱。小心——下一个"消失"的可能就是你。', tone: 'warn' };

  // ---- 回合通用 ----
  if (currentRound <= 3) return { text: '🛬 刚到美国。这里遍地黄金——也遍地白骨。', tone: 'neutral' };
  if (currentRound <= 12) return { text: '📅 第一年。活着本身就是一种特权。', tone: 'neutral' };
  if (currentRound <= 24) return { text: '⛏️ 第二年。你已经比很多人活得久了——他们去哪了？别问。', tone: 'neutral' };
  if (currentRound <= 36) return { text: '🧗 第三年。食物链的位置已经定型了——你在哪一层？', tone: 'neutral' };
  if (currentRound <= 48) return { text: '🔥 第四年。终局将至。你是站在顶端俯瞰，还是倒在路边被遗忘？', tone: 'neutral' };

  return { text: '🇺🇸 美国梦的真相：有人做梦，有人不醒。', tone: 'neutral' };
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
    danger: 'bg-red-950/80 text-red-400 border-red-800/60',
    warn: 'bg-red-950/40 text-red-300/80 border-red-900/40',
    neutral: 'bg-gray-950/80 text-gray-500 border-gray-800/40',
    good: 'bg-red-950/30 text-amber-400/80 border-amber-900/30',
    great: 'bg-red-950/40 text-amber-300 border-amber-800/40',
  };

  return (
    <div className="bg-black border-b border-red-900/30">
      {/* 实时点评 */}
      <div className={`px-3 py-1.5 text-xs border-b ${toneStyles[commentary.tone]} transition-all duration-500`}>
        {commentary.text}
      </div>

      {/* 头部：回合 + 金钱 */}
      <div className="flex justify-between items-center px-3 py-2 border-b border-red-900/20">
        <div className="flex items-center gap-2">
          <span className="text-xs bg-red-950/60 text-red-400 px-2 py-0.5 rounded-md font-mono font-medium border border-red-900/30">
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
      <div className="px-3 py-1.5 flex flex-wrap gap-x-3 gap-y-1 border-b border-red-900/20">
        <StatText icon="❤️" label="生命" value={attributes.health} max={100} danger={attributes.health <= 20} color="text-red-400" />
        <StatText icon="🧠" label="精神" value={attributes.san} max={maxSan} danger={attributes.san <= 30} color="text-purple-400" />
        <StatText icon="💳" label="信用" value={attributes.credit} max={850} danger={attributes.credit < 500} color="text-blue-400" />
        <StatText icon="🍀" label="运气" value={attributes.luck} max={100} color="text-emerald-400" />
      </div>

      {/* 身份 + 生活水平 + 阶层 - 一行展示所有标签 */}
      <div className="px-3 pb-2 flex flex-wrap gap-1.5">
        {/* 阶层标签 */}
        {(() => {
          const ci = getClassInfo(state.classLevel);
          return (
            <Tag
              color={state.classLevel >= 3 ? 'amber' : state.classLevel >= 2 ? 'blue' : state.classLevel >= 1 ? 'orange' : 'dim'}
              text={`${ci.icon} ${ci.name}`}
            />
          );
        })()}
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
          <span key={d.id} className="bg-red-950/70 text-red-400 px-2 py-0.5 rounded text-[10px] border border-red-800/50 animate-pulse">
              {d.icon} {d.name} ({d.remainingDuration}月)
            </span>
          ))}
          {activeBuffs.map(b => (
          <span key={b.id} className="bg-green-950/40 text-green-500/80 px-2 py-0.5 rounded text-[10px] border border-green-900/40">
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
    indigo: 'bg-indigo-950/40 text-indigo-300/80 border-indigo-800/40',
    yellow: 'bg-amber-950/30 text-amber-400/80 border-amber-800/40',
    pink: 'bg-red-950/30 text-pink-400/80 border-pink-900/40',
    gray: 'bg-gray-900 text-gray-500 border-gray-800',
    dim: 'bg-gray-900/50 text-gray-600 border-gray-800/50',
    slate: 'bg-gray-900/70 text-gray-500 border-gray-800/60',
    amber: 'bg-red-950/40 text-amber-300 border-amber-800/40',
    blue: 'bg-red-950/30 text-blue-300/80 border-blue-900/40',
    orange: 'bg-red-950/30 text-orange-400/80 border-orange-900/40',
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

'use client';

import { useGameStore } from '@/store/gameStore';
import { getRoundTitle, getYearPhaseText } from '@/lib/engine';
import constantsData from '@/data/constants.json';

const EDU_NAMES = ['无学历', '语言学校', '社区大学', '州立大学', '常春藤'];

/** 顶部状态栏 */
export function StatusBar() {
  const { state } = useGameStore();
  const { money, attributes, currentRound, housingLevel, dietLevel, maxSan, education, recurringItems, activeDebuffs, activeBuffs } = state;
  const housingData = constantsData.housing[housingLevel as keyof typeof constantsData.housing];
  const dietData = constantsData.diet[dietLevel as keyof typeof constantsData.diet];

  // 计算持续性项目月净收入
  const monthlyNet = recurringItems.reduce((sum, item) => sum + item.monthlyIncome, 0);
  const monthlyCost = (housingData?.cost || 0) + (dietData?.moneyCost || 0);

  return (
    <div className="bg-gray-900 border-b border-gray-700/50">
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

      {/* 四维属性 - 逐行排列 */}
      <div className="px-3 py-2 space-y-1.5">
        <StatBar icon="❤️" label="生命" value={attributes.health} max={100} color="bg-red-500" danger={attributes.health <= 20} />
        <StatBar icon="🧠" label="精神" value={attributes.san} max={maxSan} color="bg-purple-500" danger={attributes.san <= 30} />
        <StatBar icon="💳" label="信用" value={attributes.credit} max={850} color="bg-blue-500" danger={attributes.credit < 500} />
        <StatBar icon="🍀" label="运气" value={attributes.luck} max={100} color="bg-emerald-500" />
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

/** 迷你属性条 - 改为单行横向布局 */
function StatBar({ icon, label, value, max, color, danger }: {
  icon: string;
  label: string;
  value: number;
  max: number;
  color: string;
  danger?: boolean;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={`flex items-center gap-2 ${danger ? 'animate-pulse' : ''}`}>
      <span className="text-[11px] text-gray-500 w-12 shrink-0">{icon} {label}</span>
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-[11px] font-mono font-bold w-10 text-right shrink-0 ${danger ? 'text-red-400' : 'text-gray-300'}`}>
        {value}{max > 100 ? `/${max}` : ''}
      </span>
    </div>
  );
}

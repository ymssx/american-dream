'use client';

import { useGameStore } from '@/store/gameStore';
import { getRoundTitle, getYearPhaseText } from '@/lib/engine';
import constantsData from '@/data/constants.json';

/** 顶部状态栏 */
export function StatusBar() {
  const { state } = useGameStore();
  const { money, attributes, currentRound, housingLevel, dietLevel, maxSan } = state;
  const housingData = constantsData.housing[housingLevel as keyof typeof constantsData.housing];
  const dietData = constantsData.diet[dietLevel as keyof typeof constantsData.diet];

  return (
    <div className="bg-gray-900 border-b border-gray-800 px-4 py-3">
      {/* 回合信息 */}
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm text-gray-400">
          第 <span className="text-white font-bold">{currentRound}</span> 月 · {getRoundTitle(currentRound)}
        </div>
        <div className="text-xs text-gray-500">{getYearPhaseText(currentRound)}</div>
      </div>

      {/* 核心属性条 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatItem label="金钱" value={`$${money.toLocaleString()}`} icon="💰" color="green" />
        <StatItem label="健康" value={attributes.health} max={100} icon="❤️" color="red" showBar />
        <StatItem
          label="SAN"
          value={attributes.san}
          max={maxSan}
          icon="🧠"
          color="purple"
          showBar
          danger={attributes.san <= 30}
        />
        <StatItem label="信用" value={attributes.credit} icon="💳" color="blue" />
      </div>

      {/* 住房和饮食 */}
      <div className="flex gap-4 mt-2 text-xs text-gray-500">
        <span>🏠 {housingData?.name || '流浪'} (${housingData?.cost || 0}/月)</span>
        <span>🍜 {dietData?.name || '省吃俭用'} (${dietData?.moneyCost || 0}/月)</span>
      </div>

      {/* Debuffs & Buffs */}
      {(state.activeDebuffs.length > 0 || state.activeBuffs.length > 0) && (
        <div className="flex gap-2 mt-2 flex-wrap">
          {state.activeDebuffs.map(d => (
            <span key={d.id} className="bg-red-900/30 text-red-400 px-2 py-0.5 rounded text-xs">
              {d.icon} {d.name} ({d.remainingDuration}回合)
            </span>
          ))}
          {state.activeBuffs.map(b => (
            <span key={b.id} className="bg-green-900/30 text-green-400 px-2 py-0.5 rounded text-xs">
              {b.icon} {b.name} ({b.remainingDuration}回合)
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function StatItem({ label, value, max, icon, color, showBar, danger }: {
  label: string; value: number | string; max?: number; icon: string; color: string; showBar?: boolean; danger?: boolean;
}) {
  const colorMap: Record<string, string> = {
    green: 'bg-green-500', red: 'bg-red-500', purple: 'bg-purple-500', blue: 'bg-blue-500',
  };
  const pct = max ? (Number(value) / max) * 100 : 0;

  return (
    <div className={`${danger ? 'animate-pulse' : ''}`}>
      <div className="flex justify-between items-center text-xs">
        <span className="text-gray-400">{icon} {label}</span>
        <span className={`font-mono font-bold ${danger ? 'text-red-400' : 'text-white'}`}>
          {typeof value === 'number' ? value : value}
          {max ? `/${max}` : ''}
        </span>
      </div>
      {showBar && max && (
        <div className="w-full h-1.5 bg-gray-800 rounded-full mt-1 overflow-hidden">
          <div
            className={`h-full ${colorMap[color]} rounded-full transition-all duration-500`}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
      )}
    </div>
  );
}

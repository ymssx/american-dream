'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import constantsData from '@/data/constants.json';

/** 住房和饮食设置面板 */
export function SettingsPanel() {
  const { state, switchHousing, switchDiet } = useGameStore();
  const [tab, setTab] = useState<'housing' | 'diet'>('housing');

  return (
    <div className="h-full overflow-y-auto px-4 py-3">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('housing')}
          className={`px-3 py-1.5 rounded text-xs ${tab === 'housing' ? 'bg-gray-700 text-white' : 'text-gray-500'}`}
        >
          🏠 住房
        </button>
        <button
          onClick={() => setTab('diet')}
          className={`px-3 py-1.5 rounded text-xs ${tab === 'diet' ? 'bg-gray-700 text-white' : 'text-gray-500'}`}
        >
          🍜 饮食
        </button>
      </div>

      {tab === 'housing' && (
        <div className="space-y-3">
          {Object.entries(constantsData.housing).map(([level, data]) => {
            const isCurrent = state.housingLevel === level;
            const canAfford = state.money >= data.cost;
            return (
              <div
                key={level}
                className={`p-4 rounded-xl border transition-all ${
                  isCurrent
                    ? 'border-green-600 bg-green-900/10'
                    : canAfford
                      ? 'border-gray-700 bg-gray-900 hover:border-gray-600 cursor-pointer'
                      : 'border-gray-800 bg-gray-950 opacity-50'
                }`}
                onClick={() => !isCurrent && canAfford && switchHousing(level)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-white text-sm font-bold">
                      {isCurrent && '✅ '}{data.name}
                    </h4>
                    <p className="text-gray-500 text-xs mt-1">{data.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-white text-sm font-mono">${data.cost.toLocaleString()}/月</div>
                    <div className="text-purple-400 text-xs">SAN上限 {data.sanMax}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'diet' && (
        <div className="space-y-3">
          {Object.entries(constantsData.diet).map(([level, data]) => {
            const isCurrent = state.dietLevel === level;
            const canAfford = state.money >= data.moneyCost;
            return (
              <div
                key={level}
                className={`p-4 rounded-xl border transition-all ${
                  isCurrent
                    ? 'border-green-600 bg-green-900/10'
                    : canAfford
                      ? 'border-gray-700 bg-gray-900 hover:border-gray-600 cursor-pointer'
                      : 'border-gray-800 bg-gray-950 opacity-50'
                }`}
                onClick={() => !isCurrent && canAfford && switchDiet(level)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-white text-sm font-bold">
                      {isCurrent && '✅ '}{data.name}
                    </h4>
                    <p className="text-gray-500 text-xs mt-1">{data.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-white text-sm font-mono">${data.moneyCost}/月</div>
                    <div className={`text-xs ${data.healthChange > 0 ? 'text-green-400' : data.healthChange < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                      健康 {data.healthChange > 0 ? '+' : ''}{data.healthChange}/月
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

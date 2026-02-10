'use client';

import { useGameStore } from '@/store/gameStore';

/** 游戏日志面板 */
export function FeedPanel() {
  const { state } = useGameStore();
  const feed = [...state.feed].reverse();

  return (
    <div className="h-full overflow-y-auto px-4 py-3 space-y-2">
      <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">📜 事件记录</h3>
      {feed.length === 0 ? (
        <p className="text-gray-600 text-sm">暂无事件记录...</p>
      ) : (
        feed.map((entry) => {
          const kindStyles: Record<string, string> = {
            system: 'text-yellow-500 bg-yellow-900/10 border-yellow-800/30',
            scene: 'text-white bg-gray-800/50 border-gray-700/50',
            log: 'text-gray-400 bg-transparent border-transparent',
            effect: 'text-cyan-400 bg-cyan-900/10 border-cyan-800/30',
            danger: 'text-red-400 bg-red-900/10 border-red-800/30',
            warning: 'text-orange-400 bg-orange-900/10 border-orange-800/30',
          };
          const style = kindStyles[entry.kind] || kindStyles.log;

          return (
            <div key={entry.id} className={`text-xs px-3 py-2 rounded border ${style}`}>
              {entry.text}
            </div>
          );
        })
      )}
    </div>
  );
}

'use client';

import { useGameStore } from '@/store/gameStore';

/** 游戏日志面板 */
export function FeedPanel() {
  const { state } = useGameStore();
  const feed = [...state.feed].reverse();

  return (
    <div className="h-full overflow-y-auto px-4 py-3 space-y-2">
      <h3 className="text-xs text-red-700 uppercase tracking-wider mb-2">☠️ 事件记录</h3>
      {feed.length === 0 ? (
        <p className="text-gray-600 text-sm">暂无事件记录...</p>
      ) : (
        feed.map((entry) => {
          const kindStyles: Record<string, string> = {
            system: 'text-red-400 bg-red-950/20 border-red-900/30',
            scene: 'text-gray-300 bg-gray-950/50 border-gray-800/50',
            log: 'text-gray-500 bg-transparent border-transparent',
            effect: 'text-red-300 bg-red-950/10 border-red-900/20',
            danger: 'text-red-500 bg-red-950/30 border-red-800/40',
            warning: 'text-red-400/80 bg-red-950/15 border-red-900/25',
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

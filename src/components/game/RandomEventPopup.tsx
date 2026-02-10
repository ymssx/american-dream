'use client';

import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';

const toneBg: Record<string, string> = {
  positive: 'from-emerald-950/95 to-green-950/95 border-emerald-700',
  negative: 'from-red-950/95 to-orange-950/95 border-red-700',
  extreme: 'from-purple-950/95 to-red-950/95 border-purple-700',
  neutral: 'from-gray-900/95 to-gray-950/95 border-gray-700',
};

const toneLabel: Record<string, { text: string; color: string }> = {
  positive: { text: '💰 别人的不幸，你的机会', color: 'text-emerald-400' },
  negative: { text: '⚡ 这次是你', color: 'text-red-400' },
  extreme: { text: '💥 命运的轮盘', color: 'text-purple-400' },
  neutral: { text: '📌 世界新闻', color: 'text-gray-400' },
};

function formatEffects(effects: Record<string, number>): string[] {
  const labels: Record<string, string> = {
    money: '💰 资金', health: '❤️ 生命', san: '🧠 精神',
    credit: '💳 信用', luck: '🍀 运气', skills: '⚡ 技能', influence: '🌟 影响力',
  };
  return Object.entries(effects)
    .filter(([, v]) => v !== 0)
    .map(([k, v]) => `${labels[k] || k} ${v > 0 ? '+' : ''}${k === 'money' ? `$${v}` : v}`);
}

/** 随机事件弹窗 */
export function RandomEventPopup() {
  const { state, dismissRandomEvent } = useGameStore();
  const event = state.pendingRandomEvent;

  if (!event) return null;

  const bg = toneBg[event.tone] || toneBg.neutral;
  const label = toneLabel[event.tone] || toneLabel.neutral;
  const effectLines = formatEffects(event.effects);

  return (
    <AnimatePresence>
      <motion.div
        key={event.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[55] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
        onClick={dismissRandomEvent}
      >
        <motion.div
          initial={{ scale: 0.7, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 280 }}
          className={`w-full max-w-sm rounded-2xl p-5 border bg-gradient-to-b ${bg} shadow-2xl`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 标签 */}
          <p className={`text-xs text-center mb-3 font-bold tracking-wider ${label.color}`}>
            {label.text}
          </p>

          {/* 图标 */}
          <div className="text-center mb-3">
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
              className="text-5xl inline-block"
            >
              {event.icon}
            </motion.span>
          </div>

          {/* 文案 */}
          <p className="text-gray-200 text-sm text-center leading-relaxed mb-4">
            {event.text.replace(/^[^\s]+\s/, '')}
          </p>

          {/* 效果列表 */}
          {effectLines.length > 0 && (
            <div className="bg-black/30 rounded-lg p-3 mb-4 space-y-1">
              {effectLines.map((line, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className={`text-sm font-mono text-center ${
                    line.includes('+') ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {line}
                </motion.p>
              ))}
            </div>
          )}

          <button
            onClick={dismissRandomEvent}
            className="w-full py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-bold transition-colors"
          >
            知道了
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

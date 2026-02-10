'use client';

import { useState, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';

function formatEffects(effects: Record<string, number>): string[] {
  const labels: Record<string, string> = {
    money: '💰', health: '❤️', san: '🧠',
    credit: '💳', luck: '🍀', skills: '⚡', influence: '🌟',
  };
  return Object.entries(effects)
    .filter(([, v]) => v !== 0)
    .map(([k, v]) => `${labels[k] || k}${v > 0 ? '+' : ''}${k === 'money' ? `$${v}` : v}`);
}

/** 抉择事件弹窗 */
export function DilemmaPopup() {
  const { state, resolveDilemma } = useGameStore();
  const [result, setResult] = useState<{ text: string; effects: Record<string, number> } | null>(null);
  const dilemma = state.pendingDilemma;

  const handleChoice = useCallback((choice: 'A' | 'B') => {
    const res = resolveDilemma(choice);
    setResult(res);
  }, [resolveDilemma]);

  const handleDismiss = useCallback(() => {
    setResult(null);
  }, []);

  if (!dilemma && !result) return null;

  // 展示结果
  if (result) {
    const effectLines = formatEffects(result.effects);
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[55] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 18 }}
            className="w-full max-w-sm rounded-2xl p-5 border border-gray-600 bg-gray-900/95 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-3">
              <span className="text-4xl">📜</span>
            </div>
            <p className="text-xs text-gray-500 text-center mb-2">结果</p>
            <p className="text-gray-200 text-sm text-center leading-relaxed mb-4">
              {result.text}
            </p>
            {effectLines.length > 0 && (
              <div className="bg-black/30 rounded-lg p-3 mb-4 flex flex-wrap justify-center gap-2">
                {effectLines.map((line, i) => (
                  <span
                    key={i}
                    className={`text-xs font-mono px-2 py-1 rounded ${
                      line.includes('+') ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'
                    }`}
                  >
                    {line}
                  </span>
                ))}
              </div>
            )}
            <button
              onClick={handleDismiss}
              className="w-full py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-bold transition-colors"
            >
              继续
            </button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (!dilemma) return null;

  // 展示抉择
  return (
    <AnimatePresence>
      <motion.div
        key={dilemma.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[55] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 16, stiffness: 250 }}
          className="w-full max-w-sm rounded-2xl p-5 border border-yellow-700/60 bg-gradient-to-b from-gray-900/95 to-yellow-950/30 shadow-2xl"
        >
          {/* 标题 */}
          <div className="text-center mb-3">
            <span className="text-4xl">{dilemma.icon}</span>
          </div>
          <p className="text-xs text-yellow-500/80 text-center mb-1 tracking-widest">⚖️ 抉择时刻</p>
          <h3 className="text-xl font-black text-center text-white mb-2">{dilemma.title}</h3>
          <p className="text-gray-400 text-sm text-center leading-relaxed mb-5">{dilemma.description}</p>

          {/* 选项A */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => handleChoice('A')}
            className="w-full mb-3 p-4 rounded-xl border border-blue-700/50 bg-blue-950/30 hover:bg-blue-900/40 transition-all text-left"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-blue-400 font-bold text-sm">A. {dilemma.optionA.text}</span>
              {dilemma.optionA.successChance && dilemma.optionA.successChance < 1 && (
                <span className="text-[10px] text-blue-500">
                  成功率 {Math.round(dilemma.optionA.successChance * 100)}%
                </span>
              )}
            </div>
            <p className="text-gray-500 text-xs">{dilemma.optionA.description}</p>
            <div className="flex gap-1 mt-2 flex-wrap">
              {formatEffects(dilemma.optionA.effects).map((e, i) => (
                <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded ${
                  e.includes('+') ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'
                }`}>{e}</span>
              ))}
            </div>
          </motion.button>

          {/* 选项B */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => handleChoice('B')}
            className="w-full p-4 rounded-xl border border-orange-700/50 bg-orange-950/30 hover:bg-orange-900/40 transition-all text-left"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-orange-400 font-bold text-sm">B. {dilemma.optionB.text}</span>
            </div>
            <p className="text-gray-500 text-xs">{dilemma.optionB.description}</p>
            <div className="flex gap-1 mt-2 flex-wrap">
              {formatEffects(dilemma.optionB.effects).map((e, i) => (
                <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded ${
                  e.includes('+') ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'
                }`}>{e}</span>
              ))}
            </div>
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

'use client';

import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';

/** 疾病事件弹窗 */
export function DiseasePopup() {
  const { state, dismissDiseaseEvent } = useGameStore();
  const disease = state.pendingDiseaseEvent;

  if (!disease) return null;

  // 格式化每月效果
  const effectLines: string[] = [];
  if (disease.effects.healthPerRound) {
    effectLines.push(`❤️ 体力 ${disease.effects.healthPerRound}/月`);
  }
  if (disease.effects.sanPerRound) {
    effectLines.push(`🧠 精神 ${disease.effects.sanPerRound}/月`);
  }
  if (disease.effects.moneyPerRound) {
    effectLines.push(`💰 资金 $${disease.effects.moneyPerRound}/月`);
  }

  return (
    <AnimatePresence>
      <motion.div
        key={disease.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[56] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={dismissDiseaseEvent}
      >
        <motion.div
          initial={{ scale: 0.6, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 16, stiffness: 260 }}
          className={`w-full max-w-sm rounded-2xl p-5 border shadow-2xl ${
            disease.isChronic
              ? 'bg-gradient-to-b from-red-950 to-purple-950/90 border-red-600'
              : 'bg-gradient-to-b from-red-950/95 to-orange-950/80 border-orange-700'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 标签 */}
          <p className={`text-xs text-center mb-2 font-bold tracking-wider ${
            disease.isChronic ? 'text-red-400' : 'text-orange-400'
          }`}>
            {disease.isChronic ? '🏥 ⚠️ 长期疾病' : '🏥 你生病了'}
          </p>

          {/* 图标 */}
          <div className="text-center mb-3">
            <motion.span
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', delay: 0.1 }}
              className="text-5xl inline-block"
            >
              {disease.icon}
            </motion.span>
          </div>

          {/* 疾病名称 */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className={`text-center text-lg font-bold mb-2 ${
              disease.isChronic ? 'text-red-300' : 'text-orange-300'
            }`}
          >
            {disease.name}
          </motion.p>

          {/* 文案 */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-300 text-sm text-center leading-relaxed mb-4"
          >
            {disease.text.replace(/^[^\s]+\s/, '')}
          </motion.p>

          {/* 每月效果 */}
          {effectLines.length > 0 && (
            <div className={`rounded-lg p-3 mb-3 space-y-1 ${
              disease.isChronic ? 'bg-red-950/60 border border-red-800/40' : 'bg-orange-950/40 border border-orange-800/30'
            }`}>
              <p className="text-[10px] text-gray-500 text-center mb-1">每月持续扣除</p>
              {effectLines.map((line, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="text-sm font-mono text-center text-red-400"
                >
                  {line}
                </motion.p>
              ))}
            </div>
          )}

          {/* 长期疾病警告 */}
          {disease.isChronic && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-red-900/30 border border-red-700/50 rounded-lg p-2.5 mb-4"
            >
              <p className="text-red-400 text-xs text-center font-bold animate-pulse">
                ⚠️ 这是长期疾病，不会自愈！
              </p>
              <p className="text-red-500/70 text-[10px] text-center mt-1">
                必须去专科门诊治疗，否则每月持续扣血
              </p>
            </motion.div>
          )}

          {!disease.isChronic && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-orange-950/30 border border-orange-800/30 rounded-lg p-2 mb-4"
            >
              <p className="text-orange-400/80 text-[10px] text-center">
                💡 可以硬扛等自愈，或去专科门诊花钱治疗
              </p>
            </motion.div>
          )}

          <button
            onClick={dismissDiseaseEvent}
            className={`w-full py-2.5 rounded-lg text-sm font-bold transition-colors border ${
              disease.isChronic
                ? 'bg-red-950/60 hover:bg-red-900/80 text-red-200 border-red-800/40'
                : 'bg-orange-950/60 hover:bg-orange-900/80 text-orange-200 border-orange-800/40'
            }`}
          >
            {disease.isChronic ? '该死…' : '知道了'}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

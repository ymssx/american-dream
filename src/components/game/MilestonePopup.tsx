'use client';

import { useGameStore } from '@/store/gameStore';
import { getMilestoneById } from '@/data/milestones';
import { motion, AnimatePresence } from 'framer-motion';

const toneColors = {
  great: {
    bg: 'from-amber-950/95 to-yellow-950/95',
    border: 'border-amber-600',
    text: 'text-amber-300',
    glow: 'shadow-amber-500/30',
    btn: 'bg-amber-700 hover:bg-amber-600',
  },
  good: {
    bg: 'from-emerald-950/95 to-green-950/95',
    border: 'border-emerald-600',
    text: 'text-emerald-300',
    glow: 'shadow-emerald-500/30',
    btn: 'bg-emerald-700 hover:bg-emerald-600',
  },
  neutral: {
    bg: 'from-gray-900/95 to-gray-950/95',
    border: 'border-gray-600',
    text: 'text-gray-300',
    glow: 'shadow-gray-500/20',
    btn: 'bg-gray-700 hover:bg-gray-600',
  },
  warn: {
    bg: 'from-red-950/95 to-orange-950/95',
    border: 'border-red-600',
    text: 'text-red-300',
    glow: 'shadow-red-500/30',
    btn: 'bg-red-700 hover:bg-red-600',
  },
};

/** 里程碑弹窗 */
export function MilestonePopup() {
  const { state, dismissMilestone } = useGameStore();
  const pendingId = state.pendingMilestones[0];
  const milestone = pendingId ? getMilestoneById(pendingId) : null;

  if (!milestone) return null;

  const colors = toneColors[milestone.tone] || toneColors.neutral;

  return (
    <AnimatePresence>
      <motion.div
        key={milestone.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={dismissMilestone}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: -20 }}
          transition={{ type: 'spring', damping: 15, stiffness: 250 }}
          className={`w-full max-w-sm rounded-2xl p-6 border-2 bg-gradient-to-b ${colors.bg} ${colors.border} shadow-2xl ${colors.glow}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 图标 */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 12, delay: 0.15 }}
            className="text-center mb-4"
          >
            <span className="text-6xl inline-block">{milestone.icon}</span>
          </motion.div>

          {/* 标题 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <p className="text-xs text-gray-500 text-center mb-1 tracking-widest uppercase">🩸 暗黑印记</p>
            <h3 className={`text-2xl font-black text-center mb-2 ${colors.text}`}>
              {milestone.title}
            </h3>
            <p className="text-gray-400 text-sm text-center leading-relaxed mb-5">
              {milestone.description}
            </p>
          </motion.div>

          {/* 分隔装饰线 */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent mb-4" />

          {/* 按钮 */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            onClick={dismissMilestone}
            className={`w-full py-3 ${colors.btn} text-white rounded-lg text-sm font-bold transition-colors`}
          >
            继续前进 →
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

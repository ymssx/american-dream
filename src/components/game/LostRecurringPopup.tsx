'use client';

import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';

/** 被开除/投资倒闭弹窗 */
export function LostRecurringPopup() {
  const { state, dismissLostRecurring } = useGameStore();
  const items = state.pendingLostRecurring;

  if (!items || items.length === 0) return null;

  // 判断类型：工作还是投资
  const hasWork = items.some(t => t.includes('排班') || t.includes('辞退') || t.includes('裁') || t.includes('失业') || t.includes('解散') || t.includes('离职') || t.includes('不适合') || t.includes('岗位'));
  const hasInvest = items.some(t => t.includes('倒闭') || t.includes('关门') || t.includes('封了') || t.includes('征收') || t.includes('营业执照') || t.includes('抢劫') || t.includes('到期') || t.includes('瓦解') || t.includes('店') || t.includes('投资') || t.includes('停车场') || t.includes('公寓'));

  const icon = hasWork && hasInvest ? '💔' : hasWork ? '📋' : '💸';
  const title = hasWork && hasInvest ? '祸不单行！' : hasWork ? '你被开除了！' : '投资出事了！';
  const subtitle = hasWork && hasInvest
    ? '工作丢了，投资也出了问题……'
    : hasWork
    ? '这份工作没了，得重新找活路'
    : '你的投资项目出了大问题';

  return (
    <AnimatePresence>
      <motion.div
        key="lost-recurring"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[55] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={dismissLostRecurring}
      >
        <motion.div
          initial={{ scale: 0.6, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 16, stiffness: 260 }}
          className="w-full max-w-sm rounded-2xl p-5 border border-red-700 bg-gradient-to-b from-red-950 to-gray-950/95 shadow-2xl shadow-red-900/30"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 图标 */}
          <div className="text-center mb-3">
            <motion.span
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: [0, 1.3, 1], rotate: [0, 10, 0] }}
              transition={{ type: 'spring', delay: 0.1 }}
              className="text-5xl inline-block"
            >
              {icon}
            </motion.span>
          </div>

          {/* 标题 */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-center text-lg font-bold mb-1 text-red-300"
          >
            {title}
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 text-xs text-center mb-4"
          >
            {subtitle}
          </motion.p>

          {/* 详情列表 */}
          <div className="space-y-2 mb-4">
            {items.map((text, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.1 }}
                className="bg-red-950/40 border border-red-800/40 rounded-lg p-3"
              >
                <p className="text-red-200 text-sm leading-relaxed">{text}</p>
              </motion.div>
            ))}
          </div>

          <button
            onClick={dismissLostRecurring}
            className="w-full py-2.5 bg-red-950/60 hover:bg-red-900/80 text-red-200 rounded-lg text-sm font-bold transition-colors border border-red-800/40"
          >
            {items.length > 1 ? '太惨了……' : '知道了'}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

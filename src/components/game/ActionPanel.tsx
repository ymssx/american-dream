'use client';

import { useState, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import actionsData from '@/data/actions.json';
import type { ActionData } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

/** 行为面板 */
export function ActionPanel() {
  const { state, getAvailableBehaviors, executeBehavior, endRound, nextRound } = useGameStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('earn');
  const [lastResult, setLastResult] = useState<Record<string, unknown> | null>(null);
  const [executingId, setExecutingId] = useState<string | null>(null);

  const categories = actionsData.categories;
  const behaviors = getAvailableBehaviors();

  // 按类别分组
  const categoryBehaviors = behaviors.filter(b => b.category === selectedCategory);

  const handleExecute = useCallback((actionId: string) => {
    // 防止重复点击
    if (executingId) return;

    setExecutingId(actionId);

    // 短暂延迟模拟执行过程，增强反馈感
    setTimeout(() => {
      const result = executeBehavior(actionId);
      setExecutingId(null);

      if (result.success && result.result) {
        setLastResult(result.result as Record<string, unknown>);
      } else if (!result.success) {
        setLastResult({
          _error: true,
          errorMsg: result.error || '执行失败',
        });
      }
    }, 300);
  }, [executingId, executeBehavior]);

  const dismissResult = useCallback(() => {
    setLastResult(null);
  }, []);

  if (state.roundPhase === 'result') {
    return (
      <div className="p-6 text-center">
        <h3 className="text-xl font-bold text-white mb-4">📊 本月报告</h3>
        <div className="bg-gray-900 rounded-xl p-4 mb-4 text-left">
          <p className="text-gray-400 text-sm mb-2">本月执行了 {state.roundBehaviors.length} 个行动</p>
          <div className="flex flex-wrap gap-2">
            {state.roundBehaviors.map((b, i) => (
              <span key={i} className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs">
                {b.name}
              </span>
            ))}
          </div>
          <div className="mt-3 text-sm text-gray-400">
            <span className="text-green-400">进账 +${state.roundFinancials.income.toLocaleString()}</span>
            {' | '}
            <span className="text-red-400">支出 -${state.roundFinancials.expense.toLocaleString()}</span>
          </div>
        </div>
        <button
          onClick={nextRound}
          className="px-8 py-3 bg-red-700 hover:bg-red-600 text-white rounded-lg text-lg"
        >
          进入下个月
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* 执行结果弹窗 — 醒目的模态遮罩 */}
      <AnimatePresence>
        {lastResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={dismissResult}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className={`w-full max-w-sm rounded-2xl p-5 border shadow-2xl ${
                (lastResult as Record<string, unknown>)._error
                  ? 'bg-red-950 border-red-800'
                  : 'bg-gray-900 border-gray-700'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {(lastResult as Record<string, unknown>)._error ? (
                <>
                  <div className="text-center mb-3">
                    <span className="text-3xl">❌</span>
                  </div>
                  <p className="text-red-300 text-center font-bold mb-1">执行失败</p>
                  <p className="text-red-400 text-sm text-center">{String((lastResult as Record<string, unknown>).errorMsg || '')}</p>
                </>
              ) : (
                <>
                  <div className="text-center mb-3">
                    <span className="text-3xl">
                      {String((lastResult.behavior as Record<string, string>)?.icon || '✅')}
                    </span>
                  </div>
                  <p className="text-white font-bold text-center text-base mb-1">
                    {String((lastResult.behavior as Record<string, string>)?.name || '')}
                  </p>
                  <p className="text-gray-400 text-sm text-center mb-3 leading-relaxed">
                    {String(lastResult.narrative || '')}
                  </p>
                  {lastResult.effectSummary && String(lastResult.effectSummary).trim() !== '' && (
                    <div className="bg-gray-800 rounded-lg p-3 mb-3">
                      <p className="text-yellow-400 text-sm text-center font-mono">
                        {String(lastResult.effectSummary)}
                      </p>
                    </div>
                  )}
                </>
              )}
              <button
                onClick={dismissResult}
                className="w-full mt-2 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-bold transition-colors"
              >
                确认
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 类别选择器 */}
      <div className="flex overflow-x-auto gap-1 px-3 py-2 bg-gray-900/50 border-b border-gray-800">
        {categories.map((cat) => {
          const count = behaviors.filter(b => b.category === cat.id && b.canExecute).length;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-900 text-gray-500 hover:text-gray-300'
              }`}
            >
              <span>{cat.icon}</span>
              <span className="ml-1">{cat.name}</span>
              {count > 0 && (
                <span className="ml-1 bg-gray-600 text-gray-300 px-1.5 py-0.5 rounded-full text-[10px]">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 类别描述 */}
      <div className="px-4 py-2 text-xs text-gray-500">
        {categories.find(c => c.id === selectedCategory)?.subtitle}
      </div>

      {/* 行为列表 */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {categoryBehaviors.length === 0 ? (
          <div className="text-gray-600 text-center py-8">该类别暂无可用行动</div>
        ) : (
          categoryBehaviors.map((action) => (
            <ActionCard
              key={action.id}
              action={action}
              onExecute={handleExecute}
              san={state.attributes.san}
              isExecuting={executingId === action.id}
              cooldowns={state.behaviorCooldowns}
              useCounts={state.behaviorUseCount}
            />
          ))
        )}
      </div>

      {/* 结算按钮 */}
      <div className="p-4 border-t border-gray-800 bg-gray-900/80">
        <div className="flex gap-3">
          <div className="flex-1 text-xs text-gray-500">
            SAN: {state.attributes.san}/{state.maxSan} · 已执行 {state.roundBehaviors.length} 个行动
          </div>
          <button
            onClick={() => endRound()}
            className="px-6 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-lg text-sm"
          >
            结束本月
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionCard({ action, onExecute, san, isExecuting, cooldowns, useCounts }: {
  action: ActionData & { unlocked: boolean; canExecute: boolean; lockReason: string | null };
  onExecute: (id: string) => void;
  san: number;
  isExecuting: boolean;
  cooldowns: Record<string, number>;
  useCounts: Record<string, number>;
}) {
  const typeLabels: Record<string, { text: string; color: string }> = {
    fixed: { text: '确定', color: 'text-green-400' },
    random: { text: '概率', color: 'text-yellow-400' },
    risky: { text: '冒险', color: 'text-orange-400' },
    lottery: { text: '博彩', color: 'text-red-400' },
  };

  const typeInfo = typeLabels[action.type] || { text: action.type, color: 'text-gray-400' };
  const disabled = !action.canExecute || isExecuting;

  // 显示冷却和次数信息
  const cooldown = cooldowns[action.id] || 0;
  const used = useCounts[action.id] || 0;
  const maxUses = action.limit?.usesPerGame;
  const cdRounds = action.limit?.cooldown;

  return (
    <motion.div
      layout
      className={`bg-gray-900 border rounded-xl p-4 transition-all ${
        disabled
          ? 'border-gray-800 opacity-50'
          : 'border-gray-700 hover:border-gray-600 cursor-pointer'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="text-white font-bold text-sm">{action.name}</h4>
          <p className="text-gray-500 text-xs">{action.nameEn}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-xs ${typeInfo.color}`}>{typeInfo.text}</span>
          {/* 限制信息标签 */}
          {(maxUses || cdRounds) && (
            <div className="flex gap-1">
              {maxUses && (
                <span className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">
                  {used}/{maxUses}次
                </span>
              )}
              {cdRounds && cooldown > 0 && (
                <span className="text-[10px] bg-orange-900/50 text-orange-400 px-1.5 py-0.5 rounded">
                  ⏳冷却{cooldown}月
                </span>
              )}
              {cdRounds && cooldown === 0 && (
                <span className="text-[10px] bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded">
                  间隔{cdRounds}月
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <p className="text-gray-400 text-xs mb-2">{action.description}</p>
      <p className="text-gray-600 text-xs italic mb-3">&ldquo;{action.quote}&rdquo;</p>

      {/* 消耗和收益 */}
      <div className="flex flex-wrap gap-1 mb-3 text-xs">
        {action.cost?.san && action.cost.san > 0 && (
          <span className="bg-purple-900/30 text-purple-400 px-1.5 py-0.5 rounded">🧠-{action.cost.san}</span>
        )}
        {action.cost?.money && action.cost.money > 0 && (
          <span className="bg-red-900/30 text-red-400 px-1.5 py-0.5 rounded">💰-${action.cost.money}</span>
        )}
        {action.cost?.health && action.cost.health > 0 && (
          <span className="bg-red-900/30 text-red-400 px-1.5 py-0.5 rounded">❤️-{action.cost.health}</span>
        )}
        {action.gain && Object.entries(action.gain).map(([key, val]) => (
          val !== 0 && (
            <span key={key} className={`px-1.5 py-0.5 rounded ${
              (val as number) > 0 ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
            }`}>
              {key === 'money' ? '💰' : key === 'health' ? '❤️' : key === 'san' ? '🧠' : key === 'credit' ? '💳' : ''}
              {(val as number) > 0 ? '+' : ''}{key === 'money' ? `$${val}` : val}
            </span>
          )
        ))}
      </div>

      {/* 按钮 */}
      {disabled ? (
        <div className="text-xs text-gray-600">
          {isExecuting ? (
            <span className="text-yellow-500 animate-pulse">⏳ 执行中...</span>
          ) : (
            <span>🔒 {action.lockReason || '不可用'}</span>
          )}
        </div>
      ) : (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onExecute(action.id)}
          className="w-full py-2 bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white rounded-lg text-sm transition-all font-medium"
        >
          ▶ 执行
        </motion.button>
      )}
    </motion.div>
  );
}

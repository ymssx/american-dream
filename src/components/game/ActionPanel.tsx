'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import actionsData from '@/data/actions.json';
import type { ActionData } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { getClassInfo } from '@/lib/classSystem';
import { WealthChart } from './WealthChart';

/** 行为面板 */
export function ActionPanel() {
  const { state, getAvailableBehaviors, executeBehavior, endRound, nextRound } = useGameStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('special');
  const [showQuickRest, setShowQuickRest] = useState(false);
  const [quickRestResults, setQuickRestResults] = useState<Array<{ name: string; icon: string; costText: string; gainText: string }>>([]);
  const [quickRestTotals, setQuickRestTotals] = useState<{ totalMoney: number; gains: Record<string, number> }>({ totalMoney: 0, gains: {} });
  const [selectedSubGroup, setSelectedSubGroup] = useState<string>('all');
  const [lastResult, setLastResult] = useState<Record<string, unknown> | null>(null);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [pendingDangerAction, setPendingDangerAction] = useState<string | null>(null);

  const categories = actionsData.categories as Array<{ id: string; name: string; subtitle: string; icon: string; color: string; subGroups?: Array<{ id: string; name: string; icon: string }> }>;
  const behaviors = getAvailableBehaviors();

  // 当前分类的子分组定义
  const currentCat = categories.find(c => c.id === selectedCategory);
  const subGroups = currentCat?.subGroups;

  // 按类别和子分组过滤，然后排序：能执行的在前
  const categoryBehaviors = behaviors
    .filter(b => {
      if (b.category !== selectedCategory) return false;
      if (subGroups && selectedSubGroup !== 'all') {
        return b.subGroup === selectedSubGroup;
      }
      return true;
    })
    .sort((a, b) => {
      // 能执行的排前面
      if (a.canExecute && !b.canExecute) return -1;
      if (!a.canExecute && b.canExecute) return 1;
      // 已解锁但不能执行 > 未解锁
      if (a.unlocked && !b.unlocked) return -1;
      if (!a.unlocked && b.unlocked) return 1;
      return 0;
    });

  // 切换分类时重置子分组
  const handleCategoryChange = useCallback((catId: string) => {
    setSelectedCategory(catId);
    setSelectedSubGroup('all');
  }, []);

  // 检查行为是否可能致命
  const checkDanger = useCallback((actionId: string): { isDanger: boolean; warnings: string[] } => {
    const action = categoryBehaviors.find(b => b.id === actionId) || behaviors.find(b => b.id === actionId);
    if (!action) return { isDanger: false, warnings: [] };
    const warnings: string[] = [];
    const currentHealth = state.attributes.health;
    const currentSan = state.attributes.san;
    const costHealth = (action.cost as Record<string, number>)?.health || 0;
    const costSan = (action.cost as Record<string, number>)?.san || 0;
    const riskPenaltyHealth = Math.abs((action as unknown as Record<string, Record<string, Record<string, number>>>)?.risk?.penalty?.health || 0);
    const riskPenaltySan = Math.abs((action as unknown as Record<string, Record<string, Record<string, number>>>)?.risk?.penalty?.san || 0);
    const riskChance = (action as unknown as Record<string, Record<string, number>>)?.risk?.chance || 0;

    // 直接消耗就会致命
    if (costHealth > 0 && costHealth >= currentHealth) {
      warnings.push(`❤️ 健康消耗(${costHealth}) ≥ 当前健康(${currentHealth})，执行后必定死亡！`);
    }
    if (costSan > 0 && costSan >= currentSan) {
      warnings.push(`🧠 精神消耗(${costSan}) ≥ 当前SAN(${currentSan})，执行后必定崩溃！`);
    }
    // 加上风险惩罚后可能致命
    if (!warnings.length && riskChance > 0) {
      if (costHealth + riskPenaltyHealth >= currentHealth && riskPenaltyHealth > 0) {
        warnings.push(`❤️ 消耗(${costHealth})+风险惩罚(${riskPenaltyHealth}) ≥ 当前健康(${currentHealth})，有${Math.round(riskChance * 100)}%概率致命！`);
      }
      if (costSan + riskPenaltySan >= currentSan && riskPenaltySan > 0) {
        warnings.push(`🧠 消耗(${costSan})+风险惩罚(${riskPenaltySan}) ≥ 当前SAN(${currentSan})，有${Math.round(riskChance * 100)}%概率崩溃！`);
      }
    }
    // 健康或SAN过低时的额外警告（不一定致命但很危险）
    if (!warnings.length) {
      if (costHealth > 0 && currentHealth - costHealth <= 15 && currentHealth - costHealth > 0) {
        warnings.push(`⚠️ 执行后健康将仅剩 ${currentHealth - costHealth}，极度危险！`);
      }
      if (costSan > 0 && currentSan - costSan <= 10 && currentSan - costSan > 0) {
        warnings.push(`⚠️ 执行后SAN将仅剩 ${currentSan - costSan}，精神濒临崩溃！`);
      }
    }
    return { isDanger: warnings.length > 0, warnings };
  }, [categoryBehaviors, behaviors, state.attributes.health, state.attributes.san]);

  const handleExecute = useCallback((actionId: string) => {
    // 防止重复点击
    if (executingId) return;

    // 检查是否致命行为，弹出确认
    const danger = checkDanger(actionId);
    if (danger.isDanger) {
      setPendingDangerAction(actionId);
      return;
    }

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
  }, [executingId, executeBehavior, checkDanger]);

  // 确认执行致命行为
  const confirmDangerExecute = useCallback(() => {
    if (!pendingDangerAction || executingId) return;
    const actionId = pendingDangerAction;
    setPendingDangerAction(null);
    setExecutingId(actionId);

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
  }, [pendingDangerAction, executingId, executeBehavior]);

  const cancelDangerExecute = useCallback(() => {
    setPendingDangerAction(null);
  }, []);

  // ====== 一键休整 ======
  // 筛选 special 分类下 type=fixed、能执行的行为，打包预览
  const prepareQuickRest = useCallback(() => {
    const restActions = behaviors
      .filter(b => b.category === 'special' && b.type === 'fixed' && b.canExecute && b.unlocked);
    if (restActions.length === 0) return;

    const items: Array<{ id: string; name: string; icon: string; costText: string; gainText: string }> = [];
    let totalMoney = 0;
    const totalGains: Record<string, number> = {};

    for (const action of restActions) {
      const moneyCost = action.cost?.money || 0;
      const sanCost = action.cost?.san || 0;
      const costParts: string[] = [];
      if (moneyCost > 0) { costParts.push(`💰$${moneyCost}`); totalMoney += moneyCost; }
      if (sanCost > 0) costParts.push(`🧠${sanCost}`);

      const gainParts: string[] = [];
      const gains = action.gain || {};
      const names: Record<string, string> = { health: '❤️', san: '🧠', credit: '💳', money: '💰', skills: '⚡', influence: '🌟' };
      for (const [k, v] of Object.entries(gains)) {
        if (typeof v === 'number' && v > 0) {
          gainParts.push(`${names[k] || k}+${k === 'money' ? `$${v}` : v}`);
          totalGains[k] = (totalGains[k] || 0) + v;
        }
      }

      items.push({
        id: action.id,
        name: action.name,
        icon: '🛋️',
        costText: costParts.join(' ') || '免费',
        gainText: gainParts.join(' ') || '—',
      });
    }

    setQuickRestResults(items);
    setQuickRestTotals({ totalMoney, gains: totalGains });
    setShowQuickRest(true);
  }, [behaviors]);

  const executeQuickRest = useCallback(() => {
    // 按顺序执行所有可以执行的休整行为
    const restActions = behaviors
      .filter(b => b.category === 'special' && b.type === 'fixed' && b.canExecute && b.unlocked);
    const results: string[] = [];
    for (const action of restActions) {
      const result = executeBehavior(action.id);
      if (result.success) {
        results.push(action.name);
      }
    }
    setShowQuickRest(false);
    if (results.length > 0) {
      setLastResult({
        behavior: { name: '一键休整', icon: '🛋️' },
        narrative: `完成了 ${results.length} 项休整：${results.join('、')}`,
        effectSummary: Object.entries(quickRestTotals.gains)
          .map(([k, v]) => {
            const n: Record<string, string> = { health: '体力', san: 'SAN', credit: '信用', money: '资金', skills: '技能', influence: '影响力' };
            return `${n[k] || k}+${k === 'money' ? `$${v}` : v}`;
          }).join(' '),
        gain: quickRestTotals.gains,
      });
    }
  }, [behaviors, executeBehavior, quickRestTotals]);

  const dismissResult = useCallback(() => {
    setLastResult(null);
  }, []);

  if (state.roundPhase === 'result') {
    const net = state.roundFinancials.income - state.roundFinancials.expense;
    const classInfo = getClassInfo(state.classLevel);

    // "新闻头条"风格的本月最大事件
    const headline = useMemo(() => {
      if (net >= 10000) return { text: '💰 大丰收！别人在流血，你在数钱', color: 'text-green-400', bg: 'bg-green-950/50' };
      if (net >= 3000) return { text: '📈 又是赚钱的一个月。食物链往上爬了一格', color: 'text-emerald-400', bg: 'bg-emerald-950/40' };
      if (net <= -5000) return { text: '🚨 血亏严重！你快要从猎人变成猎物了', color: 'text-red-400', bg: 'bg-red-950/50' };
      if (net <= -1000) return { text: '📉 在亏钱。弱肉强食的世界里，赔钱就是在流血', color: 'text-orange-400', bg: 'bg-orange-950/40' };
      if (state.attributes.health <= 20) return { text: '⚠️ 身体快崩了。别成为下一个被抖音播报的悲惨故事', color: 'text-red-400', bg: 'bg-red-950/50' };
      if (state.attributes.san <= 20) return { text: '🌀 精神快崩了。别像那些人一样从天台上跳下去', color: 'text-purple-400', bg: 'bg-purple-950/50' };
      if (state.roundBehaviors.length === 0) return { text: '😴 什么都没做。而外面的人正在拼命。', color: 'text-gray-400', bg: 'bg-gray-800/50' };
      return { text: '📅 又一个月。有人发财，有人发丧。', color: 'text-gray-400', bg: 'bg-gray-800/50' };
    }, [net, state.attributes.health, state.attributes.san, state.roundBehaviors.length]);
    // AI 点评 — 暗黑资本家口吻
    const aiComment = useMemo(() => {
      const comments: string[] = [];
      if (net >= 10000) comments.push('赚麻了。而外面有人正在为$500拼命。这就是资本的魅力。');
      else if (net >= 3000) comments.push('不错的一个月。每一分钱都是踩着别人的影子赚来的。');
      else if (net <= -5000) comments.push('赔成这样的人，通常下一步就是街头流浪。你不想成为他们吧？');
      else if (net <= -1000) comments.push('花的比赚的多。在这个世界，赔钱的人会被吃掉。');

      if (state.recurringItems.filter(r => r.type === 'work').length === 0 && state.currentRound > 3) {
        comments.push('没有工作就是在消耗自己。而消耗完了的人，会变成新闻里的一行字。');
      }
      if (state.attributes.health <= 30) comments.push('身体在报警。这里没有免费医疗——没有钱就没有命。');
      if (state.money < 0) comments.push('负债了。蓄奴制废除了，但债务没有。');
      if (state.money > 50000 && state.recurringItems.filter(r => r.type === 'invest').length === 0) {
        comments.push('这么多现金放着不用？让钱去工作。人会死，钱不会。');
      }
      if (state.money >= 100000) {
        comments.push('十万美元。在这片土地上，这个数字意味着你可以决定别人的命运。');
      }

      return comments.length > 0 ? comments[Math.floor(Math.random() * comments.length)] : '美国梦的真相：有人做梦，有人不醒。而你，选择了叫醒别人。';
    }, [net, state.recurringItems, state.currentRound, state.attributes.health, state.money]);

    return (
      <div className="h-full overflow-y-auto">
        <div className="p-5 pb-32">
          {/* 新闻头条 */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${headline.bg} rounded-xl p-4 mb-4 border border-gray-800/60`}
          >
            <p className={`text-lg font-black text-center ${headline.color}`}>{headline.text}</p>
          </motion.div>

          {/* 阶层显示 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className={`flex items-center justify-center gap-2 mb-4 px-3 py-2 rounded-lg ${classInfo.bgColor} border border-gray-800/40`}
          >
            <span className="text-xl">{classInfo.icon}</span>
            <span className={`text-sm font-bold ${classInfo.color}`}>{classInfo.name}</span>
            <span className="text-gray-500 text-xs">— {classInfo.description}</span>
          </motion.div>

          <div className="bg-gray-900 rounded-xl p-4 mb-4 text-left">
            {/* 行动摘要 */}
            <p className="text-gray-400 text-sm mb-2">本月执行了 {state.roundBehaviors.length} 个行动</p>
            <div className="flex flex-wrap gap-2">
              {state.roundBehaviors.map((b, i) => (
                <span key={i} className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs">
                  {b.name}
                </span>
              ))}
              {state.roundBehaviors.length === 0 && (
                <span className="text-gray-600 text-xs">本月什么都没做</span>
              )}
            </div>

            {/* 资金明细 */}
            <div className="mt-3 pt-3 border-t border-gray-800 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">进账</span>
                <span className="text-green-400">+${state.roundFinancials.income.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">支出（含房租/伙食）</span>
                <span className="text-red-400">-${state.roundFinancials.expense.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-1 border-t border-gray-800">
                <span className="text-gray-300">本月净收入</span>
                <motion.span
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                  className={`${net >= 0 ? 'text-green-400' : 'text-red-400'} ${Math.abs(net) >= 5000 ? 'text-base' : ''}`}
                >
                  {net >= 0 ? '+' : ''}{net.toLocaleString()}
                </motion.span>
              </div>
            </div>

            {/* 状态变化 */}
            <div className="mt-3 pt-3 border-t border-gray-800 flex flex-wrap gap-2 text-xs">
              <span className="text-gray-500">余额: <span className="text-white font-mono">${state.money.toLocaleString()}</span></span>
              <span className="text-gray-500">❤️ {state.attributes.health}</span>
              <span className="text-gray-500">🧠 {state.attributes.san}/{state.maxSan}</span>
              <span className="text-gray-500">💳 {state.attributes.credit}</span>
            </div>

            {/* 持续性项目摘要 */}
            {state.recurringItems.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-800">
                <p className="text-gray-500 text-xs mb-1.5">📋 持续性项目</p>
                <div className="flex flex-wrap gap-1">
                  {state.recurringItems.map((item) => (
                    <span key={item.id} className={`text-[10px] px-1.5 py-0.5 rounded ${
                      item.type === 'work' ? 'bg-green-900/40 text-green-400' :
                      item.type === 'invest' ? 'bg-blue-900/40 text-blue-400' :
                      item.type === 'education' ? 'bg-indigo-900/40 text-indigo-400' :
                      'bg-red-900/40 text-red-400'
                    }`}>
                      {item.icon} {item.name} {item.monthlyIncome >= 0 ? '+' : ''}{item.monthlyIncome.toLocaleString()}/月
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 资产走势图 */}
            <WealthChart history={state.wealthHistory} currentMoney={state.money} />
          </div>

          {/* AI 点评 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800/50 rounded-lg p-3 mb-4 border border-gray-700/40"
          >
            <p className="text-gray-500 text-[10px] mb-1">🧠 内心独白</p>
            <p className="text-gray-300 text-sm italic">“{aiComment}”</p>
          </motion.div>

          {/* 📰 世界新闻播报 — 核心暗黑系统 */}
          {state.currentWorldNews.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-red-500 font-bold tracking-wider">📰 本月世界新闻</span>
                <div className="flex-1 h-px bg-red-900/40" />
              </div>
              <div className="space-y-2">
                {state.currentWorldNews.map((news, i) => {
                  const toneStyle: Record<string, string> = {
                    death: 'border-l-red-600 bg-red-950/30',
                    ruin: 'border-l-orange-600 bg-orange-950/20',
                    deport: 'border-l-blue-600 bg-blue-950/20',
                    misery: 'border-l-gray-600 bg-gray-800/30',
                    irony: 'border-l-yellow-600 bg-yellow-950/20',
                  };
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.15 }}
                      className={`border-l-2 pl-3 py-2 rounded-r-lg ${toneStyle[news.tone] || toneStyle.misery}`}
                    >
                      <p className="text-gray-300 text-xs leading-relaxed">{news.text}</p>
                      {news.playerGain && news.gainText && (
                        <p className="text-green-500/80 text-[10px] mt-1 font-mono">
                          💰 {news.gainText}
                        </p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
              {/* 累计统计 */}
              <div className="flex gap-3 mt-2 text-[10px] text-gray-600">
                <span>☠️ 累计死亡: {state.totalDeathsSeen}</span>
                <span>💸 累计破产: {state.totalRuinsSeen}</span>
                <span>🚶 累计遣返: {state.totalDeportsSeen}</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* 固定底部按钮 */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-950/95 border-t border-gray-800 backdrop-blur-sm">
          <button
            onClick={nextRound}
            className="w-full px-8 py-3 bg-red-700 hover:bg-red-600 text-white rounded-lg text-lg font-bold transition-colors"
          >
            进入下个月 →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* 执行结果弹窗 — 醒目的模态遮罩 */}
      <AnimatePresence>
        {/* 一键休整预览弹窗 */}
        {showQuickRest && (
          <motion.div
            key="quick-rest"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowQuickRest(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="w-full max-w-sm rounded-2xl p-5 border border-yellow-700/60 bg-gradient-to-b from-gray-900 to-gray-950 shadow-2xl shadow-yellow-900/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <span className="text-4xl">🛋️</span>
                <p className="text-yellow-300 font-bold text-lg mt-2">一键休整</p>
                <p className="text-gray-500 text-xs mt-1">以下 {quickRestResults.length} 项休整可以执行</p>
              </div>

              {/* 项目列表 */}
              <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                {quickRestResults.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-800/60 rounded-lg px-3 py-2">
                    <span className="text-white text-sm font-medium">{item.name}</span>
                    <div className="flex gap-2 text-xs">
                      <span className="text-red-400">{item.costText}</span>
                      <span className="text-gray-600">→</span>
                      <span className="text-green-400">{item.gainText}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* 汇总 */}
              <div className="bg-yellow-900/20 border border-yellow-800/40 rounded-lg p-3 mb-4">
                <p className="text-yellow-400 text-xs font-bold mb-1">📊 总计</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {quickRestTotals.totalMoney > 0 && (
                    <span className="text-red-400">花费 💰${quickRestTotals.totalMoney}</span>
                  )}
                  {Object.entries(quickRestTotals.gains).map(([k, v]) => {
                    const names: Record<string, string> = { health: '❤️体力', san: '🧠SAN', credit: '💳信用', money: '💰资金', skills: '⚡技能', influence: '🌟影响力' };
                    return (
                      <span key={k} className="text-green-400">
                        {names[k] || k}+{k === 'money' ? `$${v}` : v}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* 按钮 */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowQuickRest(false)}
                  className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-bold transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={executeQuickRest}
                  className="flex-1 py-2.5 bg-yellow-700 hover:bg-yellow-600 text-white rounded-lg text-sm font-bold transition-colors"
                >
                  🛋️ 全部执行
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* 致命行为确认弹窗 */}
        {pendingDangerAction && (() => {
          const danger = checkDanger(pendingDangerAction);
          const dangerAction = categoryBehaviors.find(b => b.id === pendingDangerAction) || behaviors.find(b => b.id === pendingDangerAction);
          return (
            <motion.div
              key="danger-confirm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
              onClick={cancelDangerExecute}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="w-full max-w-sm rounded-2xl p-5 border border-red-700 bg-red-950/95 shadow-2xl shadow-red-900/30"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-3">
                  <span className="text-4xl animate-pulse">💀</span>
                </div>
                <p className="text-red-300 font-bold text-center text-lg mb-1">致命警告</p>
                <p className="text-red-400/80 text-sm text-center mb-3">
                  执行「{dangerAction?.name || ''}」可能导致死亡！
                </p>
                <div className="bg-black/40 rounded-lg p-3 mb-4 space-y-1.5">
                  {danger.warnings.map((w, i) => (
                    <p key={i} className="text-red-300 text-sm leading-relaxed">{w}</p>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={cancelDangerExecute}
                    className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-bold transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={confirmDangerExecute}
                    className="flex-1 py-2.5 bg-red-800 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors animate-pulse"
                  >
                    赴死
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}

        {lastResult && (() => {
          // 判断是否大额收益/损失
          const gains = lastResult.gain as Record<string, number> | undefined;
          const moneyGain = gains?.money || 0;
          const isBigWin = moneyGain >= 5000;
          const isBigLoss = moneyGain <= -3000;
          const isError = !!(lastResult as Record<string, unknown>)._error;

          return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={dismissResult}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className={`w-full max-w-sm rounded-2xl p-5 border shadow-2xl ${
                isError
                  ? 'bg-red-950 border-red-800'
                  : isBigWin
                  ? 'bg-gradient-to-b from-yellow-950/95 to-amber-950/95 border-yellow-600 shadow-yellow-500/20'
                  : isBigLoss
                  ? 'bg-gradient-to-b from-red-950/95 to-gray-950/95 border-red-700 shadow-red-500/20'
                  : 'bg-gray-900 border-gray-700'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {isError ? (
                <>
                  <div className="text-center mb-3">
                    <span className="text-3xl">❌</span>
                  </div>
                  <p className="text-red-300 text-center font-bold mb-1">执行失败</p>
                  <p className="text-red-400 text-sm text-center">{String((lastResult as Record<string, unknown>).errorMsg || '')}</p>
                </>
              ) : (
                <>
                  {/* 大额收益特效 */}
                  {isBigWin && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.3, 1] }}
                      transition={{ duration: 0.5 }}
                      className="text-center mb-2"
                    >
                      <span className="text-5xl">💰</span>
                    </motion.div>
                  )}
                  {isBigLoss && (
                    <motion.div
                      animate={{ x: [0, -5, 5, -3, 3, 0] }}
                      transition={{ duration: 0.4 }}
                      className="text-center mb-2"
                    >
                      <span className="text-5xl">💸</span>
                    </motion.div>
                  )}
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
                    <div className={`rounded-lg p-3 mb-3 ${
                      isBigWin ? 'bg-yellow-900/40' : isBigLoss ? 'bg-red-900/40' : 'bg-gray-800'
                    }`}>
                      <p className={`text-sm text-center font-mono ${
                        isBigWin ? 'text-yellow-300 font-bold' : isBigLoss ? 'text-red-300 font-bold' : 'text-yellow-400'
                      }`}>
                        {String(lastResult.effectSummary)}
                      </p>
                    </div>
                  )}
                  {/* 大额提示 */}
                  {isBigWin && (
                    <p className="text-yellow-500/80 text-xs text-center mb-2 animate-pulse">✨ 大赚一笔！</p>
                  )}
                  {isBigLoss && (
                    <p className="text-red-500/80 text-xs text-center mb-2 animate-pulse">💥 血亏严重…</p>
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
          );
        })()}
      </AnimatePresence>

      {/* 类别选择器 */}
      <div className="flex overflow-x-auto gap-1 px-3 py-2 bg-gray-900/50 border-b border-gray-800">
        {categories.map((cat) => {
          const count = behaviors.filter(b => b.category === cat.id && b.canExecute).length;
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
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

      {/* 类别描述 + 一键休整按钮 + 子分组筛选 */}
      <div className="px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {currentCat?.subtitle}
          </div>
          {selectedCategory === 'special' && (() => {
            const restCount = behaviors.filter(b => b.category === 'special' && b.type === 'fixed' && b.canExecute && b.unlocked).length;
            return restCount > 0 ? (
              <button
                onClick={prepareQuickRest}
                className="px-3 py-1 bg-yellow-800/60 hover:bg-yellow-700/80 text-yellow-300 rounded-lg text-xs font-bold transition-all border border-yellow-700/50 hover:border-yellow-600"
              >
                🛋️ 一键休整 ({restCount})
              </button>
            ) : null;
          })()}
        </div>
        {subGroups && subGroups.length > 1 && (
          <div className="flex gap-1 mt-1.5">
            {subGroups.map((sg) => {
              const sgCount = sg.id === 'all'
                ? behaviors.filter(b => b.category === selectedCategory).length
                : behaviors.filter(b => b.category === selectedCategory && b.subGroup === sg.id).length;
              return (
                <button
                  key={sg.id}
                  onClick={() => setSelectedSubGroup(sg.id)}
                  className={`px-2 py-1 rounded text-[11px] transition-all ${
                    selectedSubGroup === sg.id
                      ? 'bg-gray-600 text-white'
                      : 'bg-gray-800/60 text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {sg.icon} {sg.name}
                  <span className="ml-0.5 text-[10px] opacity-60">{sgCount}</span>
                </button>
              );
            })}
          </div>
        )}
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

      {/* 结算按钮 — 固定在底部 */}
      <div className="flex-shrink-0 p-4 border-t border-gray-800 bg-gray-900 z-10">
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
  // 辅助函数：渲染收益/消耗标签
  function renderGainTags(obj: Record<string, number>, prefix: string) {
    return Object.entries(obj)
      .filter(([, val]) => val !== 0)
      .map(([key, val]) => (
        <span key={`${prefix}_${key}`} className={`px-1.5 py-0.5 rounded ${
          val > 0 ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
        }`}>
          {key === 'money' ? '💰' : key === 'health' ? '❤️' : key === 'san' ? '🧠' : key === 'credit' ? '💳' : key === 'skills' ? '⚡' : key === 'influence' ? '🌟' : ''}
          {val > 0 ? '+' : ''}{key === 'money' ? `$${val}` : String(val)}
        </span>
      ));
  }
  function renderGainSection() {
    const elements: React.ReactNode[] = [];
    if (action.gain) {
      elements.push(...renderGainTags(action.gain, 'g'));
    }
    if (action.baseGain) {
      elements.push(...renderGainTags(action.baseGain, 'bg'));
    }
    return <>{elements}</>;
  }
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
        {/* 收益标签 */}
        {renderGainSection()}
        {/* 持续性收入标签 — 显示具体月薪 */}
        {action.recurring ? (() => {
          const templates = (actionsData as unknown as Record<string, Record<string, Record<string, unknown>>>).recurringTemplates;
          const tmpl = templates?.[action.recurring!];
          const salary = tmpl?.monthlyIncome as number | undefined;
          return (
            <span className="bg-yellow-900/40 text-yellow-300 px-1.5 py-0.5 rounded animate-pulse">
              ✨ 月薪${salary ? `$${salary.toLocaleString()}` : '待定'}
            </span>
          );
        })() : null}
        {/* 门槛要求 */}
        {action.requirements ? (() => {
          const req = action.requirements;
          const tags: Array<{ label: string }> = [];
          if (req.educationLevel !== undefined) {
            const names = ['无', '语言学校', '社区大学', '州立大学', '常春藤'];
            tags.push({ label: `📚≥${names[req.educationLevel]}` });
          }
          if (req.skills !== undefined) {
            tags.push({ label: `⚡技能≥${req.skills}` });
          }
          if (req.influence !== undefined) {
            tags.push({ label: `🌟影响力≥${req.influence}` });
          }
          return tags.map((t, i) => (
            <span key={`req_${i}`} className="bg-indigo-900/40 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-800/50">
              {t.label}
            </span>
          ));
        })() : null}
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

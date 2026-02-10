'use client';

import { useGameStore } from '@/store/gameStore';
import type { RecurringItem } from '@/lib/types';

/** 持续性项目面板 */
export function RecurringPanel() {
  const { state, removeRecurringItem } = useGameStore();
  const items = state.recurringItems;

  if (items.length === 0) {
    return (
      <div className="p-4">
        <h3 className="text-sm font-bold text-gray-400 mb-2">📋 持续性项目</h3>
        <div className="text-gray-600 text-xs text-center py-4">
          暂无持续性项目（找到工作或投资成功后会显示在这里）
        </div>
      </div>
    );
  }

  // 按类型分组
  const workItems = items.filter(i => i.type === 'work');
  const investItems = items.filter(i => i.type === 'invest');
  const loanItems = items.filter(i => i.type === 'loan');

  // 计算总收入和支出
  const totalIncome = items.reduce((sum, i) => sum + (i.monthlyIncome > 0 ? i.monthlyIncome : 0), 0);
  const totalExpense = items.reduce((sum, i) => sum + (i.monthlyIncome < 0 ? Math.abs(i.monthlyIncome) : 0), 0);
  const netIncome = totalIncome - totalExpense;

  return (
    <div className="p-4">
      <h3 className="text-sm font-bold text-gray-400 mb-2">📋 持续性项目</h3>

      {/* 汇总条 */}
      <div className="bg-gray-900 rounded-lg p-3 mb-3 flex justify-between items-center text-xs">
        <div className="flex gap-3">
          {totalIncome > 0 && (
            <span className="text-green-400">月入 +${totalIncome.toLocaleString()}</span>
          )}
          {totalExpense > 0 && (
            <span className="text-red-400">月支 -${totalExpense.toLocaleString()}</span>
          )}
        </div>
        <span className={`font-bold ${netIncome >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          净 {netIncome >= 0 ? '+' : ''}${netIncome.toLocaleString()}/月
        </span>
      </div>

      {/* 工作 */}
      {workItems.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-gray-500 mb-1">💼 工作</div>
          {workItems.map(item => (
            <RecurringItemCard key={item.id} item={item} onRemove={removeRecurringItem} />
          ))}
        </div>
      )}

      {/* 投资 */}
      {investItems.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-gray-500 mb-1">📈 投资收益</div>
          {investItems.map(item => (
            <RecurringItemCard key={item.id} item={item} onRemove={removeRecurringItem} />
          ))}
        </div>
      )}

      {/* 借贷 */}
      {loanItems.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-gray-500 mb-1">💸 借贷还款</div>
          {loanItems.map(item => (
            <RecurringItemCard key={item.id} item={item} onRemove={removeRecurringItem} />
          ))}
        </div>
      )}
    </div>
  );
}

function RecurringItemCard({ item, onRemove }: { item: RecurringItem; onRemove: (id: string) => void }) {
  const typeColors: Record<string, string> = {
    work: 'border-green-800 bg-green-950/30',
    invest: 'border-blue-800 bg-blue-950/30',
    loan: 'border-red-800 bg-red-950/30',
  };

  return (
    <div className={`border rounded-lg p-3 mb-2 ${typeColors[item.type] || 'border-gray-800 bg-gray-900'}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-base">{item.icon}</span>
            <span className="text-white text-sm font-bold">{item.name}</span>
            {item.loseChance > 0 && (
              <span className="text-[10px] bg-yellow-900/50 text-yellow-400 px-1.5 py-0.5 rounded">
                ⚠️ 月风险{Math.round(item.loseChance * 100)}%
              </span>
            )}
          </div>
          <p className="text-gray-500 text-xs mb-2">{item.description}</p>

          {/* 每月效果 */}
          <div className="flex flex-wrap gap-1 text-xs">
            {item.monthlyIncome > 0 && (
              <span className="bg-green-900/40 text-green-400 px-1.5 py-0.5 rounded">
                💰+${item.monthlyIncome.toLocaleString()}/月
              </span>
            )}
            {item.monthlyIncome < 0 && (
              <span className="bg-red-900/40 text-red-400 px-1.5 py-0.5 rounded">
                💰-${Math.abs(item.monthlyIncome).toLocaleString()}/月
              </span>
            )}
            {item.monthlyHealthCost > 0 && (
              <span className="bg-red-900/30 text-red-400 px-1.5 py-0.5 rounded">
                ❤️-{item.monthlyHealthCost}/月
              </span>
            )}
            {item.monthlySanCost > 0 && (
              <span className="bg-purple-900/30 text-purple-400 px-1.5 py-0.5 rounded">
                🧠-{item.monthlySanCost}/月
              </span>
            )}
            {item.monthlyCreditChange !== 0 && (
              <span className={`px-1.5 py-0.5 rounded ${item.monthlyCreditChange > 0 ? 'bg-blue-900/30 text-blue-400' : 'bg-red-900/30 text-red-400'}`}>
                💳{item.monthlyCreditChange > 0 ? '+' : ''}{item.monthlyCreditChange}/月
              </span>
            )}
            {!item.permanent && item.remainingMonths > 0 && (
              <span className="bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">
                ⏳剩余{item.remainingMonths}月
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

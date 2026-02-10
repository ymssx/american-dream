'use client';

import { useGameStore } from '@/store/gameStore';
import type { RecurringItem } from '@/lib/types';

/** 持续性项目面板 */
export function RecurringPanel() {
  const { state, removeRecurringItem, sellRecurringItem } = useGameStore();
  const items = state.recurringItems;

  if (items.length === 0) {
    return (
      <div className="h-full overflow-y-auto p-4">
        <h3 className="text-sm font-bold text-red-400/70 mb-2">🩸 持续性项目</h3>
        {/* 教育/技能信息 */}
        <div className="bg-gray-950 rounded-lg p-3 mb-3 border border-gray-800/40">
          <div className="text-xs text-gray-500 mb-1">🎓 教育与技能</div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="bg-purple-900/30 text-purple-400 px-1.5 py-0.5 rounded">
              📚 学历: {['无', 'ESL语言', '社区大学', '州立大学', '常春藤'][state.education.level]}
            </span>
            <span className="bg-blue-900/30 text-blue-400 px-1.5 py-0.5 rounded">
              ⚡ 技能: {state.education.skills}
            </span>
            <span className="bg-yellow-900/30 text-yellow-400 px-1.5 py-0.5 rounded">
              🌟 影响力: {state.education.influence}
            </span>
          </div>
        </div>
        <div className="text-gray-600 text-xs text-center py-4">
          暂无持续性项目（找到工作、投资成功或入学后会显示在这里）
        </div>
      </div>
    );
  }

  // 按类型分组
  const workItems = items.filter(i => i.type === 'work');
  const investItems = items.filter(i => i.type === 'invest');
  const loanItems = items.filter(i => i.type === 'loan');
  const eduItems = items.filter(i => i.type === 'education');

  // 计算总收入和支出
  const totalIncome = items.reduce((sum, i) => sum + (i.monthlyIncome > 0 ? i.monthlyIncome : 0), 0);
  const totalExpense = items.reduce((sum, i) => {
    let exp = 0;
    if (i.monthlyIncome < 0) exp += Math.abs(i.monthlyIncome);
    if (i.monthlyCost > 0) exp += i.monthlyCost;
    return sum + exp;
  }, 0);
  const netIncome = totalIncome - totalExpense;

  return (
    <div className="h-full overflow-y-auto p-4 pb-8">
      <h3 className="text-sm font-bold text-gray-400 mb-2">📋 持续性项目</h3>

      {/* 教育/技能信息 */}
      <div className="bg-gray-900 rounded-lg p-3 mb-3">
        <div className="text-xs text-gray-500 mb-1">🎓 教育与技能</div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="bg-purple-900/30 text-purple-400 px-1.5 py-0.5 rounded">
            📚 学历: {['无', 'ESL语言', '社区大学', '州立大学', '常春藤'][state.education.level]}
          </span>
          <span className="bg-blue-900/30 text-blue-400 px-1.5 py-0.5 rounded">
            ⚡ 技能: {state.education.skills}
          </span>
          <span className="bg-yellow-900/30 text-yellow-400 px-1.5 py-0.5 rounded">
            🌟 影响力: {state.education.influence}
          </span>
        </div>
      </div>

      {/* 汇总条 */}
      <div className="bg-gray-950 rounded-lg p-3 mb-3 flex justify-between items-center text-xs border border-gray-800/40">
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
            <RecurringItemCard key={item.id} item={item} onRemove={removeRecurringItem} onSell={sellRecurringItem} />
          ))}
        </div>
      )}

      {/* 投资 */}
      {investItems.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-gray-500 mb-1">📈 投资收益</div>
          {investItems.map(item => (
            <RecurringItemCard key={item.id} item={item} onRemove={removeRecurringItem} onSell={sellRecurringItem} />
          ))}
        </div>
      )}

      {/* 教育 */}
      {eduItems.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-gray-500 mb-1">🎓 在读学校</div>
          {eduItems.map(item => (
            <RecurringItemCard key={item.id} item={item} onRemove={removeRecurringItem} onSell={sellRecurringItem} />
          ))}
        </div>
      )}

      {/* 借贷 */}
      {loanItems.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-gray-500 mb-1">💸 借贷还款</div>
          {loanItems.map(item => (
            <RecurringItemCard key={item.id} item={item} onRemove={removeRecurringItem} onSell={sellRecurringItem} />
          ))}
        </div>
      )}
    </div>
  );
}

function RecurringItemCard({ item, onRemove, onSell }: { item: RecurringItem; onRemove: (id: string) => void; onSell: (id: string) => { success: boolean; message: string } }) {
  const typeColors: Record<string, string> = {
    work: 'border-red-900/50 bg-red-950/20',
    invest: 'border-gray-700/50 bg-gray-950/40',
    loan: 'border-red-800/50 bg-red-950/30',
    education: 'border-gray-700/50 bg-gray-950/30',
  };

  return (
    <div className={`border rounded-lg p-3 mb-2 ${typeColors[item.type] || 'border-gray-800 bg-gray-900'}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-base">{item.icon}</span>
            <span className="text-white text-sm font-bold">{item.name}</span>
            {item.subType && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                item.subType === 'fund' ? 'bg-cyan-900/50 text-cyan-400' : 'bg-orange-900/50 text-orange-400'
              }`}>
                {item.subType === 'fund' ? '💹资金' : '🏪实体'}
              </span>
            )}
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
            {item.monthlyCost > 0 && (
              <span className="bg-orange-900/40 text-orange-400 px-1.5 py-0.5 rounded">
                🏷️成本-${item.monthlyCost.toLocaleString()}/月
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
            {/* 资金类投资累计盈亏 */}
            {item.subType === 'fund' && item.accumulatedGain !== undefined && (
              <span className={`px-1.5 py-0.5 rounded ${item.accumulatedGain >= 0 ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
                📊累计{item.accumulatedGain >= 0 ? '+' : ''}${item.accumulatedGain.toLocaleString()}
              </span>
            )}
            {/* 教育毕业奖励预览 */}
            {item.type === 'education' && item.graduateBonus && (
              <span className="bg-purple-900/40 text-purple-400 px-1.5 py-0.5 rounded">
                🎓毕业: 技能+{item.graduateBonus.skills} 影响力+{item.graduateBonus.influence}
              </span>
            )}
          </div>
        </div>
      </div>
      {/* 操作按钮 */}
      {item.canSell && (
        <button
          onClick={() => onSell(item.id)}
          className="mt-2 w-full py-1.5 bg-red-950/40 hover:bg-red-900/50 text-red-300 rounded text-xs transition-colors border border-red-800/30"
        >
          {item.sellText || '终止'}
        </button>
      )}
    </div>
  );
}

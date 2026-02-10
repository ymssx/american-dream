'use client';

import { useState } from 'react';
import { StatusBar } from './StatusBar';
import { ActionPanel } from './ActionPanel';
import { FeedPanel } from './FeedPanel';
import { SettingsPanel } from './SettingsPanel';
import { RecurringPanel } from './RecurringPanel';
import { MilestonePopup } from './MilestonePopup';
import { RandomEventPopup } from './RandomEventPopup';
import { DilemmaPopup } from './DilemmaPopup';

type Tab = 'action' | 'recurring' | 'log' | 'settings';

/** 游戏主界面 */
export function GameScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('action');

  return (
    <div className="h-dvh bg-gray-950 text-white flex flex-col overflow-hidden">
      {/* 顶部状态栏 */}
      <StatusBar />

      {/* Tab 切换 */}
      <div className="flex border-b border-gray-800 bg-gray-900/50">
        {([
          { key: 'action', label: '⚡ 行动', icon: '⚡' },
          { key: 'recurring', label: '💼 持续', icon: '💼' },
          { key: 'log', label: '📜 记录', icon: '📜' },
          { key: 'settings', label: '⚙️ 设置', icon: '⚙️' },
        ] as { key: Tab; label: string; icon: string }[]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3 text-sm text-center transition-all ${
              activeTab === tab.key
                ? 'text-white border-b-2 border-red-500'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容面板 */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'action' && <ActionPanel />}
        {activeTab === 'recurring' && <RecurringPanel />}
        {activeTab === 'log' && <FeedPanel />}
        {activeTab === 'settings' && <SettingsPanel />}
      </div>

      {/* === 爽感系统弹窗层 === */}
      {/* 优先级: 里程碑 > 随机事件 > 抉择事件 */}
      <MilestonePopup />
      <RandomEventPopup />
      <DilemmaPopup />
    </div>
  );
}

'use client';

import { useGameStore } from '@/store/gameStore';
import { motion } from 'framer-motion';

/** 死亡/游戏结束界面 */
export function DeathScreen() {
  const { state, resetGame } = useGameStore();
  const { death, money, attributes, currentRound } = state;

  const deathReasons: Record<string, { title: string; icon: string; color: string; narrative: string }> = {
    health: {
      title: '身体机能衰竭',
      icon: '💀',
      color: 'text-red-500',
      narrative: '你的身体终于承受不住了。长期的过度劳累、营养不良和得不到治疗的伤病，像腐蚀的铁锈一样侵蚀着你。在某个深夜，你倒在了出租屋的地板上，再也没能站起来。\n\n没有人发现你。直到房东来催房租的时候。',
    },
    sanity: {
      title: '精神崩溃',
      icon: '🧠',
      color: 'text-purple-500',
      narrative: '现实的重压终于击碎了你的精神。焦虑、恐惧、绝望像潮水一样涌来，吞没了你最后的理智。\n\n你开始分不清白天和黑夜，分不清梦境和现实。你喃喃自语，眼神空洞。\n\n有人报了警。但当救护车到的时候，你已经不认识这个世界了。',
    },
    bankrupt: {
      title: '经济破产',
      icon: '💸',
      color: 'text-yellow-500',
      narrative: '银行账户清零的那一刻，你才真正明白什么叫「一无所有」。\n\n没有钱意味着没有食物、没有住所、没有任何安全网。你被赶出了住处，露宿街头。\n\n在美国，贫穷不是一种状态，而是一种判刑。而你，刑期已满。',
    },
  };

  const deathInfo = deathReasons[death.type || 'health'] || deathReasons.health;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="max-w-2xl text-center"
      >
        <div className="text-6xl mb-6">{deathInfo.icon}</div>
        <h1 className={`text-3xl md:text-4xl font-bold mb-4 ${deathInfo.color}`}>
          {deathInfo.title}
        </h1>
        <p className="text-gray-500 text-sm mb-8">{death.reason}</p>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8 text-left">
          <div className="text-gray-300 leading-relaxed whitespace-pre-line text-sm">
            {deathInfo.narrative}
          </div>
        </div>

        {/* 统计数据 */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-8">
          <h3 className="text-gray-400 text-sm mb-3">📊 最终数据</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-500">存活</div>
              <div className="text-white font-bold">{currentRound} 个月</div>
            </div>
            <div>
              <div className="text-gray-500">余额</div>
              <div className="text-green-400 font-bold">${money.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-500">健康</div>
              <div className="text-red-400 font-bold">{attributes.health}</div>
            </div>
            <div>
              <div className="text-gray-500">信用</div>
              <div className="text-blue-400 font-bold">{attributes.credit}</div>
            </div>
          </div>
        </div>

        <button
          onClick={resetGame}
          className="px-10 py-4 bg-red-700 hover:bg-red-600 text-white text-xl rounded-lg transition-all"
        >
          重新开始
        </button>
        <p className="text-gray-600 text-xs mt-4">每一次重来，都是新的可能。</p>
      </motion.div>
    </div>
  );
}

'use client';

import { useGameStore } from '@/store/gameStore';
import { motion } from 'framer-motion';

/** 死亡/游戏结束界面 */
export function DeathScreen() {
  const { state, resetGame } = useGameStore();
  const { death, money, attributes, currentRound } = state;

  const deathReasons: Record<string, { title: string; icon: string; color: string; narrative: string }> = {
    health: {
      title: '身体报废',
      icon: '💀',
      color: 'text-red-500',
      narrative: '长期的营养不良、过劳和无法得到治疗的旧伤，最终击穿了你身体的最后一道防线。\n\n那天早上你照常起床准备出门干活，弯腰系鞋带的时候眼前一黑，后脑勺撞在了门框上。\n\n你在地上躺了很久。手机就在一步之外但你够不着。隔壁传来电视机的声音，有人在看脱口秀，观众的笑声一浪接一浪。\n\n没有人知道这间屋子里有个人正在死去。',
    },
    sanity: {
      title: '精神瓦解',
      icon: '🧠',
      color: 'text-purple-500',
      narrative: '恐惧、孤独、自我怀疑——这些东西不会杀死你，但会让你慢慢变成一个空壳。\n\n你开始忘记今天是星期几。开始在凌晨四点毫无理由地大笑。开始跟墙壁说话，而且觉得墙壁在回答你。\n\n有一天你走在街上忽然停下来，站在十字路口正中间一动不动。红灯绿灯交替了很多次。\n\n路人拨打了911。等你在医院病床上醒来的时候，你已经不记得自己是谁了。',
    },
    bankrupt: {
      title: '彻底破产',
      icon: '💸',
      color: 'text-yellow-500',
      narrative: '口袋里最后一张钞票在便利店换成了一瓶水和一包饼干。\n\n你被房东换了锁。行李装在两个黑色垃圾袋里被扔在了门口。\n\n你拎着垃圾袋走在大街上，经过那些灯火通明的橱窗。里面的人在喝咖啡、在刷手机、在笑。\n\n你走到了桥下。那里已经有十几个帐篷了。一个裹着睡袋的人挪了挪给你腾出一块地方。\n\n他什么都没问。在这里，每个人的故事都差不多。',
    },
  };

  const deathInfo = deathReasons[death.type || 'health'] || deathReasons.health;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center overflow-y-auto px-6 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="max-w-2xl w-full text-center my-auto"
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
        <p className="text-gray-600 text-xs mt-4">每一次坠落都是下一次起飞前的助跑。</p>
      </motion.div>
    </div>
  );
}

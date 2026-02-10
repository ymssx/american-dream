'use client';

import React, { useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion } from 'framer-motion';
import { calculateNetWorth } from '@/lib/classSystem';

// 资产定义：根据行为ID映射到资产卡片
interface AssetDef {
  id: string;           // 对应行为ID
  name: string;
  icon: string;
  category: 'car' | 'property' | 'luxury' | 'charity' | 'politics';
  image: string;        // emoji大图
  value: number;        // 估值
  rarity: 'epic' | 'legendary' | 'mythic';
  flatter: string;      // 马屁点评
  description: string;
}

const ASSET_DEFS: AssetDef[] = [
  // 车
  {
    id: 'LUX11', name: '特斯拉 Model S', icon: '⚡', category: 'car',
    image: '🚗', value: 50000, rarity: 'epic',
    flatter: '硅谷精英的标配座驾！自动驾驶带你通往成功之路。你已经站在了科技的风口上！',
    description: '特斯拉 Model S | 电动性能轿车',
  },
  {
    id: 'LUX04', name: '福特野马 GT', icon: '🐎', category: 'car',
    image: '🏎️', value: 80000, rarity: 'epic',
    flatter: 'V8的咆哮是你对过去所有苦难的回答！美国精神的象征——自由、力量、不可阻挡！',
    description: '福特野马 GT | 美式肌肉车',
  },
  {
    id: 'LUX12', name: '保时捷 911 Turbo', icon: '💨', category: 'car',
    image: '🏎️', value: 200000, rarity: 'legendary',
    flatter: '马里布海岸线上最耀眼的风景！每一次踩下油门，都是在向世界宣告你的到来！',
    description: '保时捷 911 Turbo | 德国跑车之王',
  },
  {
    id: 'LUX13', name: '劳斯莱斯幻影', icon: '👑', category: 'car',
    image: '🚘', value: 500000, rarity: 'mythic',
    flatter: '全球只有站在金字塔尖的人才配拥有幻影。星空顶下坐着的是一个传奇——从一无所有到拥有一切！',
    description: '劳斯莱斯幻影 | 终极豪华座驾',
  },
  // 房产
  {
    id: 'LUX20', name: '投资公寓', icon: '🏢', category: 'property',
    image: '🏠', value: 150000, rarity: 'epic',
    flatter: '从租客到房东！被动收入的起点，你已经踏入了资本家的领地！',
    description: '洛杉矶投资公寓 | 每月躺赚租金',
  },
  {
    id: 'LUX21', name: '曼哈顿公寓', icon: '🌃', category: 'property',
    image: '🏙️', value: 500000, rarity: 'legendary',
    flatter: '全球最贵的房产市场，你占有一席之地！从四十楼俯瞰中央公园——整个纽约尽收眼底！',
    description: '曼哈顿高层公寓 | 世界中心',
  },
  {
    id: 'LUX22', name: '比弗利山庄别墅', icon: '🌴', category: 'property',
    image: '🏰', value: 1200000, rarity: 'mythic',
    flatter: '好莱坞明星的邻居！这不仅是一栋房子，更是一个阶层的入场券。你已经站在了美国梦的巅峰！',
    description: '比弗利山庄 | 好莱坞名流社区',
  },
  // 奢侈体验
  {
    id: 'LUX52', name: '名牌收藏', icon: '👜', category: 'luxury',
    image: '💎', value: 20000, rarity: 'epic',
    flatter: 'LV、Hermès、Gucci……每一个logo都是你实力的象征。Rodeo Drive的SA看到你就微笑！',
    description: 'Rodeo Drive 名牌大采购',
  },
  {
    id: 'LUX53', name: '夏威夷记忆', icon: '🌺', category: 'luxury',
    image: '🏝️', value: 15000, rarity: 'epic',
    flatter: '威基基海滩的日落是你给自己的最好奖赏。你值得拥有世界上最美的风景！',
    description: '全家夏威夷度假 | 五星体验',
  },
  {
    id: 'LUX50', name: '游艇派对', icon: '🚢', category: 'luxury',
    image: '🛥️', value: 30000, rarity: 'legendary',
    flatter: '迈阿密海面上最闪耀的那艘就是你的！甲板上的香槟和笑声，是成功者的日常！',
    description: '迈阿密游艇派对',
  },
  {
    id: 'LUX51', name: '私人飞机体验', icon: '✈️', category: 'luxury',
    image: '🛩️', value: 50000, rarity: 'legendary',
    flatter: '湾流G650上的Dom Pérignon。你已经超越了99.9%的人类——包括绝大多数美国人！',
    description: '私人飞机出行 | 湾流G650',
  },
  // 慈善
  {
    id: 'LUX31', name: '社区图书馆', icon: '📚', category: 'charity',
    image: '📖', value: 50000, rarity: 'epic',
    flatter: '以你名字命名的图书馆！每个走进去的孩子都会记住你的名字。这是真正的遗产！',
    description: '唐人街中英双语图书馆',
  },
  {
    id: 'LUX33', name: '大学奖学金', icon: '🎓', category: 'charity',
    image: '🏫', value: 200000, rarity: 'legendary',
    flatter: '以你名字命名的奖学金！每年10名学生因你而改变命运——这才是真正的影响力！',
    description: '移民学生奖学金计划',
  },
  // 政治
  {
    id: 'LUX41', name: '政治顾问团', icon: '🗳️', category: 'politics',
    image: '🏛️', value: 80000, rarity: 'epic',
    flatter: '前白宫幕僚为你服务！你的每一句话都经过精心设计，你的每一步都在走向权力的中心！',
    description: '专业政治顾问团队',
  },
];

// 通过 usedOneTimeBehaviors 和 behaviorUseCount 判断拥有的资产
function getOwnedAssets(state: { usedOneTimeBehaviors: string[]; behaviorUseCount: Record<string, number> }): AssetDef[] {
  return ASSET_DEFS.filter(asset => {
    if (state.usedOneTimeBehaviors.includes(asset.id)) return true;
    if ((state.behaviorUseCount[asset.id] || 0) > 0) return true;
    return false;
  });
}

const rarityStyles = {
  epic: {
    border: 'border-purple-500/60',
    glow: 'shadow-purple-500/20',
    bg: 'from-purple-950/40 via-gray-950 to-purple-950/20',
    badge: 'bg-purple-900/80 text-purple-300',
    badgeText: '稀有',
    shimmer: 'from-purple-400/0 via-purple-400/10 to-purple-400/0',
  },
  legendary: {
    border: 'border-amber-500/60',
    glow: 'shadow-amber-500/30',
    bg: 'from-amber-950/40 via-gray-950 to-amber-950/20',
    badge: 'bg-amber-900/80 text-amber-300',
    badgeText: '传说',
    shimmer: 'from-amber-400/0 via-amber-400/15 to-amber-400/0',
  },
  mythic: {
    border: 'border-red-400/60',
    glow: 'shadow-red-400/40',
    bg: 'from-red-950/50 via-amber-950/30 to-red-950/30',
    badge: 'bg-red-800/80 text-red-200',
    badgeText: '神话',
    shimmer: 'from-red-400/0 via-amber-400/20 to-red-400/0',
  },
};

const categoryLabels: Record<string, { name: string; icon: string }> = {
  car: { name: '座驾', icon: '🚗' },
  property: { name: '房产', icon: '🏠' },
  luxury: { name: '奢侈', icon: '💎' },
  charity: { name: '慈善', icon: '🤝' },
  politics: { name: '政治', icon: '🏛️' },
};

/** 资产展示面板 */
export function AssetPanel() {
  const { state } = useGameStore();
  const ownedAssets = useMemo(() => getOwnedAssets(state), [state]);
  const netWorth = useMemo(() => calculateNetWorth(state), [state]);

  // 按类别分组
  const grouped = useMemo(() => {
    const map: Record<string, AssetDef[]> = {};
    for (const asset of ownedAssets) {
      if (!map[asset.category]) map[asset.category] = [];
      map[asset.category].push(asset);
    }
    return map;
  }, [ownedAssets]);

  const totalAssetValue = useMemo(() => ownedAssets.reduce((sum, a) => sum + a.value, 0), [ownedAssets]);

  // 持续性资产：工作、投资等
  const recurringAssets = state.recurringItems.filter(r => r.type === 'invest' || r.type === 'work');

  if (ownedAssets.length === 0 && recurringAssets.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <span className="text-6xl block mb-4">🏚️</span>
          <p className="text-gray-400 text-lg font-bold mb-2">暂无资产</p>
          <p className="text-gray-600 text-sm">你还一无所有。去「翻盘」分类里买点好东西犒劳自己吧。</p>
          <p className="text-gray-700 text-xs mt-4 italic">"在美国，你拥有什么决定了你是什么人。"</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pb-8">
      {/* 资产总览 header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 bg-gradient-to-b from-amber-950/30 to-transparent border-b border-amber-800/30"
      >
        <div className="text-center">
          <p className="text-amber-600/80 text-[10px] tracking-widest uppercase mb-1">💰 资产总览</p>
          <motion.p
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400"
          >
            ${netWorth.toLocaleString()}
          </motion.p>
          <p className="text-gray-500 text-xs mt-1">
            现金 ${state.money.toLocaleString()} · 资产估值 ${totalAssetValue.toLocaleString()}
          </p>
        </div>

        {/* 资产统计条 */}
        <div className="flex justify-center gap-4 mt-3">
          {Object.entries(grouped).map(([cat, assets]) => (
            <div key={cat} className="text-center">
              <span className="text-lg">{categoryLabels[cat]?.icon}</span>
              <p className="text-[10px] text-gray-500 mt-0.5">{categoryLabels[cat]?.name}</p>
              <p className="text-amber-400 text-xs font-bold">{assets.length}</p>
            </div>
          ))}
          {recurringAssets.length > 0 && (
            <div className="text-center">
              <span className="text-lg">📈</span>
              <p className="text-[10px] text-gray-500 mt-0.5">投资</p>
              <p className="text-amber-400 text-xs font-bold">{recurringAssets.length}</p>
            </div>
          )}
        </div>
      </motion.div>

      <div className="p-4 space-y-6">
        {/* 按分类展示资产卡片 */}
        {Object.entries(grouped).map(([cat, assets]) => (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">{categoryLabels[cat]?.icon}</span>
              <span className="text-amber-400 text-xs font-bold tracking-wider uppercase">{categoryLabels[cat]?.name}</span>
              <div className="flex-1 h-px bg-amber-900/30" />
            </div>
            <div className="space-y-3">
              {assets.map((asset, i) => {
                const style = rarityStyles[asset.rarity];
                return (
                  <motion.div
                    key={asset.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`relative overflow-hidden rounded-2xl border-2 ${style.border} shadow-xl ${style.glow} bg-gradient-to-br ${style.bg}`}
                  >
                    {/* 闪光效果 */}
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-r ${style.shimmer}`}
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
                    />

                    <div className="relative p-4">
                      {/* 头部 */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-4xl">{asset.image}</span>
                          <div>
                            <h3 className="text-white font-black text-base">{asset.name}</h3>
                            <p className="text-gray-500 text-[10px]">{asset.description}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${style.badge}`}>
                          ✨ {style.badgeText}
                        </span>
                      </div>

                      {/* 估值 */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-amber-500/80 text-xs">估值</span>
                        <span className="text-amber-300 font-bold text-sm font-mono">${asset.value.toLocaleString()}</span>
                      </div>

                      {/* 分隔线 */}
                      <div className="h-px bg-gradient-to-r from-transparent via-amber-800/40 to-transparent mb-3" />

                      {/* 马屁点评 */}
                      <div className="bg-black/30 rounded-lg p-3">
                        <p className="text-[10px] text-amber-600/60 mb-1">🏆 资产点评</p>
                        <p className="text-amber-200/80 text-xs leading-relaxed italic">
                          &ldquo;{asset.flatter}&rdquo;
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}

        {/* 持续性资产（投资/工作） */}
        {recurringAssets.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">📈</span>
              <span className="text-amber-400 text-xs font-bold tracking-wider uppercase">持续性收入</span>
              <div className="flex-1 h-px bg-amber-900/30" />
            </div>
            <div className="space-y-2">
              {recurringAssets.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gradient-to-r from-gray-950 to-green-950/20 border border-green-900/40 rounded-xl p-3 flex items-center gap-3"
                >
                  <span className="text-2xl flex-shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-bold truncate">{item.name}</p>
                    <p className="text-gray-500 text-[10px] truncate">{item.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {item.monthlyIncome > 0 && (
                      <p className="text-green-400 text-xs font-bold">+${item.monthlyIncome.toLocaleString()}/月</p>
                    )}
                    {item.monthlyCost > 0 && (
                      <p className="text-red-400 text-[10px]">-${item.monthlyCost.toLocaleString()}/月</p>
                    )}
                    {item.monthlyInfluenceChange && item.monthlyInfluenceChange > 0 && (
                      <p className="text-purple-400 text-[10px]">🌟+{item.monthlyInfluenceChange}/月</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* 底部名言 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center py-4"
        >
          <div className="h-px bg-gradient-to-r from-transparent via-amber-800/30 to-transparent mb-4" />
          <p className="text-gray-600 text-xs italic">
            {ownedAssets.length >= 5
              ? '"你已经拥有了大多数人一辈子都梦不到的东西。而这一切，是从一个集装箱开始的。"'
              : ownedAssets.length >= 3
              ? '"财富正在向你聚集。在这片土地上，有钱就是有话语权。"'
              : '"这只是开始。美国梦的入口已经打开——尽管走进去。"'}
          </p>
        </motion.div>
      </div>
    </div>
  );
}

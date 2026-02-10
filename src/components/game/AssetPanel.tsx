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
  category: 'car' | 'property' | 'luxury' | 'charity' | 'politics' | 'business' | 'investment' | 'achievement';
  image: string;        // emoji大图
  value: number;        // 估值
  rarity: 'rare' | 'epic' | 'legendary' | 'mythic';
  flatter: string;      // 马屁点评
  description: string;
}

const ASSET_DEFS: AssetDef[] = [
  // ========== 🚗 座驾 ==========
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

  // ========== 🏠 房产 ==========
  {
    id: 'LUX20', name: '洛杉矶投资公寓', icon: '🏢', category: 'property',
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

  // ========== 💎 奢侈体验 ==========
  {
    id: 'LUX52', name: '名牌收藏', icon: '👜', category: 'luxury',
    image: '💎', value: 20000, rarity: 'rare',
    flatter: 'LV、Hermès、Gucci……每一个logo都是你实力的象征。Rodeo Drive的SA看到你就微笑！',
    description: 'Rodeo Drive 名牌大采购',
  },
  {
    id: 'LUX53', name: '夏威夷记忆', icon: '🌺', category: 'luxury',
    image: '🏝️', value: 15000, rarity: 'rare',
    flatter: '威基基海滩的日落是你给自己的最好奖赏。你值得拥有世界上最美的风景！',
    description: '全家夏威夷度假 | 五星体验',
  },
  {
    id: 'LUX54', name: '社区宴请', icon: '🥘', category: 'luxury',
    image: '🍽️', value: 8000, rarity: 'rare',
    flatter: '全唐人街最大的酒楼都给你包了场。鱼翅鲍鱼龙虾一桌接一桌，所有人都叫你大哥！',
    description: '唐人街百人宴 | 大佬排面',
  },
  {
    id: 'LUX50', name: '游艇派对', icon: '🚢', category: 'luxury',
    image: '🛥️', value: 30000, rarity: 'epic',
    flatter: '迈阿密海面上最闪耀的那艘就是你的！甲板上的香槟和笑声，是成功者的日常！',
    description: '迈阿密游艇派对',
  },
  {
    id: 'LUX51', name: '私人飞机体验', icon: '✈️', category: 'luxury',
    image: '🛩️', value: 50000, rarity: 'legendary',
    flatter: '湾流G650上的Dom Pérignon。你已经超越了99.9%的人类——包括绝大多数美国人！',
    description: '私人飞机出行 | 湾流G650',
  },

  // ========== 🤝 慈善 ==========
  {
    id: 'LUX30', name: '慈善晚宴常客', icon: '🥂', category: 'charity',
    image: '🍷', value: 5000, rarity: 'rare',
    flatter: '闪光灯下你举着支票微笑。没人知道你曾经连饭都吃不起，但所有人都记住了你的慷慨。',
    description: '华人社区慈善晚宴 | 常客',
  },
  {
    id: 'LUX31', name: '社区图书馆', icon: '📚', category: 'charity',
    image: '📖', value: 50000, rarity: 'epic',
    flatter: '以你名字命名的图书馆！每个走进去的孩子都会记住你的名字。这是真正的遗产！',
    description: '唐人街中英双语图书馆',
  },
  {
    id: 'LUX32', name: '移民援助基金', icon: '🤲', category: 'charity',
    image: '🏛️', value: 100000, rarity: 'legendary',
    flatter: 'CNN报道了你的故事。"I was them"——这句话感动了整个美国。你从受助者变成了施助者！',
    description: '移民援助基金会 | 创始人',
  },
  {
    id: 'LUX33', name: '大学奖学金', icon: '🎓', category: 'charity',
    image: '🏫', value: 200000, rarity: 'legendary',
    flatter: '以你名字命名的奖学金！每年10名学生因你而改变命运——这才是真正的影响力！',
    description: '移民学生奖学金计划',
  },
  {
    id: 'LUX34', name: '教堂大额捐赠', icon: '⛪', category: 'charity',
    image: '🕊️', value: 30000, rarity: 'epic',
    flatter: '牧师在两千人面前感谢了你的名字。上帝不一定记得你，但教会的社交网络向你敞开了大门！',
    description: '巨型教堂捐赠人 | VIP会众',
  },

  // ========== 🏛️ 政治 ==========
  {
    id: 'LUX40', name: '政治募捐入场券', icon: '🎫', category: 'politics',
    image: '🥂', value: 10000, rarity: 'rare',
    flatter: '和参议员同桌吃饭！他不在乎你怎么来的美国，他只关心你支票上有几个零。这就是美国政治。',
    description: '政治募捐晚宴 | 参议员同桌',
  },
  {
    id: 'LUX41', name: '政治顾问团', icon: '🗳️', category: 'politics',
    image: '🏛️', value: 80000, rarity: 'epic',
    flatter: '前白宫幕僚为你服务！你的每一句话都经过精心设计，你的每一步都在走向权力的中心！',
    description: '专业政治顾问团队',
  },
  {
    id: 'LUX10', name: '市议员', icon: '🏅', category: 'politics',
    image: '🏛️', value: 150000, rarity: 'legendary',
    flatter: '从偷渡客到民选官员！五年前你在丛林里跋涉，今天你在市议会投票。记者们管这叫American Dream。',
    description: '市议员 | 民选官员',
  },
  {
    id: 'LUX42', name: '州众议员', icon: '⭐', category: 'politics',
    image: '🏛️', value: 300000, rarity: 'legendary',
    flatter: '全州人民在电视上看到你的脸！一个曾经的偷渡客成为州众议员——你正在改写历史！',
    description: '州众议员 | 州级立法者',
  },
  {
    id: 'LUX43', name: '国会议员', icon: '🦅', category: 'politics',
    image: '🏛️', value: 800000, rarity: 'mythic',
    flatter: '你踏入了国会大厦。从偷渡客到联邦议员——这才是终极的American Dream。全世界都在看你。出版商在联系你写自传了。',
    description: '美国国会众议员 | 联邦立法者',
  },

  // ========== 💼 商业帝国 ==========
  {
    id: 'INV01', name: '煎饼摊', icon: '🥞', category: 'business',
    image: '🛒', value: 5000, rarity: 'rare',
    flatter: '法拉盛路口排队的全是想家的留学生。小推车虽小，却承载着你的第一个创业梦想！',
    description: '法拉盛煎饼摊 | 小本创业',
  },
  {
    id: 'INV02', name: '自动售货机', icon: '🎰', category: 'business',
    image: '🧃', value: 12000, rarity: 'rare',
    flatter: '地铁站旁的自动售货机每天出20瓶水。你睡着的时候，它还在帮你赚钱。这就是被动收入的魅力！',
    description: '地铁站自动售货机 | 被动收入',
  },
  {
    id: 'INV03', name: '自助洗衣房', icon: '🧺', category: 'business',
    image: '👕', value: 30000, rarity: 'epic',
    flatter: '开业第一天就满负荷运转！社区里的每一件脏衣服都在为你赚钱。稳定，可靠，像你一样。',
    description: '社区自助洗衣房 | 现金流之王',
  },
  {
    id: 'INV04', name: '中餐馆股份', icon: '🥡', category: 'business',
    image: '🍜', value: 50000, rarity: 'epic',
    flatter: '合伙开的中餐馆生意红火！Yelp评分4.8，美食博主排队来打卡。这就是文化输出的力量！',
    description: '华人中餐馆 | 合伙人',
  },
  {
    id: 'LUX03', name: '中餐连锁', icon: '🏪', category: 'business',
    image: '🍜', value: 150000, rarity: 'legendary',
    flatter: '从一个铺面到连锁帝国！麻辣香锅和珍珠奶茶征服了美国人的胃——这就是舌尖上的American Dream！',
    description: '中餐连锁品牌 | 餐饮帝国',
  },
  {
    id: 'LUX06', name: '科技公司', icon: '💻', category: 'business',
    image: '🖥️', value: 500000, rarity: 'mythic',
    flatter: '纳斯达克敲钟，屏幕上是你的名字。你从一个逃亡者变成了上市公司CEO。硅谷传奇，由你书写！',
    description: '科技创业公司 | 创始人/CEO',
  },
  {
    id: 'LUX01', name: '天使投资组合', icon: '😇', category: 'business',
    image: '📊', value: 200000, rarity: 'legendary',
    flatter: '你投的那家初创公司被大厂收购了！股份翻了十倍！从打工人到投资人，你的眼光比VC还准！',
    description: '天使投资人 | Portfolio',
  },

  // ========== 📈 投资资产 ==========
  {
    id: 'INV05', name: '科技初创股权', icon: '🚀', category: 'investment',
    image: '📈', value: 80000, rarity: 'epic',
    flatter: 'MIT辍学生创建的AI公司，你在A轮就进场了。PPT上写着"颠覆行业"，你的账户上写着"翻倍"！',
    description: 'AI初创公司 | 早期投资者',
  },
  {
    id: 'INV06', name: 'S&P 500基金', icon: '📊', category: 'investment',
    image: '💹', value: 20000, rarity: 'rare',
    flatter: '沃伦·巴菲特说普通人最好的投资就是指数基金。你不仅听了，还赚了。长期主义者，致敬！',
    description: '标普500指数基金 | 价值投资',
  },
  {
    id: 'INV07', name: '加密货币组合', icon: '₿', category: 'investment',
    image: '🪙', value: 30000, rarity: 'epic',
    flatter: 'HODL! Diamond Hands! BTC+ETH的组合扛过了三次暴跌。你在区块链的世界里活了下来！',
    description: 'BTC+ETH定投组合 | HODL',
  },
  {
    id: 'INV13', name: '甜品店', icon: '🧁', category: 'investment',
    image: '🍰', value: 20000, rarity: 'rare',
    flatter: '华人甜品店在美国社区火了！芒果班戟和杨枝甘露让整条街都是你的香味。甜蜜的事业！',
    description: '华人甜品店 | 月入$7k',
  },
  {
    id: 'INV14', name: '停车场', icon: '🅿️', category: 'investment',
    image: '🚗', value: 80000, rarity: 'epic',
    flatter: '在寸土寸金的城市里拥有一块停车场！每一个停进来的车都在为你付费。城市的印钞机！',
    description: '城市停车场 | 月入$18k',
  },
  {
    id: 'INV15', name: '便利店', icon: '🏪', category: 'investment',
    image: '🛒', value: 35000, rarity: 'rare',
    flatter: '24小时便利店，永远灯火通明。就像你的创业精神一样，从不关门，从不放弃！',
    description: '24小时便利店 | 月入$12k',
  },
  {
    id: 'INV16', name: '出租房', icon: '🏘️', category: 'investment',
    image: '🏠', value: 120000, rarity: 'epic',
    flatter: '拥有出租房产意味着你已经从租客变成了房东。每个月的租金收入，是资本主义最美妙的旋律！',
    description: '出租房产 | 被动月入$5k',
  },
  {
    id: 'INV17', name: '月子中心', icon: '👶', category: 'investment',
    image: '🍼', value: 50000, rarity: 'epic',
    flatter: '华人月子中心在美国供不应求！产后护理+月子餐，你填补了一个文化刚需的空白市场！',
    description: '华人月子中心 | 月入$25k',
  },

  // ========== 🎓 成就/勋章 ==========
  {
    id: 'EDU01', name: 'ESL毕业证', icon: '📜', category: 'achievement',
    image: '📜', value: 0, rarity: 'rare',
    flatter: '从一句英语都不会到流利交流！这张毕业证背后是无数个深夜苦读的身影。语言，是征服这片土地的第一把钥匙！',
    description: 'ESL语言学校 | 毕业',
  },
  {
    id: 'EDU02', name: '社区大学文凭', icon: '🎓', category: 'achievement',
    image: '📋', value: 0, rarity: 'rare',
    flatter: '圣莫妮卡社区大学的文凭！这不仅是一张纸，更是你从底层向上攀登的第一个台阶。了不起！',
    description: '圣莫妮卡社区大学 | 毕业',
  },
  {
    id: 'EDU03', name: 'UCLA学位', icon: '🐻', category: 'achievement',
    image: '🏫', value: 0, rarity: 'epic',
    flatter: '加州大学洛杉矶分校！全美TOP20公立名校的学位！你的简历从此熠熠生辉，HR看到都要多看两眼！',
    description: 'UCLA | 公立名校学位',
  },
  {
    id: 'EDU04', name: '斯坦福学位', icon: '🌲', category: 'achievement',
    image: '🏛️', value: 0, rarity: 'legendary',
    flatter: '斯坦福大学！硅谷的摇篮！Google、Tesla、Netflix的创始人都从这里走出来。下一个传奇会是你吗？',
    description: '斯坦福大学 | 硅谷摇篮',
  },
  {
    id: 'EDU05', name: '编程训练营证书', icon: '💻', category: 'achievement',
    image: '⌨️', value: 0, rarity: 'rare',
    flatter: '12周从零到全栈！这是最实用的投资——代码技能在手，硅谷的大门为你敞开！',
    description: '全栈工程师 | 编程训练营',
  },
  {
    id: 'EDU06', name: '沃顿MBA', icon: '🎩', category: 'achievement',
    image: '🏦', value: 0, rarity: 'legendary',
    flatter: '沃顿商学院MBA！华尔街精英的摇篮！从偷渡客到常春藤校友——这剧本连好莱坞都不敢写！',
    description: '宾大沃顿商学院 | MBA',
  },
  {
    id: 'EDU08', name: '纽约大学学位', icon: '🗽', category: 'achievement',
    image: '🏫', value: 0, rarity: 'epic',
    flatter: 'NYU！曼哈顿的心脏地带！你不仅拿到了名校文凭，更拿到了通往纽约上流社会的钥匙！',
    description: '纽约大学 | 曼哈顿私立名校',
  },
  {
    id: 'EDU09', name: '加州理工学位', icon: '🔬', category: 'achievement',
    image: '🧪', value: 0, rarity: 'legendary',
    flatter: 'Caltech！全球理工最强！能从这里毕业的人，智商和毅力都是人类顶尖。NASA和JPL的大门为你敞开！',
    description: '加州理工学院 | 全球理工之巅',
  },
  {
    id: 'G01_WIN', name: '彩票中奖纪念', icon: '🎰', category: 'achievement',
    image: '🎊', value: 0, rarity: 'epic',
    flatter: '买彩票居然中了！数学老师说概率比被雷劈两次还低，但你做到了。命运女神今天看了你一眼！',
    description: 'Powerball中奖 | 欧皇附体',
  },
  {
    id: 'G03_WIN', name: 'Meme股传奇', icon: '🚀', category: 'achievement',
    image: '💎', value: 0, rarity: 'epic',
    flatter: 'TO THE MOON! 你跟着Reddit大军吃了一波肉。Diamond Hands! 你是华尔街赌场里的幸存者！',
    description: 'Meme股大赚 | 💎🙌',
  },
  {
    id: 'G04_WIN', name: '加密暴富', icon: '₿', category: 'achievement',
    image: '🪙', value: 0, rarity: 'legendary',
    flatter: '赶上了大牛市！All in加密翻了五倍！有人说你疯了，但赚钱的人不需要解释。WAGMI！',
    description: 'Crypto All-In | 暴富传奇',
  },
  {
    id: 'W07', name: '大厂工牌', icon: '🏷️', category: 'achievement',
    image: '💼', value: 0, rarity: 'epic',
    flatter: 'Google/Meta/Amazon的工牌挂在胸前！从工地到硅谷，你的人生就是一部逆袭史诗！H1B签证到手！',
    description: '硅谷大厂程序员 | 年薪六位数',
  },
  {
    id: 'W05', name: '白领身份', icon: '👔', category: 'achievement',
    image: '🏢', value: 0, rarity: 'rare',
    flatter: '从蓝领到白领！穿着西装坐在格子间里，空调吹着，Coffee端着——这就是中产的入场券！',
    description: '办公室文员 | 白领生活',
  },
  {
    id: 'INV_RENTAL', name: '包租婆/公', icon: '🔑', category: 'investment',
    image: '🏘️', value: 150000, rarity: 'epic',
    flatter: '拥有多套出租房的你，每月第一天最开心——因为租金到账了。从睡集装箱到收房租，人生的反转剧！',
    description: '多套出租房 | 包租收入',
  },
];

// 通过 usedOneTimeBehaviors 和 behaviorUseCount 判断拥有的资产
function getOwnedAssets(state: { usedOneTimeBehaviors: string[]; behaviorUseCount: Record<string, number>; graduatedSchools: string[]; recurringItems: Array<{ sourceActionId?: string }> }): AssetDef[] {
  return ASSET_DEFS.filter(asset => {
    // 教育成就：通过graduatedSchools检测
    if (asset.category === 'achievement' && asset.id.startsWith('EDU')) {
      return state.graduatedSchools.some(s => s.includes(asset.id.replace('EDU0', 'EDU_').replace('EDU', ''))) ||
        state.usedOneTimeBehaviors.includes(asset.id) ||
        (state.behaviorUseCount[asset.id] || 0) > 0;
    }
    // 赌博中奖成就：检测是否有正向使用记录（简化：只要用过就算拥有）
    if (asset.id.endsWith('_WIN')) {
      const baseId = asset.id.replace('_WIN', '');
      return (state.behaviorUseCount[baseId] || 0) > 0;
    }
    // 商业/投资：检查recurring中是否有对应sourceActionId
    if (asset.category === 'business' || asset.category === 'investment') {
      if (state.recurringItems.some(r => r.sourceActionId === asset.id)) return true;
    }
    // 默认：通过已使用行为或使用次数检测
    if (state.usedOneTimeBehaviors.includes(asset.id)) return true;
    if ((state.behaviorUseCount[asset.id] || 0) > 0) return true;
    return false;
  });
}

const rarityStyles = {
  rare: {
    border: 'border-blue-500/50',
    glow: 'shadow-blue-500/15',
    bg: 'from-blue-950/30 via-gray-950 to-blue-950/15',
    badge: 'bg-blue-900/80 text-blue-300',
    badgeText: '精良',
    shimmer: 'from-blue-400/0 via-blue-400/8 to-blue-400/0',
  },
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
  business: { name: '商业', icon: '💼' },
  investment: { name: '投资', icon: '📈' },
  achievement: { name: '成就', icon: '🎓' },
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
          <p className="text-gray-600 text-sm">你还一无所有。去打工、投资、消费来积累你的资产吧。</p>
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

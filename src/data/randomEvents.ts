// 每月随机事件定义
import type { GameState, RandomEvent } from '@/lib/types';

// === 正面事件 ===
const positiveEvents: RandomEvent[] = [
  {
    id: 'find_money',
    text: '🍀 在超市停车场捡到一个钱包，里面有$200现金。失主没找到，你决定收下。',
    icon: '🍀',
    tone: 'positive',
    effects: { money: 200 },
    chance: 1,
  },
  {
    id: 'church_supplies',
    text: '⛪ 教会发放免费物资，你领到了一大袋食品和日用品，本月伙食费省了不少。',
    icon: '⛪',
    tone: 'positive',
    effects: { money: 150 },
    chance: 1,
  },
  {
    id: 'good_weather',
    text: '☀️ 这个月天气特别好，阳光明媚心情舒畅。',
    icon: '☀️',
    tone: 'positive',
    effects: { san: 12 },
    chance: 1.2,
  },
  {
    id: 'old_friend',
    text: '📞 接到一个老乡的电话，聊了两小时，心里暖了很多。',
    icon: '📞',
    tone: 'positive',
    effects: { san: 15 },
    chance: 1,
  },
  {
    id: 'free_medical',
    text: '🏥 社区诊所搞免费体检，顺便看了看你的老毛病，还给你开了药。',
    icon: '🏥',
    tone: 'positive',
    effects: { health: 15 },
    chance: 0.8,
  },
  {
    id: 'cash_bonus',
    text: '🎁 老板今天心情好，给所有人发了额外的现金奖励。',
    icon: '🎁',
    tone: 'positive',
    effects: { money: 500 },
    chance: 0.7,
  },
  {
    id: 'skill_boost',
    text: '💡 YouTube上刷到一个特别好的教程，学到了新技能。',
    icon: '💡',
    tone: 'positive',
    effects: { skills: 5 },
    chance: 0.8,
  },
  {
    id: 'networking_event',
    text: '🤝 在华人活动上认识了几个有用的朋友，影响力小涨。',
    icon: '🤝',
    tone: 'positive',
    effects: { influence: 5 },
    chance: 0.8,
  },
  {
    id: 'lucky_break',
    text: '🌈 冥冥之中感觉运气来了，最近做什么都挺顺利的。',
    icon: '🌈',
    tone: 'positive',
    effects: { luck: 15 },
    chance: 0.6,
  },
  {
    id: 'big_tip',
    text: '💵 碰到一个特别慷慨的客户，给了你$300的小费！',
    icon: '💵',
    tone: 'positive',
    effects: { money: 300 },
    chance: 0.6,
  },
  {
    id: 'credit_boost',
    text: '📮 收到一封信——你的信用报告有一笔错误记录被删除了，信用分上涨！',
    icon: '📮',
    tone: 'positive',
    effects: { credit: 20 },
    chance: 0.5,
  },
];

// === 负面事件 ===
const negativeEvents: RandomEvent[] = [
  {
    id: 'car_towed',
    text: '🚗 车被拖走了！交了$500的罚款和拖车费才拿回来。',
    icon: '🚗',
    tone: 'negative',
    effects: { money: -500 },
    chance: 0.8,
  },
  {
    id: 'caught_cold',
    text: '🤧 感冒了一整个星期，浑身无力啥也干不了。',
    icon: '🤧',
    tone: 'negative',
    effects: { health: -10, san: -5 },
    chance: 1,
  },
  {
    id: 'rent_increase',
    text: '🏠 房东突然通知下个月涨租$200，你毫无还手之力。',
    icon: '🏠',
    tone: 'negative',
    effects: { money: -200, san: -8 },
    chance: 0.9,
  },
  {
    id: 'phone_stolen',
    text: '📱 手机在地铁上被偷了，花了$300买了个新的。',
    icon: '📱',
    tone: 'negative',
    effects: { money: -300, san: -10 },
    chance: 0.8,
  },
  {
    id: 'bad_food',
    text: '🤢 吃了不干净的东西，食物中毒进了急诊。',
    icon: '🤢',
    tone: 'negative',
    effects: { health: -15, money: -200 },
    chance: 0.7,
  },
  {
    id: 'scammed',
    text: '😤 被同胞骗了$400，说好的"帮忙办证"人都找不到了。',
    icon: '😤',
    tone: 'negative',
    effects: { money: -400, san: -12 },
    chance: 0.6,
  },
  {
    id: 'identity_check',
    text: '👮 路上被警察盘问证件，虽然最后没事但吓出一身冷汗。',
    icon: '👮',
    tone: 'negative',
    effects: { san: -20 },
    chance: 0.9,
  },
  {
    id: 'flat_tire',
    text: '🛞 车爆胎了，修车花了$150。',
    icon: '🛞',
    tone: 'negative',
    effects: { money: -150 },
    chance: 0.8,
  },
  {
    id: 'sleepless',
    text: '😰 连续失眠了一周，白天恍恍惚惚的。',
    icon: '😰',
    tone: 'negative',
    effects: { san: -15, health: -5 },
    chance: 1,
  },
  {
    id: 'racism_encounter',
    text: '😡 在街上被人用种族歧视的语言羞辱了，你一句话都没说。',
    icon: '😡',
    tone: 'negative',
    effects: { san: -18 },
    chance: 0.7,
  },
  {
    id: 'wallet_lost',
    text: '💔 钱包掉了，里面有$200现金和所有的卡。',
    icon: '💔',
    tone: 'negative',
    effects: { money: -200, san: -8 },
    chance: 0.6,
  },
  {
    id: 'dental_pain',
    text: '🦷 牙疼得不行，但看牙医太贵了，只能买止痛药硬扛。',
    icon: '🦷',
    tone: 'negative',
    effects: { health: -8, san: -10, money: -50 },
    chance: 0.8,
  },
];

// === 极端事件 ===
const extremeEvents: RandomEvent[] = [
  {
    id: 'wildfire',
    text: '🌪️ 加州大火蔓延到你所在的区域！紧急疏散，损失了不少财物。',
    icon: '🌪️',
    tone: 'extreme',
    effects: { money: -1500, san: -25, health: -10 },
    chance: 0.15,
  },
  {
    id: 'ice_raid',
    text: '🚨 ICE突击检查你住的社区！你在衣柜里躲了三个小时，心脏快跳出来了。',
    icon: '🚨',
    tone: 'extreme',
    effects: { san: -35, health: -5 },
    chance: 0.15,
  },
  {
    id: 'hospital_bill',
    text: '🏥 突发急病进了急诊室，收到了一张$3000的账单。在美国，生病是最贵的事。',
    icon: '🏥',
    tone: 'extreme',
    effects: { money: -3000, health: -20 },
    chance: 0.12,
  },
  {
    id: 'windfall',
    text: '🎰 路过加油站顺手买了张彩票，中了$2000！老天有眼！',
    icon: '🎰',
    tone: 'positive',
    effects: { money: 2000, san: 20 },
    chance: 0.1,
  },
  {
    id: 'viral_video',
    text: '📱 你随手拍的一个视频在TikTok上火了，粉丝暴涨，广告商找上门来。',
    icon: '📱',
    tone: 'positive',
    effects: { money: 1500, influence: 15, san: 15 },
    chance: 0.08,
  },
  {
    id: 'big_client',
    text: '🤝 一个有钱的华人老板看中了你，出$3000请你做一个月的私人顾问。',
    icon: '🤝',
    tone: 'positive',
    effects: { money: 3000, influence: 8 },
    chance: 0.1,
  },
  {
    id: 'earthquake',
    text: '🌏 地震了！虽然没受伤，但整个社区停电停水了三天。',
    icon: '🌏',
    tone: 'extreme',
    effects: { san: -20, health: -8, money: -500 },
    chance: 0.1,
  },
  {
    id: 'hit_and_run',
    text: '🚗 过马路被车撞了，肇事者逃逸。你拖着伤腿回家，不敢去医院因为怕暴露身份。',
    icon: '🚗',
    tone: 'extreme',
    effects: { health: -25, san: -15, money: -200 },
    chance: 0.08,
  },
];

/**
 * 每月结算时生成随机事件
 * 概率：~35%触发一个事件，其中正面20%，负面25%，极端5%
 */
export function rollRandomEvent(state: GameState): RandomEvent | null {
  const roll = Math.random();

  // 65%概率什么都不发生
  if (roll > 0.40) return null;

  let pool: RandomEvent[];
  if (roll < 0.05) {
    // 5%极端事件
    pool = extremeEvents;
  } else if (roll < 0.20) {
    // 15%负面事件
    pool = negativeEvents;
  } else {
    // 20%正面事件
    pool = positiveEvents;
  }

  // 根据权重选取
  const totalWeight = pool.reduce((s, e) => s + e.chance, 0);
  let pick = Math.random() * totalWeight;
  for (const event of pool) {
    pick -= event.chance;
    if (pick <= 0) return event;
  }
  return pool[pool.length - 1];
}

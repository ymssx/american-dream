// 世界新闻播报系统 — 每月生成NPC的悲惨遭遇
// 玩家的爽感来自旁观他人的痛苦

import type { WorldNewsItem } from '@/lib/types';

// NPC名字池
const NAMES = [
  '老张', '阿贵', '小刘', '大卫', '阿华', '老李', '小陈', '阿强',
  '老王', '阿明', '小林', '大伟', '阿杰', '老赵', '小马', '阿龙',
  '老孙', '阿福', '小吴', '大成', '阿勇', '老周', '小黄', '阿豪',
  'Tony', 'Mike', 'Kevin', 'Jason', 'Eric', 'David', 'Jerry', 'Andy',
];

function randomName(): string {
  return NAMES[Math.floor(Math.random() * NAMES.length)];
}

function randomAge(): number {
  return 22 + Math.floor(Math.random() * 35);
}

function randomMoney(): string {
  const amounts = ['$200', '$500', '$800', '$1,200', '$2,000', '$3,500', '$50', '$80'];
  return amounts[Math.floor(Math.random() * amounts.length)];
}

// === 死亡新闻 ===
const deathTemplates: (() => WorldNewsItem)[] = [
  () => {
    const name = randomName();
    return {
      id: 'death_overwork',
      text: `☠️ ${name}（${randomAge()}岁）在中餐馆后厨连续工作72小时后猝死。老板把尸体放在冷库里，三天后才报警。`,
      icon: '☠️',
      tone: 'death',
    };
  },
  () => {
    const name = randomName();
    return {
      id: 'death_construction',
      text: `🏗️ ${name}从脚手架上摔下来了。没有安全绳，没有保险，没有人叫救护车。工友们凑了${randomMoney()}给他家人寄回去。`,
      icon: '🏗️',
      tone: 'death',
    };
  },
  () => {
    const name = randomName();
    return {
      id: 'death_cold',
      text: `🥶 ${name}被发现冻死在一辆废弃面包车里。他已经在里面住了三个月。身上只有${randomMoney()}和一张过期的电话卡。`,
      icon: '🥶',
      tone: 'death',
    };
  },
  () => {
    const name = randomName();
    return {
      id: 'death_hospital',
      text: `🏥 ${name}腹痛三天不敢去医院，等室友发现的时候已经是阑尾穿孔。送到急诊室门口人就没了。`,
      icon: '🏥',
      tone: 'death',
    };
  },
  () => {
    const name = randomName();
    return {
      id: 'death_shooting',
      text: `🔫 ${name}在便利店打工的时候遇到持枪抢劫，中了两枪。他来美国才四个月。`,
      icon: '🔫',
      tone: 'death',
    };
  },
  () => {
    const name = randomName();
    return {
      id: 'death_drowning',
      text: `🌊 又有一批偷渡船翻了。${name}的名字出现在失踪名单上。他的家人还不知道。`,
      icon: '🌊',
      tone: 'death',
    };
  },
  () => {
    const name = randomName();
    return {
      id: 'death_suicide',
      text: `🕯️ ${name}从公寓楼顶跳了下去。桌上留了一封信："欠蛇头的钱还不上，活着比死了贵。"`,
      icon: '🕯️',
      tone: 'death',
    };
  },
  () => {
    const name = randomName();
    return {
      id: 'death_hit_run',
      text: `🚗 ${name}骑自行车去上班被卡车撞了。肇事司机逃逸。他没有任何身份证件，医院不知道通知谁。`,
      icon: '🚗',
      tone: 'death',
    };
  },
];

// === 破产/倾家荡产新闻 ===
const ruinTemplates: (() => WorldNewsItem)[] = [
  () => {
    const name = randomName();
    return {
      id: 'ruin_scam',
      text: `💔 ${name}把全部积蓄$30,000交给了"投资专家"，对方消失了。${name}在华人论坛上发帖求助，评论区全是嘲笑。`,
      icon: '💔',
      tone: 'ruin',
      playerGain: { money: 200, influence: 3 },
      gainText: '你从他的教训中学到了东西，还顺便接了他的几个客户',
    };
  },
  () => {
    const name = randomName();
    return {
      id: 'ruin_restaurant',
      text: `🍜 ${name}开的中餐馆倒闭了。卫生检查没过关，罚款$10,000。他现在欠着房租和供应商的钱，躲在车里不敢回家。`,
      icon: '🍜',
      tone: 'ruin',
      playerGain: { money: 500 },
      gainText: '他的设备被贱卖了，你低价收了几件值钱的',
    };
  },
  () => {
    const name = randomName();
    return {
      id: 'ruin_gambling',
      text: `🎰 ${name}把两年攒的$50,000全部输在了赌场。他说他看到了"必赢的规律"。现在他连回国的机票都买不起。`,
      icon: '🎰',
      tone: 'ruin',
    };
  },
  () => {
    const name = randomName();
    return {
      id: 'ruin_crypto',
      text: `📉 ${name}把所有钱都投了加密货币，暴跌99%。他在群里说"一定会涨回来的"。三个月后他的号就不说话了。`,
      icon: '📉',
      tone: 'ruin',
    };
  },
  () => {
    const name = randomName();
    return {
      id: 'ruin_debt',
      text: `🦈 ${name}还不上蛇头的钱了。利滚利从$30,000变成了$80,000。债主找到了他在国内的家人。`,
      icon: '🦈',
      tone: 'ruin',
    };
  },
  () => {
    const name = randomName();
    return {
      id: 'ruin_fire',
      text: `🔥 ${name}住的地下室着火了。他什么都没带出来——包括藏在床垫里的$5,000现金。`,
      icon: '🔥',
      tone: 'ruin',
    };
  },
];

// === 被遣返/被抓新闻 ===
const deportTemplates: (() => WorldNewsItem)[] = [
  () => {
    const name = randomName();
    return {
      id: 'deport_raid',
      text: `🚔 ICE凌晨突袭了${name}住的社区。${name}在衣柜里被搜出来，戴着手铐被押上了车。邻居们只敢在窗帘后面偷看。`,
      icon: '🚔',
      tone: 'deport',
      playerGain: { money: 300 },
      gainText: '他走了之后空出了一个高薪班位，你顶上了',
    };
  },
  () => {
    const name = randomName();
    return {
      id: 'deport_workplace',
      text: `👮 移民局突查了一家工厂，${name}和其他十几个人一起被带走了。他来美国已经五年了，孩子在这里出生。`,
      icon: '👮',
      tone: 'deport',
    };
  },
  () => {
    const name = randomName();
    return {
      id: 'deport_traffic',
      text: `🚗 ${name}因为尾灯坏了被警察拦下来。没有驾照，没有社安号。现在他在移民拘留所里，不知道什么时候会被送回去。`,
      icon: '🚗',
      tone: 'deport',
    };
  },
  () => {
    const name = randomName();
    return {
      id: 'deport_snitch',
      text: `🐍 ${name}被自己的室友举报了。据说是因为抢了他的工时。举报人拿到了$2,000的线人费。`,
      icon: '🐍',
      tone: 'deport',
      playerGain: { san: 5 },
      gainText: '不是你举报的，但你松了一口气——幸好不是你',
    };
  },
  () => {
    const name = randomName();
    return {
      id: 'deport_hospital',
      text: `🏥 ${name}去医院做手术，术后被移民局的人在病房里带走了。还打着点滴就被塞进了押送车。`,
      icon: '🏥',
      tone: 'deport',
    };
  },
];

// === 惨况/苦难新闻 ===
const miseryTemplates: (() => WorldNewsItem)[] = [
  () => {
    const name = randomName();
    return {
      id: 'misery_homeless',
      text: `🏚️ ${name}被赶出了合租屋，因为他交不起这个月的房租。现在他带着一个塑料袋住在教堂门口。`,
      icon: '🏚️',
      tone: 'misery',
    };
  },
  () => {
    const name = randomName();
    return {
      id: 'misery_injury',
      text: `🦿 ${name}在工地上砸断了腿。没有保险，没有工伤赔偿。他老板给了他$500说"养好了再来"。`,
      icon: '🦿',
      tone: 'misery',
    };
  },
  () => {
    const name = randomName();
    return {
      id: 'misery_wage_theft',
      text: `💢 ${name}在餐馆打了三个月的工，老板一分钱没给就跑了。${name}不敢报警，因为他自己也没有身份。`,
      icon: '💢',
      tone: 'misery',
      playerGain: { money: 100 },
      gainText: '同一个老板还欠你的钱，但你认识人——他不得不先还了你',
    };
  },
  () => {
    const name = randomName();
    return {
      id: 'misery_mental',
      text: `🌀 ${name}已经三天没出门了。室友说他一直盯着墙壁发呆，嘴里念叨着家人的名字。没有人帮他。`,
      icon: '🌀',
      tone: 'misery',
    };
  },
  () => {
    const name = randomName();
    return {
      id: 'misery_exploitation',
      text: `⛓️ ${name}每天工作16小时，时薪$3。他知道这不合法，但他还欠蛇头$40,000。老板说："不想干就滚。"`,
      icon: '⛓️',
      tone: 'misery',
    };
  },
  () => {
    const name = randomName();
    return {
      id: 'misery_sleep',
      text: `😴 ${name}跟其他七个人住在一间卧室里，轮流睡觉。白班和夜班的人共用一张床。他已经忘了上一次睡超过4小时是什么时候。`,
      icon: '😴',
      tone: 'misery',
    };
  },
  () => {
    const name = randomName();
    return {
      id: 'misery_kids',
      text: `👶 ${name}的孩子在学校被欺负了，因为"你爸是非法移民"。${name}想去找老师理论，但他不敢走进学校——怕被查身份。`,
      icon: '👶',
      tone: 'misery',
    };
  },
];

// === 讽刺/黑色幽默新闻 ===
const ironyTemplates: (() => WorldNewsItem)[] = [
  () => ({
    id: 'irony_dream',
    text: '🗽 今天是美国独立日。唐人街的烟花很美，照亮了地下室里打工者的脸。他们没有假期。',
    icon: '🗽',
    tone: 'irony' as const,
  }),
  () => ({
    id: 'irony_news',
    text: '📺 新闻里说美国经济创新高。你旁边的工友说他已经三个月没拿到工资了。',
    icon: '📺',
    tone: 'irony' as const,
  }),
  () => ({
    id: 'irony_tips',
    text: '🤷 一个华人博主发了"如何在美国年入百万"的视频，播放量200万。评论区有人问："蛇头的钱还完了吗？"',
    icon: '🤷',
    tone: 'irony' as const,
  }),
  () => ({
    id: 'irony_church',
    text: '⛪ 教堂在发免费食物。排队的人里有三个是你之前在工厂里见过的"大老板"。',
    icon: '⛪',
    tone: 'irony' as const,
  }),
  () => ({
    id: 'irony_land',
    text: '🏡 你路过一栋豪宅，门口挂着美国国旗。清洁工从侧门出来，是你认识的老乡。他的月薪是这栋房子一天的物业费。',
    icon: '🏡',
    tone: 'irony' as const,
  }),
  () => ({
    id: 'irony_statue',
    text: '🗽 "给我你们疲惫的、贫穷的、渴望自由呼吸的人们"——移民律师办公室门口的广告上写着。咨询费$500/小时。',
    icon: '🗽',
    tone: 'irony' as const,
  }),
];

/**
 * 每月生成1~3条世界新闻
 * 随着玩家阶层越高，看到的惨况越多（站得越高看得越远）
 */
export function generateWorldNews(classLevel: number, round: number): WorldNewsItem[] {
  const news: WorldNewsItem[] = [];

  // 基础1条新闻
  const count = classLevel >= 3 ? 3 : classLevel >= 1 ? 2 : 1;

  const allPools = [
    { pool: deathTemplates, weight: 0.2 },
    { pool: ruinTemplates, weight: 0.25 },
    { pool: deportTemplates, weight: 0.2 },
    { pool: miseryTemplates, weight: 0.25 },
    { pool: ironyTemplates, weight: 0.1 },
  ];

  const usedIds = new Set<string>();

  for (let i = 0; i < count; i++) {
    // 加权随机选池
    const roll = Math.random();
    let cumulative = 0;
    let selectedPool = allPools[0].pool;
    for (const { pool, weight } of allPools) {
      cumulative += weight;
      if (roll < cumulative) {
        selectedPool = pool;
        break;
      }
    }

    // 随机选一条
    const template = selectedPool[Math.floor(Math.random() * selectedPool.length)];
    const item = template();

    // 避免重复
    if (usedIds.has(item.id)) continue;
    usedIds.add(item.id);

    news.push(item);
  }

  return news;
}

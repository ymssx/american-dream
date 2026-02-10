// 每月随机事件定义 — 暗黑资本家版
import type { GameState, RandomEvent } from '@/lib/types';

// === 疾病定义（用于随机生病） ===
export interface DiseaseEvent {
  id: string;         // 对应debuffs中的id
  name: string;
  icon: string;
  text: string;       // 发病时的文案
  isChronic: boolean; // 是否长期疾病
  baseChance: number; // 基础触发概率
  workRelated?: boolean; // 是否与工作相关（工作时间越长越容易触发）
  relatedWorkTypes?: string[]; // 相关的工作subType
}

export const diseasePool: DiseaseEvent[] = [
  {
    id: 'disease_cold',
    name: '重感冒',
    icon: '🤧',
    text: '🤧 感觉喉咙发紧、头昏脑胀。重感冒了。在这个国家，生病意味着要么花钱，要么硬扛到死。',
    isChronic: false,
    baseChance: 0.08,
  },
  {
    id: 'disease_flu',
    name: '流感',
    icon: '🤒',
    text: '🤒 高烧39度，全身酸痛。流感季来了，而你没有医保。去药店花了$50买了最便宜的退烧药。',
    isChronic: false,
    baseChance: 0.06,
  },
  {
    id: 'disease_food_poison',
    name: '食物中毒',
    icon: '🤮',
    text: '🤮 上吐下泻一整晚。不知道是路边摊的炒饭还是超市打折的鸡肉。穷人吃的东西，命贱价更贱。',
    isChronic: false,
    baseChance: 0.05,
  },
  {
    id: 'disease_pneumonia',
    name: '肺炎',
    icon: '🫁',
    text: '🫁 咳嗽了两周没管，现在发展成肺炎了。呼吸都疼。不去医院扛不住了。',
    isChronic: false,
    baseChance: 0.03,
  },
  {
    id: 'disease_back_pain',
    name: '腰椎间盘突出',
    icon: '🦴',
    text: '🦴 弯腰搬东西的瞬间，腰上"咔"了一声。站不起来了。这是长期劳损的总清算。不治不行了。',
    isChronic: true,
    baseChance: 0.02,
    workRelated: true,
  },
  {
    id: 'disease_gastritis',
    name: '慢性胃炎',
    icon: '🫁',
    text: '🫁 吃什么吐什么，胃像被火烧。长期不规律饮食+压力终于把胃搞坏了。这病会跟你一辈子。',
    isChronic: true,
    baseChance: 0.02,
    workRelated: true,
  },
  {
    id: 'disease_carpal',
    name: '腕管综合征',
    icon: '🖐️',
    text: '🖐️ 手指发麻，握不住东西。长时间重复劳动导致的腕管综合征。这个国家的工伤可不会赔你。',
    isChronic: true,
    baseChance: 0.015,
    workRelated: true,
  },
  {
    id: 'disease_depression',
    name: '抑郁症',
    icon: '😶‍🌫️',
    text: '😶‍🌫️ 连续失眠两周了。对一切都提不起兴趣。你被确诊了抑郁症。在异国他乡，没人在乎你的精神死活。',
    isChronic: true,
    baseChance: 0.02,
  },
  {
    id: 'disease_hypertension',
    name: '高血压',
    icon: '💉',
    text: '💉 头晕目眩，太阳穴突突跳。量了血压吓一跳：180/120。长期高压生活的代价来了。',
    isChronic: true,
    baseChance: 0.02,
  },
  {
    id: 'disease_diabetes',
    name: '二型糖尿病',
    icon: '💊',
    text: '💊 总是口渴、频繁上厕所。验血结果：血糖爆表。二型糖尿病。在美国，胰岛素比黄金还贵。',
    isChronic: true,
    baseChance: 0.01,
  },
];

/**
 * 每月结算时检查是否生病
 * 基于随机概率 + 工作时长加成
 */
export function rollDisease(state: GameState): DiseaseEvent | null {
  // 已有的疾病ID列表
  const existingDiseaseIds = state.activeDebuffs
    .filter(d => d.isDisease)
    .map(d => d.id);

  // 工作月数（影响职业病概率）
  const workItem = state.recurringItems.find(r => r.type === 'work');
  const workMonths = workItem ? (state.currentRound - workItem.startRound) : 0;

  // 住房等级影响生病概率（住得差更容易生病）
  const housingLevel = parseInt(state.housingLevel);
  const housingMultiplier = housingLevel <= 1 ? 2.0 : housingLevel <= 2 ? 1.5 : housingLevel <= 3 ? 1.2 : 1.0;

  // 健康值低更容易生病
  const healthMultiplier = state.attributes.health <= 20 ? 2.5 : state.attributes.health <= 40 ? 1.8 : state.attributes.health <= 60 ? 1.3 : 1.0;

  // 饮食差更容易生病
  const dietLevel = parseInt(state.dietLevel);
  const dietMultiplier = dietLevel <= 1 ? 1.5 : dietLevel <= 2 ? 1.2 : 1.0;

  for (const disease of diseasePool) {
    // 跳过已有的疾病
    if (existingDiseaseIds.includes(disease.id)) continue;

    let chance = disease.baseChance * housingMultiplier * healthMultiplier * dietMultiplier;

    // 工作相关疾病：工作越久概率越高
    if (disease.workRelated && workMonths > 0) {
      chance += Math.min(workMonths * 0.005, 0.08); // 每工作1个月+0.5%，最多+8%
    }

    if (Math.random() < chance) {
      return disease;
    }
  }
  return null;
}

// === 正面事件（暗黑版：你的获利往往建立在别人的损失上） ===
const positiveEvents: RandomEvent[] = [
  {
    id: 'find_money',
    text: '🍀 在超市停车场捡到一个钱包，里面有$200。失主大概正在哭，但那是他的问题。',
    icon: '🍀',
    tone: 'positive',
    effects: { money: 200 },
    chance: 1,
  },
  {
    id: 'fired_coworker',
    text: '📈 同事被炒了，他的班位给了你。他的不幸就是你的加薪。多了$500/月。',
    icon: '📈',
    tone: 'positive',
    effects: { money: 500 },
    chance: 0.8,
  },
  {
    id: 'cheap_labor',
    text: '💰 新来了一批偷渡客，劳动力过剩，你的老板趁机压了他们的价，省下的钱分了你一份。',
    icon: '💰',
    tone: 'positive',
    effects: { money: 300, influence: 3 },
    chance: 0.9,
  },
  {
    id: 'debtor_pays',
    text: '🤑 一个欠你钱的人被蛇头催债，吓得先把你的$400还了。恐惧是最好的催款工具。',
    icon: '🤑',
    tone: 'positive',
    effects: { money: 400 },
    chance: 0.7,
  },
  {
    id: 'bankrupt_sale',
    text: '🏷️ 有人破产甩卖全部家当，你用$200买了价值$1000的东西转手卖了。资本家的第一课：低买高卖。',
    icon: '🏷️',
    tone: 'positive',
    effects: { money: 800 },
    chance: 0.6,
  },
  {
    id: 'snitch_reward',
    text: '🐍 你"不经意间"向老板透露了谁在偷偷接私活。老板很高兴，给你涨了工资。',
    icon: '🐍',
    tone: 'positive',
    effects: { money: 500, san: -5 },
    chance: 0.5,
  },
  {
    id: 'disaster_profit',
    text: '🌪️ 加州大火导致某个区域人口外流。你趁机低价接了一单别人不敢做的活，大赚一笔。',
    icon: '🌪️',
    tone: 'positive',
    effects: { money: 1200 },
    chance: 0.4,
  },
  {
    id: 'replace_deported',
    text: '🚔 ICE带走了一个工友。他的职位、他的客户、他的路线……全都顺理成章地成了你的。',
    icon: '🚔',
    tone: 'positive',
    effects: { money: 600, influence: 5 },
    chance: 0.7,
  },
  {
    id: 'loan_shark_cut',
    text: '🦈 你帮一个蛇头做了点小忙，他给了你$800"茶水费"。他说以后有事可以找你。',
    icon: '🦈',
    tone: 'positive',
    effects: { money: 800, san: -8 },
    chance: 0.4,
  },
  {
    id: 'fear_profit',
    text: '😰 社区里人心惶惶都在囤物资，你提前进了一批货高价卖出，净赚$600。恐慌是门好生意。',
    icon: '😰',
    tone: 'positive',
    effects: { money: 600 },
    chance: 0.5,
  },
  {
    id: 'dead_mans_job',
    text: '⚰️ 有个工友"不来了"（据说是出了事），他的高薪岗位空出来了。你毫不犹豫地顶上。',
    icon: '⚰️',
    tone: 'positive',
    effects: { money: 800, san: -3 },
    chance: 0.6,
  },
];

// === 负面事件（玩家也会受苦，但程度比别人轻得多） ===
const negativeEvents: RandomEvent[] = [
  {
    id: 'caught_cold',
    text: '🤧 感冒了。但至少你看得起医生——不像隔壁那个扛了一周直接进ICU的。',
    icon: '🤧',
    tone: 'negative',
    effects: { health: -8, money: -100 },
    chance: 1,
  },
  {
    id: 'protection_fee',
    text: '🔪 有人来收"保护费"。你付了$300。这就是丛林法则——你要么是交钱的，要么是收钱的。',
    icon: '🔪',
    tone: 'negative',
    effects: { money: -300, san: -5 },
    chance: 0.8,
  },
  {
    id: 'identity_scare',
    text: '👮 路上被警察盘问了。你假装镇定，用流利的英语对答如流。差点吓死，但过了。弱者没有这个运气。',
    icon: '👮',
    tone: 'negative',
    effects: { san: -15 },
    chance: 0.9,
  },
  {
    id: 'scammed_small',
    text: '😤 被一个"老乡"骗了$200。但你记住了他的脸——总有一天你会让他加倍奉还。',
    icon: '😤',
    tone: 'negative',
    effects: { money: -200, san: -5 },
    chance: 0.7,
  },
  {
    id: 'guilt_dream',
    text: '😱 半夜做了噩梦：梦到了那些消失的人的脸。你翻了个身继续睡——$100,000的床垫确实舒服。',
    icon: '😱',
    tone: 'negative',
    effects: { san: -12 },
    chance: 0.6,
  },
  {
    id: 'rent_increase',
    text: '🏠 房东涨租了。但你涨得起——不像那些被赶到街上去的人。',
    icon: '🏠',
    tone: 'negative',
    effects: { money: -200 },
    chance: 0.8,
  },
  {
    id: 'bad_investment',
    text: '📉 一笔小投资亏了$500。无所谓，这是学费。那些把全部身家赌进去的人才真惨。',
    icon: '📉',
    tone: 'negative',
    effects: { money: -500 },
    chance: 0.6,
  },
  {
    id: 'conscience_pang',
    text: '💭 路过一个流浪汉，他叫你的名字——是你三个月前一起打工的人。你加快脚步走了。',
    icon: '💭',
    tone: 'negative',
    effects: { san: -10 },
    chance: 0.7,
  },
];

// === 极端事件（暗黑版：极端的好运往往伴随着极端的罪恶） ===
const extremeEvents: RandomEvent[] = [
  {
    id: 'ice_raid_profit',
    text: '🚨 ICE大扫荡，你的竞争对手全被抓了。你安全地坐在家里数钱。行业空白期=暴利期。',
    icon: '🚨',
    tone: 'positive',
    effects: { money: 3000, influence: 10 },
    chance: 0.12,
  },
  {
    id: 'mass_layoff_up',
    text: '🏭 工厂大裁员，50人被赶走了。你不仅没被裁，还因为"表现优异"升了职加了薪。',
    icon: '🏭',
    tone: 'positive',
    effects: { money: 2000, influence: 5 },
    chance: 0.1,
  },
  {
    id: 'windfall_dark',
    text: '💀 一个认识的人突然"消失"了。他欠你的钱没来得及要回来，但你从他的圈子里接手了价值$5,000的生意。',
    icon: '💀',
    tone: 'positive',
    effects: { money: 5000, san: -15 },
    chance: 0.06,
  },
  {
    id: 'community_collapse',
    text: '🔥 附近的华人社区出了大事（火灾/扫荡），大量人员外流。你趁乱低价收购了他们的设备和库存。',
    icon: '🔥',
    tone: 'positive',
    effects: { money: 4000, san: -10 },
    chance: 0.08,
  },
  {
    id: 'earthquake_opportunity',
    text: '🌏 地震了！受灾区域急需物资。你囤积的货物翻了三倍价格出手。发灾难财，但合法。',
    icon: '🌏',
    tone: 'positive',
    effects: { money: 3500, san: -8 },
    chance: 0.07,
  },
  {
    id: 'hospital_bill_you',
    text: '🏥 你也进了一次急诊。$3000的账单。这就是为什么要赚更多的钱——因为在这个国家，穷人连生病的资格都没有。',
    icon: '🏥',
    tone: 'extreme',
    effects: { money: -3000, health: -15 },
    chance: 0.1,
  },
  {
    id: 'betrayal',
    text: '🗡️ 被你信任的人背后捅了一刀，偷了你$2000。你发誓不会再信任任何人。这才是在美国活下去的正确姿势。',
    icon: '🗡️',
    tone: 'extreme',
    effects: { money: -2000, san: -20 },
    chance: 0.1,
  },
  {
    id: 'close_call',
    text: '� 差一点就是你。那次扫荡、那场事故、那次爆炸——你活下来了。有些人没那么幸运。',
    icon: '�',
    tone: 'extreme',
    effects: { san: -25, luck: 20 },
    chance: 0.12,
  },
];

/**
 * 每月结算时生成随机事件
 * 暗黑版概率分布调整：正面事件更多（你是幸运的资本家）
 */
export function rollRandomEvent(state: GameState): RandomEvent | null {
  const roll = Math.random();

  // 55%概率什么都不发生
  if (roll > 0.45) return null;

  let pool: RandomEvent[];
  if (roll < 0.06) {
    // 6%极端事件
    pool = extremeEvents;
  } else if (roll < 0.18) {
    // 12%负面事件（你很少受苦）
    pool = negativeEvents;
  } else {
    // 27%正面事件（你总是幸运的）
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

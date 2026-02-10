// 里程碑/成就定义 — 暗黑资本家版
// 成就不再是"自我提升"，而是"踩着别人上位"和"冷血旁观"
import type { GameState, Milestone } from '@/lib/types';

export const milestones: Milestone[] = [
  // === 资本积累 ===
  {
    id: 'first_10k',
    title: '第一桶血',
    description: '存款突破$10,000。在这片土地上，有钱就是有命。',
    icon: '🩸',
    tone: 'good',
    check: (s) => s.money >= 10000,
  },
  {
    id: 'first_50k',
    title: '有钱人的门票',
    description: '存款突破$50,000。底层人还在为$500争得头破血流，而你已经不屑于看他们了。',
    icon: '🎟️',
    tone: 'good',
    check: (s) => s.money >= 50000,
  },
  {
    id: 'first_100k',
    title: '六位数俱乐部',
    description: '存款突破$100,000。这个数字是你认识的90%的人一辈子都摸不到的。',
    icon: '💎',
    tone: 'great',
    check: (s) => s.money >= 100000,
  },
  {
    id: 'first_500k',
    title: '小资本家',
    description: '存款突破$500,000。你已经有了让别人为你打工的资本。钱生钱，人赚人。',
    icon: '🦈',
    tone: 'great',
    check: (s) => s.money >= 500000,
  },
  {
    id: 'millionaire',
    title: '百万恶人',
    description: '存款突破$1,000,000。你站在了尸骨堆成的金字塔顶端。美国梦？不——是美国噩梦。',
    icon: '👑',
    tone: 'great',
    check: (s) => s.money >= 1000000,
  },

  // === 暗黑见证 ===
  {
    id: 'first_death_seen',
    title: '第一次旁观',
    description: '你第一次看到有人"消失"了。你什么都没做。这就是规则。',
    icon: '👁️',
    tone: 'warn',
    check: (s) => s.totalDeathsSeen >= 1,
  },
  {
    id: 'death_witness_5',
    title: '死亡旁观者',
    description: '已经看过5个人死亡了。你开始觉得这很正常。这才是可怕的。',
    icon: '💀',
    tone: 'warn',
    check: (s) => s.totalDeathsSeen >= 5,
  },
  {
    id: 'death_witness_15',
    title: '冷血动物',
    description: '15个人了。你已经不会为任何人流泪了。眼泪在这里不值钱。',
    icon: '🧊',
    tone: 'warn',
    check: (s) => s.totalDeathsSeen >= 15,
  },
  {
    id: 'ruin_witness_5',
    title: '破产收割者',
    description: '看过5个人倾家荡产。有些人的失败，正好是你的商机。',
    icon: '🪓',
    tone: 'good',
    check: (s) => s.totalRuinsSeen >= 5,
  },
  {
    id: 'deport_witness_5',
    title: '幸存者偏差',
    description: '5个人被遣返了，但你还在。不是因为你更优秀，而是因为你更冷血。',
    icon: '🛂',
    tone: 'good',
    check: (s) => s.totalDeportsSeen >= 5,
  },

  // === 资本家行为 ===
  {
    id: 'first_job',
    title: '韭菜的觉醒',
    description: '拿到了第一份工作。你终于从被收割的韭菜，变成了一根会收割别人的韭菜。',
    icon: '🌱',
    tone: 'good',
    check: (s) => s.recurringItems.some(r => r.type === 'work'),
  },
  {
    id: 'high_salary_job',
    title: '吸血鬼升级',
    description: '月薪超过$5,000。你赚的每一分钱，都有别人的血汗。',
    icon: '🧛',
    tone: 'great',
    check: (s) => s.recurringItems.some(r => r.type === 'work' && r.monthlyIncome >= 5000),
  },
  {
    id: 'elite_job',
    title: '食物链顶端',
    description: '月薪超过$15,000。下面的人在拼命求生，你在楼上喝咖啡看风景。',
    icon: '🏔️',
    tone: 'great',
    check: (s) => s.recurringItems.some(r => r.type === 'work' && r.monthlyIncome >= 15000),
  },
  {
    id: 'first_invest',
    title: '钱生钱',
    description: '开始投资了。让钱去工作，人太脆弱了——会累、会病、会死。钱不会。',
    icon: '🏦',
    tone: 'good',
    check: (s) => s.recurringItems.some(r => r.type === 'invest'),
  },
  {
    id: 'multi_invest',
    title: '资本的触手',
    description: '多线投资。你的钱在你睡觉的时候也在工作，而别人必须拿命去换。',
    icon: '🐙',
    tone: 'great',
    check: (s) => s.recurringItems.filter(r => r.type === 'invest').length >= 2,
  },

  // === 住房阶级 ===
  {
    id: 'enrolled_school',
    title: '录取通知书',
    description: '🎉 被学校录取了！从社会底层爬出来的第一步——用知识武装自己。别人在打工，你在读书。',
    icon: '📬',
    tone: 'good',
    check: (s) => s.recurringItems.some(r => r.type === 'education'),
  },
  {
    id: 'first_graduate',
    title: '🎓 毕业了！',
    description: '拿到了美国学历！从此你不再只是一个偷渡客——你是一个有学历的偷渡客。这张纸能打开很多门。',
    icon: '🎓',
    tone: 'great',
    check: (s) => s.education.graduated && s.education.level >= 1,
  },
  {
    id: 'ivy_graduate',
    title: '常春藤毕业',
    description: '从常春藤名校毕业了。你的校友在白宫、华尔街和硅谷。你不再需要仰望任何人。',
    icon: '🏛️',
    tone: 'great',
    check: (s) => s.education.graduated && s.education.level >= 4,
  },
  {
    id: 'high_skills',
    title: '技能满点',
    description: '技能值突破80。你已经是这个领域的专家——在美国，有技术的人永远饿不死。',
    icon: '⚡',
    tone: 'good',
    check: (s) => s.education.skills >= 80,
  },
  {
    id: 'influencer',
    title: '人脉通天',
    description: '影响力突破60。你认识的人比你赚的钱更有价值。在美国，关系就是生产力。',
    icon: '🌟',
    tone: 'good',
    check: (s) => s.education.influence >= 60,
  },

  // === 住房阶级 ===
  {
    id: 'nice_apartment',
    title: '体面的伪装',
    description: '住进了正经公寓。你开始从外面看不出来曾经是个偷渡客了。',
    icon: '🏠',
    tone: 'good',
    check: (s) => parseInt(s.housingLevel) >= 4,
  },
  {
    id: 'mansion',
    title: '豪宅旁观者',
    description: '住进了豪宅。站在阳台上往下看——你知道那些像蚂蚁一样移动的黑点是什么人。',
    icon: '🏰',
    tone: 'great',
    check: (s) => parseInt(s.housingLevel) >= 6,
  },

  // === 生存类 ===
  {
    id: 'survive_year1',
    title: '一年了',
    description: '12个月。很多人没能走到这一步。你踩着他们的影子继续前行。',
    icon: '🎖️',
    tone: 'good',
    check: (s) => s.currentRound >= 13,
  },
  {
    id: 'survive_year2',
    title: '老油条',
    description: '24个月。你已经学会了这里的生存法则：不要有感情，不要回头看。',
    icon: '⭐',
    tone: 'good',
    check: (s) => s.currentRound >= 25,
  },
  {
    id: 'survive_year3',
    title: '不死鸟',
    description: '36个月。死神来过很多次，但他每次都带走了别人。',
    icon: '🔥',
    tone: 'great',
    check: (s) => s.currentRound >= 37,
  },

  // === 特殊暗黑成就 ===
  {
    id: 'rich_among_dead',
    title: '朱门酒肉臭',
    description: '你坐拥$50,000，身边已经看过5个人死去。路有冻死骨——但不是你。',
    icon: '🍖',
    tone: 'great',
    check: (s) => s.money >= 50000 && s.totalDeathsSeen >= 5,
  },
  {
    id: 'mansion_with_blood',
    title: '血色豪宅',
    description: '住在豪宅里，看过10个人被遣返或死亡。你的高处，是踩着别人的尸骨爬上去的。',
    icon: '🩸',
    tone: 'great',
    check: (s) => parseInt(s.housingLevel) >= 5 && (s.totalDeathsSeen + s.totalDeportsSeen) >= 10,
  },
  {
    id: 'zero_empathy',
    title: '共情归零',
    description: '看过20次悲剧，你的精神值居然还在60以上。你已经不是人了——你是资本。',
    icon: '🤖',
    tone: 'great',
    check: (s) => (s.totalDeathsSeen + s.totalRuinsSeen + s.totalDeportsSeen) >= 20 && s.attributes.san >= 60,
  },
  {
    id: 'rock_bottom',
    title: '初尝地狱',
    description: '你也负债了。现在你知道底层的味道了——但你发誓不会留在这里。',
    icon: '📉',
    tone: 'warn',
    check: (s) => s.money < -2000,
  },
  {
    id: 'disney_life',
    title: '迪士尼人生',
    description: '住豪宅、赚大钱、天天享乐。世界在燃烧，你在看烟火。',
    icon: '🎠',
    tone: 'great',
    check: (s) => s.money >= 100000 && parseInt(s.housingLevel) >= 5 && parseInt(s.dietLevel) >= 4,
  },

  // === 后期消费 & 政治路线 ===
  {
    id: 'car_collector',
    title: '车库满了',
    description: '买了不止一辆豪车。你车库里的车比很多人一辈子赚的钱还多。',
    icon: '🏎️',
    tone: 'great',
    check: (s) => (s.behaviorUseCount['LUX04'] || 0) + (s.behaviorUseCount['LUX11'] || 0) + (s.behaviorUseCount['LUX12'] || 0) + (s.behaviorUseCount['LUX13'] || 0) >= 2,
  },
  {
    id: 'philanthropist',
    title: '慈善家',
    description: '你开始把钱洒向社会。不是因为善良——是因为你终于有资格善良了。',
    icon: '🤝',
    tone: 'good',
    check: (s) => s.recurringItems.some(r => r.id.includes('charity_fund') || r.sourceActionId === 'LUX32'),
  },
  {
    id: 'political_player',
    title: '政治新星',
    description: '你的名字开始出现在政治版面上。从偷渡客到政界人物——这个故事本身就是一种武器。',
    icon: '🏛️',
    tone: 'great',
    check: (s) => s.education.influence >= 50 && (s.behaviorUseCount['LUX10'] || 0) + (s.behaviorUseCount['LUX42'] || 0) + (s.behaviorUseCount['LUX43'] || 0) >= 1,
  },
  {
    id: 'real_estate_mogul',
    title: '地产大亨',
    description: '在美国拥有多处房产。你终于从被房租压垮的人变成了收房租的人。',
    icon: '🏘️',
    tone: 'great',
    check: (s) => (s.behaviorUseCount['LUX20'] || 0) + (s.behaviorUseCount['LUX21'] || 0) + (s.behaviorUseCount['LUX22'] || 0) >= 2,
  },
  {
    id: 'influence_maxed',
    title: '呼风唤雨',
    description: '影响力突破90。你一句话能让股价波动，一个电话能让政策改变方向。',
    icon: '🌊',
    tone: 'great',
    check: (s) => s.education.influence >= 90,
  },
  {
    id: 'ultimate_american_dream',
    title: '美国梦·终章',
    description: '百万富翁、社会名流、政界人物。一个偷渡客写出了最荒诞也最真实的美国故事。',
    icon: '🗽',
    tone: 'great',
    check: (s) => s.money >= 1000000 && s.education.influence >= 70 && parseInt(s.housingLevel) >= 5,
  },
];

/** 检查是否有新里程碑达成 */
export function checkMilestones(state: GameState): string[] {
  const newMilestones: string[] = [];
  for (const ms of milestones) {
    if (!state.achievedMilestones.includes(ms.id)) {
      try {
        if (ms.check(state)) {
          newMilestones.push(ms.id);
        }
      } catch {
        // 防止条件检查出错
      }
    }
  }
  return newMilestones;
}

/** 根据ID获取里程碑定义 */
export function getMilestoneById(id: string): Milestone | undefined {
  return milestones.find(m => m.id === id);
}

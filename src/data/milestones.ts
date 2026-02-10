// 里程碑/成就定义
import type { GameState, Milestone } from '@/lib/types';

export const milestones: Milestone[] = [
  // === 资金类 ===
  {
    id: 'first_10k',
    title: '五位数！',
    description: '存款突破 $10,000！你在美国站住脚了。',
    icon: '💰',
    tone: 'good',
    check: (s) => s.money >= 10000,
  },
  {
    id: 'first_50k',
    title: '小有积蓄',
    description: '存款突破 $50,000！开始有安全感了。',
    icon: '💎',
    tone: 'good',
    check: (s) => s.money >= 50000,
  },
  {
    id: 'first_100k',
    title: '六位数身家',
    description: '存款突破 $100,000！中产初具雏形。',
    icon: '🏆',
    tone: 'great',
    check: (s) => s.money >= 100000,
  },
  {
    id: 'first_500k',
    title: '半个百万富翁',
    description: '存款突破 $500,000！这已经超过大多数美国人了。',
    icon: '👑',
    tone: 'great',
    check: (s) => s.money >= 500000,
  },
  {
    id: 'millionaire',
    title: '百万美元俱乐部',
    description: '存款突破 $1,000,000！美国梦，实现了。',
    icon: '🌟',
    tone: 'great',
    check: (s) => s.money >= 1000000,
  },

  // === 工作类 ===
  {
    id: 'first_job',
    title: '第一份工作',
    description: '你终于不是无业游民了！虽然工资不高，但这是开始。',
    icon: '💼',
    tone: 'good',
    check: (s) => s.recurringItems.some(r => r.type === 'work'),
  },
  {
    id: 'high_salary_job',
    title: '高薪打工人',
    description: '月薪超过 $5,000！你已经是华人圈里的"成功人士"了。',
    icon: '🚀',
    tone: 'great',
    check: (s) => s.recurringItems.some(r => r.type === 'work' && r.monthlyIncome >= 5000),
  },
  {
    id: 'elite_job',
    title: '精英阶层',
    description: '月薪超过 $15,000！你站到了大多数人够不到的高度。',
    icon: '🏅',
    tone: 'great',
    check: (s) => s.recurringItems.some(r => r.type === 'work' && r.monthlyIncome >= 15000),
  },

  // === 投资类 ===
  {
    id: 'first_invest',
    title: '资本家的第一步',
    description: '你开始用钱生钱了。',
    icon: '📈',
    tone: 'good',
    check: (s) => s.recurringItems.some(r => r.type === 'invest'),
  },
  {
    id: 'multi_invest',
    title: '投资组合',
    description: '同时持有多个投资项目，风险分散是聪明人的做法。',
    icon: '📊',
    tone: 'good',
    check: (s) => s.recurringItems.filter(r => r.type === 'invest').length >= 2,
  },

  // === 教育类 ===
  {
    id: 'first_school',
    title: '重返校园',
    description: '在美国开始读书了，知识改变命运。',
    icon: '📖',
    tone: 'good',
    check: (s) => s.education.level >= 1,
  },
  {
    id: 'graduated',
    title: '毕业快乐',
    description: '拿到了学位！这张纸在美国值千金。',
    icon: '🎓',
    tone: 'great',
    check: (s) => s.education.graduated,
  },
  {
    id: 'ivy_league',
    title: '常春藤',
    description: '常春藤学位到手，你站在了学历金字塔的顶端。',
    icon: '🏛️',
    tone: 'great',
    check: (s) => s.education.level >= 4 && s.education.graduated,
  },

  // === 住房类 ===
  {
    id: 'own_room',
    title: '自己的房间',
    description: '终于有一扇能关上的门了。弗吉尼亚·伍尔夫说得对。',
    icon: '🚪',
    tone: 'good',
    check: (s) => parseInt(s.housingLevel) >= 3,
  },
  {
    id: 'nice_apartment',
    title: '正经人住正经房',
    description: '有客厅有厨房有阳台，终于像个正常人了。',
    icon: '🏠',
    tone: 'good',
    check: (s) => parseInt(s.housingLevel) >= 4,
  },
  {
    id: 'american_dream_house',
    title: '白色栅栏',
    description: '带草坪和车库的独栋House——这就是美国梦！',
    icon: '🏡',
    tone: 'great',
    check: (s) => parseInt(s.housingLevel) >= 5,
  },
  {
    id: 'mansion',
    title: '人生赢家',
    description: '海景豪宅！太平洋的风吹在你脸上，曾经的逃亡者站到了顶端。',
    icon: '🏰',
    tone: 'great',
    check: (s) => parseInt(s.housingLevel) >= 6,
  },

  // === 属性类 ===
  {
    id: 'high_credit',
    title: '信用良好',
    description: '信用分超过 750！银行开始主动给你打电话了。',
    icon: '💳',
    tone: 'good',
    check: (s) => s.attributes.credit >= 750,
  },
  {
    id: 'influencer',
    title: '社交达人',
    description: '影响力超过 60，你在华人圈子里有号召力了。',
    icon: '🌟',
    tone: 'good',
    check: (s) => s.education.influence >= 60,
  },
  {
    id: 'skilled',
    title: '技能大师',
    description: '技能值超过 70，你已经不是当初那个什么都不会的新移民了。',
    icon: '⚡',
    tone: 'good',
    check: (s) => s.education.skills >= 70,
  },

  // === 生存类 ===
  {
    id: 'survive_year1',
    title: '活过第一年',
    description: '整整12个月，你没死、没疯、没被遣返。这本身就是胜利。',
    icon: '🎖️',
    tone: 'good',
    check: (s) => s.currentRound >= 13,
  },
  {
    id: 'survive_year2',
    title: '两年老兵',
    description: '24个月了。你已经是这条路上的老手了。',
    icon: '⭐',
    tone: 'good',
    check: (s) => s.currentRound >= 25,
  },
  {
    id: 'survive_year3',
    title: '三年磨剑',
    description: '36个月。这片土地的味道，你已经熟悉了。',
    icon: '🗡️',
    tone: 'good',
    check: (s) => s.currentRound >= 37,
  },

  // === 特殊组合类 ===
  {
    id: 'zero_to_hero',
    title: '逆袭',
    description: '曾经负债，现在存款过5万。这才是真正的美国梦故事。',
    icon: '🦅',
    tone: 'great',
    check: (s) => s.money >= 50000 && s.wealthHistory.some(w => w.money < 0),
  },
  {
    id: 'full_health',
    title: '健康满分',
    description: '在美国保持满血，你是怎么做到的？',
    icon: '❤️',
    tone: 'good',
    check: (s) => s.attributes.health >= 100,
  },
  {
    id: 'rock_bottom',
    title: '触底',
    description: '负债了……但别放弃，很多人都是从这里翻身的。',
    icon: '📉',
    tone: 'warn',
    check: (s) => s.money < -2000,
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

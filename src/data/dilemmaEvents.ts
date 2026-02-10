// 抉择事件（二选一）定义
import type { GameState, DilemmaEvent } from '@/lib/types';

export const dilemmaEvents: DilemmaEvent[] = [
  {
    id: 'fake_accounting',
    title: '灰色地带',
    description: '一个华人老板找到你，出$5000请你帮忙做假账。接还是不接？',
    icon: '📒',
    minRound: 4,
    condition: (s) => s.money < 20000,
    optionA: {
      text: '接活',
      description: '拿$5000，但有30%概率东窗事发',
      effects: { money: 5000 },
      successChance: 0.7,
      successText: '钱到手了，安全过关。但你知道这条路走多了迟早出事。',
      failText: '被人举报了！幸好只是罚了一笔款，但信用大跌。',
      failEffects: { money: -2000, credit: -50, san: -20 },
    },
    optionB: {
      text: '拒绝',
      description: '保持清白，心安理得',
      effects: { san: 10, credit: 5 },
      successText: '你拒绝了。有些钱不能赚。晚上睡得格外踏实。',
    },
  },
  {
    id: 'roommate_theft',
    title: '室友跑了',
    description: '室友偷了你$1000跑了！你是报警还是忍了？',
    icon: '🏃',
    minRound: 3,
    condition: (s) => s.money >= 500,
    optionA: {
      text: '报警',
      description: '50%概率追回钱，但可能暴露自己的身份',
      effects: {},
      successChance: 0.5,
      successText: '警察帮你追回了$800，但在系统里留下了记录……',
      failText: '钱没追回来，还被警察多问了几句你的身份问题。心惊肉跳。',
      failEffects: { money: -1000, san: -25 },
    },
    optionB: {
      text: '算了',
      description: '吃个哑巴亏，息事宁人',
      effects: { money: -1000, san: -15 },
      successText: '你咬牙忍了。$1000的学费，买了个教训：不要相信任何人。',
    },
  },
  {
    id: 'overtime_vs_rest',
    title: '加班还是休息',
    description: '老板说这周末加班给双倍工资$800，但你已经连续工作了20天……',
    icon: '⏰',
    minRound: 2,
    condition: (s) => s.recurringItems.some(r => r.type === 'work'),
    optionA: {
      text: '加班',
      description: '多赚$800，但身体扛不住',
      effects: { money: 800, health: -15, san: -10 },
      successChance: 1,
      successText: '又挺过一个周末。钱到手了，但你感觉膝盖和腰都在报警。',
    },
    optionB: {
      text: '休息',
      description: '身体是革命的本钱',
      effects: { health: 10, san: 15 },
      successText: '你睡了整整一天，醒来的时候感觉重获新生。有些东西比钱重要。',
    },
  },
  {
    id: 'fake_id_offer',
    title: '假证件',
    description: '有人说$3000能办一套假证件：假社安号+假驾照。有了这些你能找到正式工作。',
    icon: '🪪',
    minRound: 5,
    condition: (s) => s.money >= 3000,
    optionA: {
      text: '买假证',
      description: '花$3000，60%概率一切顺利',
      effects: { money: -3000 },
      successChance: 0.6,
      successText: '假证做得很逼真。你用它找到了一份正式工作的面试机会。技能+10。',
      failText: '假证一看就是假的！钱打水漂了，还多了一份犯罪记录的恐惧。',
      failEffects: { money: -3000, san: -30, credit: -30 },
    },
    optionB: {
      text: '不买',
      description: '走正规路线，虽然慢但安全',
      effects: { san: 5 },
      successText: '你决定不走捷径。路虽然远，但每一步都踏实。',
    },
  },
  {
    id: 'help_stranger',
    title: '路遇同胞',
    description: '一个刚偷渡来的同胞倒在路边，身上只有$10。帮他等于花你的钱，不帮他可能就完了。',
    icon: '🤝',
    minRound: 6,
    optionA: {
      text: '帮他',
      description: '花$200给他买吃的和一晚住处',
      effects: { money: -200, san: 20, influence: 8 },
      successChance: 1,
      successText: '他红着眼眶说了声谢谢。三个月后他找到工作了，主动找到你还了$300。',
    },
    optionB: {
      text: '走开',
      description: '自顾不暇，管不了别人',
      effects: { san: -10 },
      successText: '你低着头走过去了。入夜后你翻来覆去睡不着，一直在想他。',
    },
  },
  {
    id: 'work_injury_fraud',
    title: '冒名顶替',
    description: '工友受了工伤，但他没有保险。老板提出让你用你的名义去报保险理赔，给你$2000好处费。',
    icon: '🤕',
    minRound: 7,
    condition: (s) => s.recurringItems.some(r => r.type === 'work'),
    optionA: {
      text: '答应',
      description: '拿$2000，但有风险',
      effects: { money: 2000 },
      successChance: 0.75,
      successText: '保险公司没查出来，$2000到手。但你总觉得迟早有一天要还。',
      failText: '保险公司调查发现了漏洞，你被公司开除了。',
      failEffects: { money: -500, san: -20, credit: -20 },
    },
    optionB: {
      text: '拒绝',
      description: '不趟这浑水',
      effects: { san: 5 },
      successText: '你摇了摇头走开了。有些钱，不该赚。',
    },
  },
  {
    id: 'invest_tip',
    title: '内幕消息',
    description: '一个朋友说他有"稳赚不赔"的投资内幕，让你拿$5000入伙。',
    icon: '🔮',
    minRound: 8,
    condition: (s) => s.money >= 5000,
    optionA: {
      text: '入伙',
      description: '投$5000，可能翻倍也可能血本无归',
      effects: { money: -5000 },
      successChance: 0.4,
      successText: '居然是真的！一个月后你收到了$12000！朋友不亏是朋友。',
      failText: '"朋友"消失了，电话打不通，微信被拉黑。$5000打了水漂。',
      failEffects: { money: -5000, san: -25 },
    },
    optionB: {
      text: '不投',
      description: '天上不会掉馅饼',
      effects: { san: 3 },
      successText: '你婉拒了。后来听说那个项目确实跑路了，你暗自庆幸。',
    },
  },
  {
    id: 'go_back',
    title: '来自故土的召唤',
    description: '国内的人辗转联系到你，说你的案子有转机。但如果回去可能是陷阱。你怎么选？',
    icon: '✈️',
    minRound: 12,
    optionA: {
      text: '保持现状',
      description: '在美国继续熬，不冒险',
      effects: { san: -15 },
      successChance: 1,
      successText: '你挂了电话，盯着窗外的月亮看了很久。回去？你已经没有"回去"这个选项了。',
    },
    optionB: {
      text: '留下线索',
      description: '让人帮忙打听情况，但不亲自回去',
      effects: { money: -500, san: -5 },
      successText: '你花了$500请人调查。三个月后得到消息：确实是陷阱。你冷汗直流。',
    },
  },
];

/**
 * 根据当前状态随机选择一个可触发的抉择事件
 * 每4~6回合触发一次
 */
export function rollDilemma(state: GameState): DilemmaEvent | null {
  // 概率约 25%（对应每4个月触发一次）
  if (Math.random() > 0.25) return null;

  const eligible = dilemmaEvents.filter(d => {
    if (d.minRound && state.currentRound < d.minRound) return false;
    if (d.condition) {
      try {
        if (!d.condition(state)) return false;
      } catch {
        return false;
      }
    }
    return true;
  });

  if (eligible.length === 0) return null;

  const idx = Math.floor(Math.random() * eligible.length);
  return eligible[idx];
}

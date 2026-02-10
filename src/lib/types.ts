// 游戏核心类型定义

/** 游戏阶段 */
export type GameStage = 'STORY_SELECT' | 'S00' | 'S01' | 'S02' | 'S02b' | 'S03' | 'S04' | 'S05' | 'GAME' | 'DEATH' | 'ENDING';

/** 身份路线 */
export type PathId = 'A' | 'B' | 'C' | 'D';

/** 行为类别 */
export type ActionCategory = 'heal' | 'earn' | 'invest' | 'education' | 'credit' | 'special' | 'luxury';

/** 行为类型 */
export type ActionType = 'fixed' | 'random' | 'risky' | 'lottery';

/** 难度 */
export type Difficulty = 'hell' | 'hard' | 'normal' | 'easy';

/** 游戏回合阶段 */
export type RoundPhase = 'action' | 'settlement' | 'result';

/** 角色属性 */
export interface Attributes {
  health: number;    // 健康 0-100
  san: number;       // 精神值 0-100
  credit: number;    // 信用分
  luck: number;      // 幸运值
}

/** 教育/技能状态 */
export interface EducationState {
  level: number;          // 学历等级 0=无 1=语言学校 2=社区大学 3=州立大学 4=常春藤
  schoolName: string;     // 当前/最高学校名称
  graduated: boolean;     // 是否已毕业
  skills: number;         // 技能值 0-100（影响面试成功率和学校录取）
  influence: number;      // 影响力 0-100（社交、人脉、知名度）
}

/** 住房信息 */
export interface HousingState {
  type: string;
  rent: number;
}

/** Debuff效果 */
export interface ActiveDebuff {
  id: string;
  name: string;
  icon: string;
  effect: Record<string, number>;
  remainingDuration: number;
  canClearEarly: boolean;
  clearCost: number;
}

/** Buff效果 */
export interface ActiveBuff {
  id: string;
  name: string;
  icon: string;
  effect: Record<string, number>;
  remainingDuration: number;
}

/** 持续性项目（工作、投资、借贷、教育等） */
export interface RecurringItem {
  id: string;              // 唯一实例ID
  sourceActionId: string;  // 来源行为ID
  type: 'work' | 'invest' | 'loan' | 'education';  // 项目类型
  subType?: 'fund' | 'business';  // 投资子类型：资金类/开店类
  name: string;
  icon: string;
  description: string;
  monthlyIncome: number;   // 每月收入（正数为收入，负数为支出）
  monthlyCost: number;     // 每月固定成本（开店类/教育类）
  monthlyHealthCost: number;  // 每月健康消耗
  monthlySanCost: number;     // 每月SAN消耗
  monthlyCreditChange: number; // 每月信用变化
  // 风险
  loseChance: number;      // 每月失去概率（被裁员/投资失败/等）
  loseText: string;        // 失去时的文案
  // 持续时间
  permanent: boolean;      // 是否永久（工作类）
  remainingMonths: number; // 剩余月数（投资/借贷类，-1表示永久）
  // 资金类投资：累计收益追踪
  accumulatedGain?: number; // 累计浮动盈亏（资金类投资用）
  investPrincipal?: number; // 投资本金
  // 教育类
  graduateBonus?: {        // 毕业时获得的奖励
    educationLevel: number;
    skills: number;
    influence: number;
  };
  // 可操作性
  canSell?: boolean;       // 是否可以抛售/关店/退学
  sellText?: string;       // 抛售/关店按钮文案
  // 开始时间
  startRound: number;
}

/** 日志条目 */
export interface FeedEntry {
  id: string;
  text: string;
  kind: 'system' | 'scene' | 'log' | 'effect' | 'danger' | 'warning';
  timestamp: number;
}

/** 游戏主状态 */
export interface GameState {
  // 基础阶段
  stage: GameStage;
  storyId: string | null;  // 当前故事ID
  pathId: PathId | null;
  difficulty: Difficulty;

  // 核心属性
  money: number;
  attributes: Attributes;

  // 教育/技能
  education: EducationState;

  // 住房
  housing: HousingState;
  housingLevel: string; // "1"-"6"

  // 饮食等级
  dietLevel: string; // "1"-"5"

  // 回合系统
  currentRound: number;
  roundPhase: RoundPhase;
  maxSan: number;

  // Buff/Debuff
  activeDebuffs: ActiveDebuff[];
  activeBuffs: ActiveBuff[];

  // 持续性项目（工作、投资、借贷）
  recurringItems: RecurringItem[];

  // 行为冷却与限制
  behaviorCooldowns: Record<string, number>;
  behaviorUseCount: Record<string, number>;
  usedOneTimeBehaviors: string[];

  // 剧情状态
  tutorialStep: number;
  tutorialDone: boolean;
  bgLineIdx: number; // S00 当前行索引
  s02bSceneIdx: number; // S02b 场景索引

  // 日志
  feed: FeedEntry[];
  fullGameLog: FeedEntry[];

  // 回合内行为记录
  roundBehaviors: Array<{ id: string; name: string; category: string }>;
  roundFinancials: { income: number; expense: number };

  // 死亡相关
  death: {
    active: boolean;
    type: string | null;
    reason: string;
  };

  // 时间戳
  startedAt: number;
  lastSavedAt: number;

  // 每回合可见的行为ID列表（随机刷新）
  visibleBehaviorIds: string[];

  // === 爽感系统新增 ===
  // 里程碑
  achievedMilestones: string[];       // 已达成的里程碑ID
  pendingMilestones: string[];        // 待显示的里程碑ID队列

  // 资产历史
  wealthHistory: WealthRecord[];

  // 阶层
  classLevel: ClassLevel;

  // 随机事件
  pendingRandomEvent: RandomEvent | null;

  // 抉择事件
  pendingDilemma: DilemmaEvent | null;
}

/** 行为数据结构 */
export interface ActionData {
  id: string;
  name: string;
  nameEn: string;
  category: ActionCategory;
  type: ActionType;
  description: string;
  quote: string;
  cost: { san?: number; money?: number; health?: number };
  gain?: Record<string, number>;
  baseGain?: Record<string, number>;
  outcomes?: Array<{
    chance: number;
    gain: Record<string, number>;
    text: string;
    name?: string;
    weight?: number;
  }>;
  risk?: {
    chance: number;
    penalty: Record<string, number>;
    text: string;
    debuff?: { id: string; duration: number };
  };
  debuff?: { id: string; duration: number };
  buff?: { id: string; duration: number };
  setCreditTo?: number;
  clearAllDebuffs?: boolean;
  unlock: {
    type: 'default' | 'round' | 'condition';
    round?: number;
    condition?: string;
    conditionText?: string;
  };
  requirements?: {
    educationLevel?: number;  // 最低学历等级
    skills?: number;          // 最低技能值
    influence?: number;       // 最低影响力
  };
  limit?: {
    usesPerGame?: number;
    cooldown?: number;
  };
  recurring?: string;    // 关联的持续性项目模板ID
  quitWork?: boolean;    // 是否是辞职行为
  subGroup?: string;     // 子分组ID（合并面板内的标签筛选）
  showChance?: number;   // 每回合随机出现概率 0-1，undefined表示必定出现
  tags: string[];
}

/** 行为执行结果 */
export interface BehaviorResult {
  success: boolean;
  behavior: { id: string; name: string; category: string; icon: string; type: ActionType };
  gain: Record<string, number>;
  costs: Record<string, number>;
  narrative: string;
  effectSummary: string;
  outcomeSuccess?: boolean;
}

/** 里程碑定义 */
export interface Milestone {
  id: string;
  title: string;
  description: string;
  icon: string;
  tone: 'great' | 'good' | 'neutral' | 'warn';
  check: (state: GameState) => boolean;
}

/** 随机事件定义 */
export interface RandomEvent {
  id: string;
  text: string;
  icon: string;
  tone: 'positive' | 'negative' | 'extreme' | 'neutral';
  effects: Record<string, number>;
  chance: number; // 触发权重
}

/** 抉择事件定义 */
export interface DilemmaEvent {
  id: string;
  title: string;
  description: string;
  icon: string;
  minRound?: number;
  condition?: (state: GameState) => boolean;
  optionA: {
    text: string;
    description: string;
    effects: Record<string, number>;
    successChance?: number; // 成功概率，默认100%
    successText: string;
    failText?: string;
    failEffects?: Record<string, number>;
  };
  optionB: {
    text: string;
    description: string;
    effects: Record<string, number>;
    successText: string;
  };
}

/** 阶层等级 */
export type ClassLevel = 0 | 1 | 2 | 3 | 4;

/** 资产历史记录 */
export interface WealthRecord {
  round: number;
  money: number;
  netWorth: number; // 净资产 = 现金 + 投资估值
  classLevel: ClassLevel;
}

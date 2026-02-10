// 游戏核心类型定义

/** 游戏阶段 */
export type GameStage = 'S00' | 'S01' | 'S02' | 'S02b' | 'S03' | 'S04' | 'S05' | 'GAME' | 'DEATH' | 'ENDING';

/** 身份路线 */
export type PathId = 'A' | 'B' | 'C' | 'D';

/** 行为类别 */
export type ActionCategory = 'heal' | 'earn' | 'healthToMoney' | 'moneyToHealth' | 'credit' | 'gamble' | 'special' | 'luxury';

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
  pathId: PathId | null;
  difficulty: Difficulty;

  // 核心属性
  money: number;
  attributes: Attributes;

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
  limit?: {
    usesPerGame?: number;
    cooldown?: number;
  };
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

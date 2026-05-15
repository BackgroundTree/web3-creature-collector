export type MoveCategory = "Physical" | "Special" | "Status";

export type StatName = "hp" | "atk" | "def" | "spa" | "spd" | "spe";

export type ElementType =
  | "Normal" | "Fire" | "Water" | "Electric" | "Grass" | "Ice"
  | "Fighting" | "Poison" | "Ground" | "Flying" | "Psychic" | "Bug"
  | "Rock" | "Ghost" | "Dragon" | "Dark" | "Steel" | "Fairy";

export interface BaseStats {
  hp:  number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

export interface Move {
  id:       number;
  name:     string;
  type:     ElementType;
  category: MoveCategory;
  power:    number;
  accuracy: number;
  pp:       number;
  ppMax:    number;
  effect?:  string;
}

export interface Pokemon {
  id:        number;
  name:      string;
  types:     [ElementType] | [ElementType, ElementType];
  baseStats: BaseStats;
  level:     number;
  stats:     BaseStats;
  currentHp: number;
  moves:     Move[];
  tokenId?: string;
  speciesKey?: string;
  xp?: number;
  natureSeed?: number;
}

export type BattlePhase =
  | "idle"
  | "animating"
  | "turn_resolving"
  | "victory"
  | "defeat"
  | "draw";

export interface TurnLogEntry {
  turn:    number;
  actor:   "player" | "enemy";
  message: string;
  damage?: number;
}

export interface BattleState {
  phase:      BattlePhase;
  turn:       number;
  player:     Pokemon;
  enemy:      Pokemon;
  log:        TurnLogEntry[];
  selectedMoveIndex: number | null;
}

export type ItemCategory = 'healing' | 'revive' | 'pp_restore' | 'level_up' | 'evolution' | 'berry' | 'type_booster' | 'x_item';

export interface InventoryItem {
  id: string;
  name: string;
  category: ItemCategory;
  persistAfterRun: boolean;
  usableInBattle: boolean;
  count: number;
  healAmount?: number;
  revivePercent?: number;
  ppRestore?: number;
  typeBoost?: { type: ElementType; multiplier: number };
  statBoost?: { stat: StatName; stages: number; duration: number };
  evolutionTarget?: string;
  berryEffect?: { trigger: string; effect: number | string };
}

export type Difficulty = "easy" | "normal" | "hard";

export interface RunState {
  party: Pokemon[];
  activeIndex: number;
  fight: number;
  maxFights: number;
  gold: number;
  inventory: InventoryItem[];
  kills: number;
  difficulty: Difficulty;
}

export interface LootOption {
  id: string;
  name: string;
  category: ItemCategory;
  description: string;
  persistAfterRun: boolean;
}

export interface ShopItem {
  id: string;
  name: string;
  price: number;
  category: ItemCategory;
  healAmount?: number;
  revivePercent?: number;
  ppRestore?: number;
}

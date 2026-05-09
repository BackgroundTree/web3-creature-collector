// ─────────────────────────────────────────────
//  Core domain types for the battle engine
// ─────────────────────────────────────────────

export type MoveCategory = "Physical" | "Special" | "Status";

export type StatName = "hp" | "atk" | "def" | "spa" | "spd" | "spe";

export type ElementType =
  | "Normal" | "Fire" | "Water" | "Electric" | "Grass" | "Ice"
  | "Fighting" | "Poison" | "Ground" | "Flying" | "Psychic" | "Bug"
  | "Rock" | "Ghost" | "Dragon" | "Dark" | "Steel" | "Fairy";

// ─────────────────────────────────────────────
//  Stat block (base, IV, EV etc. live here)
// ─────────────────────────────────────────────

export interface BaseStats {
  hp:  number;
  atk: number;
  def: number;
  spa: number; // Special Attack
  spd: number; // Special Defense
  spe: number; // Speed
}

// ─────────────────────────────────────────────
//  Move
// ─────────────────────────────────────────────

export interface Move {
  id:       number;
  name:     string;
  type:     ElementType;
  category: MoveCategory;
  power:    number;        // 0 for Status moves
  accuracy: number;        // 0–100, 0 = never misses
  pp:       number;
  ppMax:    number;
  /** Optional secondary effect description */
  effect?:  string;
}

// ─────────────────────────────────────────────
//  Pokémon instance (in-battle, not the dex entry)
// ─────────────────────────────────────────────

export interface Pokemon {
  id:        number;        // National Pokédex number
  name:      string;
  types:     [ElementType] | [ElementType, ElementType];
  baseStats: BaseStats;
  level:     number;

  // Computed battle stats (after nature / EV / IV calculation)
  stats: BaseStats;

  // Current battle values
  currentHp: number;
  moves:     Move[];

  /** Optional: NFT token ID for Web3 integration */
  tokenId?: string;
}

// ─────────────────────────────────────────────
//  Battle State
// ─────────────────────────────────────────────

export type BattlePhase =
  | "idle"          // waiting for player input
  | "animating"     // move animation playing
  | "turn_resolving"// engine is processing the turn
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
  /** Index of the selected move (null while waiting for input) */
  selectedMoveIndex: number | null;
}

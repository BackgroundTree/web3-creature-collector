/**
 * src/engine/damage.ts
 *
 * Pure TypeScript — zero React imports, zero side-effects.
 * Implements a simplified Gen 4 damage formula with the Physical/Special split.
 *
 * Gen 4 formula:
 *   damage = (((2 * Level / 5 + 2) * Power * A / D) / 50 + 2)
 *            * Targets * Weather * Badge * Critical * random * STAB * Type1 * Type2
 *
 * Simplifications for this skeleton:
 *   - No weather or multi-target modifiers
 *   - Critical hits: 1/16 chance → 1.5× modifier
 *   - STAB: 1.5× if move type matches attacker type
 *   - Type effectiveness: 0 / 0.5 / 1 / 2 lookup table
 *   - Random factor: uniform [0.85, 1.00]
 */

import type { Pokemon, Move, ElementType } from "../types";

// ─────────────────────────────────────────────
//  Type effectiveness chart (Gen 4)
// ─────────────────────────────────────────────

type EffectivenessRow = Partial<Record<ElementType, number>>;
type EffectivenessChart = Partial<Record<ElementType, EffectivenessRow>>;

/** Only non-neutral interactions are listed; everything else defaults to 1. */
const TYPE_CHART: EffectivenessChart = {
  Normal:   { Rock: 0.5, Ghost: 0, Steel: 0.5 },
  Fire:     { Fire: 0.5, Water: 0.5, Rock: 0.5, Dragon: 0.5, Grass: 2, Ice: 2, Bug: 2, Steel: 2 },
  Water:    { Water: 0.5, Grass: 0.5, Dragon: 0.5, Fire: 2, Ground: 2, Rock: 2 },
  Electric: { Electric: 0.5, Grass: 0.5, Dragon: 0.5, Ground: 0, Flying: 2, Water: 2 },
  Grass:    { Fire: 0.5, Grass: 0.5, Poison: 0.5, Flying: 0.5, Bug: 0.5, Dragon: 0.5, Steel: 0.5, Water: 2, Ground: 2, Rock: 2 },
  Ice:      { Water: 0.5, Ice: 0.5, Fire: 0.5, Steel: 0.5, Grass: 2, Ground: 2, Flying: 2, Dragon: 2 },
  Fighting: { Normal: 2, Ice: 2, Rock: 2, Dark: 2, Steel: 2, Poison: 0.5, Bug: 0.5, Psychic: 0.5, Flying: 0.5, Ghost: 0, Fairy: 0.5 },
  Poison:   { Grass: 2, Fairy: 2, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0 },
  Ground:   { Fire: 2, Electric: 2, Poison: 2, Rock: 2, Steel: 2, Grass: 0.5, Bug: 0.5, Flying: 0 },
  Flying:   { Grass: 2, Fighting: 2, Bug: 2, Electric: 0.5, Rock: 0.5, Steel: 0.5 },
  Psychic:  { Fighting: 2, Poison: 2, Psychic: 0.5, Steel: 0.5, Dark: 0 },
  Bug:      { Grass: 2, Psychic: 2, Dark: 2, Fire: 0.5, Fighting: 0.5, Flying: 0.5, Ghost: 0.5, Steel: 0.5, Fairy: 0.5 },
  Rock:     { Fire: 2, Ice: 2, Flying: 2, Bug: 2, Fighting: 0.5, Ground: 0.5, Steel: 0.5 },
  Ghost:    { Psychic: 2, Ghost: 2, Normal: 0, Dark: 0.5 },
  Dragon:   { Dragon: 2, Steel: 0.5, Fairy: 0 },
  Dark:     { Psychic: 2, Ghost: 2, Fighting: 0.5, Dark: 0.5, Fairy: 0.5 },
  Steel:    { Ice: 2, Rock: 2, Fairy: 2, Fire: 0.5, Water: 0.5, Electric: 0.5, Steel: 0.5 },
  Fairy:    { Fighting: 2, Dragon: 2, Dark: 2, Fire: 0.5, Poison: 0.5, Steel: 0.5 },
};

/**
 * Returns the damage multiplier for a move type hitting a defender type.
 */
export function getTypeEffectiveness(
  moveType: ElementType,
  defenderTypes: Pokemon["types"]
): number {
  return defenderTypes.reduce((multiplier, defType) => {
    const row = TYPE_CHART[moveType];
    const mod  = row?.[defType] ?? 1;
    return multiplier * mod;
  }, 1);
}

// ─────────────────────────────────────────────
//  DamageResult — what the engine gets back
// ─────────────────────────────────────────────

export interface DamageResult {
  damage:        number;
  isCritical:    boolean;
  effectiveness: number;   // 0 | 0.25 | 0.5 | 1 | 2 | 4
  missed:        boolean;
}

/**
 * calculateDamage — simplified Gen 4 damage formula.
 *
 * @param attacker  — The attacking Pokémon
 * @param defender  — The defending Pokémon
 * @param move      — The move being used
 * @returns         DamageResult
 */
export function calculateDamage(
  attacker: Pokemon,
  defender: Pokemon,
  move:     Move,
): DamageResult {
  // Status moves deal no damage
  if (move.category === "Status" || move.power === 0) {
    return { damage: 0, isCritical: false, effectiveness: 1, missed: false };
  }

  // ── Accuracy roll ──────────────────────────────────────────────────────────
  const accuracyThreshold = move.accuracy === 0 ? 100 : move.accuracy;
  const missed = Math.random() * 100 > accuracyThreshold;
  if (missed) {
    return { damage: 0, isCritical: false, effectiveness: 1, missed: true };
  }

  // ── Choose attack / defense stats based on category (Physical/Special split)─
  const A = move.category === "Physical"
    ? attacker.stats.atk
    : attacker.stats.spa;

  const D = move.category === "Physical"
    ? defender.stats.def
    : defender.stats.spd;

  // ── Base damage ────────────────────────────────────────────────────────────
  const baseDamage =
    Math.floor(((2 * attacker.level) / 5 + 2) * move.power * (A / D)) / 50 + 2;

  // ── STAB (Same Type Attack Bonus) ──────────────────────────────────────────
  const stab = attacker.types.includes(move.type) ? 1.5 : 1;

  // ── Type effectiveness ─────────────────────────────────────────────────────
  const effectiveness = getTypeEffectiveness(move.type, defender.types);

  // ── Critical hit (1/16 chance → 1.5× in Gen 4) ────────────────────────────
  const isCritical = Math.random() < (1 / 16);
  const critMod    = isCritical ? 1.5 : 1;

  // ── Random factor [0.85, 1.00] ─────────────────────────────────────────────
  const randomFactor = 0.85 + Math.random() * 0.15;

  // ── Final ──────────────────────────────────────────────────────────────────
  const damage = Math.max(
    1,
    Math.floor(baseDamage * stab * effectiveness * critMod * randomFactor),
  );

  return { damage, isCritical, effectiveness, missed: false };
}

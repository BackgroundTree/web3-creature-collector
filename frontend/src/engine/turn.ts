/**
 * src/engine/turn.ts
 *
 * Pure TypeScript — zero React imports, zero side-effects.
 * Determines which combatant acts first in a given turn.
 */

export type TurnActor = "player" | "enemy";

export interface TurnOrder {
  first:  TurnActor;
  second: TurnActor;
  /** True when speeds were equal and the order was decided by coin-flip */
  tiedSpeed: boolean;
}

/**
 * determineTurnOrder
 *
 * Rules (mirrors Gen 4 mechanics):
 *  1. Higher Speed stat goes first.
 *  2. On a tie, the winner is chosen randomly (50 / 50).
 *
 * This function is pure — same inputs always produce a deterministic result
 * *except* for the random tie-break, which is intentional game behaviour.
 * If you need reproducibility in tests, inject a seeded `Math.random`.
 *
 * @param playerSpeed — The player's active Pokémon speed stat
 * @param enemySpeed  — The enemy's active Pokémon speed stat
 * @param randomFn    — Optional override for the random source (for testing)
 */
export function determineTurnOrder(
  playerSpeed: number,
  enemySpeed:  number,
  randomFn: () => number = Math.random,
): TurnOrder {
  if (playerSpeed > enemySpeed) {
    return { first: "player", second: "enemy", tiedSpeed: false };
  }

  if (enemySpeed > playerSpeed) {
    return { first: "enemy", second: "player", tiedSpeed: false };
  }

  // Speed tie — 50/50 coin flip
  const playerGoesFirst = randomFn() < 0.5;
  return {
    first:      playerGoesFirst ? "player" : "enemy",
    second:     playerGoesFirst ? "enemy"  : "player",
    tiedSpeed: true,
  };
}

// ─────────────────────────────────────────────
//  Helpers used by the hook / AI
// ─────────────────────────────────────────────

/**
 * A dead-simple enemy AI: picks a random move index from the enemy's move set.
 */
export function chooseEnemyMoveIndex(moveCount: number): number {
  return Math.floor(Math.random() * moveCount);
}

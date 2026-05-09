/**
 * src/hooks/useBattleEngine.ts
 *
 * Owns ALL mutable battle state.  The math lives in src/engine/ — this hook
 * just orchestrates state transitions and calls those pure functions.
 */

import { useCallback, useReducer } from "react";

import { calculateDamage }              from "../engine/damage";
import { determineTurnOrder, chooseEnemyMoveIndex } from "../engine/turn";
import type { BattleState, Pokemon, TurnLogEntry }  from "../types";

// ─────────────────────────────────────────────
//  Action types
// ─────────────────────────────────────────────

type BattleAction =
  | { type: "SELECT_MOVE"; moveIndex: number }
  | { type: "RESET"; player: Pokemon; enemy: Pokemon };

// ─────────────────────────────────────────────
//  Pure reducer — no side-effects
// ─────────────────────────────────────────────

function battleReducer(state: BattleState, action: BattleAction): BattleState {
  switch (action.type) {
    // ── RESET ─────────────────────────────────────────────────────────────────
    case "RESET":
      return buildInitialState(action.player, action.enemy);

    // ── SELECT_MOVE ────────────────────────────────────────────────────────────
    case "SELECT_MOVE": {
      if (state.phase !== "idle") return state;

      const { moveIndex } = action;
      const newLog: TurnLogEntry[] = [];
      const turn = state.turn + 1;

      // Clone HP so we can mutate
      let playerHp = state.player.currentHp;
      let enemyHp  = state.enemy.currentHp;

      const playerMove = state.player.moves[moveIndex];
      const enemyMoveIdx = chooseEnemyMoveIndex(state.enemy.moves.length);
      const enemyMove  = state.enemy.moves[enemyMoveIdx];

      // Determine who swings first
      const order = determineTurnOrder(
        state.player.stats.spe,
        state.enemy.stats.spe,
      );

      const actors: Array<"player" | "enemy"> = [order.first, order.second];

      for (const actor of actors) {
        // Skip a fainted combatant mid-turn
        if (playerHp <= 0 || enemyHp <= 0) break;

        if (actor === "player") {
          const result = calculateDamage(state.player, state.enemy, playerMove);

          if (result.missed) {
            newLog.push({ turn, actor: "player", message: `${state.player.name} used ${playerMove.name} — but it missed!` });
          } else {
            enemyHp = Math.max(0, enemyHp - result.damage);
            const flavour = effectivenessFlavour(result.effectiveness);
            const crit    = result.isCritical ? " Critical hit!" : "";
            newLog.push({
              turn,
              actor:   "player",
              message: `${state.player.name} used ${playerMove.name}!${flavour}${crit}`,
              damage:  result.damage,
            });
          }
        } else {
          const result = calculateDamage(state.enemy, state.player, enemyMove);

          if (result.missed) {
            newLog.push({ turn, actor: "enemy", message: `${state.enemy.name} used ${enemyMove.name} — but it missed!` });
          } else {
            playerHp = Math.max(0, playerHp - result.damage);
            const flavour = effectivenessFlavour(result.effectiveness);
            const crit    = result.isCritical ? " Critical hit!" : "";
            newLog.push({
              turn,
              actor:   "enemy",
              message: `${state.enemy.name} used ${enemyMove.name}!${flavour}${crit}`,
              damage:  result.damage,
            });
          }
        }
      }

      // Determine outcome
      const phase =
        playerHp <= 0 && enemyHp <= 0 ? "draw"
        : playerHp <= 0               ? "defeat"
        : enemyHp  <= 0               ? "victory"
        :                               "idle";

      if (phase === "victory") newLog.push({ turn, actor: "player", message: `${state.enemy.name} fainted! You win!` });
      if (phase === "defeat")  newLog.push({ turn, actor: "enemy",  message: `${state.player.name} fainted! You lose!` });
      if (phase === "draw")    newLog.push({ turn, actor: "player", message: "Both Pokémon fainted! It's a draw!" });

      return {
        ...state,
        phase,
        turn,
        player: { ...state.player, currentHp: playerHp },
        enemy:  { ...state.enemy,  currentHp: enemyHp  },
        log:    [...state.log, ...newLog],
        selectedMoveIndex: moveIndex,
      };
    }

    default:
      return state;
  }
}

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

function buildInitialState(player: Pokemon, enemy: Pokemon): BattleState {
  return {
    phase:             "idle",
    turn:              0,
    player:            { ...player, currentHp: player.stats.hp },
    enemy:             { ...enemy,  currentHp: enemy.stats.hp  },
    log:               [{ turn: 0, actor: "enemy", message: `A wild ${enemy.name} appeared!` }],
    selectedMoveIndex: null,
  };
}

function effectivenessFlavour(e: number): string {
  if (e === 0)   return " It had no effect...";
  if (e < 1)     return " It's not very effective...";
  if (e > 1)     return " It's super effective!";
  return "";
}

// ─────────────────────────────────────────────
//  Public hook
// ─────────────────────────────────────────────

export interface UseBattleEngineReturn {
  state:      BattleState;
  selectMove: (moveIndex: number) => void;
  resetBattle: (player: Pokemon, enemy: Pokemon) => void;
}

export function useBattleEngine(
  initialPlayer: Pokemon,
  initialEnemy:  Pokemon,
): UseBattleEngineReturn {
  const [state, dispatch] = useReducer(
    battleReducer,
    undefined,
    () => buildInitialState(initialPlayer, initialEnemy),
  );

  const selectMove = useCallback((moveIndex: number) => {
    dispatch({ type: "SELECT_MOVE", moveIndex });
  }, []);

  const resetBattle = useCallback((player: Pokemon, enemy: Pokemon) => {
    dispatch({ type: "RESET", player, enemy });
  }, []);

  return { state, selectMove, resetBattle };
}

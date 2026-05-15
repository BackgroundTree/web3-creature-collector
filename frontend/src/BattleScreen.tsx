import './BattleScreen.css';
import { useState, useEffect, useRef, useMemo } from "react";
import { useBattleEngine } from './hooks/useBattleEngine';
import { buildRandomEnemy, addXpAndLevelUp } from './data/pokemonUtils';
import type { Pokemon, Move, RunState, InventoryItem } from './types';

const TYPE_COLORS: Record<string, string> = {
  Fire: "#c95c00", Water: "#1a6fa8", Grass: "#2d7a1e", Electric: "#b09400",
  Ice: "#3b8fa3", Fighting: "#8b2e00", Poison: "#6b1a7a", Ground: "#8a6300",
  Flying: "#3a5a8a", Psychic: "#9a1a5a", Bug: "#4a6a00", Rock: "#6a5a3a",
  Ghost: "#3a2a5a", Dragon: "#3a1a8a", Dark: "#2a1a1a", Steel: "#4a5a6a",
  Fairy: "#9a3a6a", Normal: "#5a5a5a",
};

function getHpColor(pct: number): string {
  if (pct > 0.5) return "var(--hp-green)";
  if (pct > 0.25) return "var(--hp-yellow)";
  return "var(--hp-red)";
}

function TypeBadge({ type }: { type?: string }): React.ReactElement {
  return (
    <span
      className="type-badge"
      style={{ background: TYPE_COLORS[type || ""] || "#333", color: "#fff" }}
    >
      {type?.toUpperCase()}
    </span>
  );
}

function HpBar({ current, max, size = "md" }: { current: number; max: number; size?: "sm" | "md" }): React.ReactElement {
  const pct = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;
  const h = size === "sm" ? "4px" : "8px";
  return (
    <div className="hp-bar-track" style={{ height: h, width: "100%" }}>
      <div
        className="hp-bar-fill"
        style={{ width: `${pct * 100}%`, background: getHpColor(pct), height: "100%" }}
      />
    </div>
  );
}


function RunStatusBar({ fight, maxFights, gold, kills }: { fight: number; maxFights: number; gold: number; kills: number }): React.ReactElement {
  return (
    <div className="run-status-bar">
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="run-status-title">◆ RELIC MONSTERS ◆</span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <span className="run-chip">FIGHT {fight}/{maxFights}</span>
        <span className="run-chip">⚔ {kills} KILLS</span>
        <span className="run-chip">◈ {gold} GOLD</span>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div className="status-indicator" />
        <span className="status-text">ON-CHAIN READY</span>
      </div>
    </div>
  );
}

function TheaterHpBlock({ pokemon, isEnemy }: { pokemon: Pokemon; isEnemy: boolean }): React.ReactElement {
  const pct = pokemon.stats.hp > 0 ? pokemon.currentHp / pokemon.stats.hp : 0;
  return (
    <div className={`theater-hp-block ${isEnemy ? "enemy" : "player"}`}>
      <div className={`theater-hp-corner ${isEnemy ? "left" : "right"}`} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div>
          <span className="theater-pokemon-name">{pokemon.name}</span>
          <span className="theater-pokemon-level">Lv.{pokemon.level}</span>
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <TypeBadge type={pokemon.types[0]} />
          {pokemon.types[1] && <TypeBadge type={pokemon.types[1]} />}
        </div>
      </div>
      <HpBar current={pokemon.currentHp} max={pokemon.stats.hp} size="md" />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
        <span className="stat-label">HP</span>
        <span className="theater-hp-text" style={{ color: getHpColor(pct) }}>
          {pokemon.currentHp} / {pokemon.stats.hp}
        </span>
      </div>
    </div>
  );
}

function SpriteArea({ player, enemy }: { player: Pokemon; enemy: Pokemon }) {
  const getPath = (mon: Pokemon, side: 'front' | 'back') => {
    return `/sprites/normal/${mon.id}_${side}.png`;
  };

  return (
    <div style={{ flex: 1, position: "relative", width: '100%', height: '100%' }}>
      <div className="ground-line" />
      <div className="sprite-enemy">
        <img src={getPath(enemy, 'front')} alt={enemy.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>
      <div className="sprite-player">
        <img src={getPath(player, 'back')} alt={player.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>
    </div>
  );
}

function MoveButton({ move, onClick, disabled }: { move: Move; onClick: (move: Move) => void; disabled?: boolean }): React.ReactElement {
  const noPp = move.pp === 0;
  return (
    <button
      className={`move-btn ${noPp || disabled ? "disabled" : ""}`}
      onClick={() => !noPp && !disabled && onClick(move)}
      style={{ padding: "10px 14px", textAlign: "left" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
        <span style={{ fontSize: "0.9rem" }}>{move.name}</span>
        <TypeBadge type={move.type} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span className="move-button-power">
          {move.power ? `PWR ${move.power}` : "STATUS"}
        </span>
        <span className={`move-button-pp ${move.pp <= 3 ? "low-pp" : ""}`}>
          PP {move.pp}/{move.ppMax}
        </span>
      </div>
    </button>
  );
}

function CombatLog({ entries }: { entries: { message: string }[] }): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [entries]);

  return (
    <div ref={ref} className="combat-log" style={{ padding: "8px 10px", height: "100%" }}>
      {entries.map((entry, i) => (
        <div key={i} className={i === entries.length - 1 ? "log-line-new" : ""} style={{ paddingBottom: 2 }}>
          <span style={{ color: "#3C1518", marginRight: 6 }}>›</span>
          {entry.message}
        </div>
      ))}
    </div>
  );
}

function PartyRoster({ party, activeIndex, onSwitch, disabled }: {
  party: Pokemon[];
  activeIndex: number;
  onSwitch: (idx: number) => void;
  disabled: boolean;
}): React.ReactElement {
  return (
    <div className="party-roster">
      {party.map((mon, i) => {
        const fainted = mon.currentHp === 0;
        const isActive = i === activeIndex;
        return (
          <div
            key={i}
            className={`party-slot ${isActive ? "active" : ""} ${fainted ? "fainted" : ""}`}
            onClick={() => !fainted && !isActive && !disabled && onSwitch(i)}
            style={{ padding: "6px 8px", borderRadius: 3, cursor: disabled ? "not-allowed" : "pointer" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
              <span style={{ fontSize: "1.2rem" }}>🐾</span>
              <div style={{ textAlign: "right" }}>
                <div className={`party-slot-name ${isActive ? "active" : ""}`}>{mon.name}</div>
                <div className="party-slot-level">Lv.{mon.level}</div>
              </div>
            </div>
            <HpBar current={mon.currentHp} max={mon.stats.hp} size="sm" />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
              <TypeBadge type={mon.types[0]} />
              {fainted
                ? <span className="party-slot-fainted">FNT</span>
                : isActive
                  ? <span className="party-slot-out">OUT</span>
                  : <span className="party-slot-hp">{mon.currentHp}/{mon.stats.hp}</span>
              }
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InventoryPanel({ inventory, onUseItem, disabled }: {
  inventory: InventoryItem[];
  onUseItem: (item: InventoryItem) => void;
  disabled: boolean;
}): React.ReactElement {
  const usable = inventory.filter(i => i.usableInBattle);
  if (usable.length === 0) {
    return (
      <div className="items-panel">
        <span className="items-empty">NO USABLE ITEMS</span>
        <span className="items-description">Visit the shop between fights to stock up.</span>
      </div>
    );
  }
  return (
    <div style={{ padding: "8px", display: "flex", flexDirection: "column", gap: "6px", height: "100%", overflowY: "auto" }}>
      {usable.map((item) => (
        <button
          key={item.id}
          className="move-btn"
          onClick={() => !disabled && onUseItem(item)}
          disabled={disabled}
          style={{ padding: "8px 12px", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <div>
            <div style={{ fontSize: "0.85rem", color: "#e8d5a3" }}>{item.name}</div>
            <div style={{ fontSize: "0.6rem", color: "#9a8a6a", fontFamily: "'Share Tech Mono', monospace" }}>
              {item.healAmount ? `Heals ${item.healAmount} HP` : item.ppRestore ? `Restores ${item.ppRestore} PP` : item.revivePercent ? `Revives ${item.revivePercent * 100}% HP` : ""}
            </div>
          </div>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "0.65rem", color: "#69140E" }}>×{item.count}</span>
        </button>
      ))}
    </div>
  );
}

interface BattleScreenProps {
  run: RunState;
  onBattleEnd: (result: { victory: boolean; party: Pokemon[]; kills: number }) => void;
  onInventoryUpdate: (inventory: InventoryItem[]) => void;
  onGoldUpdate: (gold: number) => void;
}

export default function BattleScreen({ run, onBattleEnd, onInventoryUpdate, onGoldUpdate }: BattleScreenProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<"fight" | "party" | "items">("fight");
  const [activeMonIndex, setActiveMonIndex] = useState(run.activeIndex);
  const [partyState, setPartyState] = useState<Pokemon[]>(
    () => run.party.map(p => ({ ...p, currentHp: p.currentHp }))
  );
  const [fightOver, setFightOver] = useState(false);

  const currentMon = partyState[activeMonIndex];

  const enemy = useMemo(
    () => buildRandomEnemy(run.fight, run.difficulty),
    [run.fight, run.difficulty]
  );

  const { state, selectMove, resetBattle, switchPokemon } = useBattleEngine(currentMon, enemy);

  const prevFight = useRef(run.fight);

  useEffect(() => {
    if (prevFight.current === run.fight) {
      prevFight.current = run.fight;
      return;
    }
    prevFight.current = run.fight;
    resetBattle(partyState[activeMonIndex], enemy);
    setFightOver(false);
  }, [run.fight]);

  useEffect(() => {
    if (!fightOver && (state.phase === "victory" || state.phase === "defeat" || state.phase === "draw")) {
      setFightOver(true);
      const updatedParty = partyState.map((m, i) =>
        i === activeMonIndex ? { ...state.player } : m
      );
      setPartyState(updatedParty);

      if (state.phase === "victory") {
        const goldEarned = 20 + run.fight * 5;
        onGoldUpdate(run.gold + goldEarned);
      }
    }
  }, [state.phase]);

  useEffect(() => {
    if (!fightOver) return;
    if (state.phase === "victory") {
      const timer = setTimeout(() => {
        const enemyLevel = state.enemy.level;
        const baseXp = enemyLevel * 8;
        const updatedParty = partyState.map((m, i) => {
          const mon = i === activeMonIndex ? { ...state.player } : m;
          const survived = mon.currentHp > 0;
          const bonus = survived ? enemyLevel * 3 : 0;
          return addXpAndLevelUp(mon, baseXp + bonus);
        });
        onBattleEnd({ victory: true, party: updatedParty, kills: 1 });
      }, 2000);
      return () => clearTimeout(timer);
    }
    if (state.phase === "defeat") {
      const stillAlive = partyState.filter((m, i) =>
        i !== activeMonIndex ? m.currentHp > 0 : false
      );
      if (stillAlive.length > 0) {
        const nextIdx = partyState.findIndex((m, i) => i !== activeMonIndex && m.currentHp > 0);
        setActiveMonIndex(nextIdx);
        switchPokemon(partyState[nextIdx]);
        setFightOver(false);
        return;
      }
      const timer = setTimeout(() => {
        onBattleEnd({ victory: false, party: partyState, kills: 0 });
      }, 2000);
      return () => clearTimeout(timer);
    }
    if (state.phase === "draw") {
      const timer = setTimeout(() => {
        onBattleEnd({ victory: false, party: partyState, kills: 0 });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [fightOver, state.phase]);

  const handleMoveClick = (move: Move) => {
    if (state.phase !== "idle" || fightOver) return;
    const moveIndex = currentMon.moves.findIndex(m => m.name === move.name);
    if (moveIndex >= 0) {
      selectMove(moveIndex);
    }
  };

  const handleSwitch = (idx: number) => {
    if (state.phase !== "idle" || fightOver || partyState[idx].currentHp === 0) return;
    const updatedParty = partyState.map((m, i) =>
      i === activeMonIndex ? { ...state.player, moves: [...state.player.moves] } : m
    );
    setPartyState(updatedParty);
    setActiveMonIndex(idx);
    switchPokemon(updatedParty[idx]);
    setActiveTab("fight");
  };

  const handleUseItem = (item: InventoryItem) => {
    if (state.phase !== "idle" || fightOver) return;
    let mon = { ...partyState[activeMonIndex] };
    const newInv = [...run.inventory];
    const invIdx = newInv.findIndex(i => i.id === item.id);
    if (invIdx === -1) return;

    if (item.healAmount) {
      const healed = Math.min(mon.stats.hp, mon.currentHp + item.healAmount);
      mon = { ...mon, currentHp: healed };
    }
    if (item.revivePercent && mon.currentHp === 0) {
      const revived = Math.floor(mon.stats.hp * item.revivePercent);
      mon = { ...mon, currentHp: revived };
    }
    if (item.ppRestore) {
      const updatedMoves = mon.moves.map(m => ({
        ...m,
        pp: Math.min(m.ppMax, m.pp + (item.ppRestore || 0)),
      }));
      mon = { ...mon, moves: updatedMoves };
    }

    setPartyState(partyState.map((m, i) => (i === activeMonIndex ? mon : m)));
    switchPokemon(mon);

    newInv[invIdx].count -= 1;
    if (newInv[invIdx].count <= 0) {
      newInv.splice(invIdx, 1);
    }
    onInventoryUpdate(newInv);
  };

  const canAct = state.phase === "idle" && !fightOver;

  return (
    <div className="outer-texture">
      <div className="outer-container">
        <RunStatusBar fight={run.fight} maxFights={run.maxFights} gold={run.gold} kills={run.kills} />

        <div className="main-content">
          <div className="theater-container">
            <div className="theater-rim scanlines phosphor-vignette theater-bg">
              <div style={{ position: "absolute", top: 16, left: 16, zIndex: 20 }}>
                <TheaterHpBlock pokemon={state.enemy} isEnemy={true} />
              </div>
              <div style={{ position: "absolute", bottom: 16, right: 16, zIndex: 20 }}>
                <TheaterHpBlock pokemon={state.player} isEnemy={false} />
              </div>
              <SpriteArea player={state.player} enemy={state.enemy} />
              {[[0,0],[0,1],[1,0],[1,1]].map((_, i) => (
                <div key={i} className={`theater-corner theater-corner-${i}`} />
              ))}
              <div className="theater-floor-indicator">
                — FIGHT {run.fight} —
              </div>
            </div>
          </div>

          <div className="hud-panel">
            <div className="hud-tab-row">
              {(["fight", "party", "items"] as const).map(tab => (
                <button
                  key={tab}
                  className={`menu-tab ${activeTab === tab ? "active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === "fight" ? "⚔ FIGHT" : tab === "party" ? "◈ PARTY" : "◉ ITEMS"}
                </button>
              ))}
              <div style={{ flex: 1 }} />
              <span className="turn-counter">TURN {state.turn}</span>
            </div>

            <div className="hud-content">
              <div className="hud-left">
                <div className="hud-left-header">
                  <span className="stat-label">COMBAT LOG</span>
                </div>
                <CombatLog entries={state.log} />
              </div>

              <div className="hud-right">
                {activeTab === "fight" && (
                  <div className="moves-grid">
                    {currentMon.moves.map((move, i) => (
                      <MoveButton key={i} move={move} onClick={handleMoveClick} disabled={!canAct} />
                    ))}
                  </div>
                )}

                {activeTab === "party" && (
                  <PartyRoster
                    party={partyState}
                    activeIndex={activeMonIndex}
                    onSwitch={handleSwitch}
                    disabled={!canAct}
                  />
                )}

                {activeTab === "items" && (
                  <InventoryPanel
                    inventory={run.inventory}
                    onUseItem={handleUseItem}
                    disabled={!canAct}
                  />
                )}
              </div>
            </div>

            <div className="hud-footer">
              <div style={{ display: "flex", gap: 12 }}>
                <span className="stat-label">ATK <span style={{ color: "#e8d5a3" }}>{currentMon.stats.atk}</span></span>
                <span className="stat-label">DEF <span style={{ color: "#e8d5a3" }}>{currentMon.stats.def}</span></span>
                <span className="stat-label">SPD <span style={{ color: "#e8d5a3" }}>{currentMon.stats.spe}</span></span>
              </div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "0.6rem", color: "#3C1518" }}>
                {currentMon.name} · ACTIVE
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import './BattleScreen.css';
import React, { useState, useEffect, useRef } from "react";
import { useAccount, useWriteContract } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from './contracts/config';
import { useBattleEngine } from './hooks/useBattleEngine';
import { buildPokemon, buildRandomEnemy } from './data/pokemonUtils';
import type { Pokemon as BattlePokemon, Move, TurnLogEntry } from './types';

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
  const pct = Math.max(0, Math.min(1, current / max));
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

function StatusBadge({ status }: { status?: string | null }): React.ReactElement | null {
  if (!status) return null;
  const map: Record<string, { bg: string; label: string }> = {
    BRN: { bg: "#7a2200", label: "BRN" },
    PAR: { bg: "#6a6400", label: "PAR" },
    PSN: { bg: "#5a0a6a", label: "PSN" },
    SLP: { bg: "#2a2a5a", label: "SLP" },
    FRZ: { bg: "#1a4a6a", label: "FRZ" },
    FNT: { bg: "#1a0000", label: "FNT" },
  };
  const s = map[status] || { bg: "#333", label: status };
  return (
    <span className="status-badge" style={{ background: s.bg, color: "#fff" }}>
      {s.label}
    </span>
  );
}

function RunStatusBar({ floor, gold, kills }: { floor: number; gold: number; kills: number }): React.ReactElement {
  return (
    <div className="run-status-bar">
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="run-status-title">◆ ROGUELITE BATTLE CLIENT ◆</span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <span className="run-chip">FLOOR {floor}</span>
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

function TheaterHpBlock({ pokemon, isEnemy }: { pokemon: BattlePokemon; isEnemy: boolean }): React.ReactElement {
  const pct = pokemon.currentHp / pokemon.stats.hp;
  return (
    <div className={`theater-hp-block ${isEnemy ? "enemy" : "player"}`}>
      <div className={`theater-hp-corner ${isEnemy ? "left" : "right"}`} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div>
          <span className="theater-pokemon-name">{pokemon.name}</span>
          <span className="theater-pokemon-level">Lv.{pokemon.level}</span>
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <StatusBadge status={null} />
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

function SpriteArea({ player, enemy, hitTarget }: { player: BattlePokemon; enemy: BattlePokemon; hitTarget: string | null }) {
  const getPath = (mon: BattlePokemon, side: 'front' | 'back') => {
    const folder = 'normal';
    return `/sprites/${folder}/${mon.id}_${side}.png`;
  };

  return (
    <div style={{ flex: 1, position: "relative", width: '100%', height: '100%' }}>
      <div className="ground-line" />

      <div className={`sprite-enemy ${hitTarget === "enemy" ? "hit-flash" : ""}`}>
        <img
          src={getPath(enemy, 'front')}
          alt={enemy.name}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>

      <div className={`sprite-player ${hitTarget === "player" ? "hit-flash" : ""}`}>
        <img
          src={getPath(player, 'back')}
          alt={player.name}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>
    </div>
  );
}

function MoveButton({ move, onClick }: { move: Move; onClick: (move: Move) => void }): React.ReactElement {
  const noPp = move.pp === 0;
  return (
    <button
      className={`move-btn ${noPp ? "disabled" : ""}`}
      onClick={() => !noPp && onClick(move)}
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

function CombatLog({ entries }: { entries: TurnLogEntry[] }): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [entries]);

  return (
    <div ref={ref} className="combat-log" style={{ padding: "8px 10px", height: "100%" }}>
      {entries.map((entry, i) => (
        <div
          key={i}
          className={i === entries.length - 1 ? "log-line-new" : ""}
          style={{ paddingBottom: 2 }}
        >
          <span style={{ color: "#3C1518", marginRight: 6 }}>›</span>
          {entry.message}
        </div>
      ))}
    </div>
  );
}

function PartyRoster({ party, activeIndex, onSwitch }: {
  party: BattlePokemon[];
  activeIndex: number;
  onSwitch: (idx: number) => void;
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
            onClick={() => !fainted && !isActive && onSwitch(i)}
            style={{ padding: "6px 8px", borderRadius: 3 }}
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

interface BattleScreenProps {
  onExitRun: () => void;
}

export default function BattleScreen({ onExitRun }: BattleScreenProps): React.ReactElement {
  const [floor, setFloor] = useState(1);
  const [gold, setGold] = useState(0);
  const [kills, setKills] = useState(0);
  const [hitTarget, setHitTarget] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"fight" | "party" | "items">("fight");

  const playerMon = buildPokemon("charmander", 10 + floor);
  const enemyMon = buildRandomEnemy(floor);

  const { state, selectMove } = useBattleEngine(playerMon, enemyMon);
  const { log, player, enemy } = state;

  const { address } = useAccount();
  const { writeContract, isPending, isSuccess } = useWriteContract();

  const handleMoveClick = (move: Move) => {
    const moveIndex = player.moves.findIndex(m => m.name === move.name);
    if (moveIndex >= 0) {
      setHitTarget(enemy.currentHp > 0 ? "enemy" : "player");
      setTimeout(() => setHitTarget(null), 800);
      selectMove(moveIndex);

      if (state.phase === "idle" && enemy.currentHp <= 0) {
        setKills(k => k + 1);
        setGold(g => g + 20 + floor * 5);
        setTimeout(() => {
          setFloor(f => f + 1);
        }, 1500);
      }
    }
  };

  const handleSwitch = (_idx: number) => {
    setActiveTab("fight");
  };

  const handleSettleRun = () => {
    if (!address) return;

    writeContract({
      address: CONTRACT_ADDRESSES.gameSettler as `0x${string}`,
      abi: CONTRACT_ABIS.gameSettler,
      functionName: 'settleRun',
      args: [
        address,
        parseEther(String(gold * 2)),
        false,
        parseEther("0"),
        []
      ]
    } as any, {
      onSuccess: () => {
        setTimeout(() => onExitRun(), 2500);
      },
      onError: (_err: Error) => { }
    });
  };

  return (
    <div className="outer-texture">
      <div className="outer-container">
        <RunStatusBar floor={floor} gold={gold} kills={kills} />

        <div className="main-content">
          <div className="theater-container">
            <div className="theater-rim scanlines phosphor-vignette theater-bg">
              <div style={{ position: "absolute", top: 16, left: 16, zIndex: 20 }}>
                <TheaterHpBlock pokemon={enemy} isEnemy={true} />
              </div>

              <div style={{ position: "absolute", bottom: 16, right: 16, zIndex: 20 }}>
                <TheaterHpBlock pokemon={player} isEnemy={false} />
              </div>

              <SpriteArea player={player} enemy={enemy} hitTarget={hitTarget} />

              {[["0","0"], ["0","auto"], ["auto","0"], ["auto","auto"]].map((_, i) => (
                <div key={i} className={`theater-corner theater-corner-${i}`} />
              ))}

              <div className="theater-floor-indicator">
                — FLOOR {floor} —
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
                <CombatLog entries={log} />
              </div>

              <div className="hud-right">
                {activeTab === "fight" && (
                  <div className="moves-grid">
                    {player.moves.map((move, i) => (
                      <MoveButton key={i} move={move} onClick={handleMoveClick} />
                    ))}
                  </div>
                )}

                {activeTab === "party" && (
                  <PartyRoster
                    party={[player]}
                    activeIndex={0}
                    onSwitch={handleSwitch}
                  />
                )}

                {activeTab === "items" && (
                  <div className="items-panel">
                    <span className="items-empty">NO ITEMS IN INVENTORY</span>
                    <span className="items-description">Visit the shop between floors to acquire items.</span>
                  </div>
                )}
              </div>
            </div>

            <div className="hud-footer">
              <div style={{ display: "flex", gap: 12 }}>
                <span className="stat-label">ATK <span style={{ color: "#e8d5a3" }}>{player.stats.atk}</span></span>
                <span className="stat-label">DEF <span style={{ color: "#e8d5a3" }}>{player.stats.def}</span></span>
                <span className="stat-label">SPD <span style={{ color: "#e8d5a3" }}>{player.stats.spe}</span></span>
              </div>
              <button
                className="flee-button"
                onClick={handleSettleRun}
                disabled={isPending || isSuccess}
                onMouseEnter={e => {
                  if (isPending || isSuccess) return;
                  e.currentTarget.style.boxShadow = "0 0 10px rgba(105,20,14,0.6)";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={e => {
                  if (isPending || isSuccess) return;
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.color = "#e8d5a3";
                }}
                style={{ opacity: (isPending || isSuccess) ? 0.5 : 1, cursor: (isPending || isSuccess) ? "not-allowed" : "pointer" }}
              >
                {isPending ? "SETTLING..." : isSuccess ? "SUCCESS!" : "SETTLE RUN ON-CHAIN"}
              </button>
            </div>
          </div>
        </div>

        <div className="app-footer">
          ROGUELITE BATTLE CLIENT · RESULTS SETTLED ON-CHAIN AT RUN END
        </div>
      </div>
    </div>
  );
}

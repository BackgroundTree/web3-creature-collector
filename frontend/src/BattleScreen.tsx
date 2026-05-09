import './BattleScreen.css';
import React, { useState, useEffect, useRef } from "react";
// Web3 Imports
import { useAccount, useWriteContract } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from './contracts/config';

// ─── TYPE DEFINITIONS ────────────────────────────────────────────────────────

interface Pokemon {
  id: number;
  name: string;
  isShiny: boolean;
  level: number;
  hp: number;
  maxHp: number;
  type1: string;
  type2: string | null;
  status: string | null;
  sprite?: string;
  flash?: boolean;
}

interface Move {
  name: string;
  type: string;
  pp: number;
  maxPp: number;
  power: number | null;
  category: string;
}

interface PartyMember extends Pokemon {
  active: boolean;
}

// ─── UTILITY HELPERS ─────────────────────────────────────────────────────────

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

interface TypeBadgeProps {
  type?: string;
}

function TypeBadge({ type }: TypeBadgeProps): React.ReactElement {
  return (
    <span
      className="type-badge"
      style={{ background: TYPE_COLORS[type || ""] || "#333", color: "#fff" }}
    >
      {type?.toUpperCase()}
    </span>
  );
}

interface HpBarProps {
  current: number;
  max: number;
  size?: "sm" | "md";
}

function HpBar({ current, max, size = "md" }: HpBarProps): React.ReactElement {
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

interface StatusBadgeProps {
  status?: string | null;
}

function StatusBadge({ status }: StatusBadgeProps): React.ReactElement | null {
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

// ─── MOCK DATA ───────────────────────────────────────────────────────────────

const MOCK_PLAYER: Pokemon = {
  id: 5,
  name: "Charmeleon",
  isShiny: false,
  level: 24,
  hp: 112,
  maxHp: 150,
  type1: "Fire",
  type2: null,
  status: null,
};

const MOCK_ENEMY: Pokemon = {
  id: 33,
  name: "Nidorino",
  isShiny: true,
  level: 23,
  hp: 68,
  maxHp: 170,
  type1: "Poison",
  type2: null,
  status: null,
};

const MOCK_MOVES: Move[] = [
  { name: "Flamethrower", type: "Fire",    pp: 10, maxPp: 15, power: 90, category: "Special" },
  { name: "Air Slash",    type: "Flying",  pp: 7,  maxPp: 15, power: 75, category: "Special" },
  { name: "Dragon Claw",  type: "Dragon",  pp: 15, maxPp: 15, power: 80, category: "Physical" },
  { name: "Roost",        type: "Flying",  pp: 5,  maxPp: 10, power: null, category: "Status" },
];

const MOCK_PARTY: PartyMember[] = [
  { id: 1, name: "Charizard", hp: 112, maxHp: 150, level: 24, type1: "Fire",    type2: null, status: null, isShiny: false, sprite: "🔥", active: true },
  { id: 2, name: "Blastoise", hp: 140, maxHp: 160, level: 23, type1: "Water",   type2: null, status: null, isShiny: false, sprite: "💧", active: false },
  { id: 3, name: "Venusaur",  hp: 0,   maxHp: 145, level: 22, type1: "Grass",   type2: null, status: null, isShiny: false, sprite: "🌿", active: false },
  { id: 4, name: "Gengar",    hp: 95,  maxHp: 120, level: 21, type1: "Ghost",   type2: null, status: null, isShiny: false, sprite: "👻", active: false },
  { id: 5, name: "Machamp",   hp: 130, maxHp: 155, level: 20, type1: "Fighting", type2: null, status: null, isShiny: false, sprite: "👊", active: false },
  { id: 6, name: "Alakazam",  hp: 0,   maxHp: 110, level: 19, type1: "Psychic", type2: null, status: null, isShiny: false, sprite: "🔮", active: false },
];

const MOCK_LOG: string[] = [
  "Run initialized — Floor 3 · Boss Encounter",
  "Wild GYARADOS appeared!",
  "Go! CHARIZARD!",
  "GYARADOS used Hydro Pump!",
  "It's super effective! CHARIZARD lost 38 HP.",
  "CHARIZARD's Blaze activated!",
  "CHARIZARD used Flamethrower!",
  "GYARADOS lost 52 HP.",
];

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

interface RunStatusBarProps {
  floor: number;
  gold: number;
  kills: number;
}

function RunStatusBar({ floor, gold, kills }: RunStatusBarProps): React.ReactElement {
  return (
    <div className="run-status-bar">
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="run-status-title">
          ◆ ROGUELITE BATTLE CLIENT ◆
        </span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <span className="run-chip">FLOOR {floor}</span>
        <span className="run-chip">⚔ {kills} KILLS</span>
        <span className="run-chip">◈ {gold} GOLD</span>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div className="status-indicator" />
        <span className="status-text">
          ON-CHAIN READY
        </span>
      </div>
    </div>
  );
}

interface TheaterHpBlockProps {
  pokemon: Pokemon;
  isEnemy: boolean;
}

function TheaterHpBlock({ pokemon, isEnemy }: TheaterHpBlockProps): React.ReactElement {
  const pct = pokemon.hp / pokemon.maxHp;
  return (
    <div className={`theater-hp-block ${isEnemy ? "enemy" : "player"}`}>
      {/* corner chrome */}
      <div className={`theater-hp-corner ${isEnemy ? "left" : "right"}`} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div>
          <span className="theater-pokemon-name">
            {pokemon.name}
          </span>
          <span className="theater-pokemon-level">
            Lv.{pokemon.level}
          </span>
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <StatusBadge status={pokemon.status} />
          <TypeBadge type={pokemon.type1} />
          {pokemon.type2 && <TypeBadge type={pokemon.type2} />}
        </div>
      </div>

      <HpBar current={pokemon.hp} max={pokemon.maxHp} size="md" />

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
        <span className="stat-label">HP</span>
        <span className="theater-hp-text" style={{ color: getHpColor(pct) }}>
          {pokemon.hp} / {pokemon.maxHp}
        </span>
      </div>
    </div>
  );
}

interface SpriteAreaProps {
  player: Pokemon & { flash?: boolean };
  enemy: Pokemon & { flash?: boolean };
}

function SpriteArea({ player, enemy }: SpriteAreaProps) {
  const getPath = (mon: Pokemon, side: 'front' | 'back') => {
    const folder = mon.isShiny ? 'shiny' : 'normal';
    return `/sprites/${folder}/${mon.id}_${side}.png`;
  };

  return (
    <div style={{ flex: 1, position: "relative", width: '100%', height: '100%' }}>
      {/* GROUND LINE */}
      <div className="ground-line" />

      {/* Enemy Sprite */}
      <div className="sprite-enemy">
        <img 
          key={`enemy-${enemy.id}`}
          src={getPath(enemy, 'front')} 
          alt={enemy.name} 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
        />
      </div>

      {/* Player Sprite */}
      <div className="sprite-player">
        <img 
          key={`player-${player.id}`}
          src={getPath(player, 'back')} 
          alt={player.name} 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
        />
      </div>
    </div>
  );
}

interface MoveButtonProps {
  move: Move;
  onClick: (move: Move) => void;
}

function MoveButton({ move, onClick }: MoveButtonProps): React.ReactElement {
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
          PP {move.pp}/{move.maxPp}
        </span>
      </div>
    </button>
  );
}

interface CombatLogProps {
  entries: string[];
}

function CombatLog({ entries }: CombatLogProps): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [entries]);
  return (
    <div ref={ref} className="combat-log" style={{ padding: "8px 10px", height: "100%" }}>
      {entries.map((line, i) => (
        <div
          key={i}
          className={i === entries.length - 1 ? "log-line-new" : ""}
          style={{ paddingBottom: 2 }}
        >
          <span style={{ color: "#3C1518", marginRight: 6 }}>›</span>
          {line}
        </div>
      ))}
    </div>
  );
}

interface PartyRosterProps {
  party: PartyMember[];
  onSwitch: (idx: number) => void;
}

function PartyRoster({ party, onSwitch }: PartyRosterProps): React.ReactElement {
  return (
    <div className="party-roster">
      {party.map((mon, i) => {
        const fainted = mon.hp === 0;
        return (
          <div
            key={i}
            className={`party-slot ${mon.active ? "active" : ""} ${fainted ? "fainted" : ""}`}
            onClick={() => !fainted && !mon.active && onSwitch(i)}
            style={{ padding: "6px 8px", borderRadius: 3 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
              <span style={{ fontSize: "1.2rem" }}>{mon.sprite}</span>
              <div style={{ textAlign: "right" }}>
                <div className={`party-slot-name ${mon.active ? "active" : ""}`}>
                  {mon.name}
                </div>
                <div className="party-slot-level">
                  Lv.{mon.level}
                </div>
              </div>
            </div>
            <HpBar current={mon.hp} max={mon.maxHp} size="sm" />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
              <TypeBadge type={mon.type1} />
              {fainted
                ? <span className="party-slot-fainted">FNT</span>
                : mon.active
                  ? <span className="party-slot-out">OUT</span>
                  : <span className="party-slot-hp">
                      {mon.hp}/{mon.maxHp}
                    </span>
              }
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── MAIN BATTLE SCREEN ───────────────────────────────────────────────────────
interface BattleScreenProps {
  onExitRun: () => void;
}

export default function BattleScreen({ onExitRun }: BattleScreenProps): React.ReactElement {
  const [log, setLog] = useState<string[]>(MOCK_LOG);
  const [player, setPlayer] = useState<Pokemon>(MOCK_PLAYER);
  const [enemy, setEnemy] = useState<Pokemon>(MOCK_ENEMY);
  const [party, setParty] = useState<PartyMember[]>(MOCK_PARTY);
  const [moves] = useState<Move[]>(MOCK_MOVES);
  const [activeTab, setActiveTab] = useState<"fight" | "party" | "items">("fight");
  const [hitTarget, setHitTarget] = useState<string | null>(null);

// ─── WEB3 LOGIC ───────────────────────────────────────────────────────────
  const { address } = useAccount();
  const { writeContract, isPending, isSuccess } = useWriteContract();

  const handleSettleRun = () => {
    if (!address) {
      addLog("Error: No wallet connected!");
      return;
    }

    addLog("Transmitting run data to the blockchain...");

    writeContract({
          address: CONTRACT_ADDRESSES.gameSettler as `0x${string}`,
          abi: CONTRACT_ABIS.gameSettler,
          functionName: 'settleRun',
          args: [
            address,                  
            parseEther("500"),        
            true,                     
            parseEther("0"),          
            [                         
              {                        
                speciesId: 4,         
                level: 5,
                ivs: [31, 31, 31, 31, 31, 31],
                heldItemIds: []
              }
            ]
          ]
        }, {
          onSuccess: () => {
            addLog("SUCCESS: $RELIC and NFT Minted!");
            addLog("Returning to menu...");
            // Auto-redirect after 2.5 seconds
            setTimeout(() => {
              onExitRun();
            }, 2500);
          },
          onError: (err) => addLog(`TX FAILED: ${err.message.split('\n')[0]}`)
        });
  };
  // ──────────────────────────────────────────────────────────────────────────
  const addLog = (line: string): void => {
    setLog(prev => [...prev.slice(-40), line]);
  };

  const handleMove = (move: Move): void => {
    const dmg = move.power ? Math.floor(move.power * (0.7 + Math.random() * 0.6)) : 0;

    setHitTarget("enemy");
    setTimeout(() => setHitTarget(null), 800);

    if (dmg > 0) {
      setEnemy(prev => ({ ...prev, hp: Math.max(0, prev.hp - dmg) }));
      addLog(`${player.name} used ${move.name}!`);
      addLog(`${enemy.name} lost ${dmg} HP.`);
    } else {
      addLog(`${player.name} used ${move.name}!`);
      addLog(`${player.name} restored some HP.`);
    }

    // Enemy counter
    setTimeout(() => {
      const eDmg = Math.floor(20 + Math.random() * 40);
      setHitTarget("player");
      setTimeout(() => setHitTarget(null), 800);
      setPlayer(prev => ({ ...prev, hp: Math.max(0, prev.hp - eDmg) }));
      addLog(`${enemy.name} used Hydro Pump!`);
      addLog(`${player.name} lost ${eDmg} HP.`);
    }, 900);
  };

  const handleSwitch = (idx: number): void => {
    const mon = party[idx];
    setParty(prev => prev.map((p, i) => ({ ...p, active: i === idx })));
    setPlayer({ ...mon, hp: mon.hp, maxHp: mon.maxHp });
    addLog(`Come back, ${player.name}!`);
    addLog(`Go! ${mon.name}!`);
    setActiveTab("fight");
  };

  return (
    <div className="outer-texture">
      <div className="outer-container">
        {/* ── TOP STATUS BAR ── */}
        <RunStatusBar floor={3} gold={420} kills={7} />

        {/* ── MAIN CONTENT (theater + hud) ── */}
        <div className="main-content">

          {/* ── 16:9 BATTLE THEATER ── */}
          <div className="theater-container">
            <div className="theater-rim scanlines phosphor-vignette theater-bg">
              {/* enemy hp block — top-left */}
              <div style={{ position: "absolute", top: 16, left: 16, zIndex: 20 }}>
                <TheaterHpBlock pokemon={enemy} isEnemy={true} />
              </div>

              {/* player hp block — bottom-right */}
              <div style={{ position: "absolute", bottom: 16, right: 16, zIndex: 20 }}>
                <TheaterHpBlock pokemon={player} isEnemy={false} />
              </div>

              {/* sprites */}
              <SpriteArea player={{ ...player, flash: hitTarget === "player" }} enemy={{ ...enemy, flash: hitTarget === "enemy" }} />

              {/* theater corner decorations */}
              {[["0","0"], ["0","auto"], ["auto","0"], ["auto","auto"]].map((_, i) => (
                <div key={i} className={`theater-corner theater-corner-${i}`} />
              ))}

              {/* floor indicator */}
              <div className="theater-floor-indicator">
                — FLOOR 3 · BOSS —
              </div>
            </div>
          </div>

          {/* ── BOTTOM HUD ── */}
          <div className="hud-panel">
            {/* tab row */}
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
              <span className="turn-counter">
                TURN 12
              </span>
            </div>

            {/* main hud content */}
            <div className="hud-content">
              {/* LEFT: combat log */}
              <div className="hud-left">
                <div className="hud-left-header">
                  <span className="stat-label">COMBAT LOG</span>
                </div>
                <CombatLog entries={log} />
              </div>

              {/* RIGHT: active panel */}
              <div className="hud-right">
                {activeTab === "fight" && (
                  <div className="moves-grid">
                    {moves.map((move, i) => (
                      <MoveButton key={i} move={move} onClick={handleMove} />
                    ))}
                  </div>
                )}

                {activeTab === "party" && (
                  <PartyRoster party={party} onSwitch={handleSwitch} />
                )}

                {activeTab === "items" && (
                  <div className="items-panel">
                    <span className="items-empty">
                      NO ITEMS IN INVENTORY
                    </span>
                    <span className="items-description">
                      Visit the shop between floors to acquire items.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* HUD footer strip */}
            <div className="hud-footer">
              <div style={{ display: "flex", gap: 12 }}>
                <span className="stat-label">ATK <span style={{ color: "#e8d5a3" }}>84</span></span>
                <span className="stat-label">DEF <span style={{ color: "#e8d5a3" }}>67</span></span>
                <span className="stat-label">SPD <span style={{ color: "#e8d5a3" }}>100</span></span>
              </div>
                <button className="flee-button"
                  onClick={handleSettleRun}
                  disabled={isPending || isSuccess}
                  onMouseEnter={e => {
                    if (isPending || isSuccess) return;
                    const target = e.currentTarget;
                    target.style.boxShadow = "0 0 10px rgba(105,20,14,0.6)";
                    target.style.color = "#fff";
                  }}
                  onMouseLeave={e => {
                    if (isPending || isSuccess) return;
                    const target = e.currentTarget;
                    target.style.boxShadow = "none";
                    target.style.color = "#e8d5a3";
                  }}
                  style={{ opacity: (isPending || isSuccess) ? 0.5 : 1, cursor: (isPending || isSuccess) ? "not-allowed" : "pointer" }}
                >
                  {isPending ? "SETTLING..." : isSuccess ? "SUCCESS!" : "SETTLE RUN ON-CHAIN"}
                </button>
            </div>
          </div>
        </div>

        {/* tiny footer */}
        <div className="app-footer">
          ROGUELITE BATTLE CLIENT · RESULTS SETTLED ON-CHAIN AT RUN END
        </div>
      </div>
    </div>
  );
}

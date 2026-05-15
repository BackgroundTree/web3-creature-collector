import { useState, useMemo } from 'react';
import { buildPokemon, POKEMON_KEYS, getPokemonDisplayData } from './data/pokemonUtils';
import type { Pokemon, Difficulty } from './types';

const TYPE_COLORS: Record<string, string> = {
  Fire: "#c95c00", Water: "#1a6fa8", Grass: "#2d7a1e", Electric: "#b09400",
  Ice: "#3b8fa3", Fighting: "#8b2e00", Poison: "#6b1a7a", Ground: "#8a6300",
  Flying: "#3a5a8a", Psychic: "#9a1a5a", Bug: "#4a6a00", Rock: "#6a5a3a",
  Ghost: "#3a2a5a", Dragon: "#3a1a8a", Dark: "#2a1a1a", Steel: "#4a5a6a",
  Fairy: "#9a3a6a", Normal: "#5a5a5a",
};

const DIFFICULTIES: { key: Difficulty; label: string; desc: string }[] = [
  { key: "easy",   label: "EASY",   desc: "Weaker enemies, chill adventure" },
  { key: "normal", label: "NORMAL", desc: "Balanced challenge" },
  { key: "hard",   label: "HARD",   desc: "Brutal enemies, high risk" },
];

interface PartySelectProps {
  onConfirm: (party: Pokemon[], difficulty: Difficulty) => void;
}

export default function PartySelect({ onConfirm }: PartySelectProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");

  const speciesList = useMemo(() => {
    return POKEMON_KEYS.map(key => ({
      key,
      display: getPokemonDisplayData(key),
    })).filter(s => s.display);
  }, []);

  const toggleSelect = (key: string) => {
    setSelected(prev => {
      if (prev.includes(key)) return prev.filter(k => k !== key);
      if (prev.length >= 2) return prev;
      return [...prev, key];
    });
  };

  const handleConfirm = () => {
    const party = selected.map((key, i) => buildPokemon(key, 8 + i * 4));
    onConfirm(party, difficulty);
  };

  return (
    <div style={{
      height: "100vh",
      background: "#020001",
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
        color: "#69140E",
        textAlign: "center",
        letterSpacing: "0.2em",
        marginBottom: "8px",
      }}>
        ◆ SELECT YOUR PARTY ◆
      </div>
      <div style={{
        textAlign: "center",
        fontFamily: "'Rajdhani', sans-serif",
        color: "#9a8a6a",
        fontSize: "0.9rem",
        marginBottom: "12px",
      }}>
        Choose up to 2 creatures ({selected.length}/2)
      </div>

      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: "10px",
        marginBottom: "20px",
      }}>
        {DIFFICULTIES.map(d => (
          <button
            key={d.key}
            onClick={() => setDifficulty(d.key)}
            style={{
              padding: "8px 20px",
              background: difficulty === d.key
                ? "linear-gradient(135deg, #0f2a0f, #0a1f0a)"
                : "transparent",
              border: `1px solid ${difficulty === d.key ? "#3ddc84" : "#3C1518"}`,
              color: difficulty === d.key ? "#3ddc84" : "#9a8a6a",
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "1rem",
              letterSpacing: "0.15em",
              cursor: "pointer",
              clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
            }}
            title={d.desc}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: "10px",
        maxWidth: "900px",
        width: "100%",
        margin: "0 auto",
        flex: 1,
        overflowY: "auto",
        paddingBottom: "80px",
      }}>
        {speciesList.map(({ key, display }) => {
          if (!display) return null;
          const isSelected = selected.includes(key);
          const isHovered = hovered === key;

          return (
            <div
              key={key}
              onClick={() => toggleSelect(key)}
              onMouseEnter={() => setHovered(key)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: isSelected
                  ? "linear-gradient(135deg, #0a2a0a, #051505)"
                  : isHovered
                    ? "linear-gradient(135deg, #1a0608, #0a0002)"
                    : "linear-gradient(135deg, #0e0005, #050001)",
                border: `1px solid ${isSelected ? "#3ddc84" : isHovered ? "#69140E" : "#3C1518"}`,
                padding: "12px",
                cursor: "pointer",
                transition: "all 0.15s ease",
                clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
                opacity: !isSelected && selected.length >= 2 ? 0.4 : 1,
                position: "relative",
              }}
            >
              {isSelected && (
                <div style={{
                  position: "absolute",
                  top: 4,
                  right: 8,
                  color: "#3ddc84",
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "0.7rem",
                }}>
                  ●
                </div>
              )}

              <div style={{
                width: "100%",
                height: "80px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "8px",
                background: "rgba(0,0,0,0.3)",
              }}>
                <img
                  src={`/sprites/normal/${display.id}_front.png`}
                  alt={display.name}
                  style={{
                    width: "64px",
                    height: "64px",
                    imageRendering: "pixelated",
                    opacity: isSelected || selected.length < 2 ? 1 : 0.3,
                    filter: isSelected ? "none" : "grayscale(0.5)",
                    transition: "all 0.15s ease",
                  }}
                />
              </div>

              <div style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "1rem",
                color: isSelected ? "#3ddc84" : "#e8d5a3",
                letterSpacing: "0.05em",
                textAlign: "center",
              }}>
                {display.name}
              </div>

              <div style={{
                display: "flex",
                gap: "4px",
                justifyContent: "center",
                marginTop: "6px",
              }}>
                {display.types.map((t: string) => (
                  <span key={t} style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: "0.55rem",
                    background: TYPE_COLORS[t] || "#333",
                    color: "#fff",
                    padding: "1px 4px",
                    borderRadius: "2px",
                  }}>
                    {t.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        padding: "16px 20px",
        background: "linear-gradient(0deg, #020001 0%, rgba(2,0,1,0.8) 100%)",
        display: "flex",
        justifyContent: "center",
        gap: "16px",
        borderTop: "1px solid #3C1518",
      }}>
        <button
          onClick={() => window.history.back()}
          style={{
            padding: "12px 32px",
            background: "transparent",
            border: "1px solid #3C1518",
            color: "#9a8a6a",
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "1rem",
            letterSpacing: "0.15em",
            cursor: "pointer",
            clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
          }}
        >
          BACK
        </button>
        <button
          onClick={handleConfirm}
          disabled={selected.length === 0}
          style={{
            padding: "12px 40px",
            background: selected.length > 0
              ? "linear-gradient(135deg, #0f2a0f, #0a1f0a)"
              : "rgba(10,0,2,0.8)",
            border: `1px solid ${selected.length > 0 ? "#3ddc84" : "#3C1518"}`,
            color: selected.length > 0 ? "#3ddc84" : "#5a5a5a",
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "1.1rem",
            letterSpacing: "0.2em",
            cursor: selected.length > 0 ? "pointer" : "not-allowed",
            opacity: selected.length > 0 ? 1 : 0.5,
            clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
          }}
        >
          ⚔ START RUN
        </button>
      </div>
    </div>
  );
}

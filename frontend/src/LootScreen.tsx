import { useState, useMemo } from 'react';
import { generateLootOptions, createInventoryItemFromLoot } from './data/itemData';
import type { InventoryItem } from './types';

interface LootScreenProps {
  onChoose: (items: InventoryItem[]) => void;
}

export default function LootScreen({ onChoose }: LootScreenProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const options = useMemo(() => generateLootOptions(3), []);

  const handleChoose = () => {
    if (!selectedId) return;
    const item = createInventoryItemFromLoot(selectedId);
    if (!item) return;
    onChoose([item]);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#020001",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: "-20%", left: "-10%", width: "500px", height: "500px",
        background: "radial-gradient(circle, rgba(105,20,14,0.15) 0%, transparent 70%)",
        borderRadius: "50%", animation: "pulse 8s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", bottom: "-20%", right: "-10%", width: "600px", height: "600px",
        background: "radial-gradient(circle, rgba(61,220,132,0.05) 0%, transparent 70%)",
        borderRadius: "50%", animation: "pulse 10s ease-in-out infinite reverse",
      }} />

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      `}</style>

      <div style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
        color: "#e8d5a3",
        letterSpacing: "0.2em",
        textShadow: "0 0 40px rgba(105,20,14,0.4)",
        marginBottom: "8px",
      }}>
        ◆ LOOT DROP ◆
      </div>
      <div style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: "0.75rem",
        color: "#9a8a6a",
        marginBottom: "30px",
      }}>
        Choose one reward
      </div>

      <div style={{
        display: "flex",
        gap: "16px",
        flexWrap: "wrap",
        justifyContent: "center",
        maxWidth: "700px",
        width: "100%",
      }}>
        {options.map((opt) => {
          const isSelected = selectedId === opt.id;
          return (
            <div
              key={opt.id}
              onClick={() => setSelectedId(opt.id)}
              style={{
                flex: "1 1 180px",
                maxWidth: "220px",
                padding: "20px 16px",
                background: isSelected
                  ? "linear-gradient(135deg, #0a2a0a, #051505)"
                  : "linear-gradient(135deg, #0e0005, #050001)",
                border: `1px solid ${isSelected ? "#3ddc84" : "#3C1518"}`,
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.15s ease",
                boxShadow: isSelected ? "0 0 20px rgba(61,220,132,0.3), inset 0 0 15px rgba(61,220,132,0.05)" : "none",
                clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
              }}
            >
              <div style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "1.3rem",
                color: isSelected ? "#3ddc84" : "#e8d5a3",
                marginBottom: "8px",
                letterSpacing: "0.08em",
              }}>
                {opt.name}
              </div>
              <div style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.8rem",
                color: "#9a8a6a",
                marginBottom: "8px",
              }}>
                {opt.description}
              </div>
              <div style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: "0.6rem",
                color: opt.persistAfterRun ? "#3ddc84" : "#69140E",
              }}>
                {opt.persistAfterRun ? "◆ PERSISTENT" : "◈ RUN ONLY"}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={handleChoose}
        disabled={!selectedId}
        style={{
          marginTop: "40px",
          padding: "14px 48px",
          background: selectedId
            ? "linear-gradient(135deg, #0f2a0f, #0a1f0a)"
            : "rgba(10,0,2,0.8)",
          border: `1px solid ${selectedId ? "#3ddc84" : "#3C1518"}`,
          color: selectedId ? "#3ddc84" : "#5a5a5a",
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "1.2rem",
          letterSpacing: "0.2em",
          cursor: selectedId ? "pointer" : "not-allowed",
          opacity: selectedId ? 1 : 0.5,
          clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
        }}
      >
        CLAIM
      </button>
    </div>
  );
}

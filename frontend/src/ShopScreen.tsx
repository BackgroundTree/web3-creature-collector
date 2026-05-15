import { useState, useMemo } from 'react';
import { getShopItems, buyShopItem } from './data/itemData';
import type { InventoryItem, ShopItem } from './types';

interface ShopScreenProps {
  gold: number;
  inventory: InventoryItem[];
  onGoldUpdate: (gold: number) => void;
  onInventoryUpdate: (inventory: InventoryItem[]) => void;
  onDone: () => void;
}

export default function ShopScreen({ gold, inventory, onGoldUpdate, onInventoryUpdate, onDone }: ShopScreenProps) {
  const [message, setMessage] = useState<string | null>(null);

  const shopItems = useMemo(() => getShopItems(), []);

  const handleBuy = (shopItem: ShopItem) => {
    if (gold < shopItem.price) {
      setMessage("Not enough gold!");
      setTimeout(() => setMessage(null), 2000);
      return;
    }
    const invItem = buyShopItem(shopItem.id);
    if (!invItem) return;

    const newInv = [...inventory];
    const existing = newInv.find(i => i.id === shopItem.id);
    if (existing) {
      existing.count += 1;
    } else {
      newInv.push(invItem);
    }

    onGoldUpdate(gold - shopItem.price);
    onInventoryUpdate(newInv);
    setMessage(`Bought ${shopItem.name}!`);
    setTimeout(() => setMessage(null), 1500);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#020001",
      display: "flex",
      flexDirection: "column",
      padding: "20px",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: "-10%", right: "-5%", width: "400px", height: "400px",
        background: "radial-gradient(circle, rgba(105,20,14,0.1) 0%, transparent 70%)",
        borderRadius: "50%", animation: "pulse 8s ease-in-out infinite",
      }} />

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      `}</style>

      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
          color: "#e8d5a3",
          letterSpacing: "0.2em",
          marginBottom: "4px",
        }}>
          ◆ SHOP ◆
        </div>
        <div style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: "0.9rem",
          color: "#e8d5a3",
          letterSpacing: "0.1em",
        }}>
          ◈ {gold} GOLD
        </div>
      </div>

      {message && (
        <div style={{
          textAlign: "center",
          padding: "8px 16px",
          margin: "0 auto 16px",
          maxWidth: "400px",
          background: message.includes("Not enough") ? "rgba(200,16,46,0.1)" : "rgba(61,220,132,0.1)",
          border: `1px solid ${message.includes("Not enough") ? "#c8102e" : "#3ddc84"}`,
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: "0.75rem",
          color: message.includes("Not enough") ? "#c8102e" : "#3ddc84",
        }}>
          {message}
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: "12px",
        maxWidth: "800px",
        width: "100%",
        margin: "0 auto",
        flex: 1,
        overflowY: "auto",
        paddingBottom: "80px",
      }}>
        {shopItems.map((item) => {
          const canAfford = gold >= item.price;
          return (
            <div
              key={item.id}
              style={{
                padding: "16px",
                background: canAfford
                  ? "linear-gradient(135deg, #0e0005, #050001)"
                  : "linear-gradient(135deg, #050001, #020001)",
                border: `1px solid ${canAfford ? "#3C1518" : "#1a0204"}`,
                opacity: canAfford ? 1 : 0.4,
                clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
              }}
            >
              <div style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "1.1rem",
                color: "#e8d5a3",
                letterSpacing: "0.08em",
                marginBottom: "4px",
              }}>
                {item.name}
              </div>
              <div style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: "0.65rem",
                color: "#9a8a6a",
                marginBottom: "12px",
              }}>
                {item.healAmount ? `Restores ${item.healAmount} HP` : item.ppRestore ? `Restores ${item.ppRestore} PP` : item.revivePercent ? `Revives ${item.revivePercent * 100}% HP` : ""}
              </div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <span style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "0.7rem",
                  color: canAfford ? "#e8d5a3" : "#c8102e",
                }}>
                  ◈ {item.price}
                </span>
                <button
                  onClick={() => handleBuy(item)}
                  disabled={!canAfford}
                  style={{
                    padding: "6px 16px",
                    background: canAfford
                      ? "linear-gradient(135deg, #3C1518, #1a0206)"
                      : "transparent",
                    border: `1px solid ${canAfford ? "#69140E" : "#3C1518"}`,
                    color: canAfford ? "#e8d5a3" : "#5a5a5a",
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "0.85rem",
                    letterSpacing: "0.1em",
                    cursor: canAfford ? "pointer" : "not-allowed",
                    clipPath: "polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)",
                  }}
                >
                  BUY
                </button>
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
        padding: "16px",
        background: "linear-gradient(0deg, #020001 0%, rgba(2,0,1,0.8) 100%)",
        display: "flex",
        justifyContent: "center",
        borderTop: "1px solid #3C1518",
      }}>
        <button
          onClick={onDone}
          style={{
            padding: "12px 48px",
            background: "linear-gradient(135deg, #1a3a1a, #0d1f0d)",
            border: "1px solid #3ddc84",
            color: "#3ddc84",
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "1.1rem",
            letterSpacing: "0.2em",
            cursor: "pointer",
            clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
          }}
        >
          ⚔ NEXT FIGHT
        </button>
      </div>
    </div>
  );
}

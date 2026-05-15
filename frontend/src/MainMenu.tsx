import { useState } from 'react';
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract
} from 'wagmi';
import { formatEther } from 'viem';
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from './contracts/config';

interface MainMenuProps {
  onStartRun: () => void;
  onOpenPC: () => void;
}

export default function MainMenu({ onStartRun, onOpenPC }: MainMenuProps) {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  const { data: balance, isFetching: balanceLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.relicCoin as `0x${string}`,
    abi: CONTRACT_ABIS.relicCoin,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const formattedBalance = balance ? formatEther(balance as bigint) : null;
  const walletConnectors = connectors.filter(c =>
    c.id === 'injected' || c.name.toLowerCase().includes('meta')
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "#020001",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
      padding: "20px"
    }}>
      {/* Load fonts via link tag for reliability */}
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Share+Tech+Mono&family=Rajdhani:wght@400;600;700&display=swap" rel="stylesheet" />

      {/* Animated background orbs */}
      <div style={{
        position: "absolute", top: "-20%", left: "-10%", width: "500px", height: "500px",
        background: "radial-gradient(circle, rgba(105,20,14,0.15) 0%, transparent 70%)",
        borderRadius: "50%", animation: "pulse 8s ease-in-out infinite"
      }} />
      <div style={{
        position: "absolute", bottom: "-20%", right: "-10%", width: "600px", height: "600px",
        background: "radial-gradient(circle, rgba(105,20,14,0.1) 0%, transparent 70%)",
        borderRadius: "50%", animation: "pulse 10s ease-in-out infinite reverse"
      }} />

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>

      <div style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: "clamp(2rem, 6vw, 3.5rem)",
        color: "#69140E",
        letterSpacing: "0.3em",
        textShadow: "0 0 40px rgba(105,20,14,0.6), 0 0 80px rgba(105,20,14,0.3)",
        marginBottom: "4px",
        animation: "flicker 4s ease-in-out infinite"
      }}>
        ◆ RELIC MONSTERS ◆
      </div>

      <div style={{
        width: "120px", height: "2px",
        background: "linear-gradient(90deg, transparent, #69140E, transparent)",
        marginBottom: "30px"
      }} />

      <p style={{
        color: "#9a8a6a",
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: "clamp(0.7rem, 2vw, 0.9rem)",
        marginBottom: "40px",
        letterSpacing: "0.15em",
        textTransform: "uppercase"
      }}>
        A Web3 Roguelike Battle Experience
      </p>

      {!isConnected ? (
        <div style={{ textAlign: "center", width: "100%", maxWidth: "340px" }}>
          {isPending && (
            <div style={{
              padding: "12px 20px", background: "rgba(61,220,132,0.1)", border: "1px solid #3ddc84",
              marginBottom: "15px", borderRadius: "4px"
            }}>
              <p style={{ color: "#3ddc84", fontFamily: "'Share Tech Mono', monospace", fontSize: "0.8rem" }}>
                ◈ Connecting to wallet...
              </p>
            </div>
          )}
          {error && (
            <div style={{
              padding: "12px 20px", background: "rgba(200,16,46,0.1)", border: "1px solid #c8102e",
              marginBottom: "15px", borderRadius: "4px"
            }}>
              <p style={{ color: "#c8102e", fontFamily: "'Share Tech Mono', monospace", fontSize: "0.75rem" }}>
                ✕ {error.message.slice(0, 80)}
              </p>
            </div>
          )}

          <p style={{
            marginBottom: "20px", color: "#e8d5a3",
            fontFamily: "'Rajdhani', sans-serif", fontSize: "1rem"
          }}>
            Select your wallet to enter the dungeon
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {walletConnectors.map((connector) => {
              const isHovered = hoveredButton === connector.uid;
              const isDisabled = isPending;
              return (
                <button
                  key={connector.uid}
                  onClick={() => connect({ connector })}
                  disabled={isDisabled}
                  onMouseEnter={() => setHoveredButton(connector.uid)}
                  onMouseLeave={() => setHoveredButton(null)}
                  style={{
                    padding: "16px 24px",
                    cursor: isDisabled ? "not-allowed" : "pointer",
                    background: isDisabled
                      ? "rgba(10,0,2,0.8)"
                      : isHovered
                        ? "rgba(105,20,14,0.3)"
                        : "rgba(10,0,2,0.8)",
                    border: `1px solid ${isHovered ? "#69140E" : "#3C1518"}`,
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    transition: "all 0.2s ease",
                    opacity: isDisabled ? 0.5 : 1,
                    clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))"
                  }}
                >
                  <span style={{
                    width: "32px", height: "32px", borderRadius: "50%",
                    background: "linear-gradient(135deg, #69140E, #3C1518)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1rem", boxShadow: isHovered ? "0 0 15px rgba(105,20,14,0.5)" : "none",
                    transition: "box-shadow 0.2s"
                  }}>
                    ⚡
                  </span>
                  <span style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 700,
                    fontSize: "1.1rem",
                    color: isHovered ? "#fff" : "#e8d5a3",
                    letterSpacing: "0.1em",
                    transition: "color 0.2s"
                  }}>
                    {connector.name}
                  </span>
                </button>
              );
            })}
          </div>

          <p style={{
            marginTop: "25px", color: "#5a5a5a",
            fontFamily: "'Share Tech Mono', monospace", fontSize: "0.65rem",
            letterSpacing: "0.1em"
          }}>
            No account needed — your browser wallet is enough
          </p>
        </div>
      ) : (
        <div style={{ textAlign: "center", width: "100%", maxWidth: "400px" }}>
          <div style={{
            padding: "16px 24px",
            background: "rgba(10,0,2,0.9)",
            border: "1px solid #3C1518",
            marginBottom: "20px",
            clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))"
          }}>
            <p style={{
              color: "#3ddc84", fontFamily: "'Share Tech Mono', monospace",
              fontSize: "0.7rem", letterSpacing: "0.15em", marginBottom: "8px"
            }}>
              ◆ CONNECTED
            </p>
            <p style={{
              color: "#9a8a6a", fontFamily: "'Share Tech Mono', monospace",
              fontSize: "0.65rem", wordBreak: "break-all", lineHeight: "1.6"
            }}>
              {address}
            </p>
          </div>

          <div style={{
            padding: "20px 32px",
            background: "rgba(10,0,2,0.9)",
            border: "1px solid #3C1518",
            borderTop: "2px solid #69140E",
            marginBottom: "30px",
            boxShadow: "0 0 30px rgba(105,20,14,0.2), inset 0 0 20px rgba(0,0,0,0.5)"
          }}>
            <p style={{
              color: "#69140E", fontFamily: "'Share Tech Mono', monospace",
              fontSize: "0.6rem", letterSpacing: "0.25em", marginBottom: "8px"
            }}>
              TREASURY BALANCE
            </p>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "2rem",
              color: "#e8d5a3",
              letterSpacing: "0.05em"
            }}>
              {balanceLoading ? (
                <span style={{ color: "#9a8a6a", fontSize: "1rem" }}>LOADING...</span>
              ) : (
                <>{formattedBalance || "0"} <span style={{ color: "#69140E", fontSize: "1rem" }}>$RELIC</span></>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <button
              onClick={onStartRun}
              onMouseEnter={() => setHoveredButton('start')}
              onMouseLeave={() => setHoveredButton(null)}
              style={{
                padding: "18px 40px",
                cursor: "pointer",
                background: hoveredButton === 'start'
                  ? "linear-gradient(135deg, #1a3a1a, #0d1f0d, #1a3a1a)"
                  : "linear-gradient(135deg, #0f2a0f, #0a1f0a, #0f2a0f)",
                border: `1px solid ${hoveredButton === 'start' ? "#3ddc84" : "#2d7a1e"}`,
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "1.3rem",
                color: "#3ddc84",
                letterSpacing: "0.2em",
                clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
                transition: "all 0.2s ease",
                boxShadow: hoveredButton === 'start' ? "0 0 25px rgba(61,220,132,0.3), inset 0 0 15px rgba(61,220,132,0.1)" : "none"
              }}
            >
              ⚔ START RUN
            </button>

            <button
              onClick={onOpenPC}
              onMouseEnter={() => setHoveredButton('pc')}
              onMouseLeave={() => setHoveredButton(null)}
              style={{
                padding: "14px 40px",
                cursor: "pointer",
                background: hoveredButton === 'pc'
                  ? "linear-gradient(135deg, #2a1015, #1a0508, #2a1015)"
                  : "linear-gradient(135deg, #1a0608, #0a0002, #1a0608)",
                border: `1px solid ${hoveredButton === 'pc' ? "#69140E" : "#3C1518"}`,
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "1.1rem",
                color: "#e8d5a3",
                letterSpacing: "0.2em",
                clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
                transition: "all 0.2s ease",
                boxShadow: hoveredButton === 'pc' ? "0 0 20px rgba(105,20,14,0.4)" : "none"
              }}
            >
              ◈ VIEW PC
            </button>

            <button
              onClick={() => disconnect()}
              onMouseEnter={() => setHoveredButton('disconnect')}
              onMouseLeave={() => setHoveredButton(null)}
              style={{
                padding: "8px 20px",
                cursor: "pointer",
                background: "transparent",
                border: "none",
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: "0.7rem",
                color: hoveredButton === 'disconnect' ? "#c8102e" : "#5a5a5a",
                letterSpacing: "0.1em",
                transition: "color 0.2s"
              }}
            >
              ✕ DISCONNECT WALLET
            </button>
          </div>
        </div>
      )}

      <div style={{
        position: "absolute", bottom: "20px",
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: "0.55rem", color: "#3C1518",
        letterSpacing: "0.2em"
      }}>
        RELIC MONSTERS · BATTLE CLIENT v1.0 · ON-CHAIN SETTLEMENT READY
      </div>
    </div>
  );
}

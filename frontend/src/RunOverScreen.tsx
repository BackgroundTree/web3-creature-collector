import { useState, useEffect } from 'react';
import { useAccount, useConnect, useWriteContract } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from './contracts/config';
import type { RunState } from './types';

interface RunOverScreenProps {
  run: RunState;
  onQuit: () => void;
}

function generateIVs(seed?: number): readonly [number, number, number, number, number, number] {
  let s = seed ?? Math.floor(Math.random() * 1000000);
  const ivs: number[] = [];
  for (let i = 0; i < 6; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    ivs.push(s % 32);
  }
  return ivs as [number, number, number, number, number, number];
}

type MintStep = "idle" | "settling" | "done";

export default function RunOverScreen({ run, onQuit }: RunOverScreenProps) {
  const cleared = run.fight >= run.maxFights;
  const survived = run.party.filter(m => m.currentHp > 0).length;

  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const [mintStep, setMintStep] = useState<MintStep>("idle");
  const [mintError, setMintError] = useState<string | null>(null);
  const [mintTx, setMintTx] = useState<string | null>(null);

  const settleWrite = useWriteContract();

  useEffect(() => {
    if (settleWrite.isSuccess && mintStep === "settling") {
      setMintStep("done");
      setMintTx(settleWrite.data as string);
    }
  }, [settleWrite.isSuccess, mintStep]);

  useEffect(() => {
    if (settleWrite.error && mintStep === "settling") {
      setMintError(settleWrite.error.message);
      setMintStep("idle");
    }
  }, [settleWrite.error]);

  const HARDHAT_CHAIN_ID = "0x7A69";
  const ALLOWED_ACCOUNT = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266".toLowerCase();

  const ensureHardhat = async (): Promise<string | null> => {
    const eth = (window as any).ethereum;
    if (!eth) { alert("MetaMask not detected."); return null; }
    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: HARDHAT_CHAIN_ID }],
      });
    } catch (e: any) {
      if (e.code === 4902) { alert("Hardhat network not found in MetaMask. Add it first."); return null; }
    }
    const accounts = await eth.request({ method: "eth_requestAccounts" });
    if (!accounts?.[0]) { alert("No accounts found."); return null; }
    if (accounts[0].toLowerCase() !== ALLOWED_ACCOUNT) {
      alert("Please switch to Hardhat Account #0 in MetaMask:\n" + ALLOWED_ACCOUNT);
      return null;
    }
    return accounts[0];
  };

  const handleSettle = async () => {
    try {
      const acct = await ensureHardhat();
      if (!acct) return;
      if (!isConnected) {
        const injected = connectors.find(c => c.id === 'injected');
        if (injected) connect({ connector: injected });
      }
      const sender = (address || acct) as `0x${string}`;
      setMintStep("settling");
      startSettleWithAccount(sender);
    } catch (e: any) {
      setMintError(e.message || "Something went wrong");
      setMintStep("idle");
    }
  };

  function startSettleWithAccount(account: `0x${string}`) {
    setMintError(null);
    const creaturesToMint = run.party.map(mon => ({
      speciesId: mon.id,
      level: mon.level,
      ivs: generateIVs(mon.natureSeed),
      heldItemIds: [],
    }));
    const partyAlive = run.party.filter(m => m.currentHp > 0).length;
    const isFlawless = cleared && partyAlive === run.party.length;
    const baseRelicEarned = parseEther(String(1000 * run.party.length));

    settleWrite.writeContract({
      chainId: 31337,
      address: CONTRACT_ADDRESSES.gameSettler as `0x${string}`,
      abi: CONTRACT_ABIS.gameSettler,
      functionName: 'settleRun',
      args: [
        account,
        baseRelicEarned,
        isFlawless,
        0n,
        creaturesToMint,
      ],
    } as any);
  }

  const buttonBase = {
    fontFamily: "'Bebas Neue', sans-serif" as const,
    fontSize: "1.1rem",
    letterSpacing: "0.2em",
    cursor: "pointer",
    padding: "14px 48px",
    clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
    transition: "all 0.2s ease",
    border: "none",
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
        background: cleared
          ? "radial-gradient(circle, rgba(61,220,132,0.1) 0%, transparent 70%)"
          : "radial-gradient(circle, rgba(200,16,46,0.1) 0%, transparent 70%)",
        borderRadius: "50%", animation: "pulse 8s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", bottom: "-20%", right: "-10%", width: "600px", height: "600px",
        background: "radial-gradient(circle, rgba(105,20,14,0.08) 0%, transparent 70%)",
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
        fontSize: "clamp(2rem, 6vw, 3.5rem)",
        color: cleared ? "#3ddc84" : "#c8102e",
        letterSpacing: "0.2em",
        textShadow: cleared
          ? "0 0 40px rgba(61,220,132,0.4)"
          : "0 0 40px rgba(200,16,46,0.4)",
        marginBottom: "8px",
      }}>
        {cleared ? "◆ DUNGEON CLEARED ◆" : "◆ RUN OVER ◆"}
      </div>

      <div style={{
        width: "120px", height: "2px",
        background: `linear-gradient(90deg, transparent, ${cleared ? "#3ddc84" : "#c8102e"}, transparent)`,
        marginBottom: "30px",
      }} />

      <div style={{
        padding: "24px 40px",
        background: "rgba(10,0,2,0.9)",
        border: "1px solid #3C1518",
        borderTop: `2px solid ${cleared ? "#3ddc84" : "#69140E"}`,
        textAlign: "center",
        maxWidth: "400px",
        width: "100%",
      }}>
        <div style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: "0.65rem",
          color: "#69140E",
          letterSpacing: "0.2em",
          marginBottom: "16px",
        }}>
          RUN STATISTICS
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Row label="FIGHTS" value={`${run.fight}/${run.maxFights}`} />
          <Row label="KILLS" value={String(run.kills)} />
          <Row label="GOLD EARNED" value={`◈ ${run.gold}`} />
          <Row label="SURVIVING" value={`${survived}/${run.party.length}`} />
        </div>

        <div style={{
          marginTop: "20px",
          display: "flex",
          gap: "8px",
          justifyContent: "center",
          flexWrap: "wrap",
        }}>
          {run.party.map((mon, i) => {
            const alive = mon.currentHp > 0;
            return (
              <div key={i} style={{
                padding: "4px 12px",
                border: `1px solid ${alive ? "#3ddc84" : "#3C1518"}`,
                background: alive ? "rgba(61,220,132,0.05)" : "transparent",
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: "0.65rem",
                color: alive ? "#3ddc84" : "#5a5a5a",
              }}>
                {mon.name} Lv.{mon.level} {alive ? "●" : "✕"}
              </div>
            );
          })}
        </div>
      </div>

      {cleared && (
        <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          {mintStep === "idle" && (
            <button
              onClick={handleSettle}
              style={{
                ...buttonBase,
                background: "linear-gradient(135deg, #1a3a6a, #0d1f4d)",
                border: "1px solid #4a8af4",
                color: "#4a8af4",
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 0 25px rgba(74,138,244,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}
            >
              {!isConnected ? "🔌 CONNECT WALLET" : "⚔ SETTLE & MINT"}
            </button>
          )}

          {mintStep === "settling" && (
            <div style={{
              ...buttonBase,
              background: "rgba(10,0,2,0.8)",
              border: "1px solid #e8d5a3",
              color: "#e8d5a3",
              opacity: 0.7,
              textAlign: "center",
              width: "100%",
            }}>
              MINTING CREATURES ON-CHAIN...
            </div>
          )}

          {mintStep === "done" && (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}>
              <div style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: "0.8rem",
                color: "#3ddc84",
                textAlign: "center",
              }}>
                ✅ RUN SETTLED! CREATURES MINTED ON-CHAIN.
              </div>
              {mintTx && (
                <div style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "0.55rem",
                  color: "#9a8a6a",
                  textAlign: "center",
                  wordBreak: "break-all",
                }}>
                  TX: {mintTx}
                </div>
              )}
            </div>
          )}

          {mintError && (
            <div style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "0.65rem",
              color: "#c8102e",
              textAlign: "center",
              maxWidth: "360px",
            }}>
              ❌ {mintError}
            </div>
          )}
        </div>
      )}

      <button
        onClick={onQuit}
        style={{
          marginTop: cleared ? "16px" : "40px",
          padding: "14px 48px",
          background: cleared ? "rgba(10,0,2,0.6)" : "linear-gradient(135deg, #1a3a1a, #0d1f0d)",
          border: `1px solid ${cleared ? "#3C1518" : "#3ddc84"}`,
          color: cleared ? "#9a8a6a" : "#3ddc84",
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "1.1rem",
          letterSpacing: "0.2em",
          cursor: "pointer",
          clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={e => {
          if (!cleared) e.currentTarget.style.boxShadow = "0 0 25px rgba(61,220,132,0.3)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {cleared ? "BACK TO MENU" : "RETURN TO MENU"}
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: "0.7rem",
        color: "#9a8a6a",
        letterSpacing: "0.1em",
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: "1.1rem",
        color: "#e8d5a3",
        letterSpacing: "0.05em",
      }}>
        {value}
      </span>
    </div>
  );
}

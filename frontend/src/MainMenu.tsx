import React from 'react';
import { 
  useConnection, 
  useConnect, 
  useDisconnect, 
  useConnectors, 
  useReadContract 
} from 'wagmi';
import { formatEther } from 'viem';
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from './contracts/config'; // Adjust path if needed

interface MainMenuProps {
  onStartRun: () => void;
  onOpenPC: () => void;
}

export default function MainMenu({ onStartRun, onOpenPC }: MainMenuProps) {
  const { address, isConnected } = useConnection();
  const { connect } = useConnect();
  const connectors = useConnectors(); 
  const { disconnect } = useDisconnect();

  // Wagmi Hook to read $RELIC balance from the blockchain
  const { data: balanceData } = useReadContract({
    address: CONTRACT_ADDRESSES.relicCoin as `0x${string}`,
    abi: CONTRACT_ABIS.relicCoin,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address, // Only run this query if a wallet is connected
    }
  });

  // Convert the BigInt from the blockchain into a readable number
  const formattedBalance = balanceData ? formatEther(balanceData as bigint) : "0";

  return (
    <div style={{ padding: "50px", textAlign: "center", color: "white", fontFamily: "monospace" }}>
      <h1>◆ RELIC MONSTERS ◆</h1>
      
      {!isConnected ? (
        <div style={{ marginTop: "20px" }}>
          <p>Connect your wallet to enter the dungeon.</p>
          {/* Loop over available connectors using the new useConnectors() hook */}
          {connectors.map((connector) => (
            <button 
              key={connector.uid} 
              onClick={() => connect({ connector })}
              style={{ padding: "10px 20px", margin: "5px", cursor: "pointer" }}
            >
              Connect {connector.name}
            </button>
          ))}
        </div>
      ) : (
        <div style={{ marginTop: "20px" }}>
          <p style={{ color: "var(--hp-green)" }}>Wallet Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
          <h2>Treasury: {formattedBalance} $RELIC</h2>
          
          <div style={{ marginTop: "40px", display: "flex", gap: "20px", justifyContent: "center" }}>
            <button 
              onClick={onStartRun}
              style={{ padding: "15px 30px", fontSize: "1.2rem", cursor: "pointer", background: "var(--hp-green)", color: "black", border: "none" }}
            >
              START RUN
            </button>
            <button 
              onClick={onOpenPC}
              style={{ padding: "15px 30px", fontSize: "1.2rem", cursor: "pointer", background: "#444", color: "white", border: "none" }}
            >
              VIEW PC
            </button>
            <button 
              onClick={() => disconnect()}
              style={{ padding: "15px 30px", fontSize: "1.2rem", cursor: "pointer", background: "#333", color: "white", border: "1px solid white" }}
            >
              DISCONNECT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
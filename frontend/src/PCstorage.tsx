
import { usePC } from './hooks/usePC.ts';

interface PCStorageProps {
  onBack: () => void;
}

export default function PCStorage({ onBack }: PCStorageProps) {
  const { ownedCreatures, isPending } = usePC();

  return (
    <div style={{ padding: "40px", color: "white", fontFamily: "monospace" }}>
      <button onClick={onBack} style={{ marginBottom: "20px", cursor: "pointer" }}>
        ← BACK TO MENU
      </button>
      
      <h2>PC STORAGE (Vault)</h2>
      <hr />

      {isPending ? (
        <p>Accessing the blockchain...</p>
      ) : ownedCreatures.length === 0 ? (
        <p>No creatures found in this wallet. Win a run to mint one!</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "20px", marginTop: "20px" }}>
          {ownedCreatures.map((mon) => (
            <div key={mon.id.toString()} style={{ border: "1px solid #555", padding: "15px", background: "#1a1a1a" }}>
              <h3 style={{ color: "var(--hp-green)", margin: "0" }}>ID #{mon.id.toString()}</h3>
              <p>Species: {mon.speciesId}</p>
              <p>Level: {mon.level}</p>
              <div style={{ fontSize: "0.8rem", color: "#aaa" }}>
                IVs: {mon.ivs.join('/')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
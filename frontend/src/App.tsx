import { useState } from 'react';
import BattleScreen from './BattleScreen.tsx';
import MainMenu from './MainMenu.tsx';
import PCstorage from './PCstorage.tsx';
import './App.css'; 

export default function App() {
  const [gameState, setGameState] = useState<"menu" | "battle" | "pc">("menu");

  return (
      <div className="app-root">
        {gameState === "menu" && (
          <MainMenu 
            onStartRun={() => setGameState("battle")} 
            onOpenPC={() => setGameState("pc")} // This fixes the "missing property" error
          />
        )}
        
        {/* Check capitalization: PCStorage matches the import and the component name */}
        {gameState === "pc" && <PCstorage onBack={() => setGameState("menu")} />}
        
        {gameState === "battle" && <BattleScreen onExitRun={() => setGameState("menu")} />}
      </div>
    );
}
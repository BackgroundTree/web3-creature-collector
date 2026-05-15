import { useState, useCallback } from 'react';
import BattleScreen from './BattleScreen.tsx';
import MainMenu from './MainMenu.tsx';
import PartySelect from './PartySelect.tsx';
import LootScreen from './LootScreen.tsx';
import ShopScreen from './ShopScreen.tsx';
import RunOverScreen from './RunOverScreen.tsx';
import PCstorage from './PCstorage.tsx';
import type { Pokemon, RunState, InventoryItem, Difficulty } from './types';
import './App.css';

export type GameView = "menu" | "party_select" | "battle" | "loot" | "shop" | "run_over" | "pc";

function createNewRun(party: Pokemon[], difficulty: Difficulty): RunState {
  return {
    party: party.map(p => ({ ...p, currentHp: p.stats.hp })),
    activeIndex: 0,
    fight: 1,
    maxFights: 1,
    gold: 0,
    inventory: [],
    kills: 0,
    difficulty,
  };
}

export default function App() {
  const [view, setView] = useState<GameView>("menu");
  const [run, setRun] = useState<RunState | null>(null);

  const handleStartRun = useCallback(() => {
    setView("party_select");
  }, []);

  const handlePartyConfirmed = useCallback((party: Pokemon[], difficulty: Difficulty) => {
    setRun(createNewRun(party, difficulty));
    setView("battle");
  }, []);

  const handleBattleEnd = useCallback((result: {
    victory: boolean;
    party: Pokemon[];
    kills: number;
  }) => {
    if (!run) return;
    if (!result.victory) {
      setView("run_over");
      return;
    }
    const newKills = run.kills + result.kills;
    const nextFight = run.fight + 1;
    if (nextFight > run.maxFights) {
      setRun(prev => prev ? { ...prev, party: result.party, kills: newKills, fight: run.maxFights } : prev);
      setView("run_over");
      return;
    }
    setRun(prev => prev ? {
      ...prev,
      party: result.party,
      kills: newKills,
      fight: nextFight,
    } : prev);
    setView("loot");
  }, [run]);

  const handleLootChosen = useCallback((_items: InventoryItem[]) => {
    setRun(prev => {
      if (!prev) return prev;
      const newInv = [...prev.inventory];
      for (const item of _items) {
        const existing = newInv.find(i => i.id === item.id);
        if (existing) {
          existing.count += item.count;
        } else {
          newInv.push(item);
        }
      }
      const goldDrop = Math.floor(50 + Math.random() * 100);
      return { ...prev, inventory: newInv, gold: prev.gold + goldDrop };
    });
    setView("shop");
  }, []);

  const handleShopDone = useCallback(() => {
    setView("battle");
  }, []);

  const handleRunQuit = useCallback(() => {
    setRun(null);
    setView("menu");
  }, []);

  const handleInventoryUpdate = useCallback((inventory: InventoryItem[]) => {
    setRun(prev => prev ? { ...prev, inventory } : prev);
  }, []);

  const handleGoldUpdate = useCallback((gold: number) => {
    setRun(prev => prev ? { ...prev, gold } : prev);
  }, []);

  return (
    <div className="app-root">
      {view === "menu" && (
        <MainMenu
          onStartRun={handleStartRun}
          onOpenPC={() => setView("pc")}
        />
      )}

      {view === "pc" && (
        <PCstorage onBack={() => setView("menu")} />
      )}

      {view === "party_select" && (
        <PartySelect onConfirm={handlePartyConfirmed} />
      )}

      {view === "battle" && run && (
        <BattleScreen
          run={run}
          onBattleEnd={handleBattleEnd}
          onInventoryUpdate={handleInventoryUpdate}
          onGoldUpdate={handleGoldUpdate}
        />
      )}

      {view === "loot" && (
        <LootScreen onChoose={handleLootChosen} />
      )}

      {view === "shop" && run && (
        <ShopScreen
          gold={run.gold}
          inventory={run.inventory}
          onGoldUpdate={handleGoldUpdate}
          onInventoryUpdate={handleInventoryUpdate}
          onDone={handleShopDone}
        />
      )}

      {view === "run_over" && run && (
        <RunOverScreen
          run={run}
          onQuit={handleRunQuit}
        />
      )}
    </div>
  );
}

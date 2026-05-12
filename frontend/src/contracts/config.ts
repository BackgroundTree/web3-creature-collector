// Import the massive JSON files
import RelicCoin from './RelicCoin.json';
import CreatureNFT from './CreatureNFT.json';
import GameSettler from './GameSettler.json';

// Your local deployment addresses
export const CONTRACT_ADDRESSES = {
  relicCoin: import.meta.env.VITE_RELIC_COIN_ADDR || "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  creatureNFT: import.meta.env.VITE_CREATURE_NFT_ADDR || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  gameSettler: import.meta.env.VITE_GAME_SETTLER_ADDR || "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
};

// We extract just the "abi" array from the JSON files, which is all the frontend cares about
export const CONTRACT_ABIS = {
  relicCoin: RelicCoin.abi,
  creatureNFT: CreatureNFT.abi,
  gameSettler: GameSettler.abi
};
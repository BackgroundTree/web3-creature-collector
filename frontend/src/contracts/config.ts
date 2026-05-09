// Import the massive JSON files
import RelicCoin from './RelicCoin.json';
import CreatureNFT from './CreatureNFT.json';
import GameSettler from './GameSettler.json';

// Your local deployment addresses
export const CONTRACT_ADDRESSES = {
  relicCoin: "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82",
  creatureNFT: "0x9A676e781A523b5d0C0e43731313A708CB607508",
  gameSettler: "0x0B306BF915C4d645ff596e518fAf3F9669b97016"
};

// We extract just the "abi" array from the JSON files, which is all the frontend cares about
export const CONTRACT_ABIS = {
  relicCoin: RelicCoin.abi,
  creatureNFT: CreatureNFT.abi,
  gameSettler: GameSettler.abi
};
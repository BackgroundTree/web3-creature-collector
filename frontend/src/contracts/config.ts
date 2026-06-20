import RelicCoin from './RelicCoin.json';
import CreatureNFT from './CreatureNFT.json';
import GameSettler from './GameSettler.json';

export const CONTRACT_ADDRESSES = {
  relicCoin: import.meta.env.VITE_RELIC_COIN_ADDR || "0x3bB880d2221f1f970E76B609f0b079482Fe47acb",
  creatureNFT: import.meta.env.VITE_CREATURE_NFT_ADDR || "0xb41731e8E46C495d5eD60Ad47FfB43a9C64ead8D",
  gameSettler: import.meta.env.VITE_GAME_SETTLER_ADDR || "0xe05EDe90F02585CCB52778E7212d43C6791B386a"
};

export const CONTRACT_ABIS = {
  relicCoin: RelicCoin.abi,
  creatureNFT: CreatureNFT.abi,
  gameSettler: GameSettler.abi
};
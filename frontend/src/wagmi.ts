import { http, createConfig } from 'wagmi';
import { hardhat } from 'wagmi/chains';

export const config = createConfig({
  chains: [hardhat], // Tell Wagmi to look for our local node
  transports: {
    [hardhat.id]: http('http://127.0.0.1:8545'), // Hardhat's default port
  },
});
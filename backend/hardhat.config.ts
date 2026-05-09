import { defineConfig } from "hardhat/config";
import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";

export default defineConfig({
  // THIS is what actually loads ethers into the environment in v3!
  plugins: [hardhatToolboxMochaEthersPlugin], 
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
    },
  },
});
# Web3 Creature Collector & Decentralized Escrow Simulation

An off-chain/on-chain hybrid decentralized application (dApp) disguised as a "roguelike" creature collector game. This project serves as a testbed for true digital asset ownership, closed-loop token economies, and trustless peer-to-peer (P2P) escrow marketplaces.

## 📖 Project Overview

Traditional gaming ecosystems rely on centralized servers to manage player assets and economies. This project simulates a decentralized alternative where players truly own their in-game assets (creatures) and can trade them in an asynchronous, trustless marketplace without a centralized intermediary.

To optimize user experience and eliminate prohibitive gas fees, the application utilizes a **Hybrid State Machine Architecture**:
- **Off-Chain:** The core PvE gameplay loop (battles, RNG, UI, and state management) runs entirely client-side in the browser.
- **On-Chain:** The blockchain is only invoked to settle permanent state changes, such as minting newly caught creatures, dispensing economic rewards, and executing P2P trades.

## ✨ Core Features

* **Off-Chain Game Engine:** A fast, gas-less roguelike battle loop built entirely in React.
* **Digital Scarcity (ERC-721):** Creatures are minted as NFTs. While they share base species art, on-chain metadata ensures verifiable uniqueness (IVs, Natures, Shiny odds, and Original Trainer).
* **Closed-Loop Economy (ERC-20):** Players earn `$POKE` tokens for successful runs. The economy is balanced via sinks like minting fees, consumable items, and marketplace taxes.
* **Global Trade Station (GTS):** A custom escrow smart contract that allows players to asynchronously trade assets trustlessly. Supports both 1-for-1 conditional swaps and currency-based sales.

## 🛠 Tech Stack

**Frontend (Client-Side State Machine):**
* React + TypeScript
* Vite (Build Tool)
* Tailwind CSS (Styling)
* Wagmi & RainbowKit (Web3 Wallet Integration)

**Backend (Smart Contracts & Network):**
* Solidity
* Hardhat (Local compilation, testing, and deployment environment)
* OpenZeppelin Contracts (Secure ERC-20 & ERC-721 implementations)

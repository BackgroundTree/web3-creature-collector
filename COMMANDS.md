# Commands Reference

All commands assume you are in the project root unless noted.

---

## Setup (first time only)

```bash
cd frontend && npm install
cd ../backend && npm install
```

---

## Development

**Terminal 1 — Start local Hardhat node:**
```bash
cd backend && npx hardhat node
```

**Terminal 2 — Deploy contracts (after node is running):**
```bash
cd backend && npx hardhat run scripts/deploy.ts --network localhost
```

**Terminal 3 — Start frontend dev server:**
```bash
cd frontend && npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Testing

```bash
# Backend: compile contracts + run tests
cd backend && npx hardhat compile && npx hardhat test

# Frontend: lint + build
cd frontend && npm run lint && npm run build
```

---

## Production Build

```bash
cd frontend && npm run build
# Output goes to frontend/dist/
```

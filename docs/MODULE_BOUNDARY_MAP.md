# Module Boundary Map

Peta batas fungsional komponen dalam repositori:

```
┌────────────────────────────────────────────────────────┐
│                   apps/web (Frontend)                  │
│  - Three.js / R3F Procedural Assembly                  │
│  - Wagmi / Viem Web3 Connection (Base Sepolia)         │
│  - Zustand Local UI & Animation State                 │
└───────────────────────────┬────────────────────────────┘
                            │ WebSocket / REST (Port 3444)
┌───────────────────────────▼────────────────────────────┐
│                  apps/server (Backend)                 │
│  ├── Gateway: Elysia WebSocket & HTTP Controllers       │
│  ├── Security: Anti-Cheat, Nonce Guard, Rate Limiter   │
│  ├── Core Engine: Formulas, Economy, Bitmask Bestiary  │
│  └── Web3 Signer: EIP-712 Voucher Generator            │
└─────────────┬────────────────────────────┬─────────────┘
              │ Port 5444                  │ Port 6444
┌─────────────▼─────────────┐ ┌────────────▼─────────────┐
│  PostgreSQL 16 (Database) │ │    Redis 7 (Cache/State) │
│  - players, inventory     │ │  - tickless AFK tracking │
│  - currency_ledger        │ │  - leaderboard ZSET      │
└───────────────────────────┘ └──────────────────────────┘
```

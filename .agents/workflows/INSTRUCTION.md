# INSTRUCTION.md — Execution Workflow

Protokol eksekusi bertahap untuk pengembangan NomNom Throw:

## Step 1: Infrastruktur Lingkungan & Kontainer (Docker & Config)
- Buat `docker-compose.yml` untuk PostgreSQL 16 (port 5444) dan Redis 7 (port 6444).
- Setup `.env.example`, `.env`, dan `.gitignore`.
- Buat file dokumentasi kepatuhan (`docs/*`).

## Step 2: Inisialisasi Workspace Bun & Package Shared
- Konfigurasi root `package.json` Bun workspace.
- Setup `packages/shared` berisi konstanta batas sistem (Caps), tipe data, dan formula matematika murni (MaxDistance, AFK yield, Luck roll, Payout).

## Step 3: Backend Bun + Elysia (Port 3444)
- Setup `apps/server` dengan Elysia app, CORS, dan WebSocket gateway.
- Setup route game: status, profil pemain, kalkulasi lemparan, AFK pull-up sync.

## Step 4: Modul Keamanan & Anti-Cheat
- Implementasi `apps/server/src/modules/security/anti-cheat.ts`:
  - Rate limiting & cooldown lemparan (1.2 detik).
  - Validasi jarak maksimal $\text{MaxDistance}(S) \times 1.05$.
  - Proteksi nonce replay sekuensial.

## Step 5: Automated Testing Suites (Business Flow & Security)
- Buat unit tests untuk alur bisnis di `tests/unit/formulas.test.ts`.
- Buat security tests di:
  - `tests/security/throw-spoofing.security.test.ts`
  - `tests/security/rate-limit-replay.security.test.ts`
  - `tests/security/double-sell.security.test.ts`
  - `tests/security/eip712-vault.security.test.ts`

## Step 6: Verifikasi & Audit Kualitas [COMPLETED]
- Jalankan `bun test` untuk memverifikasi 100% kelulusan test suite.
- Jalankan docker container dan pastikan PostgreSQL & Redis terkoneksi.

---

## Phase 2A: Persistensi Database (PostgreSQL 16 & Redis 7)
- **Step 2A.1**: Install dependencies persistensi (`drizzle-orm`, `postgres`, `ioredis`, `drizzle-kit`).
- **Step 2A.2**: Definisikan schema Drizzle (`apps/server/src/db/schema.ts`) mencakup `players`, `animals`, `player_inventory`, `player_bestiary`, dan `currency_ledger`.
- **Step 2A.3**: Setup koneksi database PostgreSQL (port 5444) dan Redis (port 6444).
- **Step 2A.4**: Migrasi tabel dan inisialisasi seed katalog hewan Zona 1 & 2 (`apps/server/src/db/seed.ts`).
- **Step 2A.5**: Implementasi service repositori dengan transaksi ACID dan double-entry ledger.
- **Step 2A.6**: Hubungkan handler WebSocket server ke repositori PostgreSQL & Redis.
- **Step 2A.7**: Buat automated tests alur bisnis (`tests/integration/*.test.ts`) dan security tests (`tests/security/db-*.security.test.ts`).
- **Step 2A.8**: Jalankan pengujian menyeluruh, audit formatter Prettier, dan verifikasi status.

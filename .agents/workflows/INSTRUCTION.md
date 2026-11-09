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

## Step 6: Verifikasi & Audit Kualitas
- Jalankan `bun test` untuk memverifikasi 100% kelulusan test suite.
- Jalankan docker container dan pastikan PostgreSQL & Redis terkoneksi.

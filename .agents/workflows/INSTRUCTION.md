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

## Phase 2A: Persistensi Database (PostgreSQL 16 & Redis 7) [COMPLETED]
- **Step 2A.1**: Install dependencies persistensi (`drizzle-orm`, `postgres`, `ioredis`, `drizzle-kit`).
- **Step 2A.2**: Definisikan schema Drizzle (`apps/server/src/db/schema.ts`) mencakup `players`, `animals`, `player_inventory`, `player_bestiary`, dan `currency_ledger`.
- **Step 2A.3**: Setup koneksi database PostgreSQL (port 5444) dan Redis (port 6444).
- **Step 2A.4**: Migrasi tabel dan inisialisasi seed katalog hewan Zona 1 & 2 (`apps/server/src/db/seed.ts`).
- **Step 2A.5**: Implementasi service repositori dengan transaksi ACID dan double-entry ledger.
- **Step 2A.6**: Hubungkan handler WebSocket server ke repositori PostgreSQL & Redis.
- **Step 2A.7**: Buat automated tests alur bisnis (`tests/integration/*.test.ts`) dan security tests (`tests/security/db-*.security.test.ts`).
- **Step 2A.8**: Jalankan pengujian menyeluruh, audit formatter Prettier, dan verifikasi status.

---

## Phase 2B: Frontend 3D Procedural-First (`apps/web`) [COMPLETED]
- **Step 2B.1**: Inisialisasi struktur workspace `apps/web` dengan Vite, React 18/19, Three.js, R3F, Drei, dan Zustand.
- **Step 2B.2**: Implementasi `GradeMaterialFactory` untuk 5 grade material (Normal, Besar, Emas, Berlian, Rubi).
- **Step 2B.3**: Bangun komponen primitif prosedural hewan Zona 1 (`ProceduralChicken`, `ProceduralRabbit`, `ProceduralSheep`) dan makanan (`ProceduralBurger`).
- **Step 2B.4**: Implementasi Adapter Pattern (`EntityRenderer` & `ProceduralRegistry`) dengan toggle `ASSET_SOURCE_MODE`.
- **Step 2B.5**: Buat HUD Power Bar dan R3F Game Canvas dengan controller lempar terhubung ke WebSocket port 3444 (Frontend port 3445).
- **Step 2B.6**: Buat automated unit tests (`tests/unit/grade-materials.test.ts`) dan security test (`tests/security/client-input-sanitizer.security.test.ts`).
- **Step 2B.7**: Jalankan seluruh rangkaian test suite, format kode, dan verifikasi hasil.

---

## Phase 2C: Kontrol Karakter Roblox, Throw Pad, Carry Hewan, dan Kandang Pasif (MPS)
- **Step 2C.1**: Perbarui shared package (`packages/shared`): konstanta radius zona, formula MPS, kapasitas kandang.
- **Step 2C.2**: Perbarui schema database & migrasi tabel `pen_animals` pada PostgreSQL port 5444.
- **Step 2C.3**: Implementasi `PenService` pada backend Bun (`apps/server`) dengan transaksi ACID dan validasi kedekatan proximity anti-cheat.
- **Step 2C.4**: Implementasi controller karakter Roblox (`CharacterController`) di `apps/web` (WASD gerak, Shift sprint, Space lompat, third-person camera follow).
- **Step 2C.5**: Implementasi `ThrowPadZone` (lempar klik mouse) dan `AnimalPenZone` (kandang interaktif dengan display floating MPS).
- **Step 2C.6**: Implementasi visual `Carry State` di mana karakter mengangkat model hewan di atas kepala.
- **Step 2C.7**: Buat automated tests:
  - Unit test alur bisnis MPS (`tests/unit/pen-mps.test.ts`).
  - Security test anti-cheat proximity spoofing (`tests/security/pen-proximity-spoofing.security.test.ts`).
- **Step 2C.8**: Jalankan seluruh pengujian, audit formatter Prettier, dan verifikasi.

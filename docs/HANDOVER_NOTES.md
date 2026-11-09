# Handover & Resumption Guide — NomNom Throw

Dokumen ini ditujukan sebagai panduan komprehensif bagi AI Agent atau pengembang berikutnya untuk melanjutkan pengembangan *NomNom Throw: Animal Feeder* tanpa kehilangan konteks teknis.

---

## 1. Ringkasan Status Proyek Terkini

* **Default Branch**: `main` (tersinkronisasi dengan GitHub `origin/main`).
* **Fitur Selesai (Milestone 1, 2A, 2B, 2C)**:
  1. Kontainer Docker aktif: PostgreSQL 16 (port `5444`) dan Redis 7 (port `6444`).
  2. Backend runtime Bun + Elysia (port `3444`) dengan arsitektur monorepo Bun workspaces (`packages/shared`, `apps/server`, `apps/web`).
  3. Persistensi PostgreSQL via Drizzle ORM: tabel `players`, `animals`, `player_inventory`, `player_bestiary`, `currency_ledger`, dan `pen_animals`.
  4. Frontend 3D Procedural-First via Vite + React Three Fiber (port `3445`) dengan adapter layer `EntityRenderer` dan shader generator `GradeMaterialFactory`.
  5. Roblox-style movement controller (`WASD`, `Shift` sprint, `Space` lompat) dengan kamera *third-person follow*.
  6. Arena interaksi: *Throw Pad Zone* (mode klik lempar langsung) dan *Animal Pen* (kandang pasif penghasil Money Per Second / MPS).
  7. Modul keamanan `AntiCheatValidator` (validasi cooldown 1.2 detik, batas jangkauan kekuatan 5%, urutan nonce, dan proximity zona).
  8. Automated testing suite: **50/50 test case lulus (100% pass rate)** mencakup test alur bisnis dan security exploit testing.

---

## 2. Pemetaan Port & Layanan Aktif

| Layanan | Runtime / Container | Port Internal | Port Eksternal | Endpoint / URL |
|---|---|---|---|---|
| **Frontend Web 3D** | Vite + React + R3F | `3445` | `3445` | `http://localhost:3445` |
| **Backend API & WS** | Bun + Elysia | `3444` | `3444` | `http://localhost:3444/health` / `ws://localhost:3444/ws` |
| **Database** | Docker (`nomnom-postgres`) | `5432` | `5444` | `postgresql://nomnom:nomnomsecret@localhost:5444/nomnom_db` |
| **Cache & State** | Docker (`nomnom-redis`) | `6379` | `6444` | `redis://localhost:6444` |

---

## 3. Perintah Operasional Utama

```bash
# 1. Menyalakan infrastruktur kontainer database & cache
docker-compose up -d

# 2. Menjalankan migrasi DDL dan seed data katalog hewan (Zona 1 s/d 5)
bun run db:seed

# 3. Menjalankan backend server development (Port 3444)
bun run server:dev

# 4. Menjalankan frontend 3D development (Port 3445)
bun run web:dev

# 5. Menjalankan seluruh rangkaian automated tests (Unit, Integration, Security)
bun test

# 6. Menjalankan test per kategori
bun run test:unit
bun run test:security
```

---

## 4. Panduan Melanjutkan ke Tahap Berikutnya

Agen berikutnya yang melanjutkan proyek ini wajib mengacu pada alur berikut:

### Tahap 1: Inisialisasi Branch Baru (Aturan Global 4.1 & 4.2)
Sebelum melakukan modifikasi kode, buat branch fitur baru dari `main`:
```bash
git checkout main
git pull origin main
git checkout -b feat/web3-base-sepolia
```

### Tahap 2: Eksekusi Fase 3 (Web3 & Base Sepolia Testnet Microtransactions)

Sesuai spesifikasi PRD Seksi 4:
1. **Target Blockchain**: Base Sepolia Testnet (`Chain ID: 84532`).
2. **Payment Token**: Testnet USDC Circle (`0x036CbD53842c5426634e7929541eC2318f3dCF7e`).
3. **Smart Contract `GameVault.sol`**:
   - Metode `deposit(uint256 amount)`: Menerima Testnet USDC dan memancarkan event `Deposit(address indexed user, uint256 amount)`.
   - Metode `withdraw(uint256 amount, uint256 nonce, uint256 deadline, uint8 v, bytes32 r, bytes32 s)`: Memvalidasi tanda tangan kriptografis EIP-712 backend sebelum mentransfer dana keluar dari escrow.
   - Pemetaan anti-replay: `mapping(bytes32 => bool) public executedNonces`.
4. **Backend Cryptographic Signer (`apps/server/src/modules/web3/eip712-signer.ts`)**:
   - Menghasilkan typed structured data hash (EIP-712 Domain: `name: 'NomNomGameVault', version: '1', chainId: 84532, verifyingContract`).
   - Menandatangani payload penarikan dengan `BACKEND_SIGNER_PRIVATE_KEY`.
5. **Frontend Web3 Connection (`apps/web`)**:
   - Gunakan Wagmi v2 / Viem yang terhubung ke `baseSepolia`.
   - Widget *Faucet Helper Modal*: Link langsung ke Circle USDC Faucet dan Base Sepolia ETH Faucet.
   - In-Game Store Modal: Pembelian booster (`Clover Potion`, `Titan Shake`, `Deep Sleep Bed`) menggunakan saldo G-Bucks / USDC.
6. **Automated Testing Wajib**:
   - `tests/unit/eip712-voucher.test.ts`: Validasi struktur hash dan verifikasi signature.
   - `tests/security/eip712-signature-tampering.security.test.ts`: Uji penolakan voucher jika payload diubah, signature palsu, atau stempel waktu `deadline` telah kadaluarsa.

### Tahap 3: Eksekusi Fase 4 (Leaderboards & Bestiary Album)
1. **Redis Sorted Sets**:
   - `lb:total_catches` (Akumulasi total tangkapan hewan).
   - `lb:total_earned` (Akumulasi total koin).
   - `lb:luckiest_catch` (Formula skor: $(\text{ZoneID} \times 10000) + \text{GradeWeight}$).
2. **Bestiary UI Modal**:
   - Membaca bitmask 5-bit dari `player_bestiary` untuk menampilkan grid bintang 5 tingkat kelangkaan per zona (Normal s/d Rubi).
   - Memberikan title dan bonus permanen +5% Luck saat 1 zona komplit.

---

## 5. Aturan Penting bagi AI Agent Berikutnya
* **Hard Caps**: Tetap tegakkan batasan level cap 100 pada `food_level` dan `pullup_level`, kapasitas kandang 6-20, serta cooldown lemparan 1.2 detik.
* **Kewajiban Testing**: Setiap penambahan endpoint atau mutasi bisnis WAJIB disertai test file alur bisnis dan test file keamanan di `tests/`.
* **Kewajiban Formatter**: Jalankan Prettier sebelum commit.
* **Protokol Git**: Tidak ada commit atau push otomatis tanpa izin tertulis dari pengguna pada giliran kerja tersebut.

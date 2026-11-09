# Product Requirements Document (PRD)

**Project Name:** NomNom Throw: Animal Feeder (Web3 Desktop Edition)

**Version:** 1.1.0 (Procedural-First & Testnet Edition)

**Target Platform:** Web Desktop (Chrome, Edge, Firefox, Brave)

**Blockchain Layer:** Base Sepolia Testnet (Ethereum Layer-2 Testnet, Chain ID: `84532`)

**Payment Token:** Testnet USDC (Circle Base Sepolia ERC-20: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`)

**Document Status:** Ready for Engineering Implementation

---

## 1. Executive Summary & Product Vision

### 1.1 Product Summary
*NomNom Throw* adalah game 3D casual *incremental physics-clicker* berbasis web desktop yang mengadaptasi core loop adiktif Roblox (*Throw Food to Animal*). Pemain melatih kekuatan (*Strength*) melalui mini-game idle pull-up, melempar makanan dengan jarak berbasis kekuatan ke berbagai zona liar, menangkap hewan dengan berbagai tier kelangkaan (*Luck-based*), dan menjual tangkapan ke Master Game (NPC) untuk mendapatkan koin (*Coins*).

### 1.2 Web3 & Testnet Microtransaction Vision
Monetisasi tidak menggunakan sistem tokenomics Play-to-Earn (P2E) yang rentan spekulasi dan inflasi, melainkan model **Web2.5 Hybrid Microtransactions** menggunakan stablecoin **Testnet USDC** di **Base Sepolia Testnet (L2)**:
* **Zero Gas UX untuk Gameplay**: Seluruh aksi permainan (melempar, menangkap, menjual hewan, pull-up) berjalan secara off-chain dengan latensi 0ms tanpa interupsi konfirmasi wallet.
* **On-Chain Testnet Escrow**: Interaksi blockchain hanya dilakukan saat deposit Testnet USDC ke *Game Vault* dan penarikan sisa kredit via backend cryptographic signature.
* **Testing & Faucet Integration**: Dilengkapi widget modal *Faucet Helper* (Circle Faucet & Base Sepolia ETH Faucet) sehingga tester atau pemain baru dapat langsung mengklaim saldo uji coba tanpa biaya riil.
* **Micro-pricing Scale**: Toko dalam game menjual item akselerasi (*boosters*, *convenience*, kosmetik) dengan rentang harga mikro (0.10 – 2.00 Testnet USDC).

---

## 2. Core Concepts & Mathematical Framework

Ekonomi dan gameplay didasari oleh 3 pilar stats yang saling mengunci:

```
                  ┌────────────────────────┐
                  │   AFK PULL-UP (Idle)   │
                  └───────────┬────────────┘
                              │ Yields
                              ▼
                  ┌────────────────────────┐
                  │   KEKUATAN (Strength)  │
                  └───────────┬────────────┘
                              │ Determines
                              ▼
                  ┌────────────────────────┐
                  │ Jarak Lempar / ZONA    │
                  └───────────┬────────────┘
                              │ Triggers
                              ▼
┌──────────────────┐    Roll Grade    ┌──────────────────────┐
│  UANG / COINS    │ ◄────────────────┤ KEBERUNTUNGAN (Luck) │
│ (Soft Currency)  │   Jual Hewan ke  └──────────────────────┘
└────────┬─────────┘    Master Game
         │
         ├─────────────────────────────────────────┐
         ▼                                         ▼
┌────────────────────────┐             ┌────────────────────────┐
│ Upgrade Level Makanan  │             │ Upgrade Level Pull-Up  │
│ (Multiplier & Catch)   │             │ (Strength Rate / sec)  │
└────────────────────────┘             └────────────────────────┘
```

### 2.1 Formula Jarak & Akses Zona
Jarak lemparan maksimal ditentukan oleh atribut Kekuatan ($S$):
$$
\text{MaxDistance (m)} = 20 \times \log_{10}(S + 10) + \left(\frac{S}{80}\right)^{0.65}
$$

| Zona ID | Nama Zona | Jarak Minimal | Syarat Kekuatan ($S$) | Varian Hewan Utama |
|---|---|---|---|---|
| **Z-01** | Meadow Farm | $0\text{ m}$ | $0$ | Kelinci, Ayam, Domba |
| **Z-02** | Deep Forest | $60\text{ m}$ | $650$ | Rusa, Rubah, Beruang |
| **Z-03** | Wild Savannah | $180\text{ m}$ | $3.500$ | Zebra, Jerapah, Singa |
| **Z-04** | Mystic Tundra | $400\text{ m}$ | $15.000$ | Serigala Es, Mammoth |
| **Z-05** | Dragon Volcano | $850\text{ m}$ | $60.000$ | Drake, Wyvern, Dragon |

### 2.2 Grade Hewan & Formula Keberuntungan (*Luck Engine*)
Setiap lemparan sukses melakukan kalkulasi probabilitas grade berbasis parameter Keberuntungan ($L$, base = 1.0):

| Grade | Multiplier Harga Jual | Base Chance | Weight Formula ($W$) |
|---|---|---|---|
| **Normal** | $1.0\times$ | $80.00\%$ | $\max(0, 100000 - \sum W_{\text{others}})$ |
| **Besar** | $3.0\times$ | $17.50\%$ | $17500$ |
| **Emas** | $10.0\times$ | $2.30\%$ | $\lfloor 2300 \times (1 + 0.03 \times L) \rfloor$ |
| **Berlian** | $50.0\times$ | $0.18\%$ | $\lfloor 180 \times (1 + 0.05 \times L) \rfloor$ |
| **Rubi** | $250.0\times$ | $0.02\%$ | $\lfloor 20 \times (1 + 0.08 \times L) \rfloor$ |

*Catatan: Total slot dadu server adalah $100.000$ unit. Roll dice berada pada range integer $[0, 99999]$.*

### 2.3 Formula Penjualan Hewan ke Master Game
Harga jual seekor hewan ke Master Game ditentukan oleh:
$$
\text{Payout} = \text{BasePrice}(\text{AnimalID}) \times \text{GradeMultiplier} \times \left(1 + \frac{\text{FoodLevel} \times 0.15}{1}\right)
$$

---

## 3. Feature Specifications (Functional Requirements)

### F-01: Lempar Makanan (Throw Food Mechanic)
* **Kontrol**: Pemain menahan tombol spasi atau klik kiri mouse untuk mengisi *Power Bar*, lalu melepasnya.
* **Physics Trajectory**: Kalkulasi proyektil 3D menggunakan rapier physics (Wasm). Parameter: sudut elevasi $\theta = 45^\circ$, inisial kecepatan $v_0$ proporsional terhadap durasi hold dan batas atas *MaxDistance*.
* **Collision Detection**: Makanan bersentuhan dengan *hitbox* collider hewan di zona target.
* **Anti-Cheat Validation**: Backend memverifikasi bahwa koordinat mendarat tidak melebihi $\text{MaxDistance}(S) \times 1.05$ (toleransi desinkronisasi 5%).

### F-02: Simpan Hewan (Animal Capture & Inventory)
* **Kapasitas Dasar**: 50 slot inventory (dapat ditingkatkan hingga 200 via upgrade koin).
* **Atribut Hewan Tersimpan**: `uuid`, `animal_id`, `zone_id`, `grade`, `weight_kg`, `caught_timestamp`.
* **Fitur Manajemen**: Tombol Lock/Favorite, Filter berdasarkan Zona/Grade, dan Sortir harga tertinggi.

### F-03: AFK Pull-Up System (Tick-less Idle Progression)
* **Mekanisme**: Karakter pemain berdiri di pull-up bar dan melakukan animasi idle workout.
* **Arsitektur Tick-less**: Tidak ada interval per detik di server. Server mencatat `pullup_start_timestamp`.
* **Kalkulasi Akumulasi**:
  $$
  \Delta t = \min(\text{CurrentTime} - \text{StartTime}, \text{MaxAFKTime})
  $$
  $$
  \Delta \text{Strength} = \Delta t \times \text{BaseRate} \times (1.25)^{\text{PullUpLevel}-1}
  $$
* **Default Cap**: Batas akumulasi offline default 4 jam (dapat diekspansi via booster).

### F-04: Jual Hewan ke Master Game (NPC Vendor)
* **Strict PVE Economy**: Hewan hanya dapat dijual ke NPC Master Game. **Tidak ada trading P2P antar-pemain** untuk mencegah manipulasi balance dan *multi-accounting*.
* **Action Types**: *Sell Individual*, *Quick Sell All Unlocked*, dan *Auto-Sell Threshold* (opsi langsung auto-sell grade Normal/Besar).

### F-05: Upgrade Level Makanan
* **Fungsi**: Menaikkan bonus harga jual hewan dan mempermudah tangkapan.
* **Biaya Upgrade**:
  $$
  \text{Cost}_{\text{Food}}(N) = 150 \times (1.45)^{N-1} \text{ Coins}
  $$

### F-06: Upgrade Level AFK Pull-Up
* **Fungsi**: Menaikkan yield Kekuatan ($S$) per detik saat AFK pull-up.
* **Biaya Upgrade**:
  $$
  \text{Cost}_{\text{PullUp}}(N) = 100 \times (1.38)^{N-1} \text{ Coins}
  $$

### F-07: Indeks Hewan / Bestiary per Zona
* **Tampilan**: Album koleksi berisi grid hewan per Zona (Z-01 s/d Z-05) dengan 5 indikator grade bintang.
* **Storage Optimization**: Disimpan dalam bentuk 5-bit integer bitmask per hewan:
  * Bit 0: Normal ($1$)
  * Bit 1: Besar ($2$)
  * Bit 2: Emas ($4$)
  * Bit 3: Berlian ($8$)
  * Bit 4: Rubi ($16$)
* **Reward**: Menyelesaikan seluruh grade dalam 1 zona memberikan title status dan bonus permanen +5% Luck.

### F-08: Leaderboard Real-Time (Redis Sorted Sets)
Papan peringkat global Top 100 pemain:
1. **Paling Banyak Tangkapan**: `lb:total_catches` (kuantitas total hewan).
2. **Uang Terbanyak Diperoleh**: `lb:total_earned` (akumulasi total koin).
3. **Tangkapan Paling Beruntung**: `lb:luckiest_catch`, dinilai dengan:
   $$
   \text{Score} = (\text{ZoneID} \times 10000) + \text{GradeWeight}
   $$
   *(Rubi = 5000, Berlian = 2000, Emas = 500, Besar = 100, Normal = 10)*.

---

## 4. Web3 Architecture & Monetization Engine (Base Sepolia Testnet)

### 4.1 Hybrid Architecture (Zero-Latency Web2.5)

```
[ BROWSER CLIENT ]
  ├── Three.js Canvas (Procedural / GLB Renderer)
  ├── Privy / Wagmi SDK (Base Sepolia Chain ID 84532)
  ├── Faucet Helper UI (One-click Testnet USDC claim link)
  └── WebSocket Client (Binary/JSON RPC)
          ▲
          │ WSS Connection (0ms state sync)
          ▼
[ GAME SERVER (Go / Bun) ]
  ├── Real-time Engine & Physics Validator
  ├── Double-Entry Internal Ledger (SQL ACID)
  └── Nonce-Signature Generator (EIP-712)
          ▲                           ▲
          │                           │
          ▼                           ▼
[ POSTGRESQL + REDIS ]        [ BASE SEPOLIA TESTNET (L2) ]
  ├── Player State & Inv        ├── Testnet USDC (Circle: 0x036CbD...F7e)
  ├── Bitmask Bestiary          └── GameVault.sol (Testnet Escrow)
  └── ZSET Leaderboards
```

### 4.2 Onboarding & Testnet Configuration
1. **Guest Mode**: Pemain dapat langsung melempar makanan seketika membuka URL tanpa login atau dompet Web3.
2. **Social-to-Web3 Login (Privy / Dynamic)**: Login via Google/Discord otomatis membuatkan Embedded Wallet di **Base Sepolia Testnet**.
3. **Direct Wallet Connect**: Dukungan native untuk Coinbase Wallet, MetaMask, dan Rabby (`Chain ID: 84532`).
4. **Testnet Faucet Helper**: Widget modal di dalam game menyediakan direct link ke:
   * *Circle USDC Faucet* (Network: *Base Sepolia*).
   * *Base Sepolia ETH Faucet* (untuk gas transaksi deposit).

### 4.3 Spesifikasi Smart Contract: `GameVault.sol`
* **Target Network**: Base Sepolia Testnet (`84532`).
* **Testnet USDC Address**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e` (6 decimals).
* **Metode Deposit**: User memanggil `deposit(uint256 amount)`. Backend mendengarkan event `Deposit` dan mengkreditkan *G-Bucks* (1 Testnet USDC = 100 G-Bucks).
* **Metode Withdrawal**: Penarikan menggunakan verifikasi **EIP-712 Typed Structured Data**. User meminta penarikan $\to$ backend menandatangani voucher payload $\to$ user memanggil `GameVault.withdraw(amount, nonce, deadline, v, r, s)`.

### 4.4 Katalog Microtransaction (In-Store Items)

| Item ID | Nama Item | Tipe | Efek | Durasi / Cap | Harga (Testnet USDC) |
|---|---|---|---|---|---|
| `BST-01` | Clover Potion | Consumable | +100% Luck Stat ($L$) | 15 Menit | 0.25 USDC |
| `BST-02` | Titan Shake | Consumable | 2x Gain Kekuatan Pull-Up | 30 Menit | 0.25 USDC |
| `UPG-01` | Deep Sleep Bed | Permanent | Naikkan Max AFK Cap dari 4 jam $\to$ 12 jam | Akun Permanen | 1.50 USDC |
| `BOT-01` | Auto-Feeder Drone | Service | Otomatis melempar makanan ke zona terjauh | 1 Jam Sesi | 0.99 USDC |
| `SKN-01` | Golden Burger Skin | Cosmetic | Efek visual proyektil emas & partikel kilau | Permanen | 1.99 USDC |

---

## 5. Technical Specifications & Database Schema

### 5.1 Frontend Architecture
* **Framework**: Next.js 14 / React 18 + TypeScript.
* **3D Engine**: Three.js via React Three Fiber (R3F) + Drei.
* **Physics Engine**: `@react-three/rapier` (WebAssembly build) untuk kalkulasi trajectory lokal responsif.
* **State Management**: Zustand (UI, stats & inventory state) + TanStack Query.
* **Web3 Libraries**: `viem` & `wagmi` v2 (`chains: [baseSepolia]`).

### 5.2 Backend Architecture
* **Core Runtime**: Go 1.22+ (Gorilla WebSocket) ATAU Bun + Elysia (TypeScript runtime).
* **Pub/Sub & Cache**: Redis 7.x (Tickless AFK tracking, real-time leaderboard ZSETs).
* **Primary Database**: PostgreSQL 16 (Relational state, ledger transaksi keuangan berpasangan).
* **Chain Indexer**: Viem Event Listener terkoneksi ke Base Sepolia RPC.

### 5.3 PostgreSQL Database Schema

```sql
-- 1. Master Profil Pemain
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(42) UNIQUE,
    coins NUMERIC(30, 2) DEFAULT 0 CHECK (coins >= 0),
    gbucks_balance INT DEFAULT 0 CHECK (gbucks_balance >= 0),
    strength NUMERIC(30, 2) DEFAULT 0 CHECK (strength >= 0),
    luck_stat INT DEFAULT 1 CHECK (luck_stat >= 1),
    food_level INT DEFAULT 1 CHECK (food_level >= 1),
    pullup_level INT DEFAULT 1 CHECK (pullup_level >= 1),
    is_afk_active BOOLEAN DEFAULT false,
    last_pullup_sync TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_players_wallet ON players(wallet_address);

-- 2. Master Katalog Hewan per Zona
CREATE TABLE animals (
    id INT PRIMARY KEY,
    zone_id INT NOT NULL,
    name VARCHAR(64) NOT NULL,
    base_price NUMERIC(18, 2) NOT NULL,
    asset_id VARCHAR(64) NOT NULL -- Identifier mapping (procedural / glb)
);

-- 3. Inventory Hewan Tersimpan
CREATE TABLE player_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    animal_id INT NOT NULL REFERENCES animals(id),
    grade VARCHAR(16) NOT NULL, -- NORMAL, BESAR, EMAS, BERLIAN, RUBI
    is_locked BOOLEAN DEFAULT false,
    caught_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_player ON player_inventory(player_id);

-- 4. Indeks / Bestiary Tracking (Bitmask 1-31)
CREATE TABLE player_bestiary (
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    animal_id INT NOT NULL REFERENCES animals(id),
    discovered_mask INT DEFAULT 0, -- Bitmask 5-bit
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (player_id, animal_id)
);

-- 5. Ledger Transaksi Keuangan (Auditable)
CREATE TABLE currency_ledger (
    id BIGSERIAL PRIMARY KEY,
    player_id UUID NOT NULL REFERENCES players(id),
    currency_type VARCHAR(10) NOT NULL, -- 'COINS' atau 'GBUCKS'
    delta_amount NUMERIC(30, 2) NOT NULL,
    balance_after NUMERIC(30, 2) NOT NULL,
    reason VARCHAR(64) NOT NULL,
    reference_id VARCHAR(128),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ledger_player ON currency_ledger(player_id, created_at DESC);
```

---

## 6. 3D Visual Asset Architecture: Procedural-First & Future GLB Migration

Agar proyek dapat dibangun seketika oleh AI coding agent **tanpa ketergantungan file 3D eksternal**, game ini menggunakan prinsip **Procedural-First Architecture**. Seluruh entitas 3D dibangun dari kode geometris murni bergaya voxel/blocky Roblox, namun dibungkus dalam *Adapter Layer* sehingga dapat diganti menjadi model `.glb` di kemudian hari dengan zero-code refactor pada game logic.

### 6.1 Entity Renderer Abstraction (The Adapter Pattern)

Setiap entitas visual (hewan, makanan, karakter) di-render melalui komponen wrapper seragam:

```tsx
// src/components/3d/EntityRenderer.tsx
import React from 'react';
import { ProceduralRegistry } from './procedural/ProceduralRegistry';
import { GLBModelLoader } from './models/GLBModelLoader';
import { GradeMaterialFactory } from './materials/GradeMaterialFactory';

export type EntityGrade = 'NORMAL' | 'BESAR' | 'EMAS' | 'BERLIAN' | 'RUBI';

interface EntityRendererProps {
  category: 'animal' | 'food' | 'player';
  assetId: string;                 // e.g. 'chicken', 'rabbit', 'burger'
  grade?: EntityGrade;             // Default: 'NORMAL'
  animationState?: 'idle' | 'eat' | 'throw' | 'pullup';
  scale?: number;
  position?: [number, number, number];
}

// Global Feature Flag atau per-asset configuration
const ASSET_SOURCE_MODE: 'PROCEDURAL' | 'GLB' = 
  (process.env.NEXT_PUBLIC_ASSET_MODE as 'PROCEDURAL' | 'GLB') || 'PROCEDURAL';

export const EntityRenderer: React.FC<EntityRendererProps> = ({
  category,
  assetId,
  grade = 'NORMAL',
  animationState = 'idle',
  scale = 1,
  position = [0, 0, 0]
}) => {
  // Hitung grade scale (Hewan grade BESAR berskala 1.5x)
  const effectiveScale = grade === 'BESAR' ? scale * 1.5 : scale;
  const materials = GradeMaterialFactory.getMaterials(grade);

  return (
    <group position={position} scale={effectiveScale}>
      {ASSET_SOURCE_MODE === 'PROCEDURAL' ? (
        <ProceduralRegistry 
          category={category} 
          assetId={assetId} 
          materials={materials} 
          animationState={animationState} 
        />
      ) : (
        <GLBModelLoader 
          modelPath={`/assets/models/${category}s/${assetId}.glb`} 
          materials={materials}
          animationState={animationState}
        />
      )}
    </group>
  );
};
```

### 6.2 Procedural Primitive Assembly (Tahap 1: Murni Kode)

Agent menyusun model dengan mengkombinasikan mesh primitif Three.js (`boxGeometry`, `sphereGeometry`, `cylinderGeometry`):

```tsx
// Contoh: src/components/3d/procedural/animals/ProceduralChicken.tsx
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const ProceduralChicken = ({ materials, animationState }: any) => {
  const headRef = useRef<THREE.Group>(null);
  
  // Bobbing animation procedural sederhana
  useFrame((state) => {
    if (animationState === 'idle' && headRef.current) {
      headRef.current.position.y = 0.6 + Math.sin(state.clock.elapsedTime * 6) * 0.05;
    }
  });

  return (
    <group>
      {/* Badan (Kubus Putih Rounded) */}
      <mesh position={[0, 0.4, 0]} material={materials.body}>
        <boxGeometry args={[0.6, 0.5, 0.7]} />
      </mesh>
      {/* Kepala & Jengger */}
      <group ref={headRef} position={[0, 0.6, 0.3]}>
        <mesh material={materials.body}>
          <boxGeometry args={[0.35, 0.35, 0.35]} />
        </mesh>
        {/* Paruh */}
        <mesh position={[0, -0.05, 0.22]} material={materials.accentYellow}>
          <coneGeometry args={[0.08, 0.15, 4]} rotation={[Math.PI / 2, 0, 0]} />
        </mesh>
        {/* Jengger Merah */}
        <mesh position={[0, 0.22, 0]} material={materials.accentRed}>
          <boxGeometry args={[0.1, 0.15, 0.25]} />
        </mesh>
      </group>
      {/* Sayap Kiri & Kanan */}
      <mesh position={[-0.32, 0.4, 0]} material={materials.body}>
        <boxGeometry args={[0.08, 0.3, 0.4]} />
      </mesh>
      <mesh position={[0.32, 0.4, 0]} material={materials.body}>
        <boxGeometry args={[0.08, 0.3, 0.4]} />
      </mesh>
      {/* Kaki */}
      <mesh position={[-0.15, 0.1, 0]} material={materials.accentYellow}>
        <cylinderGeometry args={[0.03, 0.03, 0.2]} />
      </mesh>
      <mesh position={[0.15, 0.1, 0]} material={materials.accentYellow}>
        <cylinderGeometry args={[0.03, 0.03, 0.2]} />
      </mesh>
    </group>
  );
};
```

### 6.3 Dynamic Grade Material & Shader Factory

Semua grade kelangkaan hewan di-generate secara real-time via material properties tanpa perlu membedakan bentuk geometry:

| Grade | Material Type Three.js | Properti Khusus Material | Efek Visual |
|---|---|---|---|
| **Normal** | `MeshStandardMaterial` | `roughness: 0.6`, `metalness: 0.1`, warna palet pastel dasar. | Tampilan matte blocky natural |
| **Besar** | `MeshStandardMaterial` | Idem Normal, namun scale root di-multiply $1.5\times$ via parent group. | Hewan berukuran raksasa |
| **Emas** | `MeshStandardMaterial` | `color: "#FFD700"`, `metalness: 0.95`, `roughness: 0.12`. | Emas berkilau dengan pantulan lingkungan |
| **Berlian** | `MeshPhysicalMaterial` | `color: "#A5F2F3"`, `transmission: 0.85`, `ior: 2.4`, `roughness: 0.05`, `thickness: 0.6`. | Kristal es kaca semi-transparan |
| **Rubi** | `MeshPhysicalMaterial` | `color: "#E0115F"`, `emissive: "#4A0018"`, `roughness: 0.1`, `metalness: 0.8`. | Kristal permata merah dengan aura pendaran |

### 6.4 Drop-in Migration Pathway ke Model GLB (Tahap 2)

Ketika pengembang memutuskan untuk mengintegrasikan model `.glb` dari asset pack eksternal (misal: Kenney Food Kit atau Quaternius Animals):
1. **Penyimpanan File**: Tempatkan file `.glb` pada folder public:
   * `/public/assets/models/animals/{assetId}.glb`
   * `/public/assets/models/foods/{assetId}.glb`
2. **Standard Rigging**: Model `.glb` hewan harus memiliki clip animasi bernama minimal: `idle`, `eat`. Model karakter pemain memiliki clip: `idle`, `throw`, `pullup`.
3. **Penerapan Grade Material pada GLB**: Loader `GLBModelLoader` secara otomatis menimpa (`traverse`) semua material mesh child dengan material dari `GradeMaterialFactory` jika grade bukan `NORMAL`.
4. **Zero Refactor Switch**: Pengembang hanya perlu mengubah konfigurasi `.env`:
   ```bash
   NEXT_PUBLIC_ASSET_MODE=GLB
   ```
   Seluruh sistem physics, collision box, inventory database, dan kalkulasi jarak tetap berfungsi normal tanpa mengubah satu baris pun logika game.

---

## 7. Security, Anti-Cheat & Reliability

1. **Server-Authoritative State**:
   * Seluruh kalkulasi deterministik (RNG Grade, Formula Jarak, Payout Penjualan Hewan, Akumulasi Kekuatan) hanya dihitung di backend server.
   * Client hanya menerima representasi state visual dan mengirim vector input lemparan.
2. **Replay & Cooldown Protection**:
   * Setiap aksi lemparan diverifikasi dengan `action_nonce` sekuensial. Batas cooldown lemparan minimal 1.2 detik.
3. **Double-Entry Financial Bookkeeping**:
   * Seluruh penambahan/pengurangan koin dan saldo internal dibungkus dalam SQL `TRANSACTION` berpasangan di PostgreSQL.
4. **Cryptographic EIP-712 Verification**:
   * Kontrak `GameVault.sol` mencegah penarikan ilegal dengan memvalidasi ECDSA signature backend dan memetakan nonce penarikan yang telah dieksekusi (`mapping(bytes32 => bool) public executedNonces`).

---

## 8. Development Roadmap & Implementation Milestones

```
[ Milestone 1 ] ──► [ Milestone 2 ] ──► [ Milestone 3 ] ──► [ Milestone 4 ]
Procedural Engine    Backend Core        Base Sepolia Testnet Polish & Future
& Physics (0 Assets) & Tick-less Logic   Vault + Faucet       GLB Drop-in Pack
(Weeks 1 - 2)        (Weeks 3 - 4)       (Weeks 5 - 6)        (Weeks 7 - 8)
```

* **Milestone 1 (Sprint 1-2): Procedural 3D Engine & Core Mechanics**
  * Setup Next.js 14 + React Three Fiber + `@react-three/rapier`.
  * Bangun hewan dan makanan zona 1 menggunakan *Procedural Primitive Assembly* murni kode.
  * Buat `GradeMaterialFactory` (Normal, Besar, Emas, Berlian, Rubi).
  * Mekanika charge power bar dan proyektil lempar makanan lokal.
* **Milestone 2 (Sprint 3-4): Backend Services & Databases**
  * WebSocket server (Go/Bun) + PostgreSQL 16 + Redis 7.
  * Implementasi *Tick-less AFK Pull-up Engine*.
  * Server-side RNG Grade Roll dan database inventory player.
  * Transaksi jual hewan ke Master Game.
* **Milestone 3 (Sprint 5-6): Base Sepolia Testnet & Microtransactions**
  * Deploy `GameVault.sol` di Base Sepolia Testnet (`Chain ID: 84532`).
  * Integrasi Privy / Wagmi dengan Base Sepolia Testnet USDC Circle.
  * Event listener deposit dan EIP-712 signature generator untuk withdrawal.
  * Implementasi Faucet Helper UI di modal menu game.
* **Milestone 4 (Sprint 7-8): Leaderboard, GLB Asset Drop-in & Beta Testing**
  * Integrasi 3 papan peringkat real-time dengan Redis `ZSET`.
  * Opsional: Drop-in model 3D `.glb` (Quaternius/Kenney) via `GLBModelLoader` dengan mengaktifkan flag `NEXT_PUBLIC_ASSET_MODE=GLB`.
  * Stress-testing concurrent connections dan playtest publik di Base Sepolia Testnet.
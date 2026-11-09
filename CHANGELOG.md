# CHANGELOG

All notable changes to this project will be documented in this file.

## [Unreleased]
### Added
- **Phase 2B (Frontend 3D Procedural-First)**:
  - Inisialisasi workspace `apps/web` berbasis Vite, React 18, Three.js, R3F, Drei, dan Zustand.
  - Implementasi `GradeMaterialFactory` untuk generator shader real-time (Normal, Besar, Emas, Berlian, Rubi).
  - Implementasi pemodelan primitif geometris murni: `ProceduralChicken`, `ProceduralRabbit`, `ProceduralSheep`, dan `ProceduralBurger`.
  - Implementasi Adapter Pattern `EntityRenderer` dengan toggle `ASSET_SOURCE_MODE` (`PROCEDURAL` vs `GLB`).
  - Implementasi Game HUD (PowerBar pengisian daya lempar, kontrol pull-up AFK, penjualan massal, upgrade level).
  - Unit test shader generator (`tests/unit/grade-materials.test.ts`) dan security test sanitasi input vektor (`tests/security/client-input-sanitizer.security.test.ts`).
- **Phase 2A (Database & Cache Persistence)**:
  - Terintegrasi penuh dengan PostgreSQL 16 (port 5444) menggunakan Drizzle ORM.
  - Implementasi schema database: `players`, `animals`, `player_inventory`, `player_bestiary`, dan `currency_ledger`.
  - Inisialisasi seed katalog hewan untuk Zona 1 s/d Zona 5 (14 entitas hewan).
  - Layanan `PlayerService` dengan transaksi ACID, row locking (`FOR UPDATE`), dan pencatatan double-entry ledger.
  - Test suite integrasi database (`tests/integration/db-inventory.test.ts`).
  - Test suite keamanan konkurensi & level cap database (`tests/security/db-double-spend.security.test.ts`, `tests/security/db-level-cap.security.test.ts`).
- Inisialisasi awal repositori, backend Bun + Elysia, Docker containers, dan modul anti-cheat.

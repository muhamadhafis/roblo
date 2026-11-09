# CHANGELOG

All notable changes to this project will be documented in this file.

## [Unreleased]
### Added
- **Phase 2A (Database & Cache Persistence)**:
  - Terintegrasi penuh dengan PostgreSQL 16 (port 5444) menggunakan Drizzle ORM.
  - Implementasi schema database: `players`, `animals`, `player_inventory`, `player_bestiary`, dan `currency_ledger`.
  - Inisialisasi seed katalog hewan untuk Zona 1 s/d Zona 5 (14 entitas hewan).
  - Layanan `PlayerService` dengan transaksi ACID, row locking (`FOR UPDATE`), dan pencatatan double-entry ledger.
  - Test suite integrasi database (`tests/integration/db-inventory.test.ts`).
  - Test suite keamanan konkurensi & level cap database (`tests/security/db-double-spend.security.test.ts`, `tests/security/db-level-cap.security.test.ts`).
- Inisialisasi awal repositori, backend Bun + Elysia, Docker containers, dan modul anti-cheat.

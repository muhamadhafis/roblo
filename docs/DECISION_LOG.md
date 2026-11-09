# Architectural Decision Log (ADR)

## ADR-001: Pemilihan Runtime Backend Bun + Elysia
- **Status**: Diterima
- **Konteks**: Diperlukan runtime performa tinggi dengan dukungan native TypeScript, WebSocket terintegrasi, dan kemudahan berbagi tipe data ke frontend Next.js/React.
- **Keputusan**: Menggunakan Bun 1.4+ dengan framework Elysia pada port 3444.
- **Konsekuensi**: Validasi schema menggunakan TypeBox/Elysia native, test runner terpadu dengan `bun test`.

## ADR-002: Port Service Kontainer & Dockerisasi
- **Status**: Diterima
- **Konteks**: Port default (5432, 6379) berpotensi tabrakan dengan kontainer atau layanan host yang sudah aktif.
- **Keputusan**: 
  - Backend Bun: Port `3444`
  - PostgreSQL 16: Port `5444:5432`
  - Redis 7: Port `6444:6379`
- **Konsekuensi**: Seluruh koneksi internal dan external harus merujuk ke port terpetakan ini.

## ADR-003: Batas Sistem (System Caps) untuk Menahan Inflasi
- **Status**: Diterima
- **Konteks**: Game incremental berisiko mengalami overflow numerik dan ketidakseimbangan ekonomi jika level dibiarkan tak terbatas.
- **Keputusan**:
  - `FoodLevel`: Max 100
  - `PullUpLevel`: Max 100
  - `MaxAFKTime`: Max 43.200 detik (12 jam)
  - `InventoryCapacity`: Max 200 slot
- **Konsekuensi**: Seluruh fungsi mutasi state wajib melakukan pengecekan boundary clamp.

## ADR-004: Pemilihan Drizzle ORM & Driver Postgres.js untuk Bun
- **Status**: Diterima
- **Konteks**: Diperlukan ORM yang ringan, zero-overhead, dan mendukung transaksi ACID dengan row-level lock (`SELECT ... FOR UPDATE`) pada PostgreSQL 16 di runtime Bun.
- **Keputusan**: Menggunakan `drizzle-orm` dengan driver `postgres` (porsager).
- **Konsekuensi**: Menghilangkan latency query builder dan memastikan type safety terhubung langsung dengan schema.

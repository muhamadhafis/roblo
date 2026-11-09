# State Management Map

Pemetaan aliran state data:

1. **Player Core State (Server-Authoritative)**
   - Disimpan di PostgreSQL tabel `players` dan dicache di Redis.
   - Perubahan hanya dapat dipicu oleh pesan WebSocket yang lolos validasi `anti-cheat`.

2. **AFK Progression State**
   - Disimpan sebagai `pullup_start_timestamp` (Unix epoch) di Redis.
   - Evaluasi kekuatan dilakukan saat event sync dipanggil oleh client atau saat aksi lemparan berikutnya.

3. **Client-Side Visual State**
   - Ditangani oleh Zustand di frontend untuk animasi lokal (bobbing, power bar charge, partikel lempar proyektil).

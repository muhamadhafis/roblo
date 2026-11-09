# Known Issues & Mitigation Log

Daftar isu potensial dan strategi penanganannya:

1. **Desinkronisasi Collision Proyektil Klien vs Backend**
   - *Gejala*: Klien Rapier Wasm memancarkan hit event palsu untuk hewan di luar jangkauan valid.
   - *Mitigasi*: Modul anti-cheat backend memvalidasi jarak maksimum berdasarkan kekuatan pemain ($\text{MaxDistance} \times 1.05$) dan menolak aksi jika melanggar batas.

2. **Spam Lemparan / Replay Nonce**
   - *Gejala*: Pengguna mengirim banyak request lemparan dalam waktu singkat untuk mengakselerasi perolehan koin.
   - *Mitigasi*: Rate limiter WebSocket dengan cooldown minimum 1.2 detik dan validasi sekuensial `action_nonce`.

3. **Diskrepansi Kurva Formula Jarak vs Jarak Minimal Tabel Zona di PRD 2.1**
   - *Gejala*: Formula $20 \log_{10}(S+10) + (S/80)^{0.65}$ menghasilkan $82.56\text{ m}$ pada $S=3500$, sedangkan tabel mencantumkan jarak minimal Z-03 sebesar $180\text{ m}$.
   - *Mitigasi*: Formula matematis murni tetap diimplementasikan sesuai PRD 2.1; perancangan visual spasi zona di client disinkronkan dengan hasil perhitungan formula atau memerlukan kalibrasi multiplier jarak pada sprint balancing.

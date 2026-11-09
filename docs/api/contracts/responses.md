# Responses Specification

Struktur envelope respons standar sistem HTTP & WebSocket:

- `success`: boolean status keberhasilan operasi.
- `data`: objek hasil jika `success` bernilai true.
- `error`: objek error dengan atribut `code` dan `message` jika `success` false.
- `timestamp`: Unix timestamp milidetik respons dihasilkan.

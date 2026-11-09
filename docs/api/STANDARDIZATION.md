# API & WebSocket Standardization

## Format Respons Standar

Setiap payload respons JSON wajib mengikuti skema seragam:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "timestamp": 1700000000000
}
```

Format error:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_DISTANCE",
    "message": "Jarak lemparan melebihi batas kekuatan maksimum"
  },
  "timestamp": 1700000000000
}
```

## Protokol WebSocket Frame

Frame aksi yang dikirim dari klien ke server pada port 3444:

```json
{
  "action": "THROW_FOOD",
  "nonce": 1,
  "payload": {
    "zoneId": 1,
    "distance": 18.5,
    "targetAnimalId": 101
  }
}
```

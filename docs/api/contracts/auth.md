# Auth Contract

## Endpoints

### 1. `POST /api/auth/guest`
Membuat atau memulihkan sesi Guest tanpa wallet.
* Response: `{ token: string, playerId: string }`

### 2. `POST /api/auth/wallet`
Autentikasi dengan dompet Web3 (Base Sepolia).
* Payload: `{ walletAddress: string, signature: string, message: string }`
* Response: `{ token: string, playerId: string, walletAddress: string }`

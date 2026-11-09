# Transactions Contract

## Endpoints

### 1. `POST /api/vault/deposit-notify`
Notifikasi setelah event on-chain deposit Testnet USDC ke `GameVault.sol` berhasil diverifikasi indexer.

### 2. `POST /api/vault/request-withdrawal`
Meminta voucher penarikan EIP-712 terenkripsi untuk ditarik langsung oleh user di Base Sepolia Testnet.
* Payload: `{ amountUsdc: number }`
* Response: `{ nonce: string, deadline: number, signature: string }`

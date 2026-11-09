# Shared Services Registry

Daftar layanan bersama:

1. **AntiCheatService (`apps/server/src/modules/security/anti-cheat.ts`)**: Validasi jarak lempar, rate limiting cooldown 1.2s, dan deteksi anomali nonce.
2. **GameFormulaService (`packages/shared/src/formulas/index.ts`)**: Evaluasi rumus deterministik jarak, probabilitas drop, dan akumulasi idle.
3. **Eip712SignerService (`apps/server/src/modules/web3/eip712-signer.ts`)**: Pembuatan payload dan signature voucher kriptografis Base Sepolia.

# Game Actions Contract

## WebSocket Messages (Client -> Server)

### 1. `THROW_FOOD`
* Nonce: Integer sekuensial
* Payload: `{ zoneId: number, distance: number, powerRatio: number }`

### 2. `SYNC_AFK`
* Nonce: Integer sekuensial
* Payload: `{ action: 'START' | 'STOP' | 'CLAIM' }`

### 3. `SELL_ANIMALS`
* Nonce: Integer sekuensial
* Payload: `{ inventoryIds: string[] }` atau `{ quickSellAll: boolean }`

### 4. `UPGRADE_STAT`
* Nonce: Integer sekuensial
* Payload: `{ type: 'FOOD' | 'PULLUP' }`

# Liquity V2 Frontend Environment Variables - Complete Guide

This document explains all environment variables used in the Liquity V2 frontend and how they connect to the code.

## Table of Contents
1. [General Settings](#general-settings)
2. [Blockchain Configuration](#blockchain-configuration)
3. [External APIs & Services](#external-apis--services)
4. [Smart Contract Addresses](#smart-contract-addresses)
5. [Collateral-Specific Contracts](#collateral-specific-contracts)
6. [How Variables Are Used in Code](#how-variables-are-used-in-code)

---

## General Settings

### `NEXT_PUBLIC_ACCOUNT_SCREEN`
- **Type**: Boolean (true/false)
- **Default**: `false`
- **Purpose**: Enables/disables the account screen feature
- **Code Location**: `src/env.ts:101`, exported as `ACCOUNT_SCREEN`
- **Usage**: Feature flag for showing user account details

### `NEXT_PUBLIC_DEMO_MODE`
- **Type**: Boolean (true/false)
- **Default**: `false` (not in env.ts, likely used elsewhere)
- **Purpose**: Enables demo mode for testing/presentation
- **Usage**: Typically used to show fake data or disable real transactions

### `NEXT_PUBLIC_VERCEL_ANALYTICS`
- **Type**: Boolean (true/false)
- **Default**: `false`
- **Purpose**: Enables Vercel Analytics tracking
- **Code Location**: `src/env.ts:186`, exported as `VERCEL_ANALYTICS`
- **Usage**: Controls whether to send analytics data to Vercel

### `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`
- **Type**: String (Project ID from WalletConnect)
- **Required**: ✅ Yes
- **Current Value**: `XXXX`
- **Purpose**: WalletConnect v2 project identifier
- **Code Location**: `src/env.ts:187-194`, exported as `WALLET_CONNECT_PROJECT_ID`
- **Usage**: Used by WalletConnect SDK to enable wallet connections (MetaMask, Rainbow, etc.)
- **How to Get**: Create a project at https://cloud.walletconnect.com/

---

## Blockchain Configuration

### `NEXT_PUBLIC_CHAIN_ID`
- **Type**: Number
- **Required**: ✅ Yes
- **Current Value**: `XXXX`
- **Purpose**: Ethereum chain ID
- **Code Location**: `src/env.ts:143-151`, exported as `CHAIN_ID`
- **Common Values**:
  - `1` = Ethereum Mainnet
  - `11155111` = Sepolia Testnet
  - `5` = Goerli Testnet (deprecated)
- **Usage**: Ensures users are on correct network, displayed in wallet prompts

### `NEXT_PUBLIC_CHAIN_NAME`
- **Type**: String
- **Required**: ✅ Yes
- **Current Value**: `Sepolia`
- **Purpose**: Human-readable chain name
- **Code Location**: `src/env.ts:153`, exported as `CHAIN_NAME`
- **Usage**: Displayed in UI when showing network info

### `NEXT_PUBLIC_CHAIN_CURRENCY`
- **Type**: String (Format: `"Name|Symbol|Decimals"`)
- **Required**: ✅ Yes
- **Current Value**: `"Ether|ETH|18"`
- **Purpose**: Native currency information
- **Code Location**: `src/env.ts:154`, parsed by `vEnvCurrency()`
- **Format**: Pipe-separated values (Name|Symbol|Decimals)
- **Usage**: Displayed when showing gas fees, wallet balance

### `NEXT_PUBLIC_CHAIN_RPC_URL`
- **Type**: URL
- **Required**: ✅ Yes
- **Current Value**: `XXXX`
- **Purpose**: RPC endpoint for blockchain queries
- **Code Location**: `src/env.ts:155`, exported as `CHAIN_RPC_URL`
- **Usage**: Used by Wagmi/Viem to read blockchain state, send transactions
- **Common Providers**:
  - Alchemy: `https://eth-mainnet.g.alchemy.com/v2/{API_KEY}`
  - Infura: `https://mainnet.infura.io/v3/{API_KEY}`
  - Public: `https://ethereum-sepolia-rpc.publicnode.com`

### `NEXT_PUBLIC_CHAIN_BLOCK_EXPLORER`
- **Type**: String (Format: `"Name|URL"`)
- **Required**: No
- **Current Value**: `"Etherscan Sepolia|https://sepolia.etherscan.io/"`
- **Purpose**: Block explorer for viewing transactions
- **Code Location**: `src/env.ts:156`, exported as `CHAIN_BLOCK_EXPLORER`
- **Format**: `"Explorer Name|https://explorer.url/"`
- **Usage**: Used to generate "View on Etherscan" links after transactions

### `NEXT_PUBLIC_CHAIN_CONTRACT_MULTICALL`
- **Type**: Ethereum Address
- **Required**: ✅ Yes
- **Current Value**: `0xXXXX`
- **Purpose**: Multicall3 contract address (standard across all chains)
- **Code Location**: `src/env.ts:165`, exported as `CHAIN_CONTRACT_MULTICALL`
- **Usage**: Batches multiple contract reads into single RPC call for performance
- **Note**: This address is same on all EVM chains (deployed via CREATE2)

### `NEXT_PUBLIC_SAFE_API_URL`
- **Type**: URL
- **Required**: No
- **Current Value**: Empty (not needed for Sepolia testing)
- **Purpose**: Gnosis Safe Transaction Service API
- **Code Location**: `src/env.ts:183`, exported as `SAFE_API_URL`
- **Usage**: Enables Safe/multisig wallet support
- **Example**: `https://safe-transaction-mainnet.safe.global/api`

---

## External APIs & Services

### `NEXT_PUBLIC_SUBGRAPH_URL`
- **Type**: URL
- **Required**: ✅ Yes
- **Current Value**: `XXXX`
- **Purpose**: The Graph subgraph endpoint for querying indexed blockchain data
- **Code Location**: `src/env.ts:185`, exported as `SUBGRAPH_URL`
- **Usage**:
  - Fetches historical loan data
  - Queries trove positions
  - Gets liquidation history
  - Reads governance votes
- **Used In**: `src/subgraph.ts`, `src/liquity-utils.ts`

### `NEXT_PUBLIC_LIQUITY_STATS_URL`
- **Type**: URL
- **Required**: ⚠️ Critical for UI to work!
- **Current Value**: `XXXX`
- **Purpose**: Fetches token prices (BOLD, ETH, etc.) from Liquity Stats API
- **Code Location**: `src/env.ts:181`, exported as `LIQUITY_STATS_URL`
- **Usage**:
  - **CRITICAL**: Provides BOLD price (from CoinGecko)
  - Without this, loan update panels won't render
  - Used in `src/services/Prices.tsx:40-42`
- **API Response Example**:
  ```json
  {
    "prices": {
      "BOLD": [1000000000000000000n, 18],  // $1.00
      "LQTY": [850000000000000000n, 18],   // $0.85
      "LUSD": [1020000000000000000n, 18]   // $1.02
    },
    "tvl": {...},
    "stats": {...}
  }
  ```

### `NEXT_PUBLIC_KNOWN_DELEGATES_URL`
- **Type**: URL
- **Required**: No
- **Purpose**: List of known interest rate delegates
- **Code Location**: `src/env.ts:178`, exported as `KNOWN_DELEGATES_URL`
- **Usage**: Shows friendly names for batch managers/delegates

### `NEXT_PUBLIC_KNOWN_INITIATIVES_URL`
- **Type**: URL
- **Required**: No
- **Purpose**: List of known governance initiatives
- **Code Location**: `src/env.ts:179`, exported as `KNOWN_INITIATIVES_URL`
- **Usage**: Displays governance initiative metadata

---

## Smart Contract Addresses

These are the core protocol contracts that are shared across all collateral types.

### `NEXT_PUBLIC_CONTRACT_BOLD_TOKEN`
- **Address**: `0xXXXX`
- **Purpose**: BOLD stablecoin ERC20 token contract
- **Code Location**: `src/env.ts:198`, exported as `CONTRACT_BOLD_TOKEN`
- **Usage**:
  - Reading BOLD balance
  - Approving BOLD for repayment
  - Transferring BOLD
- **ABI**: ERC20 standard + Liquity-specific functions

### `NEXT_PUBLIC_CONTRACT_COLLATERAL_REGISTRY`
- **Address**: `0xXXXX`
- **Purpose**: Registry of all supported collateral types
- **Code Location**: `src/env.ts:199`, exported as `CONTRACT_COLLATERAL_REGISTRY`
- **Usage**:
  - Get list of collateral branches
  - Fetch collateral metadata
  - Verify collateral support

### `NEXT_PUBLIC_CONTRACT_HINT_HELPERS`
- **Address**: `0xXXXX`
- **Purpose**: Helper contract for finding insertion hints in sorted trove list
- **Code Location**: `src/env.ts:204`, exported as `CONTRACT_HINT_HELPERS`
- **Usage**:
  - Called before opening/updating troves
  - Finds correct position in sorted list for gas-efficient insertion
  - Used in `src/liquity-utils.ts:getTroveOperationHints()`

### `NEXT_PUBLIC_CONTRACT_MULTI_TROVE_GETTER`
- **Address**: `0xXXXX`
- **Purpose**: Batch-reads multiple trove data in one call
- **Code Location**: `src/env.ts:208`, exported as `CONTRACT_MULTI_TROVE_GETTER`
- **Usage**: Performance optimization for reading many troves at once

### `NEXT_PUBLIC_CONTRACT_DEBT_IN_FRONT_HELPER`
- **Address**: `0xXXXX`
- **Purpose**: Calculates debt position in redemption queue
- **Code Location**: `src/env.ts:200`, exported as `CONTRACT_DEBT_IN_FRONT_HELPER`
- **Usage**: Shows "redemption risk" based on queue position

### `NEXT_PUBLIC_CONTRACT_EXCHANGE_HELPERS`
- **Address**: `0xXXXX`
- **Purpose**: Helper for DEX swaps during leverage operations
- **Code Location**: `src/env.ts:201`, exported as `CONTRACT_EXCHANGE_HELPERS`

### `NEXT_PUBLIC_CONTRACT_EXCHANGE_HELPERS_V2`
- **Address**: `0xXXXX`
- **Purpose**: Updated version of exchange helpers
- **Code Location**: `src/env.ts:202`, exported as `CONTRACT_EXCHANGE_HELPERS_V2`

### `NEXT_PUBLIC_CONTRACT_GOVERNANCE`
- **Address**: `0xXXXX`
- **Purpose**: LQTY governance/staking contract
- **Code Location**: `src/env.ts:203`, exported as `CONTRACT_GOVERNANCE`
- **Usage**:
  - Stake LQTY
  - Vote on initiatives
  - Claim rewards

### `NEXT_PUBLIC_CONTRACT_LQTY_STAKING`
- **Address**: `0xXXXX`
- **Purpose**: Legacy LQTY staking (V1)
- **Code Location**: `src/env.ts:205`, exported as `CONTRACT_LQTY_STAKING`

### `NEXT_PUBLIC_CONTRACT_LQTY_TOKEN`
- **Address**: `0xXXXX`
- **Purpose**: LQTY governance token
- **Code Location**: `src/env.ts:206`, exported as `CONTRACT_LQTY_TOKEN`

### `NEXT_PUBLIC_CONTRACT_LUSD_TOKEN`
- **Address**: `0xXXXX`
- **Purpose**: Legacy LUSD token (V1)
- **Code Location**: `src/env.ts:207`, exported as `CONTRACT_LUSD_TOKEN`

### `NEXT_PUBLIC_CONTRACT_WETH`
- **Address**: `0xXXXX`
- **Purpose**: Wrapped ETH token contract
- **Code Location**: `src/env.ts:209`, exported as `CONTRACT_WETH`
- **Usage**: ETH <-> WETH conversion for leverage

---

## Collateral-Specific Contracts

The protocol supports 3 collateral types (branches): ETH (COLL_0), wstETH (COLL_1), rETH (COLL_2).

Each collateral has 11 contracts + 1 token ID:

### Token Identifiers

#### `NEXT_PUBLIC_COLL_0_TOKEN_ID`
- **Value**: `ETH`
- **Purpose**: Identifies first collateral as ETH
- **Code Location**: `src/env.ts:370-372`, parsed into `ENV_BRANCHES[0].symbol`

#### `NEXT_PUBLIC_COLL_1_TOKEN_ID`
- **Value**: `WSTETH`
- **Purpose**: Identifies second collateral as Wrapped Staked ETH (Lido)

#### `NEXT_PUBLIC_COLL_2_TOKEN_ID`
- **Value**: `RETH`
- **Purpose**: Identifies third collateral as Rocket Pool ETH

### Per-Collateral Contracts (Pattern: `COLL_{0|1|2}_CONTRACT_{NAME}`)

Each collateral branch has these 11 contracts:

#### 1. `ADDRESSES_REGISTRY`
- **Example**: `NEXT_PUBLIC_COLL_0_CONTRACT_ADDRESSES_REGISTRY=0xXXXX`
- **Purpose**: Registry of all addresses for this collateral branch
- **Usage**: Single source of truth for contract addresses

#### 2. `ACTIVE_POOL`
- **Example**: `NEXT_PUBLIC_COLL_0_CONTRACT_ACTIVE_POOL=0xXXXX`
- **Purpose**: Holds collateral for active troves
- **Usage**:
  - Deposits collateral when opening trove
  - Withdraws collateral when closing
  - Tracks total collateral locked

#### 3. `BORROWER_OPERATIONS`
- **Example**: `NEXT_PUBLIC_COLL_0_CONTRACT_BORROWER_OPERATIONS=0xXXXX`
- **Purpose**: **Main entry point for user operations**
- **Usage**:
  - `openTrove()` - Open new loan
  - `adjustTrove()` - Add/remove collateral, borrow/repay
  - `closeTrove()` - Close loan
  - `addColl()`, `withdrawColl()`, `withdrawBold()`, `repayBold()`
- **Most Important**: This is where `src/tx-flows/openBorrowPosition.tsx` sends transactions

#### 4. `COLL_SURPLUS_POOL`
- **Example**: `NEXT_PUBLIC_COLL_0_CONTRACT_COLL_SURPLUS_POOL=0xXXXX`
- **Purpose**: Holds excess collateral after liquidations
- **Usage**:
  - After liquidation, remaining collateral goes here
  - Users claim surplus with `claimColl()`

#### 5. `COLL_TOKEN`
- **Example**: `NEXT_PUBLIC_COLL_0_CONTRACT_COLL_TOKEN=0xXXXX`
- **Purpose**: The collateral token contract itself
- **Usage**:
  - For ETH: WETH contract
  - For wstETH: Lido's wstETH contract
  - For rETH: Rocket Pool's rETH contract
  - Used for `approve()` before depositing

#### 6. `DEFAULT_POOL`
- **Example**: `NEXT_PUBLIC_COLL_0_CONTRACT_DEFAULT_POOL=0xXXXX`
- **Purpose**: Holds debt from closed troves
- **Usage**: Internal accounting during liquidations

#### 7. `LEVERAGE_ZAPPER`
- **Example**: `NEXT_PUBLIC_COLL_0_CONTRACT_LEVERAGE_ZAPPER=0xXXXX`
- **Purpose**: **One-transaction leveraged position opening**
- **Usage**:
  - Combines: deposit ETH → borrow BOLD → swap to more ETH → deposit more
  - Called from `src/tx-flows/openBorrowPosition.tsx:276` (`openTroveWithRawETH`)
  - Used in "Multiply" mode
- **This is what your successful transaction used!**

#### 8. `PRICE_FEED`
- **Example**: `NEXT_PUBLIC_COLL_0_CONTRACT_PRICE_FEED=0xXXXX`
- **Purpose**: **Provides collateral price in USD**
- **Usage**:
  - Called by `src/services/Prices.tsx:16-34` (`fetchCollateralPrice`)
  - Returns current ETH/wstETH/rETH price
  - Critical for LTV calculations
- **Used By**: `PanelUpdateBorrowPosition` to calculate collateral value

#### 9. `SORTED_TROVES`
- **Example**: `NEXT_PUBLIC_COLL_0_CONTRACT_SORTED_TROVES=0xXXXX`
- **Purpose**: Doubly-linked list of troves sorted by interest rate
- **Usage**:
  - Maintains order for redemptions (lowest rate = first redeemed)
  - `findInsertPosition()` finds where to insert new trove

#### 10. `STABILITY_POOL`
- **Example**: `NEXT_PUBLIC_COLL_0_CONTRACT_STABILITY_POOL=0xXXXX`
- **Purpose**: **Earn screen deposit pool**
- **Usage**:
  - Users deposit BOLD
  - Earn yield from liquidations
  - `provideToSP()`, `withdrawFromSP()`

#### 11. `TROVE_MANAGER`
- **Example**: `NEXT_PUBLIC_COLL_0_CONTRACT_TROVE_MANAGER=0xXXXX`
- **Purpose**: **Core trove logic and state**
- **Usage**:
  - Stores all trove data
  - Handles liquidations
  - Calculates fees
  - `getTrove()` reads trove state
  - Emits `TroveOperation` events
- **Used In**: `src/tx-flows/openBorrowPosition.tsx:305` to extract trove ID from logs

#### 12. `TROVE_NFT`
- **Example**: `NEXT_PUBLIC_COLL_0_CONTRACT_TROVE_NFT=0xXXXX`
- **Purpose**: ERC721 NFT representing trove ownership
- **Usage**:
  - Each trove = 1 NFT
  - Transfer NFT = transfer trove ownership
  - `ownerOf(troveId)` checks ownership

---

## How Variables Are Used in Code

### 1. Environment Loading (`src/env.ts`)

```typescript
// Lines 307-413: Parse all process.env.NEXT_PUBLIC_* variables
const parsedEnv = v.safeParse(EnvSchema, {
  CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
  SUBGRAPH_URL: process.env.NEXT_PUBLIC_SUBGRAPH_URL,
  // ... etc
});

// Lines 415-427: If validation fails, throw error
if (!parsedEnv.success) {
  throw new Error(`Invalid environment variable(s)`);
}

// Lines 429-473: Export parsed values
export const {
  CHAIN_ID,
  SUBGRAPH_URL,
  CONTRACT_BOLD_TOKEN,
  // ... etc
} = parsedEnv.output;
```

### 2. Contract Interaction (`src/contracts.ts`)

```typescript
import { CONTRACT_BOLD_TOKEN, ENV_BRANCHES } from "@/src/env";

// Get BOLD token contract
const BoldToken = {
  address: CONTRACT_BOLD_TOKEN,
  abi: BoldTokenAbi,
};

// Get branch-specific contract
const branch = ENV_BRANCHES[0]; // ETH branch
const TroveManager = {
  address: branch.contracts.TROVE_MANAGER,
  abi: TroveManagerAbi,
};
```

### 3. Price Fetching (`src/services/Prices.tsx`)

```typescript
// Line 40-42: Check if LIQUITY_STATS_URL is set
const stats = useLiquityStats();

// Line 56-59: Get BOLD price from stats API
const priceFromStats = statsPrices?.["BOLD"] ?? null;
if (priceFromStats !== null) {
  return priceFromStats; // Returns [1000000000000000000n, 18] for $1.00
}
```

### 4. Transaction Flow (`src/tx-flows/openBorrowPosition.tsx`)

```typescript
// Line 274: Get branch contracts
const branch = getBranch(ctx.request.branchId);

// Line 276: Call LeverageWETHZapper contract
return ctx.writeContract({
  ...branch.contracts.LeverageWETHZapper, // Uses LEVERAGE_ZAPPER address
  functionName: "openTroveWithRawETH",
  args: [{ ... }],
});

// Line 305: Parse TroveManager event
const [troveOperation] = parseEventLogs({
  abi: branch.contracts.TroveManager.abi, // Uses TROVE_MANAGER address
  logs: receipt.logs,
});
```

### 5. Wagmi Configuration (`src/wagmi-config.ts` or `src/services/Ethereum.tsx`)

```typescript
import { CHAIN_ID, CHAIN_RPC_URL, WALLET_CONNECT_PROJECT_ID } from "@/src/env";

const config = createConfig({
  chains: [{ id: CHAIN_ID, rpcUrls: { default: CHAIN_RPC_URL } }],
  connectors: [
    walletConnect({ projectId: WALLET_CONNECT_PROJECT_ID }),
  ],
});
```

---

## Quick Reference: What Breaks Without Each Variable

| Variable | What Breaks |
|----------|-------------|
| `LIQUITY_STATS_URL` | ❌ **CRITICAL**: Loan panels empty, no BOLD price |
| `SUBGRAPH_URL` | ❌ Can't load existing loans, history |
| `CHAIN_RPC_URL` | ❌ **CRITICAL**: No blockchain connection at all |
| `WALLET_CONNECT_PROJECT_ID` | ❌ Can't connect wallets |
| `CONTRACT_BOLD_TOKEN` | ❌ Can't read BOLD balance, approve, transfer |
| `COLL_0_CONTRACT_LEVERAGE_ZAPPER` | ❌ Can't open leveraged positions |
| `COLL_0_CONTRACT_TROVE_MANAGER` | ❌ Can't read trove data |
| `COLL_0_CONTRACT_PRICE_FEED` | ❌ No collateral price, LTV calculations fail |
| `COLL_0_CONTRACT_BORROWER_OPERATIONS` | ❌ Can't open/adjust/close loans |
| All others | ⚠️ Specific features break |

---

## How to Get Values for Different Networks

### Mainnet (Chain ID: 1)
1. Check official docs: https://docs.liquity.org/
2. Check GitHub: https://github.com/liquity/bold/
3. Look for `deployment-mainnet.json` or similar

### Sepolia (Chain ID: 11155111)
1. Your values came from: https://liquity2-sepolia.vercel.app/
2. Can also check: https://sepolia.etherscan.io/
3. Or look for test deployment files

### Custom/Fork
1. Deploy contracts yourself
2. Copy addresses from deployment output
3. Update all `NEXT_PUBLIC_COLL_*` and `NEXT_PUBLIC_CONTRACT_*` variables

---

## Environment Variable Naming Convention

```
NEXT_PUBLIC_{CATEGORY}_{SPECIFIC_NAME}

NEXT_PUBLIC_           - Required by Next.js for client-side access
CHAIN_*                - Blockchain network configuration
CONTRACT_*             - Protocol-level shared contracts
COLL_{0|1|2}_*        - Branch-specific (per-collateral)
COLL_{N}_CONTRACT_*   - Contract addresses for branch N
COLL_{N}_TOKEN_ID     - Collateral symbol (ETH/WSTETH/RETH)
```

---

## Summary

**Most Critical Variables** (app won't work without these):
1. ✅ `NEXT_PUBLIC_LIQUITY_STATS_URL` - Provides BOLD price
2. ✅ `NEXT_PUBLIC_CHAIN_RPC_URL` - Blockchain connection
3. ✅ `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` - Wallet connection
4. ✅ `NEXT_PUBLIC_SUBGRAPH_URL` - Historical data
5. ✅ All `NEXT_PUBLIC_COLL_0_CONTRACT_*` - ETH branch contracts

**Important for Full Functionality**:
- All collateral branches (COLL_1, COLL_2) if supporting wstETH/rETH
- All protocol contracts (BOLD, HINT_HELPERS, etc.)
- Chain configuration (CHAIN_ID, CHAIN_NAME, etc.)

**Optional but Recommended**:
- `NEXT_PUBLIC_CHAIN_BLOCK_EXPLORER` - Better UX
- `NEXT_PUBLIC_KNOWN_DELEGATES_URL` - Friendly names
- `NEXT_PUBLIC_SAFE_API_URL` - Multisig support

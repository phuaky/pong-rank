# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PongRank is a ping pong leaderboard app that tracks matches and player ELO ratings with blockchain verification on Ethereum Sepolia testnet. User authentication is handled via Firebase Google Sign-In.

Live at: https://pong.phuaky.com

## Commands

```bash
# Development
bun install          # Install dependencies
bun dev              # Start Next.js dev server
bun run build        # Build for production
bun start            # Start production server

# Smart Contracts (in /contracts directory)
cd contracts
forge build          # Compile contracts
forge test           # Run tests
forge test -vvv      # Run tests with verbose output

# Deploy to Sepolia (requires SIGNER_PRIVATE_KEY and SEPOLIA_RPC_URL)
forge script script/Deploy.s.sol:DeployPongRank --rpc-url $SEPOLIA_RPC_URL --broadcast
```

## Architecture

### Data Flow

```
User → Google Auth (Firebase) → Next.js API Routes → Smart Contract (Sepolia) + Firestore
```

- **Frontend**: Next.js 14 + React 18 + TypeScript + Tailwind CSS
- **Authentication**: Firebase Google Sign-In
- **Backend**: Next.js API Routes
- **On-chain Storage**: Solidity smart contract on Sepolia testnet
- **Off-chain Storage**: Firebase Firestore (user metadata, match metadata)

### Project Structure

```
/app                    # Next.js app router
  /api                  # API routes
    /auth/register      # User registration endpoint
    /players            # Player CRUD
    /matches            # Match logging
  /page.tsx             # Main page
  /layout.tsx           # Root layout
/components             # React components
/contracts              # Foundry smart contract project
  /src/PongRank.sol     # Main smart contract
  /test/PongRank.t.sol  # Contract tests
  /script/Deploy.s.sol  # Deployment script
/lib                    # Utility libraries
  /firebase.ts          # Firebase client config
  /firebaseAdmin.ts     # Firebase admin SDK
  /blockchain.ts        # Ethers.js contract interactions
  /firestoreService.ts  # Firestore database operations
  /dataService.ts       # Client-side data fetching
  /eloUtils.ts          # ELO calculation logic
  /AuthContext.tsx      # React auth context
/types.ts               # TypeScript interfaces
```

### Data Models

**Player** (Hybrid - on-chain + Firestore):
- On-chain: id (bytes32), elo, wins, losses
- Firestore: name, email, photoURL, firebaseUid, createdAt

**Match** (Hybrid - on-chain + Firestore):
- On-chain: id (bytes32), winnerIds[], loserIds[], eloChange, timestamp
- Firestore: score, type (SINGLES/DOUBLES), txHash

### Smart Contract

The `PongRank.sol` contract stores:
- Player ELO ratings and win/loss records
- Match results with ELO changes
- Only the owner (server wallet) can write; anyone can read

Key functions:
- `registerPlayer(bytes32 playerId)` - Register new player with 1200 ELO
- `logMatch(...)` - Record match and update player stats
- `getPlayer(bytes32)` / `getMatch(bytes32)` - Read data

### Environment Variables

See `.env.example` for required variables:
- Firebase client config (NEXT_PUBLIC_FIREBASE_*)
- Firebase admin credentials (FIREBASE_ADMIN_*)
- Blockchain config (SIGNER_PRIVATE_KEY, SEPOLIA_RPC_URL, NEXT_PUBLIC_CONTRACT_ADDRESS)

### Server Wallet

The backend uses a dedicated wallet for all blockchain transactions:
- Private key stored in `SIGNER_PRIVATE_KEY` environment variable
- Must be funded with Sepolia ETH from a faucet
- Signs and sends transactions on behalf of users (gasless UX)

## Deployment

### Deploy Smart Contract

1. Fund your server wallet with Sepolia ETH
2. Set environment variables
3. Deploy:
   ```bash
   cd contracts
   forge script script/Deploy.s.sol:DeployPongRank --rpc-url $SEPOLIA_RPC_URL --broadcast
   ```
4. Copy the deployed contract address to `NEXT_PUBLIC_CONTRACT_ADDRESS`

### Deploy Next.js App

1. Create Firebase project and enable Google Auth
2. Create Firestore database
3. Set all environment variables
4. Deploy to Vercel or similar

## Contributing

Repo is public at https://github.com/phuaky/pong-rank - PRs welcome!

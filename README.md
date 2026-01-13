# PongRank 🏓

A ping pong leaderboard app with blockchain-verified ELO rankings on Ethereum Sepolia testnet.

## Features

- **ELO Rating System** - Track player rankings with the proven ELO algorithm
- **Blockchain Verified** - All matches permanently recorded on Sepolia testnet
- **Google Sign-In** - Easy authentication via Firebase
- **Singles & Doubles** - Support for 1v1 and 2v2 matches

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Auth**: Firebase Google Sign-In
- **On-chain**: Solidity smart contract (Foundry)
- **Off-chain**: Firebase Firestore

## Quick Start

```bash
# Install dependencies
bun install

# Start dev server
bun dev
```

## Environment Variables

Copy `env.template` to `.env.local` and fill in:

- Firebase client config
- Firebase Admin credentials
- Blockchain config (private key, RPC URL, contract address)

## Smart Contract

```bash
cd contracts

# Build
forge build

# Test
forge test

# Deploy to Sepolia
forge script script/Deploy.s.sol:DeployPongRank --rpc-url $SEPOLIA_RPC_URL --broadcast
```

## License

MIT

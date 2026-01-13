import { ethers } from 'ethers';

// PongRank contract ABI (only the functions we need)
const PONGRANK_ABI = [
  // Write functions
  "function registerPlayer(bytes32 playerId) external",
  "function registerPlayersBatch(bytes32[] calldata _playerIds) external",
  "function logMatch(bytes32 matchId, bytes32[] calldata winnerIds, bytes32[] calldata loserIds, int256 eloChange) external",
  "function transferOwnership(address newOwner) external",
  
  // Read functions
  "function owner() external view returns (address)",
  "function INITIAL_ELO() external view returns (int256)",
  "function getPlayer(bytes32 playerId) external view returns (bytes32 id, int256 elo, uint256 wins, uint256 losses, bool exists)",
  "function getMatch(bytes32 matchId) external view returns (bytes32 id, bytes32[] memory winnerIds, bytes32[] memory loserIds, int256 eloChange, uint256 timestamp, bool exists)",
  "function playerExists(bytes32 playerId) external view returns (bool)",
  "function matchExists(bytes32 matchId) external view returns (bool)",
  "function getPlayerCount() external view returns (uint256)",
  "function getMatchCount() external view returns (uint256)",
  "function getAllPlayerIds() external view returns (bytes32[] memory)",
  "function getAllMatchIds() external view returns (bytes32[] memory)",
  "function getPlayerIdsPaginated(uint256 offset, uint256 limit) external view returns (bytes32[] memory)",
  "function getMatchIdsPaginated(uint256 offset, uint256 limit) external view returns (bytes32[] memory)",
  "function getPlayersBatch(bytes32[] calldata _playerIds) external view returns (bytes32[] memory ids, int256[] memory elos, uint256[] memory wins, uint256[] memory losses)",
  
  // Events
  "event PlayerRegistered(bytes32 indexed playerId, int256 initialElo)",
  "event MatchLogged(bytes32 indexed matchId, bytes32[] winnerIds, bytes32[] loserIds, int256 eloChange, uint256 timestamp)",
  "event PlayerStatsUpdated(bytes32 indexed playerId, int256 newElo, uint256 wins, uint256 losses)",
];

// Singleton instances
let provider: ethers.JsonRpcProvider | null = null;
let signer: ethers.Wallet | null = null;
let contract: ethers.Contract | null = null;
let readOnlyContract: ethers.Contract | null = null;

/**
 * Get the JSON RPC provider
 */
function getProvider(): ethers.JsonRpcProvider {
  if (!provider) {
    const rpcUrl = process.env.SEPOLIA_RPC_URL;
    if (!rpcUrl) {
      throw new Error('SEPOLIA_RPC_URL environment variable not set');
    }
    provider = new ethers.JsonRpcProvider(rpcUrl);
  }
  return provider;
}

/**
 * Get the server wallet signer
 */
function getSigner(): ethers.Wallet {
  if (!signer) {
    const privateKey = process.env.SIGNER_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('SIGNER_PRIVATE_KEY environment variable not set');
    }
    signer = new ethers.Wallet(privateKey, getProvider());
  }
  return signer;
}

/**
 * Get the contract instance with signer (for write operations)
 */
function getContract(): ethers.Contract {
  if (!contract) {
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    if (!contractAddress) {
      throw new Error('NEXT_PUBLIC_CONTRACT_ADDRESS environment variable not set');
    }
    contract = new ethers.Contract(contractAddress, PONGRANK_ABI, getSigner());
  }
  return contract;
}

/**
 * Get the contract instance without signer (for read operations)
 */
function getReadOnlyContract(): ethers.Contract {
  if (!readOnlyContract) {
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    if (!contractAddress) {
      throw new Error('NEXT_PUBLIC_CONTRACT_ADDRESS environment variable not set');
    }
    readOnlyContract = new ethers.Contract(contractAddress, PONGRANK_ABI, getProvider());
  }
  return readOnlyContract;
}

// ============ Utility Functions ============

/**
 * Convert a UUID string to bytes32
 */
export function uuidToBytes32(uuid: string): string {
  // Remove hyphens and convert to bytes32
  const cleanUuid = uuid.replace(/-/g, '');
  return '0x' + cleanUuid.padEnd(64, '0');
}

/**
 * Convert bytes32 to UUID string
 */
export function bytes32ToUuid(bytes32: string): string {
  // Remove 0x prefix and trailing zeros
  const hex = bytes32.slice(2, 34); // Take first 32 hex chars (16 bytes = UUID)
  // Insert hyphens in UUID format: 8-4-4-4-12
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/**
 * Generate a new UUID and return both string and bytes32 versions
 */
export function generateId(): { uuid: string; bytes32: string } {
  const uuid = crypto.randomUUID();
  return {
    uuid,
    bytes32: uuidToBytes32(uuid),
  };
}

// ============ Read Functions ============

/**
 * Check if contract is configured
 */
export function isConfigured(): boolean {
  return !!(
    process.env.SEPOLIA_RPC_URL &&
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
  );
}

/**
 * Get the server wallet address
 */
export async function getServerWalletAddress(): Promise<string> {
  return getSigner().address;
}

/**
 * Get the server wallet balance
 */
export async function getServerWalletBalance(): Promise<string> {
  const balance = await getProvider().getBalance(getSigner().address);
  return ethers.formatEther(balance);
}

/**
 * Check if a player exists on-chain
 */
export async function playerExists(playerId: string): Promise<boolean> {
  const contract = getReadOnlyContract();
  const bytes32Id = uuidToBytes32(playerId);
  return contract.playerExists(bytes32Id);
}

/**
 * Get player data from the contract
 */
export async function getPlayer(playerId: string): Promise<{
  id: string;
  elo: number;
  wins: number;
  losses: number;
  exists: boolean;
} | null> {
  const contract = getReadOnlyContract();
  const bytes32Id = uuidToBytes32(playerId);
  
  const [id, elo, wins, losses, exists] = await contract.getPlayer(bytes32Id);
  
  if (!exists) return null;
  
  return {
    id: bytes32ToUuid(id),
    elo: Number(elo),
    wins: Number(wins),
    losses: Number(losses),
    exists,
  };
}

/**
 * Get match data from the contract
 */
export async function getMatch(matchId: string): Promise<{
  id: string;
  winnerIds: string[];
  loserIds: string[];
  eloChange: number;
  timestamp: number;
  exists: boolean;
} | null> {
  const contract = getReadOnlyContract();
  const bytes32Id = uuidToBytes32(matchId);
  
  const [id, winnerIds, loserIds, eloChange, timestamp, exists] = await contract.getMatch(bytes32Id);
  
  if (!exists) return null;
  
  return {
    id: bytes32ToUuid(id),
    winnerIds: winnerIds.map(bytes32ToUuid),
    loserIds: loserIds.map(bytes32ToUuid),
    eloChange: Number(eloChange),
    timestamp: Number(timestamp),
    exists,
  };
}

/**
 * Get total player count
 */
export async function getPlayerCount(): Promise<number> {
  const contract = getReadOnlyContract();
  const count = await contract.getPlayerCount();
  return Number(count);
}

/**
 * Get total match count
 */
export async function getMatchCount(): Promise<number> {
  const contract = getReadOnlyContract();
  const count = await contract.getMatchCount();
  return Number(count);
}

/**
 * Get all player IDs
 */
export async function getAllPlayerIds(): Promise<string[]> {
  const contract = getReadOnlyContract();
  const ids = await contract.getAllPlayerIds();
  return ids.map(bytes32ToUuid);
}

/**
 * Get all match IDs
 */
export async function getAllMatchIds(): Promise<string[]> {
  const contract = getReadOnlyContract();
  const ids = await contract.getAllMatchIds();
  return ids.map(bytes32ToUuid);
}

/**
 * Get multiple players in batch
 */
export async function getPlayersBatch(playerIds: string[]): Promise<Array<{
  id: string;
  elo: number;
  wins: number;
  losses: number;
}>> {
  const contract = getReadOnlyContract();
  const bytes32Ids = playerIds.map(uuidToBytes32);
  
  const [ids, elos, wins, losses] = await contract.getPlayersBatch(bytes32Ids);
  
  return ids.map((id: string, i: number) => ({
    id: bytes32ToUuid(id),
    elo: Number(elos[i]),
    wins: Number(wins[i]),
    losses: Number(losses[i]),
  }));
}

// ============ Write Functions ============

/**
 * Register a new player on-chain
 */
export async function registerPlayer(playerId: string): Promise<{
  txHash: string;
  success: boolean;
}> {
  const contract = getContract();
  const bytes32Id = uuidToBytes32(playerId);
  
  try {
    const tx = await contract.registerPlayer(bytes32Id);
    const receipt = await tx.wait();
    
    return {
      txHash: receipt.hash,
      success: true,
    };
  } catch (error) {
    console.error('Error registering player:', error);
    throw error;
  }
}

/**
 * Register multiple players in batch
 */
export async function registerPlayersBatch(playerIds: string[]): Promise<{
  txHash: string;
  success: boolean;
}> {
  const contract = getContract();
  const bytes32Ids = playerIds.map(uuidToBytes32);
  
  try {
    const tx = await contract.registerPlayersBatch(bytes32Ids);
    const receipt = await tx.wait();
    
    return {
      txHash: receipt.hash,
      success: true,
    };
  } catch (error) {
    console.error('Error registering players batch:', error);
    throw error;
  }
}

/**
 * Log a match on-chain
 */
export async function logMatchOnChain(
  matchId: string,
  winnerIds: string[],
  loserIds: string[],
  eloChange: number
): Promise<{
  txHash: string;
  success: boolean;
}> {
  const contract = getContract();
  
  const bytes32MatchId = uuidToBytes32(matchId);
  const bytes32WinnerIds = winnerIds.map(uuidToBytes32);
  const bytes32LoserIds = loserIds.map(uuidToBytes32);
  
  try {
    const tx = await contract.logMatch(
      bytes32MatchId,
      bytes32WinnerIds,
      bytes32LoserIds,
      eloChange
    );
    const receipt = await tx.wait();
    
    return {
      txHash: receipt.hash,
      success: true,
    };
  } catch (error) {
    console.error('Error logging match:', error);
    throw error;
  }
}

// ============ Data Aggregation Functions ============

/**
 * Get all players with their on-chain data
 */
export async function getAllPlayersOnChain(): Promise<Array<{
  id: string;
  elo: number;
  wins: number;
  losses: number;
}>> {
  const playerIds = await getAllPlayerIds();
  if (playerIds.length === 0) return [];
  
  return getPlayersBatch(playerIds);
}

/**
 * Get all matches with their on-chain data
 */
export async function getAllMatchesOnChain(): Promise<Array<{
  id: string;
  winnerIds: string[];
  loserIds: string[];
  eloChange: number;
  timestamp: number;
}>> {
  const matchIds = await getAllMatchIds();
  const matches = [];
  
  for (const id of matchIds) {
    const match = await getMatch(id);
    if (match) {
      matches.push({
        id: match.id,
        winnerIds: match.winnerIds,
        loserIds: match.loserIds,
        eloChange: match.eloChange,
        timestamp: match.timestamp,
      });
    }
  }
  
  return matches;
}

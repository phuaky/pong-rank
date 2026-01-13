import { getAdminDb } from './firebaseAdmin';
import { Player, Match, MatchType } from '@/types';

// Collection names
const USERS_COLLECTION = 'users';
const MATCHES_COLLECTION = 'matches';

// User document type (stored in Firestore)
interface UserDoc {
  firebaseUid: string;
  playerId: string; // bytes32 ID for on-chain
  name: string;
  email: string;
  photoURL: string;
  createdAt: FirebaseFirestore.Timestamp;
}

// Match metadata document type (stored in Firestore)
interface MatchDoc {
  matchId: string; // bytes32 ID for on-chain
  score: string;
  type: MatchType;
  txHash?: string;
  createdAt: FirebaseFirestore.Timestamp;
}

// ============ User Functions ============

/**
 * Create or update a user in Firestore
 */
export async function upsertUser(
  firebaseUid: string,
  playerId: string,
  name: string,
  email: string,
  photoURL: string
): Promise<void> {
  const db = getAdminDb();
  const userRef = db.collection(USERS_COLLECTION).doc(firebaseUid);
  
  const existingUser = await userRef.get();
  
  if (existingUser.exists) {
    // Update existing user (name, photo might change)
    await userRef.update({
      name,
      email,
      photoURL,
    });
  } else {
    // Create new user
    await userRef.set({
      firebaseUid,
      playerId,
      name,
      email,
      photoURL,
      createdAt: new Date(),
    });
  }
}

/**
 * Get user by Firebase UID
 */
export async function getUserByFirebaseUid(firebaseUid: string): Promise<UserDoc | null> {
  const db = getAdminDb();
  const userRef = db.collection(USERS_COLLECTION).doc(firebaseUid);
  const doc = await userRef.get();
  
  if (!doc.exists) return null;
  return doc.data() as UserDoc;
}

/**
 * Get user by player ID (bytes32)
 */
export async function getUserByPlayerId(playerId: string): Promise<UserDoc | null> {
  const db = getAdminDb();
  const snapshot = await db.collection(USERS_COLLECTION)
    .where('playerId', '==', playerId)
    .limit(1)
    .get();
  
  if (snapshot.empty) return null;
  return snapshot.docs[0].data() as UserDoc;
}

/**
 * Get all users
 */
export async function getAllUsers(): Promise<UserDoc[]> {
  const db = getAdminDb();
  const snapshot = await db.collection(USERS_COLLECTION).get();
  return snapshot.docs.map(doc => doc.data() as UserDoc);
}

/**
 * Get multiple users by their player IDs
 */
export async function getUsersByPlayerIds(playerIds: string[]): Promise<Map<string, UserDoc>> {
  const db = getAdminDb();
  const userMap = new Map<string, UserDoc>();
  
  // Firestore 'in' queries are limited to 10 items, so batch if needed
  const batches = [];
  for (let i = 0; i < playerIds.length; i += 10) {
    batches.push(playerIds.slice(i, i + 10));
  }
  
  for (const batch of batches) {
    const snapshot = await db.collection(USERS_COLLECTION)
      .where('playerId', 'in', batch)
      .get();
    
    snapshot.docs.forEach(doc => {
      const user = doc.data() as UserDoc;
      userMap.set(user.playerId, user);
    });
  }
  
  return userMap;
}

// ============ Match Functions ============

/**
 * Store match metadata in Firestore
 */
export async function createMatchMetadata(
  matchId: string,
  score: string,
  type: MatchType,
  txHash?: string
): Promise<void> {
  const db = getAdminDb();
  await db.collection(MATCHES_COLLECTION).doc(matchId).set({
    matchId,
    score,
    type,
    txHash,
    createdAt: new Date(),
  });
}

/**
 * Update match with transaction hash
 */
export async function updateMatchTxHash(matchId: string, txHash: string): Promise<void> {
  const db = getAdminDb();
  await db.collection(MATCHES_COLLECTION).doc(matchId).update({
    txHash,
  });
}

/**
 * Get match metadata by ID
 */
export async function getMatchMetadata(matchId: string): Promise<MatchDoc | null> {
  const db = getAdminDb();
  const doc = await db.collection(MATCHES_COLLECTION).doc(matchId).get();
  
  if (!doc.exists) return null;
  return doc.data() as MatchDoc;
}

/**
 * Get all match metadata
 */
export async function getAllMatchMetadata(): Promise<MatchDoc[]> {
  const db = getAdminDb();
  const snapshot = await db.collection(MATCHES_COLLECTION)
    .orderBy('createdAt', 'desc')
    .get();
  
  return snapshot.docs.map(doc => doc.data() as MatchDoc);
}

/**
 * Get match metadata by IDs
 */
export async function getMatchMetadataByIds(matchIds: string[]): Promise<Map<string, MatchDoc>> {
  const db = getAdminDb();
  const matchMap = new Map<string, MatchDoc>();
  
  // Batch queries for Firestore limit
  const batches = [];
  for (let i = 0; i < matchIds.length; i += 10) {
    batches.push(matchIds.slice(i, i + 10));
  }
  
  for (const batch of batches) {
    const snapshot = await db.collection(MATCHES_COLLECTION)
      .where('matchId', 'in', batch)
      .get();
    
    snapshot.docs.forEach(doc => {
      const match = doc.data() as MatchDoc;
      matchMap.set(match.matchId, match);
    });
  }
  
  return matchMap;
}

// ============ Combined Data Functions ============

/**
 * Build full Player objects by combining Firestore user data with on-chain stats
 */
export function buildPlayerFromUserAndChainData(
  user: UserDoc,
  chainData: { elo: number; wins: number; losses: number }
): Player {
  return {
    id: user.playerId,
    name: user.name,
    email: user.email,
    photoURL: user.photoURL,
    elo: chainData.elo,
    wins: chainData.wins,
    losses: chainData.losses,
    createdAt: user.createdAt.toDate().toISOString(),
    firebaseUid: user.firebaseUid,
  };
}

/**
 * Build full Match objects by combining Firestore metadata with on-chain data
 */
export function buildMatchFromMetadataAndChainData(
  metadata: MatchDoc,
  chainData: { winnerIds: string[]; loserIds: string[]; eloChange: number; timestamp: number }
): Match {
  return {
    id: metadata.matchId,
    date: new Date(chainData.timestamp * 1000).toISOString(),
    type: metadata.type,
    winnerIds: chainData.winnerIds,
    loserIds: chainData.loserIds,
    score: metadata.score,
    eloChange: chainData.eloChange,
    txHash: metadata.txHash,
  };
}

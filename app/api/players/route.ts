import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebaseAdmin';
import { 
  getAllUsers, 
  getUserByFirebaseUid, 
  upsertUser,
  getUsersByPlayerIds,
  buildPlayerFromUserAndChainData 
} from '@/lib/firestoreService';
import { 
  getAllPlayersOnChain, 
  registerPlayer, 
  generateId,
  isConfigured 
} from '@/lib/blockchain';
import { Player } from '@/types';

/**
 * GET /api/players
 * Fetch all players with combined Firestore + on-chain data
 */
export async function GET() {
  try {
    // Check if blockchain is configured
    if (!isConfigured()) {
      // Return mock data or empty array if not configured
      return NextResponse.json({
        success: true,
        data: { players: [] },
      });
    }

    // Get on-chain player data
    const onChainPlayers = await getAllPlayersOnChain();
    
    if (onChainPlayers.length === 0) {
      return NextResponse.json({
        success: true,
        data: { players: [] },
      });
    }

    // Get Firestore user data for all players
    const playerIds = onChainPlayers.map(p => p.id);
    const usersMap = await getUsersByPlayerIds(playerIds);

    // Combine data
    const players: Player[] = onChainPlayers.map(chainData => {
      const userData = usersMap.get(chainData.id);
      
      if (userData) {
        return buildPlayerFromUserAndChainData(userData, chainData);
      }
      
      // Player exists on-chain but not in Firestore (shouldn't happen normally)
      return {
        id: chainData.id,
        name: 'Unknown Player',
        elo: chainData.elo,
        wins: chainData.wins,
        losses: chainData.losses,
        createdAt: new Date().toISOString(),
      };
    });

    // Sort by ELO descending
    players.sort((a, b) => b.elo - a.elo);

    return NextResponse.json({
      success: true,
      data: { players },
    });
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch players' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/players
 * Add a new player (requires authentication)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(token);
    const firebaseUid = decodedToken.uid;

    // Get request body
    const body = await request.json();
    const { name, email, photoURL } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Valid name is required' },
        { status: 400 }
      );
    }

    // Check if user already has a player
    const existingUser = await getUserByFirebaseUid(firebaseUid);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Player already exists for this user' },
        { status: 409 }
      );
    }

    // Generate new player ID
    const { uuid: playerId } = generateId();

    // Register on blockchain
    const { txHash } = await registerPlayer(playerId);

    // Store in Firestore
    await upsertUser(
      firebaseUid,
      playerId,
      name.trim(),
      email || '',
      photoURL || ''
    );

    const newPlayer: Player = {
      id: playerId,
      name: name.trim(),
      email,
      photoURL,
      elo: 1200,
      wins: 0,
      losses: 0,
      createdAt: new Date().toISOString(),
      firebaseUid,
    };

    return NextResponse.json({
      success: true,
      data: {
        player: newPlayer,
        txHash,
      },
    });
  } catch (error) {
    console.error('Error adding player:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add player' },
      { status: 500 }
    );
  }
}

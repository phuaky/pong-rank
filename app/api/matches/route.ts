import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebaseAdmin';
import { 
  getAllMatchMetadata,
  getMatchMetadataByIds,
  createMatchMetadata,
  updateMatchTxHash,
  getUsersByPlayerIds,
  buildMatchFromMetadataAndChainData
} from '@/lib/firestoreService';
import { 
  getAllMatchesOnChain,
  logMatchOnChain,
  generateId,
  getPlayersBatch,
  isConfigured
} from '@/lib/blockchain';
import { calculateEloChange } from '@/lib/eloUtils';
import { Match, MatchType } from '@/types';

/**
 * GET /api/matches
 * Fetch all matches with combined Firestore + on-chain data
 */
export async function GET() {
  try {
    // Check if blockchain is configured
    if (!isConfigured()) {
      return NextResponse.json({
        success: true,
        data: { matches: [] },
      });
    }

    // Get on-chain match data
    const onChainMatches = await getAllMatchesOnChain();
    
    if (onChainMatches.length === 0) {
      return NextResponse.json({
        success: true,
        data: { matches: [] },
      });
    }

    // Get Firestore metadata for all matches
    const matchIds = onChainMatches.map(m => m.id);
    const metadataMap = await getMatchMetadataByIds(matchIds);

    // Combine data
    const matches: Match[] = onChainMatches.map(chainData => {
      const metadata = metadataMap.get(chainData.id);
      
      if (metadata) {
        return buildMatchFromMetadataAndChainData(metadata, chainData);
      }
      
      // Match exists on-chain but not in Firestore (shouldn't happen normally)
      return {
        id: chainData.id,
        date: new Date(chainData.timestamp * 1000).toISOString(),
        type: 'SINGLES' as MatchType,
        winnerIds: chainData.winnerIds,
        loserIds: chainData.loserIds,
        score: '?-?',
        eloChange: chainData.eloChange,
      };
    });

    // Sort by date descending (newest first)
    matches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      success: true,
      data: { matches },
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/matches
 * Log a new match (requires authentication)
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
    await verifyIdToken(token);

    // Get request body
    const body = await request.json();
    const { type, winnerIds, loserIds, score } = body;

    // Validate input
    if (!type || !['SINGLES', 'DOUBLES'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid match type' },
        { status: 400 }
      );
    }

    if (!Array.isArray(winnerIds) || winnerIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Winner IDs required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(loserIds) || loserIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Loser IDs required' },
        { status: 400 }
      );
    }

    if (winnerIds.length !== loserIds.length) {
      return NextResponse.json(
        { success: false, error: 'Team sizes must match' },
        { status: 400 }
      );
    }

    const expectedPlayers = type === 'SINGLES' ? 1 : 2;
    if (winnerIds.length !== expectedPlayers) {
      return NextResponse.json(
        { success: false, error: `${type} requires ${expectedPlayers} player(s) per team` },
        { status: 400 }
      );
    }

    if (!score || typeof score !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Score is required' },
        { status: 400 }
      );
    }

    // Get current ELO ratings from blockchain
    const allPlayerIds = [...winnerIds, ...loserIds];
    const playersData = await getPlayersBatch(allPlayerIds);
    
    // Build ELO arrays
    const winnerElos = winnerIds.map(id => {
      const player = playersData.find(p => p.id === id);
      return player?.elo ?? 1200;
    });
    
    const loserElos = loserIds.map(id => {
      const player = playersData.find(p => p.id === id);
      return player?.elo ?? 1200;
    });

    // Calculate ELO change
    const eloChange = calculateEloChange(winnerElos, loserElos);

    // Generate match ID
    const { uuid: matchId } = generateId();

    // Store metadata in Firestore first
    await createMatchMetadata(matchId, score, type as MatchType);

    // Log match on blockchain
    const { txHash } = await logMatchOnChain(
      matchId,
      winnerIds,
      loserIds,
      eloChange
    );

    // Update Firestore with transaction hash
    await updateMatchTxHash(matchId, txHash);

    const newMatch: Match = {
      id: matchId,
      date: new Date().toISOString(),
      type: type as MatchType,
      winnerIds,
      loserIds,
      score,
      eloChange,
      txHash,
    };

    return NextResponse.json({
      success: true,
      data: {
        match: newMatch,
        txHash,
      },
    });
  } catch (error) {
    console.error('Error logging match:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to log match' },
      { status: 500 }
    );
  }
}

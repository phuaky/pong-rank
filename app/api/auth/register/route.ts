import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebaseAdmin';
import { getUserByFirebaseUid, upsertUser } from '@/lib/firestoreService';
import { registerPlayer, playerExists, generateId } from '@/lib/blockchain';

export async function POST(request: NextRequest) {
  try {
    // Get and verify the Firebase token
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

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await getUserByFirebaseUid(firebaseUid);

    if (existingUser) {
      // Update existing user's profile info
      await upsertUser(
        firebaseUid,
        existingUser.playerId,
        name,
        email || '',
        photoURL || ''
      );

      return NextResponse.json({
        success: true,
        data: {
          playerId: existingUser.playerId,
          isNewUser: false,
        },
      });
    }

    // Create new player
    const { uuid: playerId } = generateId();

    // Register player on-chain
    const { txHash } = await registerPlayer(playerId);

    // Store user in Firestore
    await upsertUser(
      firebaseUid,
      playerId,
      name,
      email || '',
      photoURL || ''
    );

    return NextResponse.json({
      success: true,
      data: {
        playerId,
        txHash,
        isNewUser: true,
      },
    });
  } catch (error) {
    console.error('Error in auth/register:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to register user' },
      { status: 500 }
    );
  }
}

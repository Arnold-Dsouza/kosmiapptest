import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

// LiveKit Configuration from environment variables
const LIVEKIT_CONFIG = {
  apiKey: process.env.LIVEKIT_API_KEY,
  apiSecret: process.env.LIVEKIT_API_SECRET,
  url: process.env.LIVEKIT_URL,
};

export async function POST(request: NextRequest) {
  try {
    // Validate configuration
    if (!LIVEKIT_CONFIG.apiKey || !LIVEKIT_CONFIG.apiSecret || !LIVEKIT_CONFIG.url) {
      console.error('❌ Missing required LiveKit environment variables!');
      return NextResponse.json(
        { 
          error: 'Server configuration error',
          details: 'Missing LiveKit credentials'
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { room, username, identity, isHost = false } = body;

    if (!room || !username) {
      return NextResponse.json(
        { 
          error: 'room and username are required' 
        },
        { status: 400 }
      );
    }

    // Create access token
    const token = new AccessToken(LIVEKIT_CONFIG.apiKey, LIVEKIT_CONFIG.apiSecret, {
      identity: identity || username,
    });

    // Grant permissions based on role
    token.addGrant({
      room: room,
      roomJoin: true,
      canPublish: true, // Allow publishing for screen share
      canSubscribe: true, // Allow subscribing to view others
      canPublishData: true, // Allow data publishing for chat, etc.
    });

    const jwt = token.toJwt();
    
    console.log('✅ Generated LiveKit token for:', { room, username, isHost });
    
    return NextResponse.json({ 
      token: jwt,
      wsUrl: LIVEKIT_CONFIG.url 
    });
  } catch (error) {
    console.error('❌ Error generating LiveKit token:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate access token',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'LiveKit Token Service is running',
    hasConfig: !!(LIVEKIT_CONFIG.apiKey && LIVEKIT_CONFIG.apiSecret && LIVEKIT_CONFIG.url)
  });
}

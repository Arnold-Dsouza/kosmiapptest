import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

// LiveKit Configuration from environment variables
const LIVEKIT_CONFIG = {
  apiKey: process.env.LIVEKIT_API_KEY,
  apiSecret: process.env.LIVEKIT_API_SECRET,
  url: process.env.LIVEKIT_URL,
};

export async function POST(request: NextRequest) {
  try {    // Validate configuration
    if (!LIVEKIT_CONFIG.apiKey || !LIVEKIT_CONFIG.apiSecret || !LIVEKIT_CONFIG.url) {
      console.error('❌ Missing required LiveKit environment variables!', {
        hasApiKey: !!LIVEKIT_CONFIG.apiKey,
        hasApiSecret: !!LIVEKIT_CONFIG.apiSecret,
        hasUrl: !!LIVEKIT_CONFIG.url
      });
      return NextResponse.json(
        { 
          error: 'Server configuration error',
          details: 'Missing LiveKit credentials',
          missing: {
            apiKey: !LIVEKIT_CONFIG.apiKey,
            apiSecret: !LIVEKIT_CONFIG.apiSecret,
            url: !LIVEKIT_CONFIG.url
          }
        },
        { status: 500 }
      );
    }    const body = await request.json();
    const { room, roomName, username, participantName, identity, isHost = false } = body;

    // Support both parameter formats (room/username and roomName/participantName)
    const roomId = room || roomName;
    const userName = username || participantName;

    if (!roomId || !userName) {
      return NextResponse.json(
        { 
          error: 'Room name and username are required' 
        },
        { status: 400 }
      );
    }    // Create access token
    const token = new AccessToken(LIVEKIT_CONFIG.apiKey, LIVEKIT_CONFIG.apiSecret, {
      identity: identity || userName,
    });
    
    // Grant permissions based on role
    token.addGrant({
      room: roomId,
      roomJoin: true,
      canPublish: true, // Allow publishing for screen share
      canSubscribe: true, // Allow subscribing to view others
      canPublishData: true, // Allow data publishing for chat, etc.
    });    // Generate the token and ensure it's a string
    let jwt;
    try {
      jwt = token.toJwt();
      
      if (typeof jwt !== 'string') {
        console.warn('⚠️ LiveKit token is not a string, converting to string');
        jwt = String(jwt);
      }
      
      console.log('✅ Generated LiveKit token for:', { 
        roomId, 
        userName, 
        isHost, 
        tokenType: typeof jwt,
        tokenLength: jwt.length
      });    } catch (error) {
      console.error('❌ Error generating JWT:', error);
      const tokenError = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to generate JWT token: ${tokenError}`);
    }
    
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

import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

// LiveKit Configuration from environment variables
const LIVEKIT_CONFIG = {
  apiKey: process.env.LIVEKIT_API_KEY || '',
  apiSecret: process.env.LIVEKIT_API_SECRET || '',
  url: process.env.LIVEKIT_URL || '',
};

// Debug environment information
console.log('🔑 LiveKit environment configuration:', {
  hasApiKey: !!LIVEKIT_CONFIG.apiKey,
  hasApiSecret: !!LIVEKIT_CONFIG.apiSecret, 
  hasUrl: !!LIVEKIT_CONFIG.url,
  apiKeyType: typeof LIVEKIT_CONFIG.apiKey,
  apiSecretType: typeof LIVEKIT_CONFIG.apiSecret,
  urlType: typeof LIVEKIT_CONFIG.url,
  // Show the first few characters for validation without revealing secrets
  apiKeyStart: LIVEKIT_CONFIG.apiKey ? `${LIVEKIT_CONFIG.apiKey.substring(0, 3)}...` : 'undefined',
  apiSecretStart: LIVEKIT_CONFIG.apiSecret ? `${LIVEKIT_CONFIG.apiSecret.substring(0, 3)}...` : 'undefined',
  urlStart: LIVEKIT_CONFIG.url ? `${LIVEKIT_CONFIG.url.substring(0, 10)}...` : 'undefined',
  nodeEnv: process.env.NODE_ENV
});

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
    try {
      // Extra verification of LiveKit configuration
      if (!LIVEKIT_CONFIG.apiKey || typeof LIVEKIT_CONFIG.apiKey !== 'string' || 
          !LIVEKIT_CONFIG.apiSecret || typeof LIVEKIT_CONFIG.apiSecret !== 'string' ||
          !LIVEKIT_CONFIG.url || typeof LIVEKIT_CONFIG.url !== 'string') {
        console.error('🚨 Invalid LiveKit config:', {
          apiKeyType: typeof LIVEKIT_CONFIG.apiKey,
          apiSecretType: typeof LIVEKIT_CONFIG.apiSecret,
          urlType: typeof LIVEKIT_CONFIG.url,
          apiKeyLength: LIVEKIT_CONFIG.apiKey?.length,
          apiSecretLength: LIVEKIT_CONFIG.apiSecret?.length,
          urlLength: LIVEKIT_CONFIG.url?.length
        });
        return NextResponse.json(
          { 
            error: 'Invalid LiveKit configuration',
            details: 'Configuration values are missing or invalid'
          },
          { status: 500 }
        );
      }      // Create a token manually if the SDK isn't working properly
      try {
        // First try using the official SDK method
        const accessToken = new AccessToken(LIVEKIT_CONFIG.apiKey, LIVEKIT_CONFIG.apiSecret, {
          identity: identity || userName,
        });
        
        // Grant permissions based on role
        accessToken.addGrant({
          room: roomId,
          roomJoin: true,
          canPublish: true, 
          canSubscribe: true,
          canPublishData: true,
        });

        const jwt = accessToken.toJwt();
        
        // Validate the JWT is a string
        if (typeof jwt !== 'string') {
          throw new Error(`Generated JWT is not a string: ${typeof jwt}`);
        }
        
        console.log('✅ Generated LiveKit token using SDK for:', { 
          roomId, 
          userName,
          identity: identity || userName,
          tokenType: typeof jwt,
        });
        
        return NextResponse.json({ 
          token: jwt,
          wsUrl: LIVEKIT_CONFIG.url 
        });
      } catch (sdkError) {
        // If the SDK method fails, log the error
        console.error('LiveKit SDK token generation failed:', sdkError);
        
        // If token generation fails, return the error
        return NextResponse.json(
          { 
            error: 'Failed to generate token JWT',
            details: sdkError instanceof Error ? sdkError.message : 'Unknown error',
            stack: sdkError instanceof Error ? sdkError.stack : undefined
          },
          { status: 500 }
        );
      }

      const jwt = token.toJwt();
      
      // Validate the JWT is a string
      if (typeof jwt !== 'string') {
        console.error('❌ Generated JWT is not a string:', { 
          jwtType: typeof jwt, 
          jwt
        });
        return NextResponse.json(
          { 
            error: 'Generated token is invalid',
            details: `Expected string but got ${typeof jwt}`
          },
          { status: 500 }
        );
      }      console.log('✅ Generated LiveKit token for:', { 
        roomId, 
        userName, 
        isHost,
        hasToken: !!jwt,
        tokenType: typeof jwt,
        jwtValue: jwt
      });
        return NextResponse.json({ 
        token: jwt,
        wsUrl: LIVEKIT_CONFIG.url 
      });    } catch (tokenError) {
      console.error('❌ Error generating token JWT:', tokenError);
      return NextResponse.json(
        { 
          error: 'Failed to generate token JWT',
          details: tokenError instanceof Error ? tokenError.message : 'Unknown error',
          stack: tokenError instanceof Error ? tokenError.stack : undefined
        },
        { status: 500 }
      );
    }
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

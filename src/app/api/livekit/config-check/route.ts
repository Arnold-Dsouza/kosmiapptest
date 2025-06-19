import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Get LiveKit Configuration from environment variables
  const LIVEKIT_CONFIG = {
    apiKey: process.env.LIVEKIT_API_KEY || '',
    apiSecret: process.env.LIVEKIT_API_SECRET || '',
    url: process.env.LIVEKIT_URL || '',
  };

  const hasApiKey = !!LIVEKIT_CONFIG.apiKey;
  const hasApiSecret = !!LIVEKIT_CONFIG.apiSecret;
  const hasUrl = !!LIVEKIT_CONFIG.url;
  
  // Hide actual values but show status and length for debugging
  const apiKeyInfo = hasApiKey 
    ? `${LIVEKIT_CONFIG.apiKey.substring(0, 3)}...${LIVEKIT_CONFIG.apiKey.substring(LIVEKIT_CONFIG.apiKey.length - 3)} (${LIVEKIT_CONFIG.apiKey.length} chars)`
    : 'Not set';
    
  const apiSecretInfo = hasApiSecret
    ? `${LIVEKIT_CONFIG.apiSecret.substring(0, 3)}...${LIVEKIT_CONFIG.apiSecret.substring(LIVEKIT_CONFIG.apiSecret.length - 3)} (${LIVEKIT_CONFIG.apiSecret.length} chars)`
    : 'Not set';
    
  return NextResponse.json({
    status: 'ok',
    environment: process.env.NODE_ENV,
    livekit: {
      hasApiKey,
      hasApiSecret,
      hasUrl,
      apiKeyInfo,
      apiSecretInfo,
      url: LIVEKIT_CONFIG.url,
    },
    apiKeyType: typeof LIVEKIT_CONFIG.apiKey,
    apiSecretType: typeof LIVEKIT_CONFIG.apiSecret,
    urlType: typeof LIVEKIT_CONFIG.url,
    vercelEnv: process.env.VERCEL_ENV || 'Not a Vercel environment'
  });
}

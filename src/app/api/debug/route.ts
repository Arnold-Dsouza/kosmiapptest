import { NextRequest, NextResponse } from 'next/server';

// This route is for debugging environment variables
// Only enable in development mode
export async function GET(request: NextRequest) {
  // In production, don't expose sensitive info
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({
      message: 'Debug endpoint is disabled in production',
      environment: process.env.NODE_ENV,
      vars: {
        LIVEKIT_API_KEY: !!process.env.LIVEKIT_API_KEY ? '[REDACTED]' : 'NOT SET',
        LIVEKIT_API_SECRET: !!process.env.LIVEKIT_API_SECRET ? '[REDACTED]' : 'NOT SET',
        LIVEKIT_URL: !!process.env.LIVEKIT_URL ? '[REDACTED]' : 'NOT SET',
        NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'NOT SET',
      }
    });
  }

  // In development, provide more details for debugging
  return NextResponse.json({
    message: 'Environment variables debug info',
    environment: process.env.NODE_ENV,
    hostname: request.headers.get('host'),
    vars: {
      // Show if variables exist but not their actual values
      LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY ? 
        `Set (${process.env.LIVEKIT_API_KEY.substring(0, 3)}...)` : 'NOT SET',
      LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET ? 
        'Set (redacted)' : 'NOT SET',
      LIVEKIT_URL: process.env.LIVEKIT_URL || 'NOT SET',
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'NOT SET',
    },
    // Additional debug info
    request: {
      url: request.url,
      method: request.method,
    }
  });
}

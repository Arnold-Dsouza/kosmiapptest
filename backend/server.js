const express = require('express');
const { AccessToken } = require('livekit-server-sdk');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// LiveKit Configuration from environment variables
const LIVEKIT_CONFIG = {
  apiKey: process.env.LIVEKIT_API_KEY,
  apiSecret: process.env.LIVEKIT_API_SECRET,
  url: process.env.LIVEKIT_URL,
};

// Validate configuration
if (!LIVEKIT_CONFIG.apiKey || !LIVEKIT_CONFIG.apiSecret || !LIVEKIT_CONFIG.url) {
  console.error('❌ Missing required LiveKit environment variables!');
  console.error('Please add LIVEKIT_API_KEY, LIVEKIT_API_SECRET, and LIVEKIT_URL to your .env file');
  process.exit(1);
}

console.log('🔧 LiveKit Configuration:', {
  url: LIVEKIT_CONFIG.url,
  apiKey: LIVEKIT_CONFIG.apiKey?.substring(0, 6) + '...',
  hasApiSecret: !!LIVEKIT_CONFIG.apiSecret,
});

// Validate configuration
if (!LIVEKIT_CONFIG.apiKey || !LIVEKIT_CONFIG.apiSecret || !LIVEKIT_CONFIG.url) {
  console.error('❌ Missing required LiveKit environment variables!');
  console.error('Please add LIVEKIT_API_KEY, LIVEKIT_API_SECRET, and LIVEKIT_URL to your .env file');
  process.exit(1);
}

app.use(cors());
app.use(express.json());

// Token generation endpoint
app.post('/api/token', async (req, res) => {
  try {
    const { roomName, participantName, isHost = false } = req.body;

    if (!roomName || !participantName) {
      return res.status(400).json({ 
        error: 'roomName and participantName are required' 
      });
    }

    // Create access token
    const token = new AccessToken(LIVEKIT_CONFIG.apiKey, LIVEKIT_CONFIG.apiSecret, {
      identity: participantName,
    });

    // Grant permissions based on role
    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true, // Allow publishing for screen share
      canSubscribe: true, // Everyone can subscribe (view)
      canPublishData: true, // Allow data publishing for chat, etc.
    });

    const jwt = await token.toJwt();
    
    console.log('✅ Generated token for:', { roomName, participantName, isHost });
    
    res.json({ token: jwt });
  } catch (error) {
    console.error('❌ Error generating token:', error);
    res.status(500).json({ 
      error: 'Failed to generate access token',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'LiveKit Token Service is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 LiveKit Token Service running on http://localhost:${PORT}`);
  console.log(`📍 Token endpoint: http://localhost:${PORT}/api/token`);
});

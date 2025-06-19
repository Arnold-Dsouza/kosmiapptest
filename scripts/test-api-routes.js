// scripts/test-api-routes.js
const fetch = require('node-fetch');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';

async function testApiRoutes() {
  console.log('📝 Testing API Routes...');
  
  try {
    // Test 1: Check debug endpoint
    console.log('\n🔍 Testing debug endpoint...');
    const debugResponse = await fetch(`${BASE_URL}/api/debug`);
    const debugData = await debugResponse.json();
    console.log('Debug endpoint response:', debugData);
    
    // Test 2: Check token endpoint health
    console.log('\n🏥 Testing token endpoint health...');
    const healthResponse = await fetch(`${BASE_URL}/api/livekit/token`);
    const healthData = await healthResponse.json();
    console.log('Token endpoint health response:', healthData);
    
    // Test 3: Try to generate a token
    console.log('\n🎫 Testing token generation...');
    const tokenResponse = await fetch(`${BASE_URL}/api/livekit/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        room: 'test-room',
        username: 'test-user',
      }),
    });
    
    const tokenData = await tokenResponse.json();
    
    if (tokenResponse.ok) {
      console.log('✅ Token generated successfully!');
      console.log('Token details:', {
        hasToken: !!tokenData.token,
        tokenLength: tokenData.token?.length,
        // Show a small preview of the token
        tokenPreview: tokenData.token ? `${tokenData.token.substring(0, 15)}...` : null,
        wsUrl: tokenData.wsUrl,
      });
    } else {
      console.error('❌ Token generation failed:', tokenData);
    }
    
  } catch (error) {
    console.error('❌ Error testing API routes:', error);
  }
}

testApiRoutes();

const { AccessToken } = require('livekit-server-sdk');

// Test JWT generation
async function testJWT() {
  console.log('Testing LiveKit JWT generation...');

  const token = new AccessToken('APIbP9CKKavHtRi', '5aeKPXNFzGUsWgOVLfv7V17h56R84pRKlNqTyGL6Icj', {
    identity: 'test-user',
  });

  token.addGrant({
    room: 'test-room',
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  try {
    const jwt = await token.toJwt();
    console.log('JWT type:', typeof jwt);
    console.log('JWT value:', jwt);
    console.log('JWT length:', jwt ? jwt.length : 'undefined');
  } catch (error) {
    console.error('Error generating JWT:', error);
  }
}

testJWT();

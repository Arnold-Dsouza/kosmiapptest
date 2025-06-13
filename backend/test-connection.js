const { Room } = require('livekit-client');

async function testLiveKitConnection() {
  console.log('Testing LiveKit connection...');
  
  // Get a token from our backend
  const tokenResponse = await fetch('http://localhost:3001/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomName: 'test-connection',
      participantName: 'test-participant',
      isHost: true
    })
  });
  
  const { token } = await tokenResponse.json();
  console.log('Got token:', token.substring(0, 50) + '...');
  
  const room = new Room();
  
  room.on('connected', () => {
    console.log('✅ Successfully connected to LiveKit!');
    room.disconnect();
  });
  
  room.on('disconnected', (reason) => {
    console.log('Disconnected:', reason);
  });
  
  try {
    await room.connect('wss://screenshare-3gbbe0by.livekit.cloud', token);
  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
}

testLiveKitConnection();

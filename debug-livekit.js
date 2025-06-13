// LiveKit Connection Debug Test
// Copy and paste this entire script into your browser console (F12)

console.log('🔍 Starting LiveKit Debug Test...');

async function debugLiveKitConnection() {
  try {
    // Step 1: Test backend token generation
    console.log('📝 Step 1: Testing token generation from backend...');
    const tokenResponse = await fetch('http://localhost:3001/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomName: 'debug-test-room',
        participantName: 'debug-user',
        isHost: true
      })
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token request failed: ${tokenResponse.status} ${tokenResponse.statusText}`);
    }

    const { token } = await tokenResponse.json();
    console.log('✅ Token received:', {
      length: token.length,
      preview: token.substring(0, 50) + '...'
    });

    // Step 2: Test WebSocket connectivity
    console.log('🌐 Step 2: Testing WebSocket connectivity...');
    const wsUrl = 'wss://screenshare-3gbbe0by.livekit.cloud';
    
    try {
      const testWs = new WebSocket(wsUrl);
      testWs.onopen = () => {
        console.log('✅ WebSocket connection successful');
        testWs.close();
      };
      testWs.onerror = (error) => {
        console.error('❌ WebSocket connection failed:', error);
      };
      testWs.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
      };
    } catch (wsError) {
      console.error('❌ WebSocket test failed:', wsError);
    }

    // Step 3: Test LiveKit Room connection
    console.log('🎥 Step 3: Testing LiveKit Room connection...');
    
    // Import LiveKit dynamically (if available)
    if (typeof window !== 'undefined' && window.LiveKit) {
      const { Room } = window.LiveKit;
      
      const room = new Room();
      
      room.on('connected', () => {
        console.log('✅ LiveKit Room connected successfully!');
        room.disconnect();
      });
      
      room.on('disconnected', (reason) => {
        console.log('LiveKit Room disconnected:', reason);
      });
      
      room.on('connectionStateChanged', (state) => {
        console.log('LiveKit connection state:', state);
      });
      
      try {
        await room.connect(wsUrl, token);
      } catch (connectionError) {
        console.error('❌ LiveKit Room connection failed:', connectionError);
        console.error('Error details:', {
          name: connectionError.name,
          message: connectionError.message,
          stack: connectionError.stack
        });
      }
    } else {
      console.warn('⚠️ LiveKit client not found on window object');
      
      // Try importing from node_modules if available
      try {
        const { Room } = await import('livekit-client');
        
        const room = new Room();
        
        room.on('connected', () => {
          console.log('✅ LiveKit Room connected successfully!');
          room.disconnect();
        });
        
        room.on('disconnected', (reason) => {
          console.log('LiveKit Room disconnected:', reason);
        });
        
        room.on('connectionStateChanged', (state) => {
          console.log('LiveKit connection state:', state);
        });
        
        await room.connect(wsUrl, token);
      } catch (importError) {
        console.error('❌ Could not import LiveKit client:', importError);
      }
    }

  } catch (error) {
    console.error('❌ Debug test failed:', error);
  }
}

// Step 4: Check browser environment
console.log('🌐 Browser environment check:', {
  userAgent: navigator.userAgent,
  webRTCSupported: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
  webSocketSupported: !!window.WebSocket,
  location: window.location.href
});

// Run the debug test
debugLiveKitConnection();

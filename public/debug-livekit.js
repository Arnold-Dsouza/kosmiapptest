// This file is used for debugging LiveKit connections from the browser
// You can include it in your HTML with:
// <script src="/debug-livekit.js"></script>

// Configuration
const defaultRoom = 'test-room';
const defaultUser = 'test-user';

// Main function to test LiveKit connection
async function testLiveKitConnection(options = {}) {
  const roomName = options.roomName || defaultRoom;
  const userName = options.userName || defaultUser;
  const apiUrl = options.apiUrl || '/api/livekit/token';
  
  console.log('🔍 Testing LiveKit connection:', { roomName, userName, apiUrl });
  
  // Step 1: Get token from API
  try {
    console.log('🎫 Requesting token from', apiUrl);
    const tokenResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        room: roomName,
        username: userName,
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('❌ Token generation failed:', errorData);
      return {
        success: false,
        stage: 'token',
        error: errorData.error || `HTTP error ${tokenResponse.status}`,
        details: errorData
      };
    }
    
    const tokenData = await tokenResponse.json();
    console.log('✅ Token received:', {
      hasToken: !!tokenData.token,
      tokenLength: tokenData.token?.length,
      wsUrl: tokenData.wsUrl
    });
    
    if (!tokenData.token) {
      return {
        success: false,
        stage: 'token',
        error: 'No token returned from API',
        details: tokenData
      };
    }
    
    // Step 2: Test if we can load LiveKit client
    try {
      if (typeof window.LivekitClient === 'undefined') {
        console.warn('⚠️ LiveKit client not loaded, trying to load it dynamically');
        await loadLiveKitScript();
      }
      
      console.log('✅ LiveKit client loaded:', !!window.LivekitClient);
      
      // Return full test results
      return {
        success: true,
        token: tokenData.token.substring(0, 20) + '...',
        wsUrl: tokenData.wsUrl,
        details: {
          tokenGenerated: true,
          clientLoaded: true
        }
      };
      
    } catch (clientError) {
      console.error('❌ Failed to load LiveKit client:', clientError);
      return {
        success: false,
        stage: 'client',
        error: clientError.message || 'Failed to load LiveKit client',
        details: { clientError: String(clientError) }
      };
    }
    
  } catch (error) {
    console.error('❌ Error testing LiveKit connection:', error);
    return {
      success: false,
      stage: 'request',
      error: error.message || 'Unknown error',
      details: { error: String(error) }
    };
  }
}

// Helper function to load LiveKit script
async function loadLiveKitScript() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/livekit-client/dist/livekit-client.umd.js';
    script.onload = () => {
      window.LivekitClient = window.LiveKit;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load LiveKit client script'));
    document.head.appendChild(script);
  });
}

// Expose function to global scope for browser testing
window.testLiveKitConnection = testLiveKitConnection;

// Auto-run test if page has ID 'livekit-debug'
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('livekit-debug')) {
    console.log('🔧 LiveKit debug mode detected, running automatic test');
    testLiveKitConnection().then(result => {
      console.log('📊 LiveKit connection test results:', result);
      
      // Display results on page
      const debugElement = document.getElementById('livekit-debug');
      debugElement.innerHTML = `
        <div style="padding: 20px; border: 1px solid #ddd; border-radius: 8px; margin: 20px 0;">
          <h3>LiveKit Connection Test Results</h3>
          <pre>${JSON.stringify(result, null, 2)}</pre>
        </div>
      `;
    });
  }
});

"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { AccessToken } from 'livekit-server-sdk';

export default function DebugPage() {
  const [token, setToken] = useState('');
  const [roomName, setRoomName] = useState('test-room');
  const [userName, setUserName] = useState('test-user');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const [tokenError, setTokenError] = useState('');
  const [envVars, setEnvVars] = useState({});
  const [apiUrl, setApiUrl] = useState('/api/livekit/token');
  
  // Fetch environment variables on mount
  useEffect(() => {
    async function fetchDebugInfo() {
      try {
        const res = await fetch('/api/debug');
        const data = await res.json();
        setEnvVars(data);
      } catch (error) {
        console.error('Failed to fetch debug info:', error);
      }
    }
    fetchDebugInfo();
  }, []);
  
  // Test API endpoint
  const testApiEndpoint = useCallback(async () => {
    setIsLoading(true);
    setTokenError('');
    setResult('');
    
    try {
      const startTime = performance.now();
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room: roomName,
          roomName: roomName,
          username: userName,
          participantName: userName,
        }),
      });
      
      const endTime = performance.now();
      const responseTime = (endTime - startTime).toFixed(2);
      
      const data = await response.json();
      
      setResult(JSON.stringify({ 
        status: response.status,
        statusText: response.statusText,
        responseTime: `${responseTime}ms`,
        data
      }, null, 2));
      
      if (response.ok && data.token) {
        setToken(data.token);
        setTokenError('');
      } else {
        setTokenError(`Error: ${data.error || 'Unknown error'}`);
      }    } catch (err) {
      console.error('Failed to test API endpoint:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setTokenError(`Error: ${errorMessage}`);
      setResult(JSON.stringify({ error: errorMessage }, null, 2));
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, roomName, userName]);
  
  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">LiveKit Debug Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
            <CardDescription>Current environment configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-black/10 p-4 rounded-md overflow-auto max-h-80">
              {JSON.stringify(envVars, null, 2)}
            </pre>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Test Token Generation</CardTitle>
            <CardDescription>Generate a LiveKit token for testing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-url">API Endpoint</Label>
                <Input 
                  id="api-url"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="/api/livekit/token"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="room-name">Room Name</Label>
                <Input 
                  id="room-name"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="test-room"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="user-name">User Name</Label>
                <Input 
                  id="user-name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="test-user"
                />
              </div>
              
              <Button 
                onClick={testApiEndpoint}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Testing...' : 'Test Token Generation'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>API Response</CardTitle>
            {tokenError && (
              <CardDescription className="text-red-500">{tokenError}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <Textarea 
              readOnly 
              value={result}
              className="font-mono h-80"
            />
          </CardContent>
          <Separator />
          <CardFooter className="flex justify-between pt-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Token</p>
              <p className="text-xs text-muted-foreground break-all">
                {token ? token.substring(0, 50) + '...' : 'No token generated'}
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

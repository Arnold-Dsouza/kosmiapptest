import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Room,
  Track,
  TrackPublication,
  Participant,
  RemoteParticipant,
  LocalParticipant,
  RoomEvent,
  ConnectionState,
  DisconnectReason,
  createLocalScreenTracks,
  LocalTrack,
} from 'livekit-client';

interface UseLiveKitProps {
  serverUrl: string;
  token: string;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
}

interface ParticipantInfo {
  identity: string;
  name?: string;
  isLocal: boolean;
  isConnected: boolean;
  audioTrack?: Track;
  videoTrack?: Track;
  screenShareTrack?: Track;
}

// Define a clear interface for what useLiveKit returns
export interface LiveKitHookResult {
  room: Room | null;
  isConnected: boolean;
  isConnecting: boolean;
  participants: ParticipantInfo[];
  localParticipant: LocalParticipant | null;
  isScreenSharing: boolean;
  isMicEnabled: boolean;
  isCameraEnabled: boolean;
  connectToRoom: () => Promise<void>;
  disconnectFromRoom: () => void;
  toggleMicrophone: () => Promise<void>;
  toggleCamera: () => Promise<void>;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => Promise<void>;
}

export const useLiveKit = ({
  serverUrl,
  token,
  onConnected,
  onDisconnected,
  onError,
}: UseLiveKitProps): LiveKitHookResult => {
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const roomRef = useRef<Room | null>(null);
  const screenTracksRef = useRef<LocalTrack[]>([]);

  // Helper function to convert participants to ParticipantInfo
  const getParticipantInfo = useCallback((participant: Participant): ParticipantInfo => {
    let audioTrack = null;
    let videoTrack = null;
    let screenShareTrack = null;

    // Search through track publications to find the tracks by source
    for (const [, publication] of participant.trackPublications) {
      if (publication.source === Track.Source.Microphone) {
        audioTrack = publication.track;
      } else if (publication.source === Track.Source.Camera) {
        videoTrack = publication.track;
      } else if (publication.source === Track.Source.ScreenShare) {
        screenShareTrack = publication.track;
      }
    }

    console.log('getParticipantInfo:', {
      identity: participant.identity,
      name: participant.name,
      isLocal: participant instanceof LocalParticipant,
      hasAudio: !!audioTrack,
      hasVideo: !!videoTrack,
      hasScreenShare: !!screenShareTrack,
    });
    
    return {
      identity: participant.identity,
      name: participant.name || participant.identity,
      isLocal: participant instanceof LocalParticipant,
      isConnected: true,
      audioTrack: audioTrack || undefined,
      videoTrack: videoTrack || undefined,
      screenShareTrack: screenShareTrack || undefined,
    };
  }, []);

  // Update participants list
  const updateParticipants = useCallback(() => {
    const currentRoom = roomRef.current;
    
    if (!currentRoom) {
      console.log('updateParticipants: No room available');
      return;
    }

    const allParticipants: ParticipantInfo[] = [];
    
    // Process local participant
    if (currentRoom.localParticipant) {
      const localInfo = getParticipantInfo(currentRoom.localParticipant);
      allParticipants.push(localInfo);
      setLocalParticipant(currentRoom.localParticipant);
      
      // Check for screen share tracks from local participant
      let hasScreenShare = false;
      for (const [, publication] of currentRoom.localParticipant.trackPublications) {
        if (publication.source === Track.Source.ScreenShare && publication.track) {
          hasScreenShare = true;
          break;
        }
      }
      setIsScreenSharing(hasScreenShare);
      
      // Check for mic and camera
      let hasMic = false;
      let hasCamera = false;
      for (const [, publication] of currentRoom.localParticipant.trackPublications) {
        if (publication.source === Track.Source.Microphone && publication.track) {
          hasMic = true;
        } else if (publication.source === Track.Source.Camera && publication.track) {
          hasCamera = true;
        }
      }
      setIsMicEnabled(hasMic);
      setIsCameraEnabled(hasCamera);
    } else {
      setLocalParticipant(null);
      setIsScreenSharing(false);
    }
    
    // Process remote participants
    for (const remoteParticipant of currentRoom.remoteParticipants.values()) {
      const remoteInfo = getParticipantInfo(remoteParticipant);
      allParticipants.push(remoteInfo);
    }
    
    console.log('Updated participants:', allParticipants.length);
    setParticipants(allParticipants);
  }, [getParticipantInfo]);

  // Connect to room
  const connectToRoom = useCallback(async () => {
    if (isConnecting) {
      console.log('Already connecting to room, skipping...');
      return;
    }

    // Don't try to connect with placeholder values
    const currentToken = token;
    const currentServerUrl = serverUrl;
    
    if (currentToken === 'placeholder-token' || currentServerUrl === 'wss://placeholder.livekit.cloud') {
      console.log('Cannot connect with placeholder credentials');
      return;
    }

    try {
      setIsConnecting(true);
      
      // Clean up any existing room first
      if (roomRef.current) {
        console.log('Disconnecting from existing room before connecting');
        await roomRef.current.disconnect();
        roomRef.current = null;
      }
      
      // Create a new room instance
      const newRoom = new Room();
      roomRef.current = newRoom;
      
      // Add event listeners
      newRoom.on(RoomEvent.TrackSubscribed, () => {
        console.log('Track subscribed');
        updateParticipants();
      });
      
      newRoom.on(RoomEvent.TrackUnsubscribed, () => {
        console.log('Track unsubscribed');
        updateParticipants();
      });
      
      newRoom.on(RoomEvent.Disconnected, (reason?: DisconnectReason) => {
        console.log('Disconnected from room:', reason);
        setIsConnected(false);
        onDisconnected?.();
        updateParticipants();
      });
      
      newRoom.on(RoomEvent.ParticipantConnected, () => {
        console.log('Participant connected');
        updateParticipants();
      });
      
      newRoom.on(RoomEvent.ParticipantDisconnected, () => {
        console.log('Participant disconnected');
        updateParticipants();
      });
      
      newRoom.on(RoomEvent.LocalTrackPublished, () => {
        console.log('Local track published');
        updateParticipants();
      });
      
      newRoom.on(RoomEvent.LocalTrackUnpublished, () => {
        console.log('Local track unpublished');
        updateParticipants();
      });
        newRoom.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
        console.log('Connection state changed:', state);
        if (state === ConnectionState.Connected) {
          setIsConnected(true);
          onConnected?.();
          updateParticipants();
        } else if (state === ConnectionState.Disconnected) {
          setIsConnected(false);
          onDisconnected?.();
        } else if (state === ConnectionState.Reconnecting) {
          console.log('Reconnecting to LiveKit...');
        }
      });

      // Add error event listener for better error handling
      newRoom.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
        console.log('Connection quality changed:', { quality, participant: participant?.identity });
      });

      // Handle DataChannel and WebRTC errors
      newRoom.on(RoomEvent.DataReceived, (payload, participant) => {
        // Data channel is working if we receive data
        console.log('Data received from participant:', participant?.identity);
      });
        // Connect to the room with optimized settings for DataChannel stability
      console.log('Attempting to connect to LiveKit room:', { 
        serverUrl: currentServerUrl,
        hasToken: !!currentToken,
        tokenPreview: currentToken ? (currentToken.length > 20 ? currentToken.substring(0, 20) + '...' : currentToken) : 'no token'
      });
      
      // Use connection options that may help with DataChannel stability
      const connectOptions = {
        autoSubscribe: true,
        publishDefaults: {
          simulcast: false, // Disable simulcast which can cause DataChannel issues
        },
        rtcConfig: {
          // ICE servers configuration to improve connection reliability
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ],
          iceCandidatePoolSize: 10, // Increase candidate pool for better connectivity
        },
      };
      
      await newRoom.connect(currentServerUrl, currentToken, connectOptions);
      console.log('Successfully connected to LiveKit room');      // Monitor for DataChannel errors after connection
      // This will catch runtime DataChannel errors that occur after initial connection
      const originalConsoleError = console.error;
      let isHandlingError = false; // Flag to prevent infinite loops
      let errorCount = 0; // Counter to prevent too many consecutive errors
      let lastErrorTime = 0; // Timestamp of last error
      
      const dataChannelErrorHandler = (...args: any[]) => {
        // Prevent infinite loops by checking if we're already handling an error
        if (isHandlingError) {
          originalConsoleError.apply(console, args);
          return;
        }
        
        // Rate limiting: prevent handling too many errors in quick succession
        const now = Date.now();
        if (now - lastErrorTime < 100) { // Less than 100ms since last error
          errorCount++;
          if (errorCount > 5) {
            originalConsoleError('Too many DataChannel errors in quick succession, reverting to original console.error');
            console.error = originalConsoleError;
            originalConsoleError.apply(console, args);
            return;
          }
        } else {
          errorCount = 0; // Reset counter after time gap
        }
        lastErrorTime = now;
        
        const message = args.join(' ');
        
        // Only handle DataChannel errors from LiveKit, not from our own error handling
        if ((message.includes('DataChannel error') || message.includes('data channel')) && 
            !message.includes('LiveKit error:')) {
          isHandlingError = true;
          
          // Add timeout to prevent hanging
          const timeoutId = setTimeout(() => {
            if (isHandlingError) {
              originalConsoleError('DataChannel error handler timeout, resetting...');
              isHandlingError = false;
            }
          }, 5000); // 5 second timeout
          
          console.warn('🔧 Runtime DataChannel error detected:', {
            message,
            timestamp: new Date().toISOString(),
            connectionState: newRoom.state,
            participantCount: newRoom.numParticipants,
            args
          });
          
          // Trigger onError callback for DataChannel errors without using console.error
          try {
            onError?.(new Error(`DataChannel error: ${message}`));
          } catch (errorInCallback) {
            // Use original console.error to avoid infinite loop
            originalConsoleError('Error in onError callback:', errorInCallback);
          } finally {
            clearTimeout(timeoutId);
            isHandlingError = false;
          }
        } else if (message.includes('RTCEngine') && message.includes('error') && 
                   !message.includes('LiveKit error:')) {
          console.warn('🔧 RTCEngine error detected:', {
            message,
            timestamp: new Date().toISOString(),
            args
          });
          originalConsoleError.apply(console, args);
        } else {
          // For all other errors, use original console.error
          originalConsoleError.apply(console, args);
        }
      };
      
      // Temporarily override console.error to catch DataChannel errors
      console.error = dataChannelErrorHandler;
      
      // Store reference for cleanup
      (newRoom as any)._originalConsoleError = originalConsoleError;
      (newRoom as any)._dataChannelErrorHandler = dataChannelErrorHandler;
      
      // Set room state AFTER successful connection
      setRoom(newRoom);} catch (error) {
      console.log('Failed to connect to room:', error);
      
      // Enhanced error handling for different types of connection issues
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('DataChannel') || errorMessage.includes('data channel')) {
        console.error('🔧 DataChannel connection failed:', error);
        // For DataChannel errors, we'll let the onError callback handle recovery
      } else if (errorMessage.includes('WebRTC') || errorMessage.includes('ICE')) {
        console.error('🌐 WebRTC/ICE connection failed:', error);
      } else if (errorMessage.includes('token') || errorMessage.includes('auth')) {
        console.error('🔑 Authentication failed:', error);
      } else {
        console.error('❌ General connection error:', error);
      }
      
      setIsConnecting(false);
      setIsConnected(false);
      
      // Clean up on failure
      if (roomRef.current) {
        roomRef.current = null;
      }
      
      setRoom(null);
      onError?.(error as Error);
    } finally {
      setIsConnecting(false);
      console.log('connectToRoom finished');
    }
  }, [serverUrl, token, isConnecting, onConnected, onDisconnected, onError, updateParticipants]);
  // Disconnect from room
  const disconnectFromRoom = useCallback(async () => {
    if (roomRef.current) {
      // Restore original console.error if it was overridden
      if ((roomRef.current as any)._originalConsoleError) {
        console.error = (roomRef.current as any)._originalConsoleError;
      }
      
      await roomRef.current.disconnect();
      roomRef.current = null;
      setRoom(null);
      setIsConnected(false);
      setLocalParticipant(null);
      setParticipants([]);
      setIsScreenSharing(false);
      setIsMicEnabled(false);
      setIsCameraEnabled(false);
    }
  }, []);

  // Toggle microphone
  const toggleMicrophone = useCallback(async () => {
    if (!localParticipant) return;
    
    try {
      if (isMicEnabled) {
        await localParticipant.setMicrophoneEnabled(false);
        setIsMicEnabled(false);
      } else {
        await localParticipant.setMicrophoneEnabled(true);
        setIsMicEnabled(true);
      }
      
      updateParticipants();
    } catch (error) {
      console.log('Failed to toggle microphone:', error);
    }
  }, [localParticipant, isMicEnabled, updateParticipants]);

  // Toggle camera
  const toggleCamera = useCallback(async () => {
    if (!localParticipant) return;
    
    try {
      if (isCameraEnabled) {
        await localParticipant.setCameraEnabled(false);
        setIsCameraEnabled(false);
      } else {
        await localParticipant.setCameraEnabled(true);
        setIsCameraEnabled(true);
      }
      
      updateParticipants();
    } catch (error) {
      console.log('Failed to toggle camera:', error);
    }
  }, [localParticipant, isCameraEnabled, updateParticipants]);

  // Start screen sharing - using the proven implementation from screenshare_test
  const startScreenShare = useCallback(async () => {
    if (!localParticipant) {
      console.warn('Cannot start screen share: no local participant');
      throw new Error('LiveKit connection not established. Please ensure you are connected to the room.');
    }
    
    if (isScreenSharing) {
      console.warn('Screen share is already active');
      return;
    }

    try {
      console.log('Starting screen share...');
      
      // Create screen share tracks using LiveKit's built-in method
      const tracks = await createLocalScreenTracks({
        audio: true,
        video: true,
      });
      
      // Store tracks for cleanup
      screenTracksRef.current = tracks;
      
      // Publish the tracks
      for (const track of tracks) {
        await localParticipant.publishTrack(track);
      }
      
      console.log('Screen share enabled successfully');
      setIsScreenSharing(true);
      updateParticipants();
    } catch (error) {
      console.log('Failed to start screen share:', error);
      // Provide more user-friendly error messages
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          throw new Error('Screen sharing permission was denied. Please grant permission and try again.');
        } else if (error.name === 'NotSupportedError') {
          throw new Error('Screen sharing is not supported in this browser.');
        } else if (error.name === 'NotFoundError') {
          throw new Error('No screen available for sharing.');
        }
      }
      throw error;
    }
  }, [localParticipant, isScreenSharing, updateParticipants]);

  // Stop screen sharing
  const stopScreenShare = useCallback(async () => {
    if (!localParticipant || !isScreenSharing) return;

    try {
      console.log('Stopping screen share...');
      
      // Unpublish and stop all screen share tracks
      for (const track of screenTracksRef.current) {
        await localParticipant.unpublishTrack(track);
        track.stop();
      }
      
      // Clear the tracks reference
      screenTracksRef.current = [];
      
      console.log('Screen share stopped successfully');
      setIsScreenSharing(false);
      updateParticipants();
    } catch (error) {
      console.log('Failed to stop screen share:', error);
      // Don't throw here, as we're stopping the share
    }
  }, [localParticipant, isScreenSharing, updateParticipants]);

  // Auto-connect effect
  useEffect(() => {
    // Only try to connect if we have real credentials
    if (token && token !== 'placeholder-token' && 
        serverUrl && serverUrl !== 'wss://placeholder.livekit.cloud' && 
        !isConnected && !isConnecting) {
      console.log('Auto-connecting to LiveKit...');
      connectToRoom();
    }
  }, [token, serverUrl, isConnected, isConnecting, connectToRoom]);
    // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (roomRef.current) {
        console.log('Cleaning up LiveKit room on unmount');
        
        // Restore original console.error if it was overridden
        if ((roomRef.current as any)._originalConsoleError) {
          console.error = (roomRef.current as any)._originalConsoleError;
        }
        
        roomRef.current.disconnect();
        roomRef.current = null;
      }
      
      // Clean up screen tracks
      for (const track of screenTracksRef.current) {
        track.stop();
      }
      screenTracksRef.current = [];
    };
  }, []);

  return {
    room,
    isConnected,
    isConnecting,
    participants,
    localParticipant,
    isScreenSharing,
    isMicEnabled,
    isCameraEnabled,
    connectToRoom,
    disconnectFromRoom,
    toggleMicrophone,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
  };
};

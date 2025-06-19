"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from "@/lib/utils";
import { useLiveKit } from '@/hooks/use-livekit';
import {
  Video,
  Users,
  Settings,
  MessageSquare,
  Send,
  LogOut,
  Mic,
  MicOff,
  VideoOff,
  Maximize,
  ChevronDown,
  PlaySquare,
  UserPlus,
  PenTool,
  Bell,
  PlusCircle,
  Globe,
  Copy,  Square, // Stop icon
  Play,   // Play icon
  Pause,  // Pause icon
  Volume2, // Volume icon
  VolumeX, // Mute icon
  ListVideo, // Select Media icon (now Menu)
  Menu, // New Menu icon
  Settings2, // Settings icon for controls
  Captions, // CC icon
  Expand,   // Fullscreen icon
  Youtube, // YouTube icon
  Crown,  User, // User/Avatar icon
  Edit3, // Edit icon
  Palette, // Appearance icon
  Eye, // Visibility icon
  EyeOff, // Hidden visibility icon
  Shield, // Security icon
  ChevronRight, // Right arrow icon
  X, // Close icon
  Upload, // Upload icon
  Check, // Check icon for save
  Edit, // Edit icon
  Trash, // Delete icon
  AlertTriangle, // Warning icon
} from 'lucide-react';
import { Track, RemoteTrack, RemoteTrackPublication, RemoteParticipant } from 'livekit-client';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import SelectMediaModal from './SelectMediaModal';
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, getDocs } from 'firebase/firestore';


interface RoomClientProps {
  roomId: string;
}

interface Message {
  id: string;
  user: string;
  avatar?: string;
  text: string;
  timestamp: Date;
}

interface Participant {
  id: string;
  name: string;
  avatarUrl: string;
  hint: string;
  isHost: boolean;
}

export default function RoomClient({ roomId }: RoomClientProps) {
  // Add hydration state
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Hydration effect
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
  const mediaFrameRef = useRef<HTMLIFrameElement>(null);
  const placeholderContentRef = useRef<HTMLDivElement>(null);
  const mainMediaContainerRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  
  const [isSelectMediaModalOpen, setIsSelectMediaModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [roomLink, setRoomLink] = useState('');
  const { toast } = useToast();
  
  const screenStreamRef = useRef<MediaStream | null>(null);
  const [currentMediaUrl, setCurrentMediaUrl] = useState<string | null>(null);
  const [isYouTubeVideo, setIsYouTubeVideo] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);

  const [isScreenSharePlaying, setIsScreenSharePlaying] = useState(false);
  const [isScreenShareMuted, setIsScreenShareMuted] = useState(false);
  const [screenShareVolume, setScreenShareVolume] = useState(1); // 0 to 1
  const [previousVolume, setPreviousVolume] = useState(1); // To store volume before mute
  const [mediaSourceText, setMediaSourceText] = useState<string | null>(null);
  
  const [videoProgress, setVideoProgress] = useState(0);
  const [currentTimeDisplay, setCurrentTimeDisplay] = useState("00:00");
  const [durationDisplay, setDurationDisplay] = useState("00:00");
  const [areCaptionsEnabled, setAreCaptionsEnabled] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Connection health monitoring states
  const [connectionHealth, setConnectionHealth] = useState<'good' | 'poor' | 'disconnected'>('good');
  const [reconnectionAttempts, setReconnectionAttempts] = useState(0);
  const [lastConnectionError, setLastConnectionError] = useState<string | null>(null);
  const connectionMonitorRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectionAttempts = 3;
  // Theme selection states
  const [selectedTheme, setSelectedTheme] = useState<keyof typeof backgroundThemes>('default');
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);  // Room settings states
  const [isRoomSettingsOpen, setIsRoomSettingsOpen] = useState(false);
  const [roomVisibility, setRoomVisibility] = useState<'Public' | 'Private'>('Private');
  const [roomName, setRoomName] = useState('');
  const [roomSettingsView, setRoomSettingsView] = useState<'main' | 'appearance' | 'avatar' | 'roomname' | 'security'>('main');
  const [isEditingRoomName, setIsEditingRoomName] = useState(false);
  const [editingRoomName, setEditingRoomName] = useState('');
    // Avatar management states
  const [userAvatar, setUserAvatar] = useState<string>('');
  const [selectedAvatarOption, setSelectedAvatarOption] = useState<string>('default');  // Initialize room name and visibility
  useEffect(() => {
    if (roomId) {
      // Initialize room visibility
      const savedVisibility = typeof window !== 'undefined' ? localStorage.getItem(`vh_roomVisibility_${roomId}`) : null;
      if (savedVisibility === 'Public' || savedVisibility === 'Private') {
        setRoomVisibility(savedVisibility);
      }

      // First check localStorage for saved room name
      const savedRoomName = typeof window !== 'undefined' ? localStorage.getItem(`vh_roomName_${roomId}`) : null;
      if (savedRoomName) {
        setRoomName(savedRoomName);
      } else {        // Check Firebase for room data
        const roomRef = doc(db, 'rooms', roomId);
        const unsubscribe = onSnapshot(roomRef, async (docSnapshot) => {
          if (docSnapshot.exists()) {
            const roomData = docSnapshot.data();
            if (roomData.name) {
              setRoomName(roomData.name);
            } else {
              // Default room name
              const defaultName = roomId.split(/[-']/)[0] + "'s room";
              setRoomName(defaultName);
              
              // Save default name to Firebase
              try {
                await setDoc(roomRef, { 
                  name: defaultName,
                  createdAt: new Date(),
                  updatedAt: new Date()
                }, { merge: true });
              } catch (error) {
                console.error("Error saving default room name:", error);
              }
            }
            
            if (roomData.visibility && (roomData.visibility === 'Public' || roomData.visibility === 'Private')) {
              setRoomVisibility(roomData.visibility);
            }
          } else {
            // Default room name for new room
            const defaultName = roomId.split(/[-']/)[0] + "'s room";
            setRoomName(defaultName);
            
            // Create room document with default name
            try {
              await setDoc(roomRef, {
                name: defaultName,
                visibility: 'Private',
                createdAt: new Date(),
                updatedAt: new Date()
              });
            } catch (error) {
              console.error("Error creating room document:", error);
            }
          }
        });
        
        return () => unsubscribe();
      }    }
  }, [roomId]);
    // Initialize user avatar from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedAvatar = localStorage.getItem('vh_userAvatar');
      const storedAvatarOption = localStorage.getItem('vh_avatarOption');
      if (storedAvatar) {
        setUserAvatar(storedAvatar);
      }
      if (storedAvatarOption) {
        setSelectedAvatarOption(storedAvatarOption);
      }
    }
  }, []);
  
  // Update document title when room name changes
  useEffect(() => {
    if (typeof document !== 'undefined' && roomName) {
      document.title = `${roomName} - VideoHub`;
    }
  }, [roomName]);
  
  // Predefined background themes
  const backgroundThemes = {
    default: {
      name: 'Default',
      image: null as string | null,
      preview: '#1a1a1a'
    },
    space: {
      name: 'Space',
      image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?ixlib=rb-4.0.3&auto=format&fit=crop&w=2013&q=80',
      preview: '#0f1419'
    },
    galaxy: {
      name: 'Galaxy',
      image: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      preview: '#1a0f2e'
    },
    abstract: {
      name: 'Abstract',
      image: 'https://images.unsplash.com/photo-1557683316-973673baf926?ixlib=rb-4.0.3&auto=format&fit=crop&w=2029&q=80',
      preview: '#2d1b3d'
    },
    minimal: {
      name: 'Minimal',
      image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      preview: '#f8f9fa'
    },
    ocean: {
      name: 'Ocean',
      image: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      preview: '#0c4a6e'
    },
    forest: {
      name: 'Forest',
      image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      preview: '#134e4a'
    },
    sunset: {
      name: 'Sunset',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      preview: '#ea580c'
    }
  } as const;

  // Predefined avatar options
  const avatarOptions = {
    default: {
      name: 'Default',
      url: null,
      color: '#6366f1'
    },
    avatar1: {
      name: 'Professional',
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      color: '#3b82f6'
    },
    avatar2: {
      name: 'Creative',
      url: 'https://images.unsplash.com/photo-1494790108755-2616b612b142?w=150&h=150&fit=crop&crop=face',
      color: '#ec4899'
    },
    avatar3: {
      name: 'Casual',
      url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      color: '#10b981'
    },
    avatar4: {
      name: 'Modern',
      url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      color: '#f59e0b'
    },
    avatar5: {
      name: 'Stylish',
      url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      color: '#8b5cf6'
    },
    avatar6: {
      name: 'Friendly',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
      color: '#ef4444'
    }
  } as const;

  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);

  const [allParticipants, setAllParticipants] = useState<Participant[]>([]);
  const [userName, setUserName] = useState('');
  const [isNamePromptOpen, setIsNamePromptOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [isHost, setIsHost] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // LiveKit integration state
  const [livekitToken, setLivekitToken] = useState<string>('placeholder-token');
  const [livekitServerUrl, setLivekitServerUrl] = useState<string>('wss://placeholder.livekit.cloud');

  // Add new state for media sync
  const [mediaState, setMediaState] = useState<{
    url: string | null;
    isYouTube: boolean;
    sourceText: string | null;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
  }>({
    url: null,
    isYouTube: false,    sourceText: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0
  });
  
  // Initialize LiveKit hook only after hydration to prevent SSR mismatch
  const livekit = useLiveKit({
    serverUrl: isHydrated ? livekitServerUrl : 'wss://placeholder.livekit.cloud',
    token: isHydrated ? livekitToken : 'placeholder-token',
    onConnected: () => {
      console.log('✅ LiveKit connected successfully');
      toast({
        title: "Connected",
        description: "Connected to collaboration service",
      });
    },
    onDisconnected: () => {
      console.log('❌ LiveKit disconnected');
      toast({
        variant: "destructive",
        title: "Disconnected",
        description: "Lost connection to collaboration service",
      });
    },    onError: (error) => {
      console.error('LiveKit error:', error);
      
      const errorMessage = error.message?.toLowerCase() || '';
      setLastConnectionError(error.message); // Track last error for auto-reconnection
      
      // Handle specific data channel errors with recovery mechanisms
      if (errorMessage.includes('datachannel') || errorMessage.includes('data channel')) {
        console.warn('🔧 DataChannel error detected, attempting recovery...', error);
        
        // For participants, DataChannel errors are often recoverable
        // The auto-reconnection system will handle this
        toast({
          variant: "destructive",
          title: "Connection Issue",
          description: "Experiencing connectivity issues, trying to reconnect...",
          duration: 3000,
        });
      } else if (errorMessage.includes('webrtc') || errorMessage.includes('ice')) {
        console.error('🌐 WebRTC/ICE error:', error);
        toast({
          variant: "destructive",
          title: "Network Error",
          description: "WebRTC connection failed. Check your network connection.",
          duration: 5000,
        });
      } else if (errorMessage.includes('token') || errorMessage.includes('auth')) {
        console.error('🔑 Authentication error:', error);
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Session expired. Please refresh the page.",
          duration: 5000,
        });
      } else {
        console.error('❌ General LiveKit error:', error);
        toast({
          variant: "destructive",
          title: "Connection Error",
          description: error.message || "An unexpected error occurred",
          duration: 4000,
        });
      }
    },
  });

  // --- Connection Health Monitoring ---
  useEffect(() => {
    if (!livekit.room) {
      setConnectionHealth('disconnected');
      return;
    }

    // Monitor connection health
    const monitorConnection = () => {
      if (livekit.isConnected) {
        setConnectionHealth('good');
        setReconnectionAttempts(0);
        setLastConnectionError(null);
      } else if (livekit.isConnecting) {
        setConnectionHealth('poor');
      } else {
        setConnectionHealth('disconnected');
      }
    };

    // Initial check
    monitorConnection();

    // Set up periodic monitoring
    connectionMonitorRef.current = setInterval(monitorConnection, 5000);

    return () => {
      if (connectionMonitorRef.current) {
        clearInterval(connectionMonitorRef.current);
        connectionMonitorRef.current = null;
      }
    };
  }, [livekit.room, livekit.isConnected, livekit.isConnecting]);

  // --- Auto-reconnection for DataChannel errors ---
  useEffect(() => {
    if (connectionHealth === 'disconnected' && 
        reconnectionAttempts < maxReconnectionAttempts && 
        lastConnectionError?.toLowerCase().includes('datachannel')) {
      
      const reconnectDelay = Math.min(2000 * Math.pow(2, reconnectionAttempts), 10000); // Exponential backoff
      
      console.log(`🔄 Attempting reconnection ${reconnectionAttempts + 1}/${maxReconnectionAttempts} in ${reconnectDelay}ms`);
      
      const reconnectTimer = setTimeout(async () => {
        try {
          setReconnectionAttempts(prev => prev + 1);
          await livekit.connectToRoom();
          console.log('✅ Reconnection successful');
        } catch (error) {
          console.error('🚫 Reconnection failed:', error);
          setLastConnectionError(error instanceof Error ? error.message : String(error));
        }
      }, reconnectDelay);

      return () => clearTimeout(reconnectTimer);
    }
  }, [connectionHealth, reconnectionAttempts, lastConnectionError, livekit.connectToRoom, maxReconnectionAttempts]);

  // --- LiveKit screen share event listeners (for all participants) ---
  useEffect(() => {
    if (!livekit.room) return;

    const handleTrackSubscribed = (
      track: RemoteTrack,
      publication: RemoteTrackPublication,
      participant: RemoteParticipant
    ) => {
      console.log('📺 Track subscribed:', { 
        source: track.source, 
        kind: track.kind, 
        participant: participant.identity 
      });
      
      if (track.source === Track.Source.ScreenShare && track.kind === 'video') {
        console.log('📺 Screen share track detected, attaching to video element');
        if (videoRef.current) {
          track.attach(videoRef.current);
          videoRef.current.classList.remove('hidden');
          videoRef.current.style.objectFit = 'contain';
          videoRef.current.style.backgroundColor = '#000';
          videoRef.current.style.width = '100%';
          videoRef.current.style.height = '100%';
          if (placeholderContentRef.current) placeholderContentRef.current.classList.add('hidden');
          if (mediaFrameRef.current) mediaFrameRef.current.classList.add('hidden');
          setMediaSourceText(`Screen shared by ${participant.name || participant.identity}`);
          setIsYouTubeVideo(false);
          setCurrentMediaUrl(null);
          console.log('✅ Screen share attached successfully');
        }
      }
    };
    
    const handleTrackUnsubscribed = (
      track: RemoteTrack,
      publication: RemoteTrackPublication,
      participant: RemoteParticipant
    ) => {
      console.log('📺 Track unsubscribed:', { 
        source: track.source, 
        kind: track.kind, 
        participant: participant.identity 
      });
      
      if (track.source === Track.Source.ScreenShare && track.kind === 'video') {
        console.log('📺 Screen share track removed, detaching from video element');
        if (videoRef.current) {
          track.detach();
          videoRef.current.classList.add('hidden');
          if (!currentMediaUrl && placeholderContentRef.current) placeholderContentRef.current.classList.remove('hidden');
          setMediaSourceText(null);
          console.log('✅ Screen share detached successfully');
        }
      }
    };

    // Handle LOCAL track published (for host to see their own screen share)
    const handleLocalTrackPublished = (publication: any, participant: any) => {
      console.log('📺 Local track published:', { 
        source: publication.source, 
        kind: publication.kind 
      });
      
      if (publication.source === Track.Source.ScreenShare && publication.kind === 'video' && publication.track) {
        console.log('📺 Local screen share track detected, attaching to video element for host');
        if (videoRef.current) {
          publication.track.attach(videoRef.current);
          videoRef.current.classList.remove('hidden');
          videoRef.current.style.objectFit = 'contain';
          videoRef.current.style.backgroundColor = '#000';
          videoRef.current.style.width = '100%';
          videoRef.current.style.height = '100%';
          if (placeholderContentRef.current) placeholderContentRef.current.classList.add('hidden');
          if (mediaFrameRef.current) mediaFrameRef.current.classList.add('hidden');
          setMediaSourceText("Your Screen (Live)");
          setIsYouTubeVideo(false);
          setCurrentMediaUrl(null);
          console.log('✅ Host screen share attached successfully');
        }
      }
    };

    // Handle LOCAL track unpublished (when host stops sharing)
    const handleLocalTrackUnpublished = (publication: any, participant: any) => {
      console.log('📺 Local track unpublished:', { 
        source: publication.source, 
        kind: publication.kind 
      });
      
      if (publication.source === Track.Source.ScreenShare && publication.kind === 'video') {
        console.log('📺 Local screen share track removed, detaching from video element');
        if (videoRef.current) {
          publication.track?.detach();
          videoRef.current.classList.add('hidden');
          if (!currentMediaUrl && placeholderContentRef.current) placeholderContentRef.current.classList.remove('hidden');
          setMediaSourceText(null);
          console.log('✅ Host screen share detached successfully');
        }
      }
    };
    
    livekit.room.on('trackSubscribed', handleTrackSubscribed);
    livekit.room.on('trackUnsubscribed', handleTrackUnsubscribed);
    livekit.room.on('localTrackPublished', handleLocalTrackPublished);
    livekit.room.on('localTrackUnpublished', handleLocalTrackUnpublished);
    
    return () => {
      livekit.room?.off('trackSubscribed', handleTrackSubscribed);
      livekit.room?.off('trackUnsubscribed', handleTrackUnsubscribed);
      livekit.room?.off('localTrackPublished', handleLocalTrackPublished);
      livekit.room?.off('localTrackUnpublished', handleLocalTrackUnpublished);
    };
  }, [livekit.room, currentMediaUrl]);

  const formatTime = (timeInSeconds: number): string => {
    if (isNaN(timeInSeconds) || !isFinite(timeInSeconds)) return "00:00";
    const totalSeconds = Math.floor(timeInSeconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSeconds = String(seconds).padStart(2, '0');

    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${paddedMinutes}:${paddedSeconds}`;
    }
    return `${paddedMinutes}:${paddedSeconds}`;
  };

  const stopMediaPlayback = useCallback(async () => {
    setCurrentMediaUrl(null);
    setIsYouTubeVideo(false);
    if (mediaFrameRef.current) {
      mediaFrameRef.current.src = 'about:blank';
      mediaFrameRef.current.classList.add('hidden');
    }
     if (placeholderContentRef.current && !screenStreamRef.current) {
      placeholderContentRef.current.classList.remove('hidden');
       if(videoRef.current) videoRef.current.classList.add('hidden');
    }
    setMediaSourceText(null);
    setVideoProgress(0);
    setCurrentTimeDisplay("00:00");
    setDurationDisplay("00:00");

    // Update Firebase state if host
    if (isHost) {
      const mediaStateRef = doc(db, 'rooms', roomId, 'media', 'state');
      await setDoc(mediaStateRef, {
        url: null,
        isYouTube: false,
        sourceText: null,
        isPlaying: false,
        currentTime: 0,
        duration: 0
      });
    }
  }, [isHost, roomId]);

  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.classList.add('hidden');
    }
    setIsScreenSharePlaying(false);
    setMediaSourceText(null);
    setVideoProgress(0);
    setCurrentTimeDisplay("00:00");
    setDurationDisplay("00:00");

    if (placeholderContentRef.current && !currentMediaUrl) {
      placeholderContentRef.current.classList.remove('hidden');
      if (mediaFrameRef.current) mediaFrameRef.current.classList.add('hidden');
    } else if (mediaFrameRef.current && currentMediaUrl) {
       mediaFrameRef.current.classList.remove('hidden');
       if (placeholderContentRef.current) placeholderContentRef.current.classList.add('hidden');
    }  }, [currentMediaUrl]);  // Function to get LiveKit token from API route
  const getLivekitToken = useCallback(async () => {
    if (!userName || !roomId) {
      console.warn('Cannot get LiveKit token: missing userName or roomId');
      return;
    }
    
    try {
      console.log('🎫 Getting LiveKit token from Next.js API route...', {
        roomId,
        userName
      });
      
      // For local development, check if we should use a different endpoint
      const tokenEndpoint = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3001/api/token' // Use Express backend in development
        : '/api/livekit/token'; // Use Next.js API route in production
      
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room: roomId,
          roomName: roomId, // Support both parameter formats
          username: userName,
          participantName: userName, // Support both parameter formats
          identity: userName,
          isHost: isHost,
        }),
      });

      // Parse the response regardless of status to see error details
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Token API error response:', data);
        throw new Error(`Failed to get token: ${response.status} ${response.statusText} - ${data.error || 'Unknown error'}`);
      }
        if (!data.token) {
        throw new Error('Token API returned success but no token was provided');
      }
      
      if (typeof data.token !== 'string') {
        throw new Error('Token API returned success but token is not a string: ' + JSON.stringify(data));
      }
        
      console.log('✅ Received LiveKit token from API:', {
        hasToken: !!data.token,
        tokenLength: data.token.length,
        tokenPreview: data.token.substring(0, 20) + '...',
        wsUrl: data.wsUrl
      });
      
      // Set the token and server URL
      setLivekitToken(data.token);
      setLivekitServerUrl(data.wsUrl || 'wss://screenshare-3gbbe0by.livekit.cloud');
      return data.token; // Return the token for convenience
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Failed to get LiveKit token:', errorMessage);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: `Failed to connect to LiveKit: ${errorMessage}`,
      });
    }
  }, [userName, roomId, isHost, toast]);

 useEffect(() => {
    const video = videoRef.current;
    if (!video || mediaSourceText !== "Your Screen") {
      setIsScreenSharePlaying(false); // Reset if not screen sharing
      return;
    }

    const handlePlay = () => setIsScreenSharePlaying(true);
    const handlePause = () => setIsScreenSharePlaying(false);
    
    const handleLoadedMetadata = () => {
      if (isFinite(video.duration)) {
        setDurationDisplay(formatTime(video.duration));
        // Mute by default if audio is present on screen share, or use isScreenShareMuted
        // video.muted = true; // Example: mute by default
        // setIsScreenShareMuted(true);
        setScreenShareVolume(video.muted ? 0 : video.volume);
        setIsScreenShareMuted(video.muted);

      } else {
        setDurationDisplay("Live"); // Or some other indicator for indeterminate duration
      }
      setIsScreenSharePlaying(!video.paused); // Set initial playing state
    };

    const handleTimeUpdate = () => {
      if (!isSeeking && isFinite(video.currentTime) && isFinite(video.duration) && video.duration > 0) {
        setVideoProgress((video.currentTime / video.duration) * 100);
        setCurrentTimeDisplay(formatTime(video.currentTime));
      } else if (!isFinite(video.duration)) {
         setCurrentTimeDisplay(formatTime(video.currentTime)); // For live or indeterminate streams
      }
    };
    
    const handleVolumeChange = () => {
      setScreenShareVolume(video.muted ? 0 : video.volume);
      setIsScreenShareMuted(video.muted);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('volumechange', handleVolumeChange);
    
    // Set initial state if video is already loaded (e.g., if stream was just attached)
    if (video.readyState >= video.HAVE_METADATA) {
        handleLoadedMetadata();
        handleTimeUpdate();
    }


    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [mediaSourceText, isSeeking]); // Re-run if mediaSourceText changes (e.g. screen share starts/stops)

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Use absolute URL with the correct host for production deployment
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
      const roomUrl = `${baseUrl}/room/${roomId}`;
      setRoomLink(roomUrl);
    }
    
    return () => {
      if (screenStreamRef.current) {
        stopScreenShare();
      }
    };
  }, [roomId, stopScreenShare]);

  useEffect(() => {
    if (messages.length > 1 && messages[messages.length - 1].user !== 'System') {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.text.includes('joined the room')) {
        toast({
          title: 'New Participant',
          description: `${lastMsg.user} has joined the room!`,
        });
      }
    }  }, [messages, toast]);

  // Get LiveKit token when user name is set
  useEffect(() => {
    if (userName && roomId) {
      getLivekitToken();
    }
  }, [userName, roomId, isHost, getLivekitToken]);
  // Add current user to the room's participants list
  useEffect(() => {
    if (!userName) return;
    
    const userRef = doc(db, 'rooms', roomId, 'participants', `${userName}_${isHost ? 'host' : 'guest'}_${roomId}`);
    
    // Use custom avatar if available, otherwise fall back to default
    let avatarUrl = userAvatar;
    if (!avatarUrl || avatarUrl === '') {
      avatarUrl = `https://placehold.co/80x80.png?text=${userName.charAt(0).toUpperCase()}`;
    }
    
    const userData = {
      id: `${userName}_${isHost ? 'host' : 'guest'}_${roomId}`,
      name: userName,
      avatarUrl: avatarUrl,
      hint: 'person avatar',
      isHost: isHost
    };
    setDoc(userRef, userData);

    // Listen for changes to the participants list
    const unsub = onSnapshot(collection(db, 'rooms', roomId, 'participants'), (snapshot) => {
      const participants = snapshot.docs.map(doc => doc.data() as Participant);
      setAllParticipants(participants);
    });

    // Remove user from participants list on unmount
    return () => {
      deleteDoc(userRef);
      unsub();
    };  }, [roomId, userName, isHost, userAvatar]);

  // Update public room listing when participants change
  useEffect(() => {
    if (roomVisibility === 'Public' && allParticipants.length > 0) {
      const updatePublicRoom = async () => {
        try {
          const publicRoomRef = doc(db, 'publicRooms', roomId);
          await setDoc(publicRoomRef, {
            id: roomId,
            name: roomName,
            visibility: 'Public',
            participantCount: allParticipants.length,
            updatedAt: new Date(),
            hostName: userName
          }, { merge: true });
        } catch (error) {
          console.error("Error updating public room:", error);
        }
      };
      
      updatePublicRoom();
    }
  }, [allParticipants, roomVisibility, roomId, userName, roomName]);

  // Add useEffect for real-time message updates
  useEffect(() => {
    if (!roomId) return;

    // Listen for messages in real-time
    const messagesRef = collection(db, 'rooms', roomId, 'messages');
    const unsub = onSnapshot(messagesRef, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as Message[];
      
      // Sort messages by timestamp
      newMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      setMessages(newMessages);
    });

    return () => unsub();
  }, [roomId]);

  // Add auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !userName) return;

    try {
      const messageRef = doc(collection(db, 'rooms', roomId, 'messages'));
      
      // Use custom avatar if available, otherwise fall back to default
      let messageAvatar = userAvatar;
      if (!messageAvatar || messageAvatar === '') {
        messageAvatar = `https://placehold.co/40x40.png?text=${userName.charAt(0).toUpperCase()}`;
      }
      
      await setDoc(messageRef, {
        id: messageRef.id,
        user: userName,
        text: chatInput.trim(),
        timestamp: new Date(),
        avatar: messageAvatar
      });

      setChatInput('');
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message. Please try again.",
      });
    }
  };const getYouTubeEmbedUrl = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}?autoplay=1&controls=1&rel=0&showinfo=0&modestbranding=1&enablejsapi=1&origin=${window.location.origin}&playsinline=1&fs=1&iv_load_policy=3&widgetid=1&events=onStateChange&cc_load_policy=0`;
    }
    return null;
  };

  // Update useEffect for media sync to handle controls
  useEffect(() => {
    if (!roomId) return;

    const mediaStateRef = doc(db, 'rooms', roomId, 'media', 'state');
    const unsub = onSnapshot(mediaStateRef, (doc) => {
      const data = doc.data();
      if (data) {
        // Update local state
        setMediaState({
          url: data.url,
          isYouTube: data.isYouTube,
          sourceText: data.sourceText,
          isPlaying: data.isPlaying || false,
          currentTime: data.currentTime || 0,
          duration: data.duration || 0
        });

        // Update UI based on media state
        if (data.url) {
          if (data.isYouTube && mediaFrameRef.current) {
            const iframe = mediaFrameRef.current;            // Set the source first
            if (iframe.src !== data.url) {
              iframe.src = data.url;
              
              // Initialize YouTube API connection
              setTimeout(() => {
                iframe.contentWindow?.postMessage('{"event":"listening","id":"kosmi"}', '*');
              }, 1000);
            }
            iframe.classList.remove('hidden');
            if (placeholderContentRef.current) placeholderContentRef.current.classList.add('hidden');
            if (videoRef.current) videoRef.current.classList.add('hidden');
            setCurrentMediaUrl(data.url);
            setIsYouTubeVideo(true);
            setMediaSourceText(data.sourceText);

            // Then handle controls
            if (data.isPlaying) {
              iframe.contentWindow?.postMessage(JSON.stringify({
                event: 'command',
                func: 'playVideo',
                args: ''
              }), { targetOrigin: '*' });
            } else {
              iframe.contentWindow?.postMessage(JSON.stringify({
                event: 'command',
                func: 'pauseVideo',
                args: ''
              }), { targetOrigin: '*' });
            }
            if (data.currentTime) {
              iframe.contentWindow?.postMessage(JSON.stringify({
                event: 'command',
                func: 'seekTo',
                args: [data.currentTime, true]
              }), { targetOrigin: '*' });
            }
          } else if (videoRef.current) {
            // For regular video elements
            videoRef.current.src = data.url;
            videoRef.current.classList.remove('hidden');
            if (mediaFrameRef.current) mediaFrameRef.current.classList.add('hidden');
            if (placeholderContentRef.current) placeholderContentRef.current.classList.add('hidden');
            setCurrentMediaUrl(data.url);
            setIsYouTubeVideo(false);
            setMediaSourceText(data.sourceText);

            // Handle controls
            if (data.isPlaying) {
              videoRef.current.play().catch(console.error);
            } else {
              videoRef.current.pause();
            }
            if (data.currentTime) {
              videoRef.current.currentTime = data.currentTime;
            }
          }
        } else {
          stopMediaPlayback();
        }
      }
    });

    return () => unsub();
  }, [roomId]);
  // Add YouTube iframe API ready handler
  useEffect(() => {
    const handleYouTubeMessage = (event: MessageEvent) => {
      if (event.data && typeof event.data === 'string') {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'onStateChange') {
            // Update local state when YouTube player state changes
            const isPlaying = data.info === 1; // 1 is playing, 2 is paused
            if (isHost) {
              const mediaStateRef = doc(db, 'rooms', roomId, 'media', 'state');
              setDoc(mediaStateRef, {
                ...mediaState,
                isPlaying
              }, { merge: true });
            }          } else if (data.event === 'onReady') {
            // When the iframe is ready, sync with the current state
            if (mediaState.isPlaying) {
              event.source?.postMessage(JSON.stringify({
                event: 'command',
                func: 'playVideo',
                args: ''
              }), { targetOrigin: '*' });
            }
            if (mediaState.currentTime) {
              event.source?.postMessage(JSON.stringify({
                event: 'command',
                func: 'seekTo',
                args: [mediaState.currentTime, true]
              }), { targetOrigin: '*' });
            }
            // Set initial volume if we have a stored volume
            if (screenShareVolume > 0) {
              event.source?.postMessage(JSON.stringify({
                event: 'command',
                func: 'setVolume',
                args: [screenShareVolume * 100]
              }), { targetOrigin: '*' });
            }
            // Request current volume info
            event.source?.postMessage(JSON.stringify({
              event: 'listening',
              id: 'volumeListener',
              channel: 'widget'
            }), { targetOrigin: '*' });
            
            // Start requesting time updates
            setTimeout(() => {
              event.source?.postMessage(JSON.stringify({
                event: 'command',
                func: 'getCurrentTime',
                args: ''
              }), { targetOrigin: '*' });
              
              event.source?.postMessage(JSON.stringify({
                event: 'command',
                func: 'getDuration',
                args: ''
              }), { targetOrigin: '*' });
              
              // Test captions availability
              console.log('🎬 Testing captions availability...');
              event.source?.postMessage(JSON.stringify({
                event: 'command',
                func: 'getOptions',
                args: ['captions']
              }), { targetOrigin: '*' });
            }, 1000);          } else if (data.event === 'infoDelivery') {
            if (data.info && data.info.volume !== undefined) {
              // Handle volume changes from YouTube player
              const youtubeVolume = data.info.volume / 100; // Convert from 0-100 to 0-1
              const isMuted = data.info.muted || youtubeVolume === 0;
              
              setScreenShareVolume(youtubeVolume);
              setIsScreenShareMuted(isMuted);
            }
            
            if (data.info && typeof data.info.currentTime === 'number') {
              // Handle current time updates
              const currentTime = data.info.currentTime;
              setCurrentTimeDisplay(formatTime(currentTime));
              
              if (typeof data.info.duration === 'number') {
                const duration = data.info.duration;
                setDurationDisplay(formatTime(duration));
                const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
                setVideoProgress(progress);
              }
            }
            
            if (data.info && typeof data.info.duration === 'number') {
              // Handle duration-only updates
              const duration = data.info.duration;
              setDurationDisplay(formatTime(duration));
            }
          } else if (data.info && typeof data.info === 'number') {
            // Handle direct number responses (getCurrentTime and getDuration responses)
            if (data.event === 'getCurrentTime') {
              const currentTime = data.info;
              setCurrentTimeDisplay(formatTime(currentTime));
            } else if (data.event === 'getDuration') {
              const duration = data.info;
              setDurationDisplay(formatTime(duration));
            }
          } else if (data.event === 'command' && data.info) {
            // Handle command responses (including captions)
            console.log('🎬 YouTube command response:', data);
            
            // Check for captions module status
            if (data.func === 'loadModule' && data.args && data.args[0] === 'captions') {
              console.log('🎬 Captions module loaded successfully');
              setAreCaptionsEnabled(true);
            } else if (data.func === 'unloadModule' && data.args && data.args[0] === 'captions') {
              console.log('🎬 Captions module unloaded successfully');
              setAreCaptionsEnabled(false);
            }
          }
        } catch (e) {
          // Not a JSON message
        }
      }
    };

    window.addEventListener('message', handleYouTubeMessage);
    return () => window.removeEventListener('message', handleYouTubeMessage);
  }, [isHost, roomId, mediaState]);

  // Add video control handlers
  const handlePlayPause = async () => {
    if (!isHost) return; // Only host can control playback

    const newIsPlaying = !mediaState.isPlaying;
    
    // Update local state first for immediate feedback
    if (isYouTubeVideo && mediaFrameRef.current) {
      const iframe = mediaFrameRef.current;
      if (newIsPlaying) {
        iframe.contentWindow?.postMessage(JSON.stringify({
          event: 'command',
          func: 'playVideo',
          args: ''
        }), { targetOrigin: '*' });
      } else {
        iframe.contentWindow?.postMessage(JSON.stringify({
          event: 'command',
          func: 'pauseVideo',
          args: ''
        }), { targetOrigin: '*' });
      }
    } else if (videoRef.current) {
      if (newIsPlaying) {
        videoRef.current.play().catch(console.error);
      } else {
        videoRef.current.pause();
      }
    }

    // Update local state
    setMediaState(prev => ({
      ...prev,
      isPlaying: newIsPlaying
    }));

    // Then sync to Firebase
    const mediaStateRef = doc(db, 'rooms', roomId, 'media', 'state');
    await setDoc(mediaStateRef, {
      ...mediaState,
      isPlaying: newIsPlaying
    }, { merge: true });
  };  // Single handleProgressChange function with sync functionality
  const handleProgressChange = async (value: number[]) => {
    if (!isHost) return; // Only host can control seeking
    
    if (isYouTubeVideo && mediaFrameRef.current) {
      // Handle YouTube video seeking
      // First explicitly request the duration to ensure we have accurate data
      mediaFrameRef.current.contentWindow?.postMessage(JSON.stringify({
        event: 'command',
        func: 'getDuration',
        args: []
      }), '*');
      
      // Need a small delay to ensure we've received duration response
      setTimeout(() => {
        let duration = 0;
        
        // Try to parse duration from display
        const durationParts = durationDisplay.split(':').map(part => parseInt(part, 10));
        if (durationParts.length === 2) {
          duration = durationParts[0] * 60 + durationParts[1]; // mm:ss
        } else if (durationParts.length === 3) {
          duration = durationParts[0] * 3600 + durationParts[1] * 60 + durationParts[2]; // hh:mm:ss
        }
        
        console.log(`🎯 Seeking YouTube video. Progress: ${value[0]}%, Duration: ${duration}s`);
        
        if (duration > 0) {
          const newTime = Math.floor((value[0] / 100) * duration);
          console.log(`🎯 Seeking to ${newTime}s (${formatTime(newTime)})`);
          
          // Using setTimeout ensures better communication with YouTube iframe
          setTimeout(() => {
            if (mediaFrameRef.current) {
              mediaFrameRef.current.contentWindow?.postMessage(JSON.stringify({
                event: 'command',
                func: 'seekTo',
                args: [newTime, true]
              }), '*');
            }
          }, 50);
          
          // Update UI immediately for better perceived performance
          setCurrentTimeDisplay(formatTime(newTime));
          setVideoProgress(value[0]);
          
          // Sync seek position
          const mediaStateRef = doc(db, 'rooms', roomId, 'media', 'state');
          setDoc(mediaStateRef, {
            ...mediaState,
            currentTime: newTime
          }, { merge: true });
        } else {
          console.warn("⚠️ Could not determine YouTube video duration for seeking");
        }
      }, 100);
    } else if (videoRef.current && screenStreamRef.current && isFinite(videoRef.current.duration)) {
      // Handle regular video seeking
      const newTime = (value[0] / 100) * videoRef.current.duration;
      videoRef.current.currentTime = newTime;
      setCurrentTimeDisplay(formatTime(newTime));
      setVideoProgress(value[0]);
      
      // Sync seek position
      const mediaStateRef = doc(db, 'rooms', roomId, 'media', 'state');
      await setDoc(mediaStateRef, {
        ...mediaState,
        currentTime: newTime
      }, { merge: true });
    }
  };
  // Update handlePlayUrl to include initial control state
  const handlePlayUrl = async (url: string) => {
    if (screenStreamRef.current) {
      stopScreenShare();
    }
    
    const embedUrl = getYouTubeEmbedUrl(url);
    if (embedUrl) {
      // Update local state
      setCurrentMediaUrl(embedUrl);
      setIsYouTubeVideo(true);
      if (mediaFrameRef.current) {
        // Clear any existing content
        mediaFrameRef.current.src = 'about:blank';
        
        // Set new URL after a short delay to ensure clean initialization
        setTimeout(() => {
          if (mediaFrameRef.current) {
            mediaFrameRef.current.src = embedUrl;
            mediaFrameRef.current.classList.remove('hidden');
            
            // Initialize YouTube API after iframe loads
            mediaFrameRef.current.onload = () => {
              console.log("🎬 YouTube iframe loaded, initializing API");
              setTimeout(() => {
                mediaFrameRef.current?.contentWindow?.postMessage('{"event":"listening","id":"kosmi"}', '*');
              }, 500);
            };
          }
        }, 50);      }
      if (placeholderContentRef.current) placeholderContentRef.current.classList.add('hidden');
      if (videoRef.current) videoRef.current.classList.add('hidden');
      setMediaSourceText(null);

      // Update Firebase state if host
      if (isHost) {
        const mediaStateRef = doc(db, 'rooms', roomId, 'media', 'state');
        await setDoc(mediaStateRef, {
          url: embedUrl,
          isYouTube: true,
          sourceText: null,
          isPlaying: true,
          currentTime: 0,
          duration: 0
        });
      }
    } else {
      // For non-YouTube URLs
      setCurrentMediaUrl(url);
      setIsYouTubeVideo(false);
      if (mediaFrameRef.current) {
        mediaFrameRef.current.src = url;
        mediaFrameRef.current.classList.remove('hidden');
      }
      if (placeholderContentRef.current) placeholderContentRef.current.classList.add('hidden');
      if (videoRef.current) videoRef.current.classList.add('hidden');
      try {
        const hostname = new URL(url).hostname;
        setMediaSourceText(hostname);
        
        // Update Firebase state if host
        if (isHost) {
          const mediaStateRef = doc(db, 'rooms', roomId, 'media', 'state');
          await setDoc(mediaStateRef, {
            url: url,
            isYouTube: false,
            sourceText: hostname,
            isPlaying: true,
            currentTime: 0,
            duration: 0
          });
        }
      } catch (e) {
        setMediaSourceText("External Link");
        
        // Update Firebase state if host
        if (isHost) {
          const mediaStateRef = doc(db, 'rooms', roomId, 'media', 'state');
          await setDoc(mediaStateRef, {
            url: url,
            isYouTube: false,
            sourceText: "External Link",
            isPlaying: true,
            currentTime: 0,
            duration: 0
          });
        }
      }
    }
    setIsSelectMediaModalOpen(false);
  };  const handleShareScreen = async () => {
    console.log('handleShareScreen called');
    
    if (isSelectMediaModalOpen) setIsSelectMediaModalOpen(false);
    if (currentMediaUrl) stopMediaPlayback();    // Check if already screen sharing
    if (livekit.isScreenSharing) {
      console.log('Stopping existing LiveKit screen share');
      
      // Stop LiveKit screen share (this will trigger localTrackUnpublished event)
      await livekit.stopScreenShare();
      
      return;
    }

    // Check if connected to LiveKit
    if (!livekit.isConnected) {
      toast({
        variant: "destructive",
        title: "Not Connected",
        description: "Connecting to screen sharing service...",
      });
      
      // Try to get token and connect
      await getLivekitToken();
      
      // Wait a moment for connection
      setTimeout(async () => {
        if (livekit.isConnected) {
          await handleShareScreen(); // Retry after connection
        } else {
          toast({
            variant: "destructive",
            title: "Connection Failed",
            description: "Could not connect to screen sharing service",
          });
        }
      }, 2000);
      return;
    }    try {
      console.log('Starting LiveKit screen share...');
      
      // Start screen sharing with LiveKit (this will trigger localTrackPublished event for host to see)
      await livekit.startScreenShare();
      
      console.log('LiveKit screen share started successfully - host will see via localTrackPublished event');
      
      toast({
        title: "Screen Share Started",
        description: "Your screen is now being shared with all participants",
      });

    } catch (err: any) {
      console.error("Error sharing screen:", err);
      
      // Provide better error messages
      let errorMessage = "Could not start screen sharing. Please ensure permission is granted.";
      
      if (err?.name === 'NotAllowedError') {
        errorMessage = "Screen sharing permission was denied. Please allow access and try again.";
      } else if (err?.name === 'NotFoundError') {
        errorMessage = "No screen available for sharing.";
      } else if (err?.name === 'NotSupportedError') {
        errorMessage = "Screen sharing is not supported in this browser.";
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      toast({
        variant: "destructive",
        title: "Screen Share Failed",
        description: errorMessage,
      });
      
      if (videoRef.current) videoRef.current.classList.add('hidden');
      
      if (currentMediaUrl && mediaFrameRef.current) {
         mediaFrameRef.current.classList.remove('hidden');
         if(placeholderContentRef.current) placeholderContentRef.current.classList.add('hidden');
      } else if (placeholderContentRef.current) {
        placeholderContentRef.current.classList.remove('hidden');
        if(mediaFrameRef.current) mediaFrameRef.current.classList.add('hidden');
      }
      setMediaSourceText(null);
    }
  };

  const handleCopyLink = () => {
    if (roomLink) {
      navigator.clipboard.writeText(roomLink)
        .then(() => {
          toast({
            title: "Link Copied!",
            description: "Room link copied to clipboard.",
          });
        })
        .catch(err => {
          console.error("Failed to copy link: ", err);
          toast({
            variant: "destructive",
            title: "Copy Failed",
            description: "Could not copy link to clipboard.",
          });
        });
    }
  };

  const handleStopMedia = () => {
    if (screenStreamRef.current) {
      stopScreenShare();
    } else if (currentMediaUrl) {
      stopMediaPlayback();
    }
  };

  const toggleScreenSharePlayPause = () => {
    if (videoRef.current && screenStreamRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(e => console.error("Play error:", e));
      } else {
        videoRef.current.pause();
      }
      // State will be updated by 'play'/'pause' event listeners
    }
  };
  const toggleScreenShareMute = () => {
    if (isYouTubeVideo && mediaFrameRef.current) {
      // Handle YouTube video mute/unmute
      const iframe = mediaFrameRef.current;
      if (isScreenShareMuted) { // Currently muted, so unmute
        iframe.contentWindow?.postMessage(JSON.stringify({
          event: 'command',
          func: 'unMute',
          args: ''
        }), { targetOrigin: '*' });
        // Restore previous volume or set to default if previous was 0
        const volumeToRestore = previousVolume > 0 ? previousVolume * 100 : 50;
        iframe.contentWindow?.postMessage(JSON.stringify({
          event: 'command',
          func: 'setVolume',
          args: [volumeToRestore]
        }), { targetOrigin: '*' });
        setScreenShareVolume(volumeToRestore / 100);
        setIsScreenShareMuted(false);
      } else { // Currently unmuted, so mute
        setPreviousVolume(screenShareVolume); // Store current volume
        iframe.contentWindow?.postMessage(JSON.stringify({
          event: 'command',
          func: 'mute',
          args: ''
        }), { targetOrigin: '*' });
        setScreenShareVolume(0);
        setIsScreenShareMuted(true);
      }
    } else if (videoRef.current && screenStreamRef.current) {
      const currentlyMuted = videoRef.current.muted;
      if (currentlyMuted) { // Unmuting
        videoRef.current.muted = false;
        // Restore previous volume or set to default if previous was 0
        videoRef.current.volume = previousVolume > 0 ? previousVolume : 0.5;
        // setScreenShareVolume(previousVolume > 0 ? previousVolume : 0.5); // Handled by volumechange event
      } else { // Muting
        setPreviousVolume(videoRef.current.volume); // Store current volume
        videoRef.current.muted = true;
        // setScreenShareVolume(0); // Handled by volumechange event
      }
      // setIsScreenShareMuted(!currentlyMuted); // Handled by volumechange event
    }
  };
    const handleVolumeChange = (newVolumeArray: number[]) => {
    const newVolume = newVolumeArray[0];
    
    if (isYouTubeVideo && mediaFrameRef.current) {
      // Handle YouTube video volume
      const iframe = mediaFrameRef.current;
      const youtubeVolume = newVolume * 100; // YouTube expects 0-100
      
      iframe.contentWindow?.postMessage(JSON.stringify({
        event: 'command',
        func: 'setVolume',
        args: [youtubeVolume]
      }), { targetOrigin: '*' });
      
      // Also handle mute/unmute
      if (newVolume === 0) {
        iframe.contentWindow?.postMessage(JSON.stringify({
          event: 'command',
          func: 'mute',
          args: ''
        }), { targetOrigin: '*' });
        setIsScreenShareMuted(true);
      } else {
        iframe.contentWindow?.postMessage(JSON.stringify({
          event: 'command',
          func: 'unMute',
          args: ''
        }), { targetOrigin: '*' });
        setIsScreenShareMuted(false);
      }
      
      setScreenShareVolume(newVolume);
    } else if (videoRef.current && screenStreamRef.current) {
      // Handle regular video volume
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
      // State updates (screenShareVolume, isScreenShareMuted) are handled by the 'volumechange' event listener
    }
  };  // Handler to toggle YouTube captions
  const handleToggleCaptions = () => {
    if (!isYouTubeVideo || !mediaFrameRef.current) return;
    const iframe = mediaFrameRef.current;
    
    console.log('🎬 Toggling captions. Current state:', areCaptionsEnabled);
    
    if (!areCaptionsEnabled) {
      // Turn ON captions - try multiple methods
      console.log('🎬 Turning ON captions');
      
      // Method 1: Try using setOption for captions
      iframe.contentWindow?.postMessage(JSON.stringify({
        event: 'command',
        func: 'setOption',
        args: ['captions', 'track', {'languageCode': 'en'}]
      }), '*');
      
      // Method 2: loadModule approach
      iframe.contentWindow?.postMessage(JSON.stringify({
        event: 'command',
        func: 'loadModule',
        args: ['captions']
      }), '*');
      
      // Method 3: Try setting cc options
      iframe.contentWindow?.postMessage(JSON.stringify({
        event: 'command',
        func: 'setOption',
        args: ['cc', 'fontSize', 1]
      }), '*');
      
      // Method 4: Try enabling through cc_load_policy simulation
      iframe.contentWindow?.postMessage(JSON.stringify({
        event: 'command', 
        func: 'setOption',
        args: ['cc', 'displaySettings', {'windowColor': 0, 'windowOpacity': 0}]
      }), '*');
      
      setAreCaptionsEnabled(true);
    } else {
      // Turn OFF captions
      console.log('🎬 Turning OFF captions');
      
      // Method 1: unloadModule
      iframe.contentWindow?.postMessage(JSON.stringify({
        event: 'command',
        func: 'unloadModule',
        args: ['captions']
      }), '*');
      
      // Method 2: setOption to disable
      iframe.contentWindow?.postMessage(JSON.stringify({
        event: 'command',
        func: 'setOption',
        args: ['captions', 'track', {}]
      }), '*');
      
      setAreCaptionsEnabled(false);
    }
  };
  const handleToggleFullscreen = () => {
    // When media is active, use the video container for fullscreen
    const elem = isMediaActive ? videoContainerRef.current : mainMediaContainerRef.current;
    if (!elem) return;

    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Controls auto-hide functionality
  const resetControlsTimer = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const handleMouseEnter = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
  };

  const handleMouseLeave = () => {
    resetControlsTimer();
  };

  const handleMouseMove = () => {
    resetControlsTimer();
  };

  const isMediaActive = !!(currentMediaUrl || screenStreamRef.current);
  const isScreenShareActive = !!screenStreamRef.current;

  // Reset captions state when media changes
  useEffect(() => {
    setAreCaptionsEnabled(false);
  }, [currentMediaUrl, isYouTubeVideo]);

  // Initialize controls timer when media becomes active
  useEffect(() => {
    if (isMediaActive) {
      resetControlsTimer();
    } else {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      setShowControls(true);
    }
    
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isMediaActive]);

  // Handle fullscreen state changes for proper video container styling
  useEffect(() => {
    const handleFullscreenChange = () => {
      const videoContainer = videoContainerRef.current;
      if (!videoContainer) return;

      if (document.fullscreenElement === videoContainer) {
        // In fullscreen mode - make video container fill the screen
        videoContainer.style.width = '100vw';
        videoContainer.style.height = '100vh';
        videoContainer.style.maxWidth = 'none';
        videoContainer.style.aspectRatio = 'unset';
        videoContainer.style.borderRadius = '0';
        videoContainer.style.border = 'none';
      } else {
        // Exit fullscreen - restore original styles
        videoContainer.style.width = '';
        videoContainer.style.height = '';
        videoContainer.style.maxWidth = '';
        videoContainer.style.aspectRatio = '';
        videoContainer.style.borderRadius = '';
        videoContainer.style.border = '';
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Check if user is the first participant and set up initial state
  useEffect(() => {
    const checkFirstParticipant = async () => {
      const participantsRef = collection(db, 'rooms', roomId, 'participants');
      const snapshot = await getDocs(participantsRef);
      
      if (snapshot.empty) {
        // This is the first participant (room creator)
        setIsHost(true);
        const defaultName = 'Host';
        setUserName(defaultName);
        if (typeof window !== 'undefined') {
          localStorage.setItem('vh_userName', defaultName);
        }
      } else {
        // This is a joining participant
        const storedName = typeof window !== 'undefined' ? localStorage.getItem('vh_userName') : '';
        if (storedName) {
          setUserName(storedName);
        } else {
          setIsNamePromptOpen(true);
        }
      }
    };
    
    checkFirstParticipant();
  }, [roomId]);

  // Handle name submit
  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      setUserName(nameInput.trim());
      if (typeof window !== 'undefined') {
        localStorage.setItem('vh_userName', nameInput.trim());
      }
      setIsNamePromptOpen(false);
    }  };

  // Avatar handling functions
  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please select an image file.",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUserAvatar(result);
        setSelectedAvatarOption('custom');
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('vh_userAvatar', result);
          localStorage.setItem('vh_avatarOption', 'custom');
        }
        
        toast({
          title: "Avatar updated",
          description: "Your avatar has been updated successfully.",
        });
      };
      reader.readAsDataURL(file);
    }
    // Reset the input
    event.target.value = '';
  };

  const handleAvatarSelect = (optionKey: string) => {
    setSelectedAvatarOption(optionKey);
    
    if (optionKey === 'default') {
      setUserAvatar('');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('vh_userAvatar');
        localStorage.setItem('vh_avatarOption', 'default');
      }
    } else if (optionKey !== 'custom') {
      const selectedOption = avatarOptions[optionKey as keyof typeof avatarOptions];
      if (selectedOption && selectedOption.url) {
        setUserAvatar(selectedOption.url);
        if (typeof window !== 'undefined') {
          localStorage.setItem('vh_userAvatar', selectedOption.url);
          localStorage.setItem('vh_avatarOption', optionKey);
        }
      }
    }
    
    toast({
      title: "Avatar updated",
      description: "Your avatar has been updated successfully.",
    });
  };

  const getCurrentAvatarUrl = () => {
    if (userAvatar && userAvatar !== '') {
      return userAvatar;
    }    return `https://placehold.co/80x80.png?text=${userName.charAt(0).toUpperCase()}`;
  };  // Handle room settings modal state
  const handleRoomSettingsOpen = (view: 'main' | 'appearance' | 'avatar' | 'roomname' | 'security' = 'main') => {
    setRoomSettingsView(view);
    setIsRoomSettingsOpen(true);
  };
  const handleRoomSettingsClose = () => {
    setIsRoomSettingsOpen(false);
    setRoomSettingsView('main');
    setIsEditingRoomName(false);
    setEditingRoomName('');
  };

  // Room name editing functions
  const handleEditRoomName = () => {
    setEditingRoomName(roomName);
    setIsEditingRoomName(true);
  };
  const handleSaveRoomName = async () => {
    if (editingRoomName.trim() && editingRoomName.trim() !== roomName) {
      try {
        const newRoomName = editingRoomName.trim();
        
        // Save to Firebase
        const roomRef = doc(db, 'rooms', roomId);
        await setDoc(roomRef, { 
          name: newRoomName,
          updatedAt: new Date()
        }, { merge: true });

        // Update public rooms collection if room is public
        if (roomVisibility === 'Public') {
          const publicRoomRef = doc(db, 'publicRooms', roomId);
          await setDoc(publicRoomRef, {
            name: newRoomName,
            updatedAt: new Date()
          }, { merge: true });
        }

        // Update local state
        setRoomName(newRoomName);
        
        // Update document title
        if (typeof document !== 'undefined') {
          document.title = `${newRoomName} - VideoHub`;
        }
        
        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(`vh_roomName_${roomId}`, newRoomName);
        }

        toast({
          title: "Room name updated",
          description: "The room name has been updated successfully.",
        });
      } catch (error) {
        console.error("Error updating room name:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update room name. Please try again.",
        });
      }
    }
    setIsEditingRoomName(false);
    setEditingRoomName('');
  };
  const handleCancelEditRoomName = () => {
    setIsEditingRoomName(false);
    setEditingRoomName('');
  };
  // Room visibility toggle function
  const handleToggleVisibility = async () => {
    const newVisibility = roomVisibility === 'Private' ? 'Public' : 'Private';
    
    try {
      // Save to Firebase
      const roomRef = doc(db, 'rooms', roomId);
      await setDoc(roomRef, { 
        visibility: newVisibility,
        updatedAt: new Date(),
        name: roomName,
        createdAt: new Date(), // Add creation date for public listings
        participantCount: allParticipants.length
      }, { merge: true });

      // If making room public, add to public rooms collection
      if (newVisibility === 'Public') {
        const publicRoomRef = doc(db, 'publicRooms', roomId);
        await setDoc(publicRoomRef, {
          id: roomId,
          name: roomName,
          visibility: 'Public',
          participantCount: allParticipants.length,
          createdAt: new Date(),
          updatedAt: new Date(),
          hostName: userName
        });
      } else {
        // If making room private, remove from public rooms collection
        const publicRoomRef = doc(db, 'publicRooms', roomId);
        await deleteDoc(publicRoomRef);
      }

      // Update local state
      setRoomVisibility(newVisibility);
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(`vh_roomVisibility_${roomId}`, newVisibility);
      }

      toast({
        title: "Room visibility updated",
        description: `Room is now ${newVisibility.toLowerCase()}. ${newVisibility === 'Public' ? 'Anyone can find and join this room from the public lobby.' : 'Only people with the link can join.'}`,
      });
    } catch (error) {
      console.error("Error updating room visibility:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update room visibility. Please try again.",
      });
    }  };

  // Security functions
  const handleClearChatHistory = async () => {
    try {
      // Get all messages in the room
      const messagesRef = collection(db, 'rooms', roomId, 'messages');
      const snapshot = await getDocs(messagesRef);
      
      // Delete all messages
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Clear local state
      setMessages([]);

      toast({
        title: "Chat history cleared",
        description: "All chat messages have been permanently deleted.",
      });
    } catch (error) {
      console.error("Error clearing chat history:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to clear chat history. Please try again.",
      });
    }
  };

  const handleDeleteRoom = async () => {
    try {
      // Delete all participants
      const participantsRef = collection(db, 'rooms', roomId, 'participants');
      const participantsSnapshot = await getDocs(participantsRef);
      const deleteParticipantsPromises = participantsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deleteParticipantsPromises);

      // Delete all messages
      const messagesRef = collection(db, 'rooms', roomId, 'messages');
      const messagesSnapshot = await getDocs(messagesRef);
      const deleteMessagesPromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deleteMessagesPromises);

      // Delete room from public rooms if it's public
      if (roomVisibility === 'Public') {
        const publicRoomRef = doc(db, 'publicRooms', roomId);
        await deleteDoc(publicRoomRef);
      }

      // Delete the room document
      const roomRef = doc(db, 'rooms', roomId);
      await deleteDoc(roomRef);

      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`vh_roomName_${roomId}`);
        localStorage.removeItem(`vh_roomVisibility_${roomId}`);
      }

      toast({
        title: "Room deleted",
        description: "The room and all its data have been permanently deleted.",
      });

      // Redirect to home page
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);

    } catch (error) {
      console.error("Error deleting room:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete room. Please try again.",
      });
    }
  };

  // Add new function to handle appointing host
  const handleAppointHost = async (participantId: string) => {
    try {
      // Update the new host
      const newHostRef = doc(db, 'rooms', roomId, 'participants', participantId);
      await setDoc(newHostRef, { isHost: true }, { merge: true });

      // Update the current host to not be host
      const currentHostRef = doc(db, 'rooms', roomId, 'participants', `${userName}_${isHost ? 'host' : 'guest'}_${roomId}`);
      await setDoc(currentHostRef, { isHost: false }, { merge: true });

      // Update local state
      setIsHost(false);
      
      toast({
        title: "Host Changed",
        description: "The room host has been updated.",
      });
    } catch (error) {
      console.error("Error appointing host:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to appoint new host.",
      });
    }
  };

  // Add new function to handle kicking participants
  const handleKickParticipant = async (participantId: string) => {
    try {
      const participantRef = doc(db, 'rooms', roomId, 'participants', participantId);
      await deleteDoc(participantRef);
      
      toast({
        title: "Participant Removed",
        description: "The participant has been removed from the room.",
      });
    } catch (error) {
      console.error("Error kicking participant:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove participant.",
      });
    }
  };

  // Replace the camera/mic initialization useEffect with this new one
  useEffect(() => {
    let stream: MediaStream | null = null;

    const initializeMedia = async () => {
      try {
        // Only request media if either camera or mic is enabled
        if (isCameraOn || isMicOn) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: isCameraOn,
            audio: isMicOn
          });
          
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          setLocalStream(stream);
        }
      } catch (err) {
        console.error("Error accessing media devices:", err);
        toast({
          variant: "destructive",
          title: "Media Access Error",
          description: "Could not access camera or microphone. Please check permissions.",
        });
        // Reset states if permission denied
        setIsCameraOn(false);
        setIsMicOn(false);
      }
    };

    initializeMedia();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraOn, isMicOn]); // Re-run when camera or mic state changes

  // Add handlers for camera and mic toggles
  const handleCameraToggle = async () => {
    if (!isCameraOn && !localStream) {
      // If turning on camera and no stream exists, request permissions
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: isMicOn
        });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        toast({
          variant: "destructive",
          title: "Camera Access Error",
          description: "Could not access camera. Please check permissions.",
        });
        return;
      }
    }
    setIsCameraOn(!isCameraOn);
  };

  const handleMicToggle = async () => {
    if (!isMicOn && !localStream) {
      // If turning on mic and no stream exists, request permissions
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: isCameraOn,
          audio: true
        });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing microphone:", err);
        toast({
          variant: "destructive",
          title: "Microphone Access Error",
          description: "Could not access microphone. Please check permissions.",
        });
        return;
      }
    }
    setIsMicOn(!isMicOn);
  };
  // YouTube Time Tracking with direct API approach
  useEffect(() => {
    if (!isYouTubeVideo || !mediaFrameRef.current) return;
    
    console.log("🕒 Setting up YouTube time tracking");

    // Function to get current time from YouTube iframe
    const requestYouTubeTimeUpdate = () => {
      if (!mediaFrameRef.current?.contentWindow) return;
      
      try {
        // Try all possible methods to ensure we get time updates
        
        // Method 1: Direct postMessage command
        mediaFrameRef.current.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func: 'getCurrentTime',
          args: []
        }), '*');
        
        mediaFrameRef.current.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func: 'getDuration',
          args: []
        }), '*');
        
        // Method 2: Get player info
        mediaFrameRef.current.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func: 'getVideoStats', 
          args: []
        }), '*');
        
        // Method 3: Try directly requesting player state (triggers info delivery)
        mediaFrameRef.current.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func: 'getPlayerState',
          args: []
        }), '*');
      } catch (e) {
        console.error("Error requesting YouTube time update:", e);
      }
    };
    
    // Initial request with slight delay to ensure iframe is fully loaded
    const initialTimeoutId = setTimeout(() => {
      // Initialize API
      if (mediaFrameRef.current?.contentWindow) {
        mediaFrameRef.current.contentWindow.postMessage('{"event":"listening","id":"kosmi"}', '*');
      }
      
      // Wait a bit more, then request time updates
      setTimeout(requestYouTubeTimeUpdate, 500);
    }, 1000);
    
    // Set up recurring time updates - updating every 250ms for smoother progress
    const timeUpdateIntervalId = setInterval(requestYouTubeTimeUpdate, 250);
    
    return () => {
      clearTimeout(initialTimeoutId);
      clearInterval(timeUpdateIntervalId);
    };
  }, [isYouTubeVideo]);

  // Prevent hydration mismatch by only rendering after hydration
  if (!isHydrated) {
    return (
      <div className="flex h-screen bg-background text-foreground overflow-hidden items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading room...</p>
        </div>
      </div>
    );
  }
  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background text-foreground overflow-hidden">        {/* Main Area Container */}
        <div className="flex-1 flex flex-col">{/* Top Bar */}
          <header className="p-3 flex justify-center items-center border-b border-border bg-card/50 backdrop-blur-sm relative">
            {/* Left side spacer for symmetry */}
            <div className="absolute left-3 flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon"><Bell className="h-5 w-5" /></Button>
                </TooltipTrigger>
                <TooltipContent><p>Notifications</p></TooltipContent>
              </Tooltip>
            </div>
              {/* Centered room name */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-lg font-semibold hover:bg-primary/10">
                  {roomName || `${roomId.split(/[-']/)[0]}'s room`}
                  <ChevronDown className="h-5 w-5 ml-1" />
                </Button>
              </DropdownMenuTrigger>              <DropdownMenuContent className="w-72 p-0">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <h3 className="text-lg font-semibold">Rooms</h3>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => window.open('/', '_blank')}
                      className="h-8 w-8"
                    >
                      <Globe className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => window.open('/', '_blank')}
                      className="h-8 w-8"
                    >
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Search Bar */}
                <div className="p-4 border-b border-border">
                  <div className="relative">
                    <Input 
                      placeholder="Search..." 
                      className="bg-muted/50 border-0 h-9"
                    />
                  </div>
                </div>
                
                {/* Current Room Info */}
                <div className="p-4 border-b border-border">
                  <DropdownMenuItem 
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast({
                        title: "Room link copied!",
                        description: "Share this link for others to join.",
                      });
                    }}
                    className="flex items-center gap-2 p-2 rounded-md bg-primary/10"
                  >
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground text-sm font-bold">
                        {roomName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{roomName}</div>
                      <div className="text-xs text-muted-foreground">Current room • Click to copy link</div>
                    </div>
                  </DropdownMenuItem>
                </div>
                
                {/* Join Public Lobby Section */}
                <div className="p-4">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-2">No one online?</div>
                    <DropdownMenuItem 
                      onClick={() => window.open('/', '_blank')}
                      className="flex items-center justify-center gap-2 p-3 bg-muted/50 hover:bg-muted rounded-md"
                    >
                      <Globe className="h-5 w-5" />
                      <span className="font-medium">Join the public lobby!</span>
                    </DropdownMenuItem>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>            {/* Right side controls */}
            <div className="absolute right-3 flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => setIsParticipantsOpen(true)}>
                    <Users className="h-5 w-5" />
                    <span className="sr-only">Show Participants</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Participants ({allParticipants.length})</p></TooltipContent>
              </Tooltip>
               <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleToggleFullscreen}><Maximize className="h-5 w-5" /></Button>
                </TooltipTrigger>
                <TooltipContent><p>Fullscreen</p></TooltipContent>
              </Tooltip>
              <Button variant="ghost" size="sm" asChild className="group text-destructive hover:bg-destructive/10 hover:text-destructive">
                <Link href="/">
                  <LogOut className="h-4 w-4 mr-1 md:mr-2 group-hover:text-destructive" /> <span className="hidden md:inline group-hover:text-destructive">Leave</span>
                </Link>
              </Button>
            </div>
          </header>          {/* Content Area */}          <main 
            className="flex-1 flex flex-col items-center justify-start p-9 p-4 bg-background relative" 
            ref={mainMediaContainerRef}
            style={backgroundThemes[selectedTheme].image ? {
              backgroundImage: `url('${backgroundThemes[selectedTheme].image}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundAttachment: 'fixed'
            } : {}}
          >
            {/* Background overlay for better contrast - only show when there's a background image */}
            {backgroundThemes[selectedTheme].image && (
              <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
            )}
            
            <div 
              ref={videoContainerRef}
              className="w-full max-w-2xl aspect-[16/9] bg-black rounded-lg shadow-2xl relative border border-border overflow-hidden z-10"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <video 
                ref={videoRef} 
                className="absolute inset-0 w-full h-full rounded-md hidden" 
                playsInline 
                autoPlay
                style={{
                  objectFit: 'contain',
                  backgroundColor: '#000'
                }}
              />              
              {/* LiveKit screen share will be handled by track subscription events to the main videoRef */}
              <iframe 
                ref={mediaFrameRef} 
                className="absolute inset-0 w-full h-full border-0 rounded-md hidden" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                title="Media Content"
              ></iframe>
              <div ref={placeholderContentRef} className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                <h2 className="text-2xl font-semibold text-muted-foreground mb-4">Your virtual space is ready.</h2>
                {isHost && (
                 <Button size="lg" className="bg-primary hover:bg-primary/80" onClick={() => setIsSelectMediaModalOpen(true)}>
                    <PlaySquare className="h-6 w-6 mr-2" /> Select Media
                 </Button>
                )}
                <p className="text-sm text-muted-foreground mt-4">Watch videos, share your screen, or play games together.</p>              </div>              {/* Media Control Bar - Positioned as overlay above YouTube controls */}
              {isMediaActive && (
                <div 
                  className={cn(
                   
                    "absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-sm p-2 rounded-b-lg transition-all duration-300 hover:bg-black/60 flex flex-col gap-1.5",
                    showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
                  )}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  onMouseMove={handleMouseMove}
                >
                  {/* Progress Bar and Time */}
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-xs text-white w-12 text-center">{currentTimeDisplay}</span>
                    {isHost && (
                    <Slider
                      value={[videoProgress]}
                      max={100}
                      step={0.1}
                      onValueChange={handleProgressChange}
                      onPointerDown={() => setIsSeeking(true)}
                      onPointerUp={() => setIsSeeking(false)}
                      className={cn(
                        "w-full h-2 cursor-pointer",
                        "[&>[data-radix-slider-track]]:h-1.5 [&>[data-radix-slider-track]]:bg-gray-600",
                        "[&>[data-radix-slider-range]]:bg-yellow-400",
                        "[&>[data-radix-slider-thumb]]:h-3.5 [&>[data-radix-slider-thumb]]:w-3.5 [&>[data-radix-slider-thumb]]:bg-yellow-400 [&>[data-radix-slider-thumb]]:border-2 [&>[data-radix-slider-thumb]]:border-white [&>[data-radix-slider-thumb]]:shadow",
                        "[&>[data-radix-slider-thumb]:focus-visible]:ring-yellow-400/50 [&>[data-radix-slider-thumb]:focus-visible]:ring-offset-0"
                      )}
                      disabled={!isScreenShareActive && !isYouTubeVideo}
                    />
                    )}
                    <span className="text-xs text-white w-12 text-center">{durationDisplay}</span>
                  </div>
                   {/* Media Source Text */}
                  {mediaSourceText && <div className="text-center text-xs text-gray-300 -mt-0.5 mb-0.5">{mediaSourceText}</div>}

                  {/* Control Buttons */}
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      {isHost && (
                        <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <Button variant="default" size="icon" className="bg-white/20 hover:bg-white/30 text-white p-1.5 rounded w-9 h-9 backdrop-blur-sm" onClick={() => setIsSelectMediaModalOpen(true)}>
                             <Menu className="h-5 w-5" />
                           </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Select Media</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="default" size="icon" className="bg-white/20 hover:bg-white/30 text-white p-1.5 rounded w-9 h-9 backdrop-blur-sm" onClick={handleStopMedia}>
                            <Square className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Stop Media</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <Button variant="default" size="icon" className="bg-white/20 hover:bg-white/30 text-white p-1.5 rounded w-9 h-9 backdrop-blur-sm" onClick={handlePlayPause} disabled={!currentMediaUrl}>
                             {mediaState.isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                          </Button>
                        </TooltipTrigger>
                            <TooltipContent><p>{mediaState.isPlaying ? "Pause" : "Play"}</p></TooltipContent>
                      </Tooltip>                      <Tooltip>
                        <TooltipTrigger asChild>
                           <Button variant="default" size="icon" className="bg-white/20 hover:bg-white/30 text-white p-1.5 rounded w-9 h-9 backdrop-blur-sm" onClick={toggleScreenShareMute} disabled={!isScreenShareActive && !isYouTubeVideo}>
                             {isScreenShareMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                           </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>{isScreenShareMuted ? "Unmute" : "Mute"}</p></TooltipContent>
                      </Tooltip><Slider
                          value={[screenShareVolume]}
                          max={1}
                          step={0.01}
                          onValueChange={handleVolumeChange}
                          className={cn(
                            "w-20 h-2 ml-1",
                            "[&>[data-radix-slider-track]]:h-1 [&>[data-radix-slider-track]]:bg-gray-500",
                            "[&>[data-radix-slider-range]]:bg-white",
                            "[&>[data-radix-slider-thumb]]:h-3 [&>[data-radix-slider-thumb]]:w-3 [&>[data-radix-slider-thumb]]:bg-white [&>[data-radix-slider-thumb]]:border-0 [&>[data-radix-slider-thumb]]:shadow-sm",
                            "[&>[data-radix-slider-thumb]:focus-visible]:ring-white/50 [&>[data-radix-slider-thumb]:focus-visible]:ring-offset-0"
                          )}
                          disabled={(!isScreenShareActive && !isYouTubeVideo) || isScreenShareMuted}
                        />
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isYouTubeVideo && <Youtube className="h-5 w-5 text-red-500 hidden md:inline" />}
                      <span className="text-xs text-white font-semibold bg-black/30 px-1.5 py-0.5 rounded hidden md:inline">HD</span>                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="default"
                            size="icon"
                            className={cn(
                              "bg-white/20 hover:bg-white/30 text-white p-1.5 rounded w-9 h-9 backdrop-blur-sm",
                              areCaptionsEnabled && isYouTubeVideo ? "ring-2 ring-yellow-400 bg-yellow-500/60" : ""
                            )}
                            onClick={handleToggleCaptions}
                            disabled={!isYouTubeVideo}
                            aria-pressed={areCaptionsEnabled && isYouTubeVideo}
                          >
                            <Captions className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Captions (CC)</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="default" size="icon" className="bg-white/20 hover:bg-white/30 text-white p-1.5 rounded w-9 h-9 backdrop-blur-sm" disabled>
                            <Settings2 className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Settings (Coming Soon)</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="default" size="icon" className="bg-white/20 hover:bg-white/30 text-white p-1.5 rounded w-9 h-9 backdrop-blur-sm" onClick={handleToggleFullscreen}>
                            <Expand className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Fullscreen</p></TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              )}            </div>
              {/* Participant Avatars */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-auto max-w-4/5 md:max-w-3/4 lg:max-w-1/2 h-auto pb-1 pt-2 px-4 bg-muted/30 rounded-t-xl flex justify-center items-end space-x-2 md:space-x-3 shadow-xl backdrop-blur-sm">
              {/* Firebase participants */}
              {allParticipants.map(user => {
                const isCurrentUser = user.id === `${userName}_${isHost ? 'host' : 'guest'}_${roomId}`;
                return (
                  <div key={user.id} className="flex flex-col items-center text-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative">
                          {isCurrentUser && isCameraOn ? (
                            <div className={`h-12 w-12 md:h-16 md:w-16 rounded-full overflow-hidden border-2 ${isHost ? 'border-accent ring-4 ring-accent/50' : 'border-primary ring-2 ring-primary/50'} mb-0.5 hover:scale-110 transition-transform cursor-pointer`}>
                              <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <Avatar className={`h-12 w-12 md:h-16 md:w-16 border-2 ${user.isHost ? 'border-accent ring-4 ring-accent/50' : 'border-primary ring-2 ring-primary/50'} mb-0.5 hover:scale-110 transition-transform cursor-pointer`}>
                              <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint={user.hint} />
                              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                          )}
                          {user.isHost && (
                            <span className="absolute -top-2 -right-2">
                              <Crown className="h-5 w-5 text-yellow-400 drop-shadow" />
                            </span>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent><p>{user.isHost ? `${user.name} (Host)` : user.name}</p></TooltipContent>
                    </Tooltip>
                    <span className={`text-xs max-w-[60px] truncate ${user.isHost ? 'font-semibold text-accent' : 'text-muted-foreground'}`}>{user.name}</span>
                  </div>
                );
              })}
              
              {/* LiveKit participants (only those not already in Firebase list) */}
              {livekit.participants
                .filter(lkParticipant => 
                  !allParticipants.some(fbParticipant => 
                    fbParticipant.name === lkParticipant.name || fbParticipant.name === lkParticipant.identity
                  )
                )
                .map(lkParticipant => (
                  <div key={`livekit-${lkParticipant.identity}`} className="flex flex-col items-center text-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative">                          <Avatar className="h-12 w-12 md:h-16 md:w-16 border-2 border-green-500 ring-2 ring-green-500/50 mb-0.5 hover:scale-110 transition-transform cursor-pointer">
                            <AvatarFallback className="bg-green-100 text-green-700">
                              {(lkParticipant.name || lkParticipant.identity).charAt(0)}
                           
                            </AvatarFallback>
                          </Avatar>
                          {lkParticipant.screenShareTrack && (
                            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1 rounded-full">
                              📺
                            </span>
                          )}
                        </div>
                      </TooltipTrigger>                      <TooltipContent>
                        <p>{lkParticipant.name || lkParticipant.identity} (LiveKit)</p>
                        {lkParticipant.screenShareTrack && <p className="text-xs text-blue-400">Screen sharing</p>}
                      </TooltipContent>
                    </Tooltip>
                    <span className="text-xs max-w-[60px] truncate text-green-600 font-medium">
                      {lkParticipant.name || lkParticipant.identity}
                    </span>
                  </div>
                ))
              }
            </div>
          </main>
        </div>

        {/* Right Chat Sidebar */}
        <aside className="w-80 lg:w-96 bg-card border-l border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="text-xl font-semibold mb-3 flex items-center justify-between font-headline">
              Room Menu              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleRoomSettingsOpen()}
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Room Settings</p></TooltipContent>
              </Tooltip>
            </h2>

            <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
              <DialogTrigger asChild>
                <Button className="w-full mb-3 bg-primary/90 hover:bg-primary">
                  <UserPlus className="h-5 w-5 mr-2" /> Invite Friends
                </Button>
              </DialogTrigger>              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Invite to room</DialogTitle>
                </DialogHeader>
                <div className="py-2 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Share this room link for others to join:
                  </p>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="roomLink"
                      value={roomLink}
                      readOnly
                      className="flex-1"
                    />
                    <Button onClick={handleCopyLink} size="sm" className="px-3 bg-primary hover:bg-primary/80">
                      <Copy className="h-4 w-4 mr-2" />
                      Copy link
                    </Button>
                  </div>
                   <p className="text-sm text-muted-foreground">
                    Paste the link into any email or messaging app message.
                  </p>
                </div>
              </DialogContent>
            </Dialog>
            
            <div className="flex items-center justify-around gap-2">
               <Tooltip>
                <TooltipTrigger asChild>
                   <Button 
                    onClick={handleMicToggle}
                    className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground shadow-md active:shadow-inner active:translate-y-px border-b-4 border-muted"
                    size="icon"
                    suppressHydrationWarning
                  >
                    {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5 text-destructive" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{isMicOn ? "Mute Mic" : "Unmute Mic"}</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={handleCameraToggle}
                    className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground shadow-md active:shadow-inner active:translate-y-px border-b-4 border-muted"
                    size="icon"
                    suppressHydrationWarning
                  >
                    {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5 text-destructive" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{isCameraOn ? "Stop Camera" : "Start Camera"}</p></TooltipContent>
              </Tooltip>
            </div>
          </div>
          <div className="p-2 text-sm text-muted-foreground border-b border-border">
            <Users className="h-4 w-4 inline mr-1" /> {allParticipants.length} online
          </div>

          <ScrollArea className="flex-grow p-3 pr-2">
            {messages.map((msg) => {
              const isCurrentUser = msg.user === userName;
              const isSystemMessage = msg.user === "System";
              return (
                <div key={msg.id} className={`flex gap-2 mb-3 ${isCurrentUser ? 'justify-end' : ''}`}>
                  {!isCurrentUser && !isSystemMessage && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={msg.avatar || `https://placehold.co/40x40.png?text=${msg.user.charAt(0)}`} alt={msg.user} data-ai-hint="user avatar" />
                      <AvatarFallback>{msg.user.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-[75%] p-2 rounded-lg shadow-sm ${
                    isSystemMessage 
                      ? 'bg-muted/50 text-muted-foreground mx-auto' 
                      : isCurrentUser 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-secondary'
                  }`}>
                    {!isSystemMessage && (
                      <p className="text-xs font-semibold mb-0.5">{msg.user}</p>
                    )}
                    <p className="text-sm">{msg.text}</p>
                    <p className="text-xs text-muted-foreground/80 mt-1 text-right">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {isCurrentUser && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={msg.avatar} alt={msg.user} data-ai-hint="user avatar host" />
                      <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </ScrollArea>
          <form onSubmit={handleSendMessage} className="p-3 border-t border-border flex gap-2 bg-card">
            <Input
              type="text"
              placeholder="Type a message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-grow bg-background focus:ring-primary"
              suppressHydrationWarning
            />
            <Button 
              type="submit" 
              size="icon" 
              aria-label="Send message" 
              className="bg-primary hover:bg-primary/80"
              suppressHydrationWarning
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </aside>

        {/* Select Media Modal (Dialog) */}
         <Dialog open={isSelectMediaModalOpen} onOpenChange={setIsSelectMediaModalOpen}>
            <DialogContent 
              className="max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl w-[95vw] md:w-[90vw] h-auto md:h-[90vh] p-0 border-0 bg-transparent shadow-none data-[state=open]:!animate-none data-[state=closed]:!animate-none"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <DialogHeader className="sr-only">
                <DialogTitle>Select Media</DialogTitle>
                <DialogDescription>Choose content to share in the room.</DialogDescription>
              </DialogHeader>
              <SelectMediaModal 
                onShareScreen={handleShareScreen} 
                onPlayUrl={handlePlayUrl} 
              />
            </DialogContent>
          </Dialog>

        {/* Participants Dialog */}
        <Dialog open={isParticipantsOpen} onOpenChange={setIsParticipantsOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Participants ({allParticipants.length})</DialogTitle>
            </DialogHeader>
            <ul className="space-y-2">
              {allParticipants.map((user) => (
                <li key={user.id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {user.isHost && (
                        <span className="absolute -top-1 -right-1 bg-transparent">
                          <Crown className="h-4 w-4 text-yellow-500 drop-shadow" />
                        </span>
                      )}
                    </div>
                    <span className="font-medium">{user.name}</span>
                  </div>
                  
                  {/* Host controls - only show if current user is host and not controlling themselves */}
                  {isHost && user.id !== `${userName}_host_${roomId}` && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => handleAppointHost(user.id)}
                          className="text-primary"
                        >
                          <Crown className="h-4 w-4 mr-2" />
                          Appoint as Host
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleKickParticipant(user.id)}
                          className="text-destructive"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Kick
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </li>
              ))}
            </ul>
          </DialogContent>
        </Dialog>

        {/* Name Prompt Modal */}
        <Dialog open={isNamePromptOpen}>
          <DialogContent className="max-w-xs">
            <DialogHeader>
              <DialogTitle>Enter your name</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleNameSubmit} className="flex flex-col gap-3">
              <Input
                autoFocus
                placeholder="Your name"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                maxLength={20}
                required
              />
              <Button type="submit" className="w-full">Join Room</Button>
            </form>          </DialogContent>
        </Dialog>

        {/* Theme Selection Modal */}
        <Dialog open={isThemeModalOpen} onOpenChange={setIsThemeModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Choose Background Theme</DialogTitle>
              <p className="text-sm text-muted-foreground">Select a background theme for your room</p>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {Object.entries(backgroundThemes).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedTheme(key as keyof typeof backgroundThemes);
                    setIsThemeModalOpen(false);
                  }}
                  className={cn(
                    "relative aspect-video rounded-lg border-2 overflow-hidden transition-all hover:scale-105",
                    selectedTheme === key 
                      ? "border-primary ring-2 ring-primary/20" 
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div 
                    className="w-full h-full flex items-center justify-center text-sm font-medium text-white"
                    style={{
                      backgroundColor: theme.preview,
                      backgroundImage: theme.image ? `url('${theme.image}')` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    {!theme.image && (
                      <span className="bg-black/20 px-2 py-1 rounded">{theme.name}</span>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 text-center">
                    {theme.name}
                  </div>
                  {selectedTheme === key && (
                    <div className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </DialogContent>        </Dialog>        {/* Room Settings Modal */}
        <Dialog open={isRoomSettingsOpen} onOpenChange={handleRoomSettingsClose}>
          <DialogContent className="max-w-md p-0 gap-0 bg-card/95 backdrop-blur-md border-border">
            <DialogHeader className="p-6 pb-4">
              <div className="flex items-center gap-3">
                {roomSettingsView !== 'main' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setRoomSettingsView('main')}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                  </Button>
                )}                <DialogTitle className="text-foreground text-xl font-semibold">
                  {roomSettingsView === 'main' && 'Room Settings'}
                  {roomSettingsView === 'appearance' && 'Choose Background'}
                  {roomSettingsView === 'avatar' && 'Choose Avatar'}
                  {roomSettingsView === 'roomname' && 'Edit Room Name'}
                  {roomSettingsView === 'security' && 'Security Settings'}
                </DialogTitle>
              </div>
              {roomSettingsView === 'appearance' && (
                <DialogDescription className="text-muted-foreground ml-11">
                  Select a background theme for your room
                </DialogDescription>
              )}
            </DialogHeader>
            
            <div className="px-6 pb-6">
              {roomSettingsView === 'main' && (
                <div className="space-y-3">
                  {/* Avatar Section */}
                  <div 
                    className="bg-muted/50 hover:bg-muted transition-colors rounded-lg p-4 flex items-center justify-between cursor-pointer group"
                    onClick={() => setRoomSettingsView('avatar')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-foreground font-medium">Avatar</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        {userAvatar && userAvatar !== '' ? (
                          <img 
                            src={userAvatar} 
                            alt="Current avatar" 
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-primary-foreground text-sm font-bold">
                              {userName.charAt(0).toUpperCase() || 'T'}
                            </span>
                          </div>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </div>                  {/* Room Name Section */}
                  <div className="bg-muted/50 hover:bg-muted transition-colors rounded-lg p-4">
                    {isEditingRoomName ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Edit3 className="h-5 w-5 text-primary" />
                          </div>
                          <span className="text-foreground font-medium">Edit Room Name</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            value={editingRoomName}
                            onChange={(e) => setEditingRoomName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveRoomName();
                              } else if (e.key === 'Escape') {
                                handleCancelEditRoomName();
                              }
                            }}
                            placeholder="Enter room name"
                            className="flex-1"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={handleSaveRoomName}
                            disabled={!editingRoomName.trim() || editingRoomName.trim() === roomName}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEditRoomName}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between cursor-pointer group" onClick={handleEditRoomName}>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Edit3 className="h-5 w-5 text-primary" />
                          </div>
                          <span className="text-foreground font-medium">Room name</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-sm max-w-32 truncate">
                            {roomName}
                          </span>
                          <Edit className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Appearance Section */}
                  <div 
                    className="bg-muted/50 hover:bg-muted transition-colors rounded-lg p-4 flex items-center justify-between cursor-pointer group"
                    onClick={() => setRoomSettingsView('appearance')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Palette className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-foreground font-medium">Appearance</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>                  {/* Visibility Section */}
                  <div 
                    className="bg-muted/50 hover:bg-muted transition-colors rounded-lg p-4 flex items-center justify-between cursor-pointer group"
                    onClick={handleToggleVisibility}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {roomVisibility === 'Private' ? (
                          <EyeOff className="h-5 w-5 text-primary" />
                        ) : (
                          <Eye className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-foreground font-medium">Visibility</span>
                        <span className="text-xs text-muted-foreground">
                          {roomVisibility === 'Private' 
                            ? 'Only people with the link can join' 
                            : 'Anyone can find and join this room'
                          }
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        roomVisibility === 'Private' 
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      }`}>
                        {roomVisibility}
                      </div>
                      <div className={`w-10 h-6 rounded-full transition-colors ${
                        roomVisibility === 'Public' ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                      } relative`}>
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                          roomVisibility === 'Public' ? 'translate-x-5' : 'translate-x-1'
                        }`} />
                      </div>
                    </div>
                  </div>                  {/* Security Section */}
                  <div 
                    className="bg-muted/50 hover:bg-muted transition-colors rounded-lg p-4 flex items-center justify-between cursor-pointer group"
                    onClick={() => setRoomSettingsView('security')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-foreground font-medium">Security</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </div>
              )}

              {roomSettingsView === 'appearance' && (
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(backgroundThemes).map(([key, theme]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedTheme(key as keyof typeof backgroundThemes);
                        setRoomSettingsView('main');
                      }}
                      className={cn(
                        "relative aspect-video rounded-lg border-2 overflow-hidden transition-all hover:scale-105",
                        selectedTheme === key 
                          ? "border-primary ring-2 ring-primary/20" 
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div 
                        className="w-full h-full flex items-center justify-center text-sm font-medium text-white"
                        style={{
                          backgroundColor: theme.preview,
                          backgroundImage: theme.image ? `url('${theme.image}')` : 'none',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      >
                        {!theme.image && (
                          <span className="bg-black/20 px-2 py-1 rounded">{theme.name}</span>
                        )}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 text-center">
                        {theme.name}
                      </div>
                      {selectedTheme === key && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {roomSettingsView === 'avatar' && (
                <div className="space-y-6">
                  {/* Current Avatar Preview */}
                  <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                    <div className="relative">
                      {userAvatar && userAvatar !== '' ? (
                        <img 
                          src={userAvatar} 
                          alt="Current avatar" 
                          className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center border-2 border-primary">
                          <span className="text-primary-foreground text-lg font-bold">
                            {userName.charAt(0).toUpperCase() || 'T'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{userName}</h3>
                      <p className="text-sm text-muted-foreground">Current avatar</p>
                    </div>
                  </div>

                  {/* Upload Custom Avatar */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-foreground">Upload Custom Avatar</h4>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        id="avatar-upload"
                      />
                      <label
                        htmlFor="avatar-upload"
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
                      >
                        <Upload className="h-4 w-4" />
                        Upload Image
                      </label>
                      <span className="text-sm text-muted-foreground">Max 5MB</span>
                    </div>
                  </div>

                  {/* Default Avatar Options */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-foreground">Default Avatars</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {Object.entries(avatarOptions).map(([key, option]) => (
                        <button
                          key={key}
                          onClick={() => handleAvatarSelect(key)}
                          className={cn(
                            "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all hover:border-primary/50",
                            selectedAvatarOption === key
                              ? "border-primary bg-primary/10"
                              : "border-border bg-muted/30"
                          )}
                        >
                          {option.url ? (
                            <img 
                              src={option.url} 
                              alt={option.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div 
                              className="w-12 h-12 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: option.color }}
                            >
                              <span className="text-white text-lg font-bold">
                                {userName.charAt(0).toUpperCase() || 'T'}
                              </span>
                            </div>
                          )}
                          <span className="text-xs text-foreground font-medium">{option.name}</span>
                        </button>
                      ))}                    </div>
                  </div>
                </div>
              )}

              {roomSettingsView === 'security' && (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Destructive Actions
                      </span>
                    </div>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      These actions cannot be undone. Please proceed with caution.
                    </p>
                  </div>

                  {/* Clear Chat History */}
                  <button
                    onClick={handleClearChatHistory}
                    className="w-full bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg">
                        <Trash className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="text-left">
                        <span className="text-red-800 dark:text-red-200 font-medium block">
                          Clear Chat History
                        </span>
                        <span className="text-red-600 dark:text-red-400 text-sm">
                          Delete all chat messages permanently
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-red-500 group-hover:text-red-600 transition-colors" />
                  </button>

                  {/* Delete Room */}
                  {isHost && (
                    <button
                      onClick={handleDeleteRoom}
                      className="w-full bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center justify-between transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg">
                          <Trash className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="text-left">
                          <span className="text-red-800 dark:text-red-200 font-medium block">
                            Delete Room
                          </span>
                          <span className="text-red-600 dark:text-red-400 text-sm">
                            Permanently delete this room and all data
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-red-500 group-hover:text-red-600 transition-colors" />
                    </button>
                  )}

                  {!isHost && (
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground text-center">
                        Only the room host can delete the room.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>        </Dialog>

      </div>
    </TooltipProvider>
  );
}


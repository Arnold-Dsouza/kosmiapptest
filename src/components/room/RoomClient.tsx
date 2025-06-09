
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Copy,
  Square, // Stop icon
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
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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

const currentUser: Participant = {
  id: 'currentUserHost',
  name: 'You', // This will be used in tooltips or lists, display name under avatar is "Host"
  avatarUrl: 'https://placehold.co/80x80.png?text=Me',
  hint: 'person avatar host',
  isHost: true,
};

const remoteParticipants: Participant[] = [
  { id: '1', name: 'Alex', avatarUrl: 'https://placehold.co/80x80.png?text=A' , hint: 'person avatar', isHost: false },
  { id: '2', name: 'Sam', avatarUrl: 'https://placehold.co/80x80.png?text=S' , hint: 'person avatar', isHost: false },
  { id: '3', name: 'Casey', avatarUrl: 'https://placehold.co/80x80.png?text=C' , hint: 'person avatar', isHost: false },
];

const allParticipants: Participant[] = [currentUser, ...remoteParticipants];


export default function RoomClient({ roomId }: RoomClientProps) {
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaFrameRef = useRef<HTMLIFrameElement>(null);
  const placeholderContentRef = useRef<HTMLDivElement>(null);
  const mainMediaContainerRef = useRef<HTMLDivElement>(null);
  
  const [isSelectMediaModalOpen, setIsSelectMediaModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [roomLink, setRoomLink] = useState('');
  const { toast } = useToast();
  
  const screenStreamRef = useRef<MediaStream | null>(null);
  const [currentMediaUrl, setCurrentMediaUrl] = useState<string | null>(null);

  const [isScreenSharePlaying, setIsScreenSharePlaying] = useState(false);
  const [isScreenShareMuted, setIsScreenShareMuted] = useState(false);
  const [screenShareVolume, setScreenShareVolume] = useState(1); // 0 to 1
  const [previousVolume, setPreviousVolume] = useState(1); // To store volume before mute

  const [mediaSourceText, setMediaSourceText] = useState<string | null>(null);
  
  const [videoProgress, setVideoProgress] = useState(0);
  const [currentTimeDisplay, setCurrentTimeDisplay] = useState("00:00");
  const [durationDisplay, setDurationDisplay] = useState("00:00");
  const [isYouTubeVideo, setIsYouTubeVideo] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);

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

  const stopMediaPlayback = useCallback(() => {
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
  }, []);

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
    }
  }, [currentMediaUrl]);

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
    const timer = setTimeout(() => {
      setMessages(prev => [...prev, {id: Date.now().toString(), user: "System", avatar: 'https://placehold.co/40x40.png?text=S', text: `Welcome to room ${roomId}!`, timestamp: new Date()}]);
    }, 1000);
    if (typeof window !== "undefined") {
      setRoomLink(window.location.href);
    }
    
    return () => {
      clearTimeout(timer);
      if (screenStreamRef.current) {
        stopScreenShare();
      }
    };
  }, [roomId, stopScreenShare]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      setMessages([...messages, {
        id: Date.now().toString(),
        user: currentUser.name,
        text: chatInput.trim(),
        timestamp: new Date(),
        avatar: currentUser.avatarUrl
      }]);
      setChatInput('');
    }
  };

  const getYouTubeEmbedUrl = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}?autoplay=1&controls=1&rel=0&showinfo=0&modestbranding=1`;
    }
    return null;
  };

 const handlePlayUrl = (url: string) => {
    if (screenStreamRef.current) {
      stopScreenShare();
    }
    
    const embedUrl = getYouTubeEmbedUrl(url);
    if (embedUrl) {
      setCurrentMediaUrl(embedUrl);
      setIsYouTubeVideo(true);
      if (mediaFrameRef.current) {
        mediaFrameRef.current.src = embedUrl;
        mediaFrameRef.current.classList.remove('hidden');
      }
      if (placeholderContentRef.current) placeholderContentRef.current.classList.add('hidden');
      if (videoRef.current) videoRef.current.classList.add('hidden');
      setMediaSourceText("youtube.com");
    } else {
      // For now, only YouTube is "officially" supported with special handling.
      // You could attempt to load other URLs directly, but X-Frame-Options might prevent it.
      // Basic attempt:
      setCurrentMediaUrl(url);
      setIsYouTubeVideo(false); // Not a YouTube video
      if (mediaFrameRef.current) {
        mediaFrameRef.current.src = url;
        mediaFrameRef.current.classList.remove('hidden');
      }
      if (placeholderContentRef.current) placeholderContentRef.current.classList.add('hidden');
      if (videoRef.current) videoRef.current.classList.add('hidden');
      try {
        const hostname = new URL(url).hostname;
        setMediaSourceText(hostname);
      } catch (e) {
        setMediaSourceText("External Link");
      }
      // toast({
      //   variant: "destructive",
      //   title: "Unsupported URL",
      //   description: "Only YouTube video URLs are fully supported for now. Other URLs might not embed correctly.",
      // });
    }
    setIsSelectMediaModalOpen(false);
  };

  const handleShareScreen = async () => {
    if (isSelectMediaModalOpen) setIsSelectMediaModalOpen(false);
    if (currentMediaUrl) stopMediaPlayback(); 

    if (screenStreamRef.current) {
        stopScreenShare(); 
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true, // Request audio as well
      });
      screenStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(error => console.error("Error playing video:", error));
        videoRef.current.classList.remove('hidden');
        // Initial mute state can be set here or by useEffect based on video.muted
        // videoRef.current.muted = true; 
        // setIsScreenShareMuted(true);
        // setScreenShareVolume(0);
      }
      if (placeholderContentRef.current) placeholderContentRef.current.classList.add('hidden');
      if (mediaFrameRef.current) mediaFrameRef.current.classList.add('hidden');
      setMediaSourceText("Your Screen");
      setIsYouTubeVideo(false);


      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (err: any) {
      console.error("Error sharing screen:", err);
      toast({
        variant: "destructive",
        title: "Screen Share Failed",
        description: err.message || "Could not start screen sharing. Please ensure permission is granted.",
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
    if (videoRef.current && screenStreamRef.current) {
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
    if (videoRef.current && screenStreamRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
      // State updates (screenShareVolume, isScreenShareMuted) are handled by the 'volumechange' event listener
    }
  };


  const handleToggleFullscreen = () => {
    const elem = mainMediaContainerRef.current;
    if (!elem) return;

    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  };
  
  const handleProgressChange = (value: number[]) => {
    if (videoRef.current && screenStreamRef.current && isFinite(videoRef.current.duration)) {
      const newTime = (value[0] / 100) * videoRef.current.duration;
      videoRef.current.currentTime = newTime;
      setCurrentTimeDisplay(formatTime(newTime)); // Immediate update for responsiveness
      setVideoProgress(value[0]);
    }
  };


  const isMediaActive = !!(currentMediaUrl || screenStreamRef.current);
  const isScreenShareActive = !!screenStreamRef.current;


  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background text-foreground overflow-hidden">
        {/* Left Toolbar */}
        <aside className="w-16 bg-card p-3 flex flex-col items-center space-y-4 border-r border-border">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                <PenTool className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right"><p>Drawing Tools</p></TooltipContent>
          </Tooltip>
           <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                <PlusCircle className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right"><p>Add Content</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                <Globe className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right"><p>Explore Rooms</p></TooltipContent>
          </Tooltip>
        </aside>

        {/* Main Area Container */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <header className="p-3 flex justify-between items-center border-b border-border bg-card/50 backdrop-blur-sm">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-lg font-semibold hover:bg-primary/10">
                  {roomId}'s room
                  <ChevronDown className="h-5 w-5 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Room Settings</DropdownMenuItem>
                <DropdownMenuItem>Change Room Name</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon"><Bell className="h-5 w-5" /></Button>
                </TooltipTrigger>
                <TooltipContent><p>Notifications</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon"><Users className="h-5 w-5" /></Button>
                </TooltipTrigger>
                <TooltipContent><p>Participants ({allParticipants.length})</p></TooltipContent>
              </Tooltip>
               <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleToggleFullscreen}><Maximize className="h-5 w-5" /></Button>
                </TooltipTrigger>
                <TooltipContent><p>Fullscreen</p></TooltipContent>
              </Tooltip>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">
                  <LogOut className="h-4 w-4 mr-1 md:mr-2" /> <span className="hidden md:inline">Leave</span>
                </Link>
              </Button>
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 flex flex-col items-center justify-center p-4 relative bg-background" ref={mainMediaContainerRef}>
            <div className="w-full max-w-4xl aspect-[16/7] bg-black/50 rounded-lg shadow-2xl flex flex-col items-center justify-center border border-border overflow-hidden">
              <video ref={videoRef} className="w-full h-full object-contain rounded-md hidden" playsInline />
              <iframe 
                ref={mediaFrameRef} 
                className="w-full h-full border-0 hidden" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                title="Media Content"
              ></iframe>
              <div ref={placeholderContentRef} className="text-center p-8">
                <h2 className="text-2xl font-semibold text-muted-foreground mb-4">Your virtual space is ready.</h2>
                 <Button size="lg" className="bg-primary hover:bg-primary/80" onClick={() => setIsSelectMediaModalOpen(true)}>
                    <PlaySquare className="h-6 w-6 mr-2" /> Select Media
                 </Button>
                <p className="text-sm text-muted-foreground mt-4">Watch videos, share your screen, or play games together.</p>
              </div>
            </div>

            {/* Media Control Bar */}
            {isMediaActive && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-3xl bg-black/80 p-2 rounded-lg shadow-xl backdrop-blur-sm flex flex-col gap-1.5">
                {/* Progress Bar and Time */}
                <div className="flex items-center gap-2 px-1">
                  <span className="text-xs text-white w-12 text-center">{currentTimeDisplay}</span>
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
                    disabled={!isScreenShareActive || !isFinite(videoRef.current?.duration ?? 0)}
                  />
                  <span className="text-xs text-white w-12 text-center">{durationDisplay}</span>
                </div>
                 {/* Media Source Text */}
                {mediaSourceText && <div className="text-center text-xs text-gray-300 -mt-0.5 mb-0.5">{mediaSourceText}</div>}

                {/* Control Buttons */}
                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                         <Button variant="default" size="icon" className="bg-primary hover:bg-primary/80 text-primary-foreground p-1.5 rounded w-9 h-9" onClick={() => setIsSelectMediaModalOpen(true)}>
                           <Menu className="h-5 w-5" />
                         </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Select Media</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="default" size="icon" className="bg-primary hover:bg-primary/80 text-primary-foreground p-1.5 rounded w-9 h-9" onClick={handleStopMedia}>
                          <Square className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Stop Media</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="default" size="icon" className="bg-primary hover:bg-primary/80 text-primary-foreground p-1.5 rounded w-9 h-9" onClick={toggleScreenSharePlayPause} disabled={!isScreenShareActive}>
                          {isScreenSharePlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>{isScreenSharePlaying ? "Pause" : "Play"}</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                         <Button variant="default" size="icon" className="bg-primary hover:bg-primary/80 text-primary-foreground p-1.5 rounded w-9 h-9" onClick={toggleScreenShareMute} disabled={!isScreenShareActive}>
                           {isScreenShareMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                         </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>{isScreenShareMuted ? "Unmute" : "Mute"}</p></TooltipContent>
                    </Tooltip>
                     <Slider
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
                        disabled={!isScreenShareActive || isScreenShareMuted}
                      />
                  </div>
                  <div className="flex items-center gap-2">
                    {isYouTubeVideo && <Youtube className="h-5 w-5 text-red-500 hidden md:inline" />}
                    <span className="text-xs text-white font-semibold bg-black/30 px-1.5 py-0.5 rounded hidden md:inline">HD</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="default" size="icon" className="bg-primary/70 hover:bg-primary/60 text-primary-foreground p-1.5 rounded w-9 h-9" disabled>
                          <Captions className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Captions (Coming Soon)</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="default" size="icon" className="bg-primary/70 hover:bg-primary/60 text-primary-foreground p-1.5 rounded w-9 h-9" disabled>
                          <Settings2 className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Settings (Coming Soon)</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="default" size="icon" className="bg-primary hover:bg-primary/80 text-primary-foreground p-1.5 rounded w-9 h-9" onClick={handleToggleFullscreen}>
                          <Expand className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Fullscreen</p></TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            )}
            
            {/* Participant Avatars */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-auto max-w-4/5 md:max-w-3/4 lg:max-w-1/2 h-auto pb-1 pt-2 px-4 bg-muted/30 rounded-t-xl flex justify-center items-end space-x-2 md:space-x-3 shadow-xl backdrop-blur-sm">
              {allParticipants.map(user => (
                <div key={user.id} className="flex flex-col items-center text-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Avatar className={`h-12 w-12 md:h-16 md:w-16 border-2 ${user.isHost ? 'border-accent ring-4 ring-accent/50' : 'border-primary ring-2 ring-primary/50'} mb-0.5 hover:scale-110 transition-transform cursor-pointer`}>
                        <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint={user.hint} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent><p>{user.isHost ? `${user.name} (Host)` : user.name}</p></TooltipContent>
                  </Tooltip>
                  <span className={`text-xs max-w-[60px] truncate ${user.isHost ? 'font-semibold text-accent' : 'text-muted-foreground'}`}>
                    {user.isHost ? 'Host' : user.name}
                  </span>
                </div>
              ))}
            </div>
          </main>
        </div>

        {/* Right Chat Sidebar */}
        <aside className="w-80 lg:w-96 bg-card border-l border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="text-xl font-semibold mb-3 flex items-center justify-between font-headline">
              Room Menu
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon"><Settings className="h-5 w-5" /></Button>
                </TooltipTrigger>
                <TooltipContent><p>Room Settings</p></TooltipContent>
              </Tooltip>
            </h2>

            <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
              <DialogTrigger asChild>
                <Button className="w-full mb-3 bg-primary/90 hover:bg-primary">
                  <UserPlus className="h-5 w-5 mr-2" /> Invite Friends
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
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
                    onClick={() => setIsMicOn(!isMicOn)}
                    className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground shadow-md active:shadow-inner active:translate-y-px border-b-4 border-muted"
                    size="icon"
                  >
                    {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5 text-destructive" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{isMicOn ? "Mute Mic" : "Unmute Mic"}</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={() => setIsCameraOn(!isCameraOn)}
                    className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground shadow-md active:shadow-inner active:translate-y-px border-b-4 border-muted"
                    size="icon"
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
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 mb-3 ${msg.user === currentUser.name ? 'justify-end' : ''}`}>
                {msg.user !== currentUser.name && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={msg.avatar || `https://placehold.co/40x40.png?text=${msg.user.charAt(0)}`} alt={msg.user} data-ai-hint="user avatar" />
                    <AvatarFallback>{msg.user.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-[75%] p-2 rounded-lg shadow-sm ${msg.user === currentUser.name ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                  <p className="text-xs font-semibold mb-0.5">{msg.user === 'System' ? 'System Notice' : msg.user}</p>
                  <p className="text-sm">{msg.text}</p>
                  <p className="text-xs text-muted-foreground/80 mt-1 text-right">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                 {msg.user === currentUser.name && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={msg.avatar} alt={msg.user} data-ai-hint="user avatar host" />
                    <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </ScrollArea>
          <form onSubmit={handleSendMessage} className="p-3 border-t border-border flex gap-2 bg-card">
            <Input
              type="text"
              placeholder="Type a message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-grow bg-background focus:ring-primary"
            />
            <Button type="submit" size="icon" aria-label="Send message" className="bg-primary hover:bg-primary/80">
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

      </div>
    </TooltipProvider>
  );
}


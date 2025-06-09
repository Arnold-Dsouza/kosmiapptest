
"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Video,
  ScreenShare,
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
  Gem,
  PlusCircle,
  Globe,
  X, // X icon is still available if needed, but DialogClose component is not used directly here.
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
  DialogHeader, // Import DialogHeader
  DialogTitle,   // Import DialogTitle
  // DialogClose, // Explicit DialogClose from RoomClient is removed
} from "@/components/ui/dialog";
import SelectMediaModal from './SelectMediaModal';


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

const placeholderUsers = [
  { id: '1', name: 'Alex', avatarUrl: 'https://placehold.co/80x80.png?text=A' , hint: 'person avatar'},
  { id: '2', name: 'Sam', avatarUrl: 'https://placehold.co/80x80.png?text=S' , hint: 'person avatar'},
  { id: '3', name: 'Casey', avatarUrl: 'https://placehold.co/80x80.png?text=C' , hint: 'person avatar'},
];


export default function RoomClient({ roomId }: RoomClientProps) {
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isSelectMediaModalOpen, setIsSelectMediaModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMessages(prev => [...prev, {id: Date.now().toString(), user: "System", text: `Welcome to room ${roomId}! This is a new design.`, timestamp: new Date()}]);
    }, 1000);
    return () => clearTimeout(timer);
  }, [roomId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      setMessages([...messages, {
        id: Date.now().toString(),
        user: 'You',
        text: chatInput.trim(),
        timestamp: new Date(),
        avatar: 'https://placehold.co/40x40.png?text=Me'
      }]);
      setChatInput('');
    }
  };

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
              <Button variant="default" size="sm" className="bg-pink-600 hover:bg-pink-700 text-white">
                <Gem className="h-4 w-4 mr-2" /> Subscribe
              </Button>
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
                <TooltipContent><p>Participants</p></TooltipContent>
              </Tooltip>
               <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon"><Maximize className="h-5 w-5" /></Button>
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
          <main className="flex-1 flex flex-col items-center justify-center p-4 relative bg-background">
            <div className="w-full max-w-4xl aspect-[16/7] bg-black/50 rounded-lg shadow-2xl flex flex-col items-center justify-center border border-border">
              <video ref={videoRef} className="w-full h-full object-cover rounded-md hidden" autoPlay muted />
              <div className="text-center p-8">
                <h2 className="text-2xl font-semibold text-muted-foreground mb-4">Your virtual space is ready.</h2>
                <Dialog open={isSelectMediaModalOpen} onOpenChange={setIsSelectMediaModalOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="bg-primary hover:bg-primary/80">
                      <PlaySquare className="h-6 w-6 mr-2" /> Select Media
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl w-[95vw] md:w-[90vw] h-auto md:h-[90vh] p-0 border-0 bg-transparent shadow-none data-[state=open]:!animate-none data-[state=closed]:!animate-none">
                    <DialogHeader className="sr-only">
                      <DialogTitle>Select Media</DialogTitle>
                    </DialogHeader>
                    <SelectMediaModal />
                    {/* The custom DialogClose element previously here has been removed.
                        The DialogContent from ui/dialog.tsx provides its own close button. */}
                  </DialogContent>
                </Dialog>
                <p className="text-sm text-muted-foreground mt-4">Watch videos, share your screen, or play games together.</p>
              </div>
            </div>

            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 md:w-1/2 lg:w-1/3 h-20 md:h-28 bg-muted/30 rounded-t-full flex justify-center items-end p-2 pb-0 space-x-2 md:space-x-4 shadow-xl backdrop-blur-sm">
              {placeholderUsers.map(user => (
                <Tooltip key={user.id}>
                  <TooltipTrigger asChild>
                    <Avatar className="h-12 w-12 md:h-16 md:w-16 border-2 border-primary ring-2 ring-primary/50 mb-2 md:mb-3 hover:scale-110 transition-transform cursor-pointer">
                      <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint={user.hint} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent><p>{user.name}</p></TooltipContent>
                </Tooltip>
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
            <Button className="w-full mb-3 bg-primary/90 hover:bg-primary">
              <UserPlus className="h-5 w-5 mr-2" /> Invite Friends
            </Button>
            <div className="flex items-center justify-around gap-2">
               <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => setIsMicOn(!isMicOn)} className="flex-1">
                    {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5 text-destructive" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{isMicOn ? "Mute Mic" : "Unmute Mic"}</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => setIsCameraOn(!isCameraOn)} className="flex-1">
                    {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5 text-destructive" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{isCameraOn ? "Stop Camera" : "Start Camera"}</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="flex-1"><ScreenShare className="h-5 w-5" /></Button>
                </TooltipTrigger>
                <TooltipContent><p>Share Screen</p></TooltipContent>
              </Tooltip>
            </div>
          </div>
          <div className="p-2 text-sm text-muted-foreground border-b border-border">
            <Users className="h-4 w-4 inline mr-1" /> {placeholderUsers.length + 1} online
          </div>

          <ScrollArea className="flex-grow p-3 pr-2">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 mb-3 ${msg.user === 'You' ? 'justify-end' : ''}`}>
                {msg.user !== 'You' && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={msg.avatar || `https://placehold.co/40x40.png?text=${msg.user.charAt(0)}`} alt={msg.user} data-ai-hint="user avatar" />
                    <AvatarFallback>{msg.user.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-[75%] p-2 rounded-lg shadow-sm ${msg.user === 'You' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                  <p className="text-xs font-semibold mb-0.5">{msg.user === 'System' ? 'System Notice' : msg.user}</p>
                  <p className="text-sm">{msg.text}</p>
                  <p className="text-xs text-muted-foreground/80 mt-1 text-right">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                 {msg.user === 'You' && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={msg.avatar} alt={msg.user} data-ai-hint="user avatar" />
                    <AvatarFallback>{msg.user.charAt(0)}</AvatarFallback>
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
      </div>
    </TooltipProvider>
  );
}

  
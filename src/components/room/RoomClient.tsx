"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link'; // Added import for Link
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Video, ScreenShare, Edit3, Gamepad2, Users, Settings, MessageSquare, Send, LogOut, Mic, MicOff, VideoOff, Maximize } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

export default function RoomClient({ roomId }: RoomClientProps) {
  const [currentView, setCurrentView] = useState('video'); // 'video', 'whiteboard', 'games'
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);

  // Effect to simulate receiving messages for placeholder
  useEffect(() => {
    const timer = setTimeout(() => {
      setMessages(prev => [...prev, {id: Date.now().toString(), user: "System", text: `Welcome to room ${roomId}!`, timestamp: new Date()}]);
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
        avatar: 'https://placehold.co/40x40.png'
      }]);
      setChatInput('');
    }
  };

  const renderMainContent = () => {
    switch (currentView) {
      case 'whiteboard':
        return <div className="flex-grow bg-card flex items-center justify-center rounded-lg shadow-inner"><p className="text-2xl text-muted-foreground">Shared Whiteboard Area</p></div>;
      case 'games':
        return <div className="flex-grow bg-card flex items-center justify-center rounded-lg shadow-inner"><p className="text-2xl text-muted-foreground">Embedded Games Area</p></div>;
      case 'video':
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="aspect-video bg-muted flex items-center justify-center overflow-hidden relative group">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={`https://placehold.co/100x100.png?text=User${i+1}`} alt={`User ${i+1}`} data-ai-hint="person avatar" />
                  <AvatarFallback>{`U${i+1}`}</AvatarFallback>
                </Avatar>
                <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">User {i+1}</div>
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>
        );
    }
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-secondary/30 text-foreground">
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col p-4 gap-4">
          <header className="flex justify-between items-center">
            <h1 className="text-2xl font-bold font-headline">Room: <span className="text-primary">{roomId}</span></h1>
            <div className="flex items-center gap-2">
               <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => setIsMicOn(!isMicOn)}>
                    {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5 text-destructive" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{isMicOn ? "Mute Mic" : "Unmute Mic"}</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => setIsCameraOn(!isCameraOn)}>
                    {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5 text-destructive" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{isCameraOn ? "Stop Camera" : "Start Camera"}</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon"><ScreenShare className="h-5 w-5" /></Button>
                </TooltipTrigger>
                <TooltipContent><p>Share Screen</p></TooltipContent>
              </Tooltip>
              <Separator orientation="vertical" className="h-8 mx-2" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon"><Users className="h-5 w-5" /></Button>
                </TooltipTrigger>
                <TooltipContent><p>Participants</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon"><Settings className="h-5 w-5" /></Button>
                </TooltipTrigger>
                <TooltipContent><p>Room Settings</p></TooltipContent>
              </Tooltip>
              <Button variant="destructive" size="sm" asChild>
                <Link href="/">
                  <LogOut className="h-4 w-4 mr-2" /> Leave
                </Link>
              </Button>
            </div>
          </header>

          <div className="flex-grow flex flex-col bg-background p-4 rounded-lg shadow-md">
            {renderMainContent()}
          </div>
          
          <nav className="bg-background p-2 rounded-lg shadow-md flex justify-center items-center gap-2">
            <Button variant={currentView === 'video' ? 'default' : 'outline'} onClick={() => setCurrentView('video')} className="gap-2">
              <Video className="h-5 w-5" /> Video Grid
            </Button>
            <Button variant={currentView === 'whiteboard' ? 'default' : 'outline'} onClick={() => setCurrentView('whiteboard')} className="gap-2">
              <Edit3 className="h-5 w-5" /> Whiteboard
            </Button>
            <Button variant={currentView === 'games' ? 'default' : 'outline'} onClick={() => setCurrentView('games')} className="gap-2">
              <Gamepad2 className="h-5 w-5" /> Games
            </Button>
          </nav>
        </main>

        {/* Sidebar for Chat */}
        <aside className="w-80 lg:w-96 bg-background border-l border-border flex flex-col p-4">
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2 font-headline">
            <MessageSquare className="h-6 w-6 text-primary" /> Live Chat
          </h2>
          <ScrollArea className="flex-grow mb-3 pr-3 border rounded-md p-2 bg-muted/30 shadow-inner">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 mb-3 ${msg.user === 'You' ? 'justify-end' : ''}`}>
                {msg.user !== 'You' && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={msg.avatar || `https://placehold.co/40x40.png?text=${msg.user.charAt(0)}`} alt={msg.user} data-ai-hint="user avatar" />
                    <AvatarFallback>{msg.user.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-[75%] p-2 rounded-lg shadow-sm ${msg.user === 'You' ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
                  <p className="text-xs font-semibold mb-0.5">{msg.user}</p>
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
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input 
              type="text" 
              placeholder="Type a message..." 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-grow"
            />
            <Button type="submit" size="icon" aria-label="Send message">
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </aside>
      </div>
    </TooltipProvider>
  );
}

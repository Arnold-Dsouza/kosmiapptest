
"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MountainIcon, Menu, Plus, Users } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";


export default function Navbar() {
  const router = useRouter();
  const { toast } = useToast();
  const [isJoinRoomDialogOpen, setIsJoinRoomDialogOpen] = useState(false);
  const [joinRoomInput, setJoinRoomInput] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleJoinRoom = () => {
    if (!joinRoomInput.trim()) {
      toast({
        variant: "destructive",
        title: "Input Required",
        description: "Please enter a room ID or link.",
      });
      return;
    }

    let roomId = joinRoomInput.trim();
    const roomPathSegment = '/room/';
    const roomPathIndex = roomId.lastIndexOf(roomPathSegment);

    if (roomPathIndex !== -1) {
      roomId = roomId.substring(roomPathIndex + roomPathSegment.length);
    }

    // Remove potential query params or hash
    roomId = roomId.split('?')[0].split('#')[0];

    if (roomId) {
      const formattedRoomId = roomId.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      router.push(`/room/${formattedRoomId}`);
      setIsJoinRoomDialogOpen(false);
      setJoinRoomInput('');
    } else {
      toast({
        variant: "destructive",
        title: "Invalid Room ID",
        description: "Could not extract a valid room ID from your input.",
      });
    }
  };

  const generateRandomSuffix = (length = 7) => {
    return Math.random().toString(36).substring(2, 2 + length);
  };

  const handleQuickCreateRoom = () => {
    const uniqueRoomId = `room-${generateRandomSuffix()}`;
    router.push(`/room/${uniqueRoomId}`);
  };
  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60 mobile-header-safe">
        <div className="container flex h-14 sm:h-16 items-center px-4">
          <Link href="/" className="mr-4 sm:mr-6 flex items-center space-x-2 min-w-0">
            <MountainIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
            <span className="font-bold text-lg sm:text-xl font-headline text-foreground truncate">OurScreen</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex flex-1 items-center space-x-6">
            {/* Future nav links can go here: Features, Pricing, About */}
          </nav>
          
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-2">
            <Button
              variant="ghost"
              className="text-foreground hover:bg-primary/10 hover:text-primary"
              onClick={() => setIsJoinRoomDialogOpen(true)}
            >
              <Users className="h-4 w-4 mr-2" />
              Join Room
            </Button>
            <Button 
              onClick={handleQuickCreateRoom} 
              className="bg-primary hover:bg-primary/80 text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Room
            </Button>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden ml-auto">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 sm:w-96">
                <SheetHeader>
                  <SheetTitle className="text-left">Menu</SheetTitle>
                  <SheetDescription className="text-left">
                    Create or join a room to get started.
                  </SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-6">
                  <Button 
                    onClick={() => {
                      handleQuickCreateRoom();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full bg-primary hover:bg-primary/80 text-primary-foreground justify-start"
                    size="lg"
                  >
                    <Plus className="h-5 w-5 mr-3" />
                    Create Room
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    size="lg"
                    onClick={() => {
                      setIsJoinRoomDialogOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <Users className="h-5 w-5 mr-3" />
                    Join Room
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>      <Dialog open={isJoinRoomDialogOpen} onOpenChange={setIsJoinRoomDialogOpen}>
        <DialogContent className="sm:max-w-[425px] mx-4 w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>Join Room</DialogTitle>
            <DialogDescription>
              Enter the room ID or the full room link to join.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="room-link-input">
                Room ID/Link
              </Label>
              <Input
                id="room-link-input"
                value={joinRoomInput}
                onChange={(e) => setJoinRoomInput(e.target.value)}
                placeholder="e.g., awesome-party or https://.../room/awesome-party"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleJoinRoom();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsJoinRoomDialogOpen(false);
                setJoinRoomInput('');
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={handleJoinRoom}
              className="bg-primary hover:bg-primary/80 text-primary-foreground w-full sm:w-auto"
            >
              Join
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

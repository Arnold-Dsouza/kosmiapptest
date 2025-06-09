
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
import { MountainIcon } from 'lucide-react'; // Using MountainIcon as a placeholder logo
import { useToast } from "@/hooks/use-toast";


export default function Navbar() {
  const router = useRouter();
  const { toast } = useToast();
  const [isJoinRoomDialogOpen, setIsJoinRoomDialogOpen] = useState(false);
  const [joinRoomInput, setJoinRoomInput] = useState('');

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
      <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <MountainIcon className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl sm:inline-block font-headline text-foreground">Virtual Hub</span>
          </Link>
          <nav className="flex flex-1 items-center space-x-4 sm:space-x-6">
            {/* Future nav links can go here: Features, Pricing, About */}
          </nav>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              className="text-foreground hover:bg-primary/10 hover:text-primary"
              onClick={() => setIsJoinRoomDialogOpen(true)}
            >
              Join Room
            </Button>
            <Button 
              onClick={handleQuickCreateRoom} 
              className="bg-primary hover:bg-primary/80 text-primary-foreground"
            >
              Create Room
            </Button>
          </div>
        </div>
      </header>

      <Dialog open={isJoinRoomDialogOpen} onOpenChange={setIsJoinRoomDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Join Room</DialogTitle>
            <DialogDescription>
              Enter the room ID or the full room link to join.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="room-link-input" className="text-right">
                Room ID/Link
              </Label>
              <Input
                id="room-link-input"
                value={joinRoomInput}
                onChange={(e) => setJoinRoomInput(e.target.value)}
                className="col-span-3"
                placeholder="e.g., awesome-party or https://.../room/awesome-party"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleJoinRoom();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsJoinRoomDialogOpen(false);
                setJoinRoomInput('');
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={handleJoinRoom}
              className="bg-primary hover:bg-primary/80 text-primary-foreground"
            >
              Join
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

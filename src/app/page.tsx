
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import FeatureCard from '@/components/FeatureCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Film, Gamepad2, Users, ScreenShare, Edit3, Music, CheckCircle, Server, Globe } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [isCreateRoomDialogOpen, setIsCreateRoomDialogOpen] = useState(false);
  const [roomNameInput, setRoomNameInput] = useState('');

  const features = [
    {
      icon: Film,
      title: 'Watch Videos Together',
      description: 'Sync YouTube, Vimeo, or local files. Enjoy movies and shows with friends in real-time.',
      imageUrl: 'https://placehold.co/600x400.png',
      imageHint: 'cinema screen',
    },
    {
      icon: Gamepad2,
      title: 'Play Games Online',
      description: 'Dive into a variety of embedded online games or share your own emulated classics.',
      imageUrl: 'https://placehold.co/600x400.png',
      imageHint: 'game controllers',
    },
    {
      icon: Users,
      title: 'Hang Out & Chat',
      description: 'Seamless video and text chat keeps everyone connected. Share moments and laughs.',
      imageUrl: 'https://placehold.co/600x400.png',
      imageHint: 'people chatting',
    },
    {
      icon: ScreenShare,
      title: 'Share Your Screen',
      description: 'Present, collaborate, or show anything on your desktop with high-quality screen sharing.',
      imageUrl: 'https://placehold.co/600x400.png',
      imageHint: 'desktop monitor',
    },
    {
      icon: Edit3,
      title: 'Collaborate on Whiteboards',
      description: 'Brainstorm ideas, draw, and strategize together on a shared digital whiteboard.',
      imageUrl: 'https://placehold.co/600x400.png',
      imageHint: 'whiteboard drawing',
    },
    {
      icon: Music,
      title: 'Listen to Music',
      description: 'Share your favorite tunes or discover new ones together with synchronized music playback.',
      imageUrl: 'https://placehold.co/600x400.png',
      imageHint: 'headphones music',
    },
  ];

  const highlights = [
    { icon: CheckCircle, text: 'No Sign-up Required: Jump straight into the fun.' },
    { icon: Globe, text: 'Works Everywhere: Access from any modern web browser.' },
    { icon: Server, text: 'Powerful & Customizable: Tailor your room to your liking.' },
  ];

  const generateRandomSuffix = (length = 5) => {
    return Math.random().toString(36).substring(2, 2 + length);
  };

  const handleCreateRoom = () => {
    if (roomNameInput.trim()) {
      const formattedBaseName = roomNameInput.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const randomSuffix = generateRandomSuffix();
      const uniqueRoomId = `${formattedBaseName}-${randomSuffix}`;
      router.push(`/room/${uniqueRoomId}`);
      setIsCreateRoomDialogOpen(false);
      setRoomNameInput('');
    }
  };

  const handleQuickCreateRoom = () => {
    const randomSuffix = generateRandomSuffix(7);
    const uniqueRoomId = `room-${randomSuffix}`;
    router.push(`/room/${uniqueRoomId}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-20 md:py-32 bg-gradient-to-br from-background to-secondary/30">
          <div className="container text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight font-headline">
              Your Space, Your Rules. <span className="text-primary">Instantly.</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground">
              Create a room, invite your friends, and enjoy videos, games, and more together. 
              No sign-up needed, completely free.
            </p>
            <div className="mt-10 max-w-md mx-auto flex flex-col sm:flex-row justify-center">
              <Button 
                size="lg" 
                className="h-12 text-base shadow-md hover:shadow-lg transition-shadow bg-primary hover:bg-primary/80 text-primary-foreground"
                onClick={() => setIsCreateRoomDialogOpen(true)}
              >
                Create Room With Name
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              or <Button variant="link" className="text-primary p-0 h-auto" onClick={handleQuickCreateRoom}>create a quick room</Button>
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 md:py-24 bg-background">
          <div className="container">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 font-headline text-foreground">
              Everything You Need to <span className="text-primary">Connect & Play</span>
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature) => (
                <FeatureCard
                  key={feature.title}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  imageUrl={feature.imageUrl}
                  imageHint={feature.imageHint}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Highlights Section */}
        <section className="py-16 md:py-24 bg-secondary/20">
          <div className="container">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              {highlights.map((highlight) => (
                <div key={highlight.text} className="p-6 bg-card rounded-lg shadow-md">
                  <highlight.icon className="h-12 w-12 text-accent mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2 font-headline text-card-foreground">{highlight.text.split(':')[0]}</h3>
                  <p className="text-muted-foreground">{highlight.text.split(':')[1]?.trim()}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* "And More" Section */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-headline text-foreground">And So Much More...</h2>
            <p className="max-w-xl mx-auto text-lg text-muted-foreground mb-8">
              Virtual Hub is packed with features to make your online gatherings unforgettable. From custom room settings to moderation tools, you're in control.
            </p>
            <Image 
              src="https://placehold.co/1200x600.png" 
              alt="Collage of app features" 
              width={1200} 
              height={600}
              className="rounded-lg shadow-xl mx-auto"
              data-ai-hint="app collage features"
            />
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 md:py-32 bg-primary text-primary-foreground">
          <div className="container text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 font-headline">Ready to Start Your Hub?</h2>
            <p className="max-w-lg mx-auto text-lg text-primary-foreground/90 mb-8">
              It takes just a click to create your own private space. No downloads, no hassle.
            </p>
            <Button 
              size="lg" 
              variant="secondary" 
              className="text-lg h-14 px-8 shadow-md hover:shadow-lg transition-shadow bg-accent hover:bg-accent/80 text-accent-foreground" 
              onClick={handleQuickCreateRoom}
            >
              Create Your Free Room Now
            </Button>
          </div>
        </section>
      </main>
      <Footer />

      <Dialog open={isCreateRoomDialogOpen} onOpenChange={setIsCreateRoomDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Set Room Name</DialogTitle>
            <DialogDescription>
              Enter a name for your new room. A random suffix will be added to ensure uniqueness.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="room-name-modal" className="text-right">
                Name
              </Label>
              <Input
                id="room-name-modal"
                value={roomNameInput}
                onChange={(e) => setRoomNameInput(e.target.value)}
                className="col-span-3"
                placeholder="e.g., movie-night"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateRoom();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              onClick={handleCreateRoom}
              disabled={!roomNameInput.trim()}
              className="bg-primary hover:bg-primary/80 text-primary-foreground"
            >
              Create & Go
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

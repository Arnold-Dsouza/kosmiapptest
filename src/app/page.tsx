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
      imageUrl: '/images/watchtogether.jpg',
      imageHint: 'cinema screen',
    },
    {
      icon: Gamepad2,
      title: 'Play Games Online',
      description: 'Dive into a variety of embedded online games or share your own emulated classics.',
      imageUrl: '/images/Play Games Online.jpg',
      imageHint: 'game controllers',
    },
    {
      icon: Users,
      title: 'Hang Out & Chat',
      description: 'Seamless video and text chat keeps everyone connected. Share moments and laughs.',
      imageUrl: '/images/Hang Out & Chat.jpg',
      imageHint: 'people chatting',
    },
    {
      icon: ScreenShare,
      title: 'Share Your Screen',
      description: 'Present, collaborate, or show anything on your desktop with high-quality screen sharing.',
      imageUrl: '/images/Share Your Screen.jpg',
      imageHint: 'desktop monitor',
    },
    {
      icon: Edit3,
      title: 'Collaborate on Whiteboards',
      description: 'Brainstorm ideas, draw, and strategize together on a shared digital whiteboard.',
      imageUrl: '/images/Collaborate on Whiteboards online.jpg',
      imageHint: 'whiteboard drawing',
    },
    {
      icon: Music,
      title: 'Listen to Music',
      description: 'Share your favorite tunes or discover new ones together with synchronized music playback.',
      imageUrl: '/images/music.jpg',
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

  return (    <div className="flex flex-col min-h-screen bg-background text-foreground mobile-safe">
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-12 sm:py-20 md:py-32 bg-gradient-to-br from-background to-secondary/30 px-4">
          <div className="container text-center max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight font-headline leading-tight">
              Your Space, Your Rules. <span className="text-primary">Instantly.</span>
            </h1>
            <p className="mt-4 sm:mt-6 max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-muted-foreground px-4">
              Create a room, invite your friends, and enjoy videos, games, and more together. 
              No sign-up needed, completely free.
            </p>
            <div className="mt-8 sm:mt-10 max-w-md mx-auto flex flex-col gap-3 px-4">
              <Button 
                size="lg" 
                className="h-12 sm:h-14 text-base sm:text-lg shadow-md hover:shadow-lg transition-shadow bg-primary hover:bg-primary/80 text-primary-foreground w-full"
                onClick={() => setIsCreateRoomDialogOpen(true)}
              >
                Create Room With Name
              </Button>
              <p className="text-sm text-muted-foreground">
                or <Button variant="link" className="text-primary p-0 h-auto text-sm" onClick={handleQuickCreateRoom}>create a quick room</Button>
              </p>
            </div>
          </div>
        </section>        {/* Features Section */}
        <section id="features" className="py-12 sm:py-16 md:py-24 bg-background px-4">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-12 font-headline text-foreground px-4">
              Everything You Need to <span className="text-primary">Connect & Play</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
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
        </section>        {/* Highlights Section */}
        <section className="py-12 sm:py-16 md:py-24 bg-secondary/20 px-4">
          <div className="container max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-12 font-headline text-foreground">
              Why Choose <span className="text-primary">OurScreen</span>?
            </h2>            <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
              {highlights.map((highlight, index) => (
                <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 sm:p-6 bg-card/50 rounded-lg border border-border">
                  <div className="flex-shrink-0">
                    <highlight.icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  </div>
                  <p className="text-sm sm:text-base text-foreground font-medium leading-relaxed">{highlight.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-12 sm:py-16 md:py-24 bg-background px-4">
          <div className="container max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-4 font-headline text-foreground">
              Meet the <span className="text-primary">Creator</span>
            </h2>
            <p className="max-w-2xl mx-auto text-center text-base sm:text-lg text-muted-foreground mb-8 sm:mb-12 px-4">
              Passionate about bringing people together through technology and creating seamless digital experiences.
            </p>
            <div className="max-w-md mx-auto">
              <div className="bg-card rounded-xl shadow-lg p-6 sm:p-8 text-center border border-border/50">
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6">
                  <Image
                    src="/images/creator.jpg"
                    alt="Creator Profile"
                    width={128}
                    height={128}
                    className="rounded-full object-cover border-4 border-primary/20"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-2">
                    <Users className="h-4 w-4" />
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-card-foreground mb-2">Arnold Dsouza</h3>
                <p className="text-primary font-semibold mb-3">Founder & Creator</p>
              
                <div className="flex justify-center space-x-3">
                  
                 
                </div>
              </div>
            </div>
          </div>
        </section>        
        {/* "And More" Section */}
        <section className="py-12 sm:py-16 md:py-24 bg-background px-4">
          <div className="container text-center max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 font-headline text-foreground">And So Much More...</h2>
            <p className="max-w-xl mx-auto text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 px-4">
              OurScreen is packed with features to make your online gatherings unforgettable. From custom room settings to moderation tools, you're in control.
            </p>            
            <div className="overflow-hidden rounded-lg shadow-xl mx-auto max-w-full">
              <Image 
                src="/images/1200x600.jpg" 
                alt="Collage of app features" 
                width={1200} 
                height={600}
                className="w-full h-auto object-cover"
                data-ai-hint="app collage features"
              />
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-16 sm:py-20 md:py-32 bg-primary text-primary-foreground px-4 mobile-video-controls">
          <div className="container text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 font-headline">Ready to Start Your Hub?</h2>
            <p className="max-w-lg mx-auto text-base sm:text-lg text-primary-foreground/90 mb-6 sm:mb-8 px-4">
              It takes just a click to create your own private space. No downloads, no hassle.
            </p>
            <Button 
              size="lg" 
              variant="secondary" 
              className="text-base sm:text-lg h-12 sm:h-14 px-6 sm:px-8 shadow-md hover:shadow-lg transition-shadow bg-accent hover:bg-accent/80 text-accent-foreground w-full sm:w-auto" 
              onClick={handleQuickCreateRoom}
            >
              Create Your Free Room Now
            </Button>
          </div>
        </section>
      </main>
      <Footer />      <Dialog open={isCreateRoomDialogOpen} onOpenChange={setIsCreateRoomDialogOpen}>
        <DialogContent className="sm:max-w-[425px] mx-4 w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>Set Room Name</DialogTitle>
            <DialogDescription>
              Enter a name for your new room. A random suffix will be added to ensure uniqueness.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="room-name-modal">
                Name
              </Label>
              <Input
                id="room-name-modal"
                value={roomNameInput}
                onChange={(e) => setRoomNameInput(e.target.value)}
                placeholder="e.g., movie-night"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateRoom();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline"
              onClick={() => {
                setIsCreateRoomDialogOpen(false);
                setRoomNameInput('');
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={handleCreateRoom}
              disabled={!roomNameInput.trim()}
              className="bg-primary hover:bg-primary/80 text-primary-foreground w-full sm:w-auto"
            >
              Create & Go
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import Image from 'next/image';
import Link from 'next/link';
import * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, ChevronDown, MonitorPlay, Link2, Folder, Search, Compass, Tv, Gamepad2, Sparkles, Info, Gem, Youtube, Clapperboard, Globe, Puzzle, ScreenShare } from 'lucide-react';

interface SelectMediaModalProps {
  onShareScreen?: () => void;
  onPlayUrl: (url: string) => void;
}

const categories = [
  { name: 'Discover', icon: Compass, id: 'discover' },
  { name: 'Streaming', icon: Tv, id: 'streaming' },
  { name: 'Games', icon: Gamepad2, id: 'games' },
  { name: 'Activities', icon: Sparkles, id: 'activities' },
  { name: 'Kosmi 101', icon: Info, id: 'kosmi101' },
];

const mediaItemsData = [
  { id: 'youtube', name: 'YouTube', imageUrl: 'https://placehold.co/200x120/FFF/000.png?text=YouTube', category: ['discover', 'streaming'], type: 'video_catalog', hint: 'youtube logo red' },
  { id: 'minigolf', name: 'Mini Golf Club', imageUrl: 'https://imgs.crazygames.com/mini-golf-club_16x9/20250106022059/mini-golf-club_16x9-cover?metadata=none&quality=70', category: ['discover', 'games'], type: 'crazy_game', hint: 'mini golf game' },
  { id: 'pool', name: '8 Ball Pool Billiards', imageUrl: 'https://placehold.co/200x120/000/FFF.png?text=8+Ball+Pool', category: ['discover', 'games'], type: 'crazy_game', hint: 'billiards game' },
  { id: 'tubi', name: 'Tubi', imageUrl: 'https://placehold.co/200x120/E50914/FFF.png?text=Tubi', category: ['discover', 'streaming'], type: 'video_catalog', hint: 'tubi tv logo' },
  { id: 'virtualbrowser', name: 'Virtual Browser', imageUrl: 'https://placehold.co/200x120/1E88E5/FFF.png?text=Virtual+Browser', category: ['discover', 'kosmi_apps'], type: 'kosmi_app', isPremium: true, hint: 'globe browser icon' },
  { id: 'netflix', name: 'Netflix', imageUrl: 'https://placehold.co/200x120/E50914/FFF.png?text=Netflix', category: ['streaming'], type: 'web_embed', hint: 'netflix logo dark' },
  { id: 'spotify', name: 'Spotify', imageUrl: 'https://placehold.co/200x120/1DB954/FFF.png?text=Spotify', category: ['streaming'], type: 'web_embed', hint: 'spotify logo green' },
  { id: 'openarena', name: 'Open Arena', imageUrl: 'https://placehold.co/200x120/555/FFF.png?text=Open+Arena', category: ['games'], type: 'kosmi_app', hint: 'game logo abstract' },
  { id: 'disneyplus', name: 'Disney+', imageUrl: 'https://placehold.co/200x120/0A285F/FFF.png?text=Disney%2B', category: ['streaming'], type: 'web_embed', hint: 'disney plus logo' },
  { id: 'max', name: 'Max', imageUrl: 'https://placehold.co/200x120/0033FF/FFF.png?text=Max', category: ['streaming'], type: 'web_embed', hint: 'max streaming logo' },
  { id: 'primevideo', name: 'Prime Video', imageUrl: 'https://placehold.co/200x120/00A8E1/FFF.png?text=Prime+Video', category: ['streaming'], type: 'web_embed', hint: 'amazon prime video' },
  { id: 'peacock', name: 'Peacock', imageUrl: 'https://placehold.co/200x120/000/FFF.png?text=Peacock', category: ['streaming'], type: 'web_embed', hint: 'peacock tv logo' },
];


export default function SelectMediaModal({ onShareScreen, onPlayUrl }: SelectMediaModalProps) {
  const [activeCategoryId, setActiveCategoryId] = useState(categories[0].id);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState<'main' | 'loadFile' | 'loadUrl'>('main');
  const [urlInput, setUrlInput] = useState('');

  const filteredMediaItems = mediaItemsData.filter(item => {
    const matchesCategory = item.category.includes(activeCategoryId) || activeCategoryId === 'discover';
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });  const handleMediaItemClick = (item: typeof mediaItemsData[0]) => {
    if (item.id === 'minigolf') {
      // Use the proper embed URL for CrazyGames Mini Golf Club with additional parameters
      // This format ensures better compatibility with our iframe
      const crazyGamesEmbedUrl = 'https://www.crazygames.com/embed/mini-golf-club?fullscreen=yes';
      console.log('Opening Mini Golf Club embed:', crazyGamesEmbedUrl);
      onPlayUrl(crazyGamesEmbedUrl);
    } else if (item.id === 'pool') {
      // Use the proper embed URL for CrazyGames 8 Ball Pool with additional parameters
      const poolEmbedUrl = 'https://www.crazygames.com/embed/8-ball-pool?fullscreen=yes';
      console.log('Opening 8 Ball Pool embed:', poolEmbedUrl);
      onPlayUrl(poolEmbedUrl);
    } else if (item.type === 'web_embed' || item.type === 'video_catalog' || item.type === 'crazy_game') {
      // Handle other media types as needed
      console.log(`Clicked on ${item.name}`);
    }
  };

  const handleOpenUrl = () => {
    if (urlInput.trim()) {
      onPlayUrl(urlInput.trim());
      setUrlInput('');
      setCurrentView('main'); // Optionally close modal or go back to main view
    }
  };

  if (currentView === 'loadFile') {
    return (
      <div className="flex flex-col h-full max-h-[90vh] md:h-[80vh] md:max-h-[700px] w-full bg-card text-card-foreground p-0 overflow-hidden rounded-lg">
        <div className="p-4 pr-12 border-b border-border flex items-center shrink-0">
          <Button variant="ghost" size="icon" onClick={() => setCurrentView('main')} className="mr-2 hover:bg-primary/10">
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </Button>
          <h2 className="text-xl md:text-2xl font-semibold text-foreground">Select Media</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Button
            size="lg"
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold mb-8 px-6 py-3 rounded-md"
          >
            Load a Video File...
          </Button>

          <div className="mb-8">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="link" className="text-sm text-muted-foreground hover:text-foreground hover:no-underline group">
                  Advanced Settings <ChevronDown className="h-4 w-4 ml-1 transition-transform group-data-[state=open]:rotate-180" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="bg-popover text-popover-foreground">
                <DropdownMenuItem disabled>Max file size: 2GB (Placeholder)</DropdownMenuItem>
                <DropdownMenuItem disabled>Enable direct play (Placeholder)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="text-xs text-muted-foreground space-y-1 max-w-md">
            <p>
              For list of supported video formats look <Link href="#" className="text-primary hover:underline">here</Link>.
            </p>
            <p>
              If you have problems with your file (e.g. audio missing) try converting your file using the <Link href="#" className="text-primary hover:underline">Kosmi Video Converter</Link>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'loadUrl') {
    return (
      <div className="flex flex-col h-full max-h-[90vh] md:h-[80vh] md:max-h-[700px] w-full bg-card text-card-foreground p-0 overflow-hidden rounded-lg">
        <div className="p-4 pr-12 border-b border-border flex items-center shrink-0">
          <Button variant="ghost" size="icon" onClick={() => setCurrentView('main')} className="mr-2 hover:bg-primary/10">
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </Button>
          <h2 className="text-xl md:text-2xl font-semibold text-foreground">Select Media</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="flex w-full max-w-xl items-center space-x-2">
            <Input
              type="text"
              placeholder="https://... or magnet:..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="bg-input border-border focus:ring-primary h-10 md:h-12 flex-grow"
            />
            <Button onClick={handleOpenUrl} className="bg-primary hover:bg-primary/80 h-10 md:h-12 px-6">
              Open
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main view (grid of media items)
  return (
    <div className="flex flex-col h-full max-h-[90vh] md:h-[80vh] md:max-h-[700px] w-full bg-card text-card-foreground p-0 overflow-hidden rounded-lg">
      <div className="p-3 md:p-4 pr-10 md:pr-12 border-b border-border shrink-0">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-0">
           <div className="flex items-center gap-2">
             <h2 className="text-xl md:text-2xl font-semibold mr-2 md:mr-4 text-foreground">Select</h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="lg" className="p-2 md:p-3 aspect-square h-auto" onClick={() => { if (onShareScreen) { onShareScreen(); } }}>
                  <MonitorPlay className="h-5 w-5 md:h-6 md:w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Share your screen or an application window</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="lg" className="p-2 md:p-3 aspect-square h-auto" onClick={() => setCurrentView('loadUrl')}>
                  <Link2 className="h-5 w-5 md:h-6 md:w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Open a website in a virtual browser</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="lg"
                  className="p-2 md:p-3 aspect-square h-auto"
                  onClick={() => setCurrentView('loadFile')}
                >
                  <Folder className="h-5 w-5 md:h-6 md:w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Load a video from your computer</p></TooltipContent>
            </Tooltip>
          </div>
          <div className="w-full md:w-2/5 lg:w-1/3 relative">
            <Input
              type="search"
              placeholder="Search apps and media content"
              className="bg-input border-border focus:ring-primary h-10 md:h-12 pr-10 text-sm md:text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-1/4 md:w-1/5 p-2 md:p-4 border-r border-border flex flex-col gap-1 md:gap-2 overflow-y-auto">
          {categories.map(category => (
            <Button
              key={category.id}
              variant={activeCategoryId === category.id ? "secondary" : "ghost"}
              className={`justify-start w-full text-left px-2 py-1.5 md:px-3 md:py-2 h-auto text-xs md:text-sm ${activeCategoryId === category.id ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'hover:bg-muted/50'}`}
              onClick={() => setActiveCategoryId(category.id)}
            >
              <category.icon className="mr-2 h-4 w-4 md:h-5 md:w-5 shrink-0" />
              <span className="truncate">{category.name}</span>
            </Button>
          ))}
        </aside>

        <main className="flex-1 p-3 md:p-6 overflow-y-auto">
            {filteredMediaItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                {filteredMediaItems.map(item => (
                  <Card
                    key={item.id}
                    className="overflow-hidden aspect-[16/10] flex flex-col items-center justify-center p-1 md:p-2 bg-secondary/30 hover:shadow-lg transition-shadow cursor-pointer hover:bg-secondary/50 border-border"
                    onClick={() => handleMediaItemClick(item)}
                  >                    <div className="relative w-full h-full flex items-center justify-center">
                       <Image src={item.imageUrl} alt={item.name} width={180} height={108} style={{objectFit: 'contain'}} data-ai-hint={item.hint} className="max-h-full max-w-full" />
                       {item.isPremium && <Gem className="absolute top-1 right-1 h-3 w-3 md:h-4 md:w-4 text-yellow-500 bg-black/50 rounded-full p-0.5" />}
                    </div>
                    <div className="mt-1 text-xs md:text-sm font-medium text-center truncate w-full px-1">
                      {item.name}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Search className="h-16 w-16 mb-4" />
                <p className="text-lg">No media found.</p>
                <p className="text-sm">Try adjusting your filters or search term.</p>
              </div>
            )}
        </main>
      </div>
    </div>
  );
}

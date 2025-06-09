
"use client";

import Image from 'next/image';
import * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog'; // DialogClose is handled by Dialog in parent
import { MonitorPlay, Link2, Folder, Search, Compass, Tv, Gamepad2, Sparkles, Info, Gem, Youtube, Clapperboard, Globe, Puzzle, ScreenShare } from 'lucide-react';

interface SelectMediaModalProps {
  // Props can be added here if needed for interaction, e.g., onMediaSelect
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
  { id: 'minigolf', name: 'Mini Golf Club', imageUrl: 'https://placehold.co/200x120/4CAF50/FFF.png?text=Mini+Golf', category: ['discover', 'games'], type: 'crazy_game', hint: 'mini golf game' },
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

const filterTabs = [
    { id: "all", label: "All", icon: undefined },
    { id: "video_catalog", label: "Video Catalogs", icon: Clapperboard },
    { id: "crazy_game", label: "Crazy Game", icon: Gamepad2 },
    { id: "web_embed", label: "Web embeds", icon: Globe },
    { id: "kosmi_app", label: "Kosmi Apps", icon: Puzzle },
    { id: "screen_shareable", label: "Screen shareable", icon: ScreenShare },
];


export default function SelectMediaModal({}: SelectMediaModalProps) {
  const [activeCategoryId, setActiveCategoryId] = useState(categories[0].id);
  const [activeFilterTabId, setActiveFilterTabId] = useState(filterTabs[0].id);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMediaItems = mediaItemsData.filter(item => {
    const matchesCategory = item.category.includes(activeCategoryId) || activeCategoryId === 'discover';
    const matchesFilterTab = activeFilterTabId === 'all' || item.type === activeFilterTabId;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesFilterTab && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full max-h-[90vh] md:h-[80vh] md:max-h-[700px] w-full bg-card text-card-foreground p-0 overflow-hidden rounded-lg">
      <DialogHeader className="p-4 border-b border-border flex flex-row justify-between items-center shrink-0">
        <DialogTitle className="text-xl md:text-2xl font-semibold">Select Media</DialogTitle>
        {/* The actual close (X) button is part of DialogClose in the parent Dialog component */}
      </DialogHeader>

      <div className="p-3 md:p-4 border-b border-border shrink-0">
        <div className="flex flex-col md:flex-row justify-between items-start mb-3 md:mb-4 gap-3 md:gap-0">
          <div className="flex gap-2">
            <Button variant="outline" size="lg" className="p-2 md:p-3 aspect-square h-auto"> <MonitorPlay className="h-5 w-5 md:h-6 md:w-6" /> </Button>
            <Button variant="outline" size="lg" className="p-2 md:p-3 aspect-square h-auto"> <Link2 className="h-5 w-5 md:h-6 md:w-6" /> </Button>
            <Button variant="outline" size="lg" className="p-2 md:p-3 aspect-square h-auto"> <Folder className="h-5 w-5 md:h-6 md:w-6" /> </Button>
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
        
        <Tabs value={activeFilterTabId} onValueChange={setActiveFilterTabId}>
          <TabsList className="bg-transparent p-0 overflow-x-auto whitespace-nowrap justify-start no-scrollbar">
            {filterTabs.map(tab => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id} 
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-muted/50 px-3 py-1.5 text-xs md:text-sm h-auto shrink-0"
              >
                {/* {tab.icon && <tab.icon className="mr-2 h-4 w-4 hidden sm:inline-block" />} */}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-1/4 md:w-1/5 p-2 md:p-4 border-r border-border flex flex-col gap-1 md:gap-2 overflow-y-auto">
          {categories.map(category => (
            <Button
              key={category.id}
              variant={activeCategoryId === category.id ? "secondary" : "ghost"}
              className={`justify-start w-full text-left px-2 py-1.5 md:px-3 md:py-2 h-auto text-xs md:text-sm ${activeCategoryId === category.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/50'}`}
              onClick={() => setActiveCategoryId(category.id)}
            >
              <category.icon className="mr-2 h-4 w-4 md:h-5 md:w-5 shrink-0" />
              <span className="truncate">{category.name}</span>
            </Button>
          ))}
        </aside>

        <main className="flex-1 p-3 md:p-6 overflow-y-auto">
          <TabsContent value={activeFilterTabId} className="mt-0 h-full">
            {filteredMediaItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                {filteredMediaItems.map(item => (
                  <Card 
                    key={item.id} 
                    className="overflow-hidden aspect-[16/10] flex flex-col items-center justify-center p-1 md:p-2 bg-secondary/30 hover:shadow-lg transition-shadow cursor-pointer hover:bg-secondary/50 border-border"
                  >
                    <div className="relative w-full h-full flex items-center justify-center">
                       <Image src={item.imageUrl} alt={item.name} width={180} height={108} objectFit="contain" data-ai-hint={item.hint} className="max-h-full max-w-full" />
                       {item.isPremium && <Gem className="absolute top-1 right-1 h-3 w-3 md:h-4 md:w-4 text-yellow-500 bg-black/50 rounded-full p-0.5" />}
                    </div>
                    {/* <CardContent className="p-1 md:p-2 text-center w-full mt-auto shrink-0">
                       <p className="text-xs md:text-sm font-medium truncate">{item.name}</p>
                    </CardContent> */}
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
          </TabsContent>
        </main>
      </div>
    </div>
  );
}
// Helper for no-scrollbar
// You might need to add this to your globals.css if it's not already there:
// .no-scrollbar::-webkit-scrollbar { display: none; }
// .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
// For Tailwind, ensure you have a plugin or utility for this if using JIT/AOT.
// Often, these are covered by default browser styles or reset stylesheets.
// For now, this component assumes Tailwind's default scrollbar utilities.
// If scrollbars persist on the TabsList, add the `no-scrollbar` class directly in your globals.css
// or use a Tailwind plugin like `tailwind-scrollbar-hide`.

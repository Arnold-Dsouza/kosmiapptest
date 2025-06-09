import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MountainIcon } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <MountainIcon className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl sm:inline-block font-headline">Virtual Hub</span>
        </Link>
        <nav className="flex flex-1 items-center space-x-4 sm:space-x-6">
          {/* Future nav links can go here: Features, Pricing, About */}
        </nav>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" asChild>
            <Link href="/room/public-lobby">Join Room</Link>
          </Button>
          <Button asChild>
            <Link href="/room/new-room">Create Room</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

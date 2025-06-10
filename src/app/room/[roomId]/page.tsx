import RoomClient from '@/components/room/RoomClient';
import type { Metadata } from 'next';
import Link from 'next/link';

// The Props type alias is removed.
// type Props = {
//   params: { roomId: string };
// };

export async function generateMetadata({ params }: { params: { roomId: string } }): Promise<Metadata> {
  return {
    title: `Room: ${params.roomId} | Virtual Hub`,
  };
}

export default function RoomPage({ params }: { params: { roomId: string } }) {
  // Basic validation or redirect if roomId is something like "new-room" (though this specific path might be handled differently)
  if (!params.roomId || params.roomId === "undefined") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Invalid Room ID</h1>
        <p className="mb-6 text-muted-foreground">The room ID is missing or invalid. Please try creating a new room or joining with a valid ID.</p>
        <Link href="/" className="text-primary hover:underline">Go to Homepage</Link>
      </div>
    );
  }

  return <RoomClient roomId={params.roomId} />;
}

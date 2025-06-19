import { Metadata } from 'next';
import RoomClient from '@/components/room/RoomClient';

type Props = {
  params: Promise<{ roomId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { roomId } = await params;
  return {
    title: `Room: ${roomId} | OurScreen`,
  };
}

export default async function RoomPage({ params }: Props) {
  const { roomId } = await params;
  
  // Validate room ID format
  const isValidRoomId = /^[a-zA-Z0-9-]+$/.test(roomId);

  if (!roomId || roomId === "undefined" || !isValidRoomId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Invalid Room ID</h1>
        <p className="text-muted-foreground mb-4">
          The room ID you're trying to access is invalid or doesn't exist.
        </p>
        <a href="/" className="text-primary hover:underline">
          Return to Home
        </a>
      </div>
    );
  }

  return <RoomClient roomId={roomId} />;
}

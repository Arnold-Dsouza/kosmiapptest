# Kosmi App

A Next.js application with LiveKit integration for real-time communication.

## Features

- Real-time video, audio, and screen sharing using LiveKit
- Chat functionality with Firebase Firestore
- User interface built with Tailwind CSS and Radix UI components

## Deployment

This application can be deployed on Vercel. See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for detailed instructions.

## Development

### Prerequisites

- Node.js and npm
- LiveKit account and credentials
- Firebase project (optional, for chat functionality)

### Setup

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env.local` file with the required environment variables (see `.env.example`)
4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:9002](http://localhost:9002) in your browser

## Environment Variables

- `LIVEKIT_API_KEY`: Your LiveKit API key
- `LIVEKIT_API_SECRET`: Your LiveKit API secret
- `LIVEKIT_URL`: Your LiveKit WebSocket URL

For Firebase configuration, see `.env.example` file.

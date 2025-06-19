# Vercel Deployment Guide

This guide will walk you through deploying your application to Vercel.

## Prerequisites

1. A [Vercel](https://vercel.com) account
2. [LiveKit](https://livekit.io) account and credentials
3. [Firebase](https://firebase.google.com) project (if using Firebase features)

## Deployment Steps

### 1. Push your code to a Git repository

Make sure your code is in a Git repository (GitHub, GitLab, or Bitbucket).

### 2. Import your project in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" > "Project"
3. Select your Git repository
4. Configure the project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `next build`
   - Output Directory: `.next`

### 3. Configure Environment Variables

Add the following environment variables in the Vercel project settings under **Settings > Environment Variables**:

#### LiveKit Configuration

- `LIVEKIT_API_KEY`: Your LiveKit API key
- `LIVEKIT_API_SECRET`: Your LiveKit API secret
- `LIVEKIT_URL`: Your LiveKit WebSocket URL (e.g., `wss://your-instance.livekit.cloud`)

#### Application Settings

- `NEXT_PUBLIC_BASE_URL`: The URL of your deployed application (e.g., `https://your-app.vercel.app`)

#### Firebase Configuration (if using Firebase)

- `NEXT_PUBLIC_FIREBASE_API_KEY`: Your Firebase API key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Your Firebase auth domain
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Your Firebase project ID
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: Your Firebase storage bucket
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Your Firebase messaging sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID`: Your Firebase app ID

### 4. Deploy

Click "Deploy" and wait for the build to complete.

## Post-Deployment

After successful deployment:

1. Test the LiveKit token generation by navigating to `/api/livekit/token` endpoint
2. Test room creation and joining
3. If you encounter any issues:
   - Check Vercel logs
   - Verify environment variables are correctly set
   - Make sure Firebase and LiveKit configurations are correct

## Development Workflow

For local development:

1. Create a `.env.local` file with the same environment variables used in Vercel
2. Run `npm run dev` to start the development server
3. Changes pushed to your main branch will automatically trigger a new deployment on Vercel

## Troubleshooting

### Environment Variable Issues

If you see an error message like `Environment Variable "LIVEKIT_API_KEY" references Secret "livekit_api_key", which does not exist`:

1. Go to your Vercel project **Settings > Environment Variables**
2. Add each environment variable directly:
   - Set the variable name (e.g., `LIVEKIT_API_KEY`)
   - Add the actual value (not a reference like `@livekit_api_key`)
   - Select the appropriate environments (Production, Preview, and Development)
   - Save

### Token Generation Issues

If LiveKit token generation fails:

1. Check that all LiveKit environment variables are correctly set in Vercel
2. Test the `/api/livekit/token` endpoint by making a POST request with:

   ```json
   {
     "room": "test-room",
     "username": "test-user"
   }
   ```

3. Check the response for detailed error information

### Firebase Connection Issues

- Verify Firebase credentials are correctly set
- Check Firebase console for security rules
- Ensure your IP address is not blocked

### Deployment Failures

- Review build logs in Vercel dashboard
- Check that your Next.js build is succeeding locally with `npm run build`

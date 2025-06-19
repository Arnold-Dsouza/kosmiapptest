# LiveKit Environment Variables Setup Guide

This document explains how to set up the LiveKit environment variables required for our application to work correctly on Vercel.

## Required Environment Variables

For LiveKit to work, you need to set up the following environment variables in your Vercel project settings:

1. `LIVEKIT_API_KEY` - Your LiveKit API key
2. `LIVEKIT_API_SECRET` - Your LiveKit API secret
3. `LIVEKIT_URL` - Your LiveKit server URL (WebSocket URL, starts with `wss://`)

## How to Set Up Environment Variables on Vercel

1. Go to your Vercel dashboard
2. Select the project
3. Click on "Settings" tab
4. Click on "Environment Variables" in the left sidebar
5. Add each of the variables listed above with their corresponding values
6. Make sure to add them to all environments (Production, Preview, and Development)
7. Save the changes

## Verifying Environment Variables

After deploying your application, you can verify that the environment variables are set correctly by visiting:

```
https://your-vercel-domain.vercel.app/api/livekit/config-check
```

This endpoint will show you whether each environment variable is properly set without revealing the actual secrets.

## Troubleshooting

If you see errors like "Generated JWT is not a string: object", it means that your LiveKit environment variables are not set correctly on Vercel.

Common issues:
- Environment variables are missing or empty
- API key or secret has incorrect format
- LIVEKIT_URL does not start with `wss://`

## Getting LiveKit Credentials

If you don't have LiveKit credentials yet:

1. Sign up at https://livekit.io
2. Create a new project
3. Navigate to the "Keys" section
4. Create a new API key
5. Copy the key and secret values to your environment variables

For the WebSocket URL, use the Cloud URL provided in your LiveKit Cloud dashboard.

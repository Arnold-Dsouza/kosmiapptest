// scripts/check-env.js
const requiredEnvVars = [
  'LIVEKIT_API_KEY',
  'LIVEKIT_API_SECRET',
  'LIVEKIT_URL'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('\x1b[31m%s\x1b[0m', '❌ Missing required environment variables:');
  missingEnvVars.forEach(envVar => {
    console.error(`  - ${envVar}`);
  });
  console.error('\x1b[33m%s\x1b[0m', '⚠️ Make sure to add these in your Vercel project settings or .env.local file.');
  process.exit(1);
} else {
  console.log('\x1b[32m%s\x1b[0m', '✅ All required environment variables are set.');
}

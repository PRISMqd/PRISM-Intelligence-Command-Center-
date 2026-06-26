# PRISM Intelligence Command Center

## Setup
1. Clone the repo
2. Install: `npm install`
3. Copy .env.local and fill in Supabase credentials
4. Run: `npm run dev`

## Environment Variables
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- NEXT_PUBLIC_APP_URL

## Database
Run the SQL migration in `supabase/migrations/001_prism_schema.sql` in your Supabase SQL editor before starting.

## Tech Stack
Next.js 14, TypeScript, Tailwind CSS, Supabase, Zustand, Recharts

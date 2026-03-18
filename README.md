# bababa

A trilingual job marketplace connecting Chinese companies in Uzbekistan with local workers.

## Features

- **Trilingual platform** (Uzbek, Chinese, Russian) with Uzbek as the default locale
- **AI-powered translation** — all job listings and messages are auto-translated via GPT-4o-mini
- **Real-time messaging** with automatic translation between Chinese and Uzbek/Russian
- **Job posting and application management** for companies and workers
- **Worker profiles** with HSK level, skills, and work experience
- **Company profiles** with verification
- **Mobile-responsive design** built with Tailwind CSS v4
- **ISR caching** for fast public pages

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Database & Auth:** Supabase
- **Styling:** Tailwind CSS v4
- **Internationalization:** next-intl
- **AI Translation:** OpenAI GPT-4o-mini
- **UI:** Lucide icons, class-variance-authority, tailwind-merge
- **Charts:** Recharts
- **Deployment:** Vercel

## Getting Started

```bash
# Clone the repository
git clone https://github.com/your-username/bababa.git
cd bababa

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Fill in the values (see Environment Variables below)

# Run Supabase migrations
npx supabase db push

# Start the dev server
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create a `.env.local` file with the following keys:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
NEXT_PUBLIC_SITE_URL=
```

## Deployment

- **Hosting:** Deployed on Vercel
- **Database:** Supabase (Mumbai region recommended for low latency)
- **Region:** Set the Vercel function region to match your Supabase region (e.g., `bom1` for Mumbai)

## License

All rights reserved.

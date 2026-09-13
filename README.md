# Shopify Product Builder

A premium client product intake studio for preparing Shopify-ready product data.

## Stack

- Next.js App Router with TypeScript
- Tailwind CSS
- Supabase Auth, Postgres, Storage, and Row Level Security
- Vercel-ready configuration

## Getting Started

1. Create a Supabase project on the free tier.
2. Run `supabase/schema.sql` in the Supabase SQL editor. This creates the single REP.MOVEMENT catalog, product colorways, variants, drops, templates, reviews, and audit tables.
3. Create a private storage bucket named `product-images`.
4. Copy `.env.example` to `.env.local` and fill in the Supabase URL and anon key.
5. Install dependencies and run:

```bash
npm install
npm run dev
```

The application is intentionally single-brand: there are no organizations, tenant switching, or billing concepts. Once Supabase is configured, protected routes use Supabase Auth and database-backed access patterns.

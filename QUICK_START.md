# Quick Start - Supabase Connection

## ✅ Setup Complete

The project is configured to use Supabase Postgres. Follow these steps:

## 1. Get Supabase Database URL

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **Database**
4. Copy the **Connection string** (URI format)

## 2. Create `.env.local`

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` and add your Supabase connection string:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres"
```

Replace:
- `[YOUR-PASSWORD]` with your Supabase database password
- `[PROJECT-REF]` with your project reference ID

## 3. Apply Database Schema

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to Supabase (creates all tables)
npx prisma db push
```

## 4. Verify in Supabase

1. Go to Supabase Dashboard → **Table Editor**
2. You should see these tables:
   - ✅ `User`
   - ✅ `Account`
   - ✅ `Session`
   - ✅ `VerificationToken`
   - ✅ `FacebookPage`

## 5. Start Development

```bash
npm run dev
```

## Database Security Notes

- ✅ All database access goes through Next.js API routes (backend only)
- ✅ No direct client access to database tokens
- ✅ `.env.local` is in `.gitignore` (never commit secrets)
- ✅ Use Prisma migrations only (not Supabase SQL editor)

## Need Help?

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions.


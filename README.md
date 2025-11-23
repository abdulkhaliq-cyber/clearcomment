# ClearComment

A Facebook comment moderation tool that automatically hides spam, offensive language, and competitor links from your Facebook Page posts.

## Features

- 🛡️ Auto-hide spam comments
- ⚡ Keyword filtering
- 📊 Activity logs

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account and project (see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md))
- PostgreSQL database (via Supabase)

### Development

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
   - Copy `.env.local.example` to `.env.local`
   - Fill in your Supabase `DATABASE_URL` and other required variables
   - See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for details

3. **Set up database:**
```bash
# Generate Prisma Client
npx prisma generate

# Push schema to Supabase
npx prisma db push
```

4. **Run the development server:**
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

Build the application:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## Environment Variables

Create a `.env.local` file (see `.env.local.example` for template) with:

```env
# Database - Supabase Postgres
DATABASE_URL="postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
FACEBOOK_CLIENT_ID="your-facebook-app-id"
FACEBOOK_CLIENT_SECRET="your-facebook-app-secret"

# Facebook SDK (optional)
NEXT_PUBLIC_FACEBOOK_APP_ID="your-facebook-app-id"
```

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed Supabase configuration instructions.

## Database Migrations

**Important**: All database migrations are managed through Prisma only.

- **Development**: Use `npx prisma db push` to sync schema changes
- **Production**: Use `npx prisma migrate deploy` to apply migrations

Do NOT use Supabase's SQL editor for schema changes. Always use Prisma to keep your schema in sync with your codebase.

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for more details.

## Technologies Used

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Prisma** - Database ORM
- **Supabase Postgres** - Database
- **NextAuth.js v5** - Authentication

## License

Private - All rights reserved

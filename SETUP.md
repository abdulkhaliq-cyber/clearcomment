# NextAuth Setup Guide

This guide will help you set up NextAuth v5 with Google OAuth and Credentials authentication.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- Google OAuth credentials (for Google login)

## Step 1: Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/clearcomment?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Facebook (optional, for existing features)
NEXT_PUBLIC_FACEBOOK_APP_ID="your-facebook-app-id"
```

### Generate NEXTAUTH_SECRET

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

### Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Choose "Web application"
6. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy the Client ID and Client Secret to your `.env.local`

## Step 2: Database Setup

1. **Create PostgreSQL database** (if not already created):
   ```bash
   # Using psql
   createdb clearcomment
   ```

2. **Generate Prisma Client**:
   ```bash
   npm run db:generate
   ```

3. **Push schema to database**:
   ```bash
   npm run db:push
   ```

   Or use migrations:
   ```bash
   npm run db:migrate
   ```

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` and test the authentication:

1. **Test Registration**: Go to `/register` and create an account
2. **Test Login**: Go to `/login` and sign in with credentials
3. **Test Google Login**: Click "Sign in with Google" on login/register pages
4. **Test Protected Route**: Try accessing `/dashboard` without logging in (should redirect to login)
5. **Test Session Persistence**: Refresh the page after logging in (session should persist)
6. **Test Logout**: Click logout button (session should be cleared)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and run migrations
- `npm run db:studio` - Open Prisma Studio (database GUI)

## Database Models

The Prisma schema includes:

- **User**: Stores user accounts (email, password hash, name, image)
- **Account**: Stores OAuth provider accounts (Google, etc.)
- **Session**: Stores user sessions (if using database sessions)
- **VerificationToken**: Stores email verification tokens

## Authentication Flow

1. **Registration**: User creates account → Password is hashed with bcrypt → User saved to database
2. **Credentials Login**: User enters email/password → Verified against database → JWT token created
3. **Google OAuth**: User clicks Google login → Redirected to Google → Callback creates/updates user → JWT token created
4. **Session**: JWT token stored in HTTP-only cookie → Middleware checks session on protected routes

## Troubleshooting

### "Invalid credentials" error
- Check that user exists in database
- Verify password was hashed correctly during registration
- Check database connection

### Google OAuth not working
- Verify redirect URI matches exactly: `http://localhost:3000/api/auth/callback/google`
- Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct
- Ensure Google+ API is enabled in Google Cloud Console

### Database connection errors
- Verify DATABASE_URL is correct
- Check PostgreSQL is running
- Verify database exists

### Session not persisting
- Check NEXTAUTH_SECRET is set
- Verify cookies are enabled in browser
- Check NEXTAUTH_URL matches your domain

## Security Notes

- Never commit `.env.local` to version control
- Use strong, randomly generated NEXTAUTH_SECRET
- Use HTTPS in production
- Keep database credentials secure
- Regularly update dependencies


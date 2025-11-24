import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const envCheck = {
        hasAuthSecret: !!process.env.AUTH_SECRET,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasGoogleId: !!process.env.GOOGLE_CLIENT_ID,
        hasFacebookId: !!process.env.FACEBOOK_CLIENT_ID,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        nodeEnv: process.env.NODE_ENV,
    };

    let dbStatus = "unknown";
    try {
        await prisma.$queryRaw`SELECT 1`;
        dbStatus = "connected";
    } catch (error: any) {
        dbStatus = `failed: ${error.message}`;
    }

    return NextResponse.json({
        envCheck,
        dbStatus,
    });
}

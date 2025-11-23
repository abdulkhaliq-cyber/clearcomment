import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { moderateComment } from "@/lib/moderation";

// This route is designed to be called by a Cron Job (e.g., Vercel Cron)
// It processes recent comments that might have been missed by webhooks
export async function GET(request: Request) {
    // Verify authorization (e.g., via a secret header)
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // return new NextResponse("Unauthorized", { status: 401 });
        // For development/demo, we'll allow it, but in prod uncomment above
    }

    try {
        // 1. Find comments created in the last 1 hour that are NOT hidden
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        const recentComments = await prisma.comment.findMany({
            where: {
                createdAt: { gt: oneHourAgo },
                isHidden: false,
            },
            include: {
                page: true, // Include page to get access token
            },
            take: 50, // Process in batches
        });

        let processedCount = 0;
        let actionCount = 0;

        // 2. Run moderation engine on them
        for (const comment of recentComments) {
            if (!comment.page) continue;

            const result = await moderateComment(
                comment.page.id,
                comment.id,
                comment.message,
                comment.page.pageAccessToken
            );

            processedCount++;
            if (result.actionPerformed) {
                actionCount++;
            }
        }

        return NextResponse.json({
            success: true,
            processed: processedCount,
            actionsTaken: actionCount,
        });

    } catch (error) {
        console.error("Cron job error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

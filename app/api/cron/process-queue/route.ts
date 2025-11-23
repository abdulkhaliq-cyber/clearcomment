import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { moderateComment } from "@/lib/moderation";

// This route is designed to be called by a Cron Job (e.g., Vercel Cron) every minute
export async function GET(request: Request) {
    // Verify authorization (e.g., via a secret header)
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // return new NextResponse("Unauthorized", { status: 401 });
        // For development/demo, we'll allow it, but in prod uncomment above
    }

    try {
        // 1. Fetch pending jobs from the queue
        // We take 10 at a time to avoid timeouts
        const jobs = await prisma.moderationQueue.findMany({
            where: {
                status: { in: ["PENDING", "FAILED"] },
                attempts: { lt: 3 }, // Retry up to 3 times
            },
            orderBy: { createdAt: "asc" },
            take: 10,
        });

        if (jobs.length === 0) {
            return NextResponse.json({ message: "No jobs to process" });
        }

        let processedCount = 0;

        // 2. Process each job
        for (const job of jobs) {
            try {
                // Mark as processing
                await prisma.moderationQueue.update({
                    where: { id: job.id },
                    data: { status: "PROCESSING", attempts: { increment: 1 } },
                });

                const payload = job.payload as any;
                const { pageId, commentId, message, verb } = payload;

                // Fetch page details for token
                const page = await prisma.facebookPage.findUnique({
                    where: { id: pageId },
                });

                if (!page) {
                    throw new Error(`Page not found: ${pageId}`);
                }

                // Execute moderation logic
                if (verb === "add" || verb === "edit") {
                    const result = await moderateComment(
                        page.id,
                        commentId,
                        message,
                        page.pageAccessToken
                    );

                    if (result.actionPerformed) {
                        console.log(`Job ${job.id}: Action taken - ${result.actionType}`);
                    }
                }

                // Mark as completed
                await prisma.moderationQueue.update({
                    where: { id: job.id },
                    data: { status: "COMPLETED" },
                });

                processedCount++;

            } catch (error: any) {
                console.error(`Job ${job.id} failed:`, error);

                // Mark as failed with error message
                await prisma.moderationQueue.update({
                    where: { id: job.id },
                    data: {
                        status: "FAILED",
                        error: error.message || "Unknown error"
                    },
                });
            }
        }

        return NextResponse.json({
            success: true,
            processed: processedCount,
        });

    } catch (error) {
        console.error("Queue worker error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

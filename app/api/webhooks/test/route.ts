import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { pageId } = await request.json();

        // Verify ownership
        const page = await prisma.facebookPage.findUnique({
            where: { id: pageId },
        });

        if (!page || page.userId !== session.user.id) {
            return new NextResponse("Page not found or unauthorized", { status: 404 });
        }

        // Simulate a webhook event
        // In a real app, this might trigger a self-call to the webhook endpoint
        // For now, we'll just log a test event to the DB to show it works
        await prisma.moderationLog.create({
            data: {
                pageId,
                action: "TEST",
                commentId: "test_event_" + Date.now(),
                commentText: "This is a test webhook event triggered from settings.",
                success: true,
                apiResponse: { message: "Test successful" },
            },
        });

        return NextResponse.json({ message: "Test event triggered successfully" });
    } catch (error) {
        console.error("Test webhook failed:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

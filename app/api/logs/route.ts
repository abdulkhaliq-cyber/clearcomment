import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get("pageId");
    const cursor = searchParams.get("cursor");
    const limit = 20;

    if (!pageId) {
        return new NextResponse("Page ID required", { status: 400 });
    }

    const session = await auth();
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        // Verify ownership
        const page = await prisma.facebookPage.findUnique({
            where: { id: pageId },
        });

        if (!page || page.userId !== session.user.id) {
            return new NextResponse("Page not found or unauthorized", { status: 404 });
        }

        const logs = await prisma.moderationLog.findMany({
            where: { pageId },
            take: limit + 1, // Fetch one extra to determine if there's a next page
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: { performedAt: "desc" },
        });

        let nextCursor: string | undefined = undefined;
        if (logs.length > limit) {
            const nextItem = logs.pop();
            nextCursor = nextItem?.id;
        }

        return NextResponse.json({
            logs,
            nextCursor,
        });
    } catch (error) {
        console.error("Failed to fetch logs:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

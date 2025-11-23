import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const pageId = params.id;

    try {
        // Verify ownership
        const page = await prisma.facebookPage.findUnique({
            where: { id: pageId },
        });

        if (!page || page.userId !== session.user.id) {
            return new NextResponse("Page not found or unauthorized", { status: 404 });
        }

        // Delete page and cascade delete related rules, logs, comments
        // Note: Prisma schema should handle cascade if configured, otherwise we delete manually
        // For safety, we rely on Prisma relation onDelete: Cascade if set, or manual deletion here
        // Assuming schema has onDelete: Cascade or we do it manually:

        // Manual cleanup just in case schema isn't perfect
        await prisma.moderationRule.deleteMany({ where: { pageId } });
        await prisma.moderationLog.deleteMany({ where: { pageId } });
        await prisma.comment.deleteMany({ where: { pageId } });

        await prisma.facebookPage.delete({
            where: { id: pageId },
        });

        return new NextResponse("Page disconnected", { status: 200 });
    } catch (error) {
        console.error("Failed to disconnect page:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

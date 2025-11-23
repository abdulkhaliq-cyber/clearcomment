import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const pageId = params.id;

    try {
        const body = await request.json();
        const { enabled } = body;

        if (typeof enabled !== "boolean") {
            return new NextResponse("Invalid body", { status: 400 });
        }

        // Verify ownership
        const page = await prisma.facebookPage.findUnique({
            where: { id: pageId },
        });

        if (!page || page.userId !== session.user.id) {
            return new NextResponse("Page not found or unauthorized", { status: 404 });
        }

        // Update
        const updatedPage = await prisma.facebookPage.update({
            where: { id: pageId },
            data: { moderationEnabled: enabled },
        });

        return NextResponse.json(updatedPage);
    } catch (error) {
        console.error("Failed to toggle moderation:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

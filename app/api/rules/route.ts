import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET: Fetch rules for a specific page
export async function GET(request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get("pageId");

    if (!pageId) {
        return new NextResponse("Missing pageId", { status: 400 });
    }

    try {
        // Verify ownership
        const page = await prisma.facebookPage.findUnique({
            where: { id: pageId },
        });

        if (!page || page.userId !== session.user.id) {
            return new NextResponse("Page not found or unauthorized", { status: 404 });
        }

        const rules = await prisma.moderationRule.findMany({
            where: { pageId },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(rules);
    } catch (error) {
        console.error("Error fetching rules:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// POST: Create a new rule
export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await request.json();
        const { pageId, type, keyword, replyText } = body;

        if (!pageId || !type) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        if (type === "BLOCK_KEYWORD" && !keyword) {
            return new NextResponse("Keyword is required for blocking rules", { status: 400 });
        }
        if (type === "AUTO_REPLY" && (!keyword || !replyText)) {
            return new NextResponse("Keyword and reply text required for auto-reply", { status: 400 });
        }

        // Verify ownership
        const page = await prisma.facebookPage.findUnique({
            where: { id: pageId },
        });

        if (!page || page.userId !== session.user.id) {
            return new NextResponse("Page not found or unauthorized", { status: 404 });
        }

        const rule = await prisma.moderationRule.create({
            data: {
                pageId,
                type,
                keyword,
                replyText,
            },
        });

        return NextResponse.json(rule);
    } catch (error) {
        console.error("Error creating rule:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// PATCH: Toggle rule enabled status
export async function PATCH(request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await request.json();
        const { id, isEnabled } = body;

        if (!id || isEnabled === undefined) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Verify ownership via the rule's page
        const rule = await prisma.moderationRule.findUnique({
            where: { id },
            include: { page: true },
        });

        if (!rule || rule.page.userId !== session.user.id) {
            return new NextResponse("Rule not found or unauthorized", { status: 404 });
        }

        const updatedRule = await prisma.moderationRule.update({
            where: { id },
            data: { isEnabled },
        });

        return NextResponse.json(updatedRule);
    } catch (error) {
        console.error("Error updating rule:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// DELETE: Remove a rule
export async function DELETE(request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
        return new NextResponse("Missing rule ID", { status: 400 });
    }

    try {
        // Verify ownership via the rule's page
        const rule = await prisma.moderationRule.findUnique({
            where: { id },
            include: { page: true },
        });

        if (!rule || rule.page.userId !== session.user.id) {
            return new NextResponse("Rule not found or unauthorized", { status: 404 });
        }

        await prisma.moderationRule.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting rule:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

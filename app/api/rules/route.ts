import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get("pageId");

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

        const rules = await prisma.moderationRule.findMany({
            where: { pageId },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(rules);
    } catch (error) {
        console.error("Failed to fetch rules:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await request.json();
        const { pageId, type, keyword, replyText, ruleConfig } = body;

        if (!pageId || !type) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Verify ownership
        const page = await prisma.facebookPage.findUnique({
            where: { id: pageId },
        });

        if (!page || page.userId !== session.user.id) {
            return new NextResponse("Page not found or unauthorized", { status: 404 });
        }

        // Validate rule type specifics
        if (type === "BLOCK_KEYWORD" && !keyword) {
            return new NextResponse("Keyword required for block rule", { status: 400 });
        }
        if (type === "AUTO_REPLY" && !replyText) {
            return new NextResponse("Reply text required for auto-reply rule", { status: 400 });
        }
        if (type === "REGEX_MATCH" && !keyword) {
            return new NextResponse("Regex pattern required", { status: 400 });
        }

        const rule = await prisma.moderationRule.create({
            data: {
                pageId,
                type,
                keyword,
                replyText,
                ruleConfig: ruleConfig || {},
            },
        });

        return NextResponse.json(rule);
    } catch (error) {
        console.error("Failed to create rule:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await request.json();
        const { ruleId, isEnabled } = body;

        if (!ruleId || typeof isEnabled !== "boolean") {
            return new NextResponse("Invalid body", { status: 400 });
        }

        // Verify ownership via rule -> page -> user
        const rule = await prisma.moderationRule.findUnique({
            where: { id: ruleId },
            include: { page: true },
        });

        if (!rule || rule.page.userId !== session.user.id) {
            return new NextResponse("Rule not found or unauthorized", { status: 404 });
        }

        const updatedRule = await prisma.moderationRule.update({
            where: { id: ruleId },
            data: { isEnabled },
        });

        return NextResponse.json(updatedRule);
    } catch (error) {
        console.error("Failed to update rule:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const ruleId = searchParams.get("ruleId");

        if (!ruleId) {
            return new NextResponse("Rule ID required", { status: 400 });
        }

        // Verify ownership
        const rule = await prisma.moderationRule.findUnique({
            where: { id: ruleId },
            include: { page: true },
        });

        if (!rule || rule.page.userId !== session.user.id) {
            return new NextResponse("Rule not found or unauthorized", { status: 404 });
        }

        await prisma.moderationRule.delete({
            where: { id: ruleId },
        });

        return new NextResponse("Rule deleted", { status: 200 });
    } catch (error) {
        console.error("Failed to delete rule:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

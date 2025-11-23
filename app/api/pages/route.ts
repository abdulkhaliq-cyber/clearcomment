import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";

// GET: Fetch all pages connected by the current user
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const pages = await prisma.facebookPage.findMany({
            where: { userId: session.user.id },
            select: {
                id: true,
                pageId: true,
                pageName: true,
                moderationEnabled: true,
                createdAt: true,
                // Do NOT return the access token to the client
            },
        });

        return NextResponse.json(pages);
    } catch (error) {
        console.error("Error fetching pages:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// POST: Connect a new page (save token)
export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await request.json();
        const { pageId, pageName, pageAccessToken } = body;

        if (!pageId || !pageName || !pageAccessToken) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Encrypt the token before saving
        const encryptedToken = encrypt(pageAccessToken);

        const page = await prisma.facebookPage.upsert({
            where: { pageId },
            update: {
                pageName,
                pageAccessToken: encryptedToken,
                userId: session.user.id, // Ensure ownership is updated if re-connected
            },
            create: {
                userId: session.user.id,
                pageId,
                pageName,
                pageAccessToken: encryptedToken,
            },
        });

        return NextResponse.json(page);
    } catch (error) {
        console.error("Error connecting page:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

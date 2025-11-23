import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";

// POST: Exchange short-lived token for long-lived token and save pages
export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await request.json();
        const { shortLivedToken, selectedPageIds } = body;

        if (!shortLivedToken) {
            return new NextResponse("Missing short-lived token", { status: 400 });
        }

        const appId = process.env.FACEBOOK_CLIENT_ID;
        const appSecret = process.env.FACEBOOK_CLIENT_SECRET;

        // 1. Exchange for Long-Lived User Access Token
        const exchangeUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`;

        const exchangeRes = await fetch(exchangeUrl);
        const exchangeData = await exchangeRes.json();

        if (exchangeData.error) {
            console.error("Error exchanging token:", exchangeData.error);
            return new NextResponse("Failed to exchange token", { status: 400 });
        }

        const longLivedUserToken = exchangeData.access_token;

        // 2. Fetch Pages with the Long-Lived User Token
        // This automatically grants long-lived Page Access Tokens
        const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?access_token=${longLivedUserToken}`;
        const pagesRes = await fetch(pagesUrl);
        const pagesData = await pagesRes.json();

        if (pagesData.error) {
            console.error("Error fetching pages:", pagesData.error);
            return new NextResponse("Failed to fetch pages", { status: 400 });
        }

        const pages = pagesData.data;
        const savedPages = [];

        // 3. Save/Update Pages in Database
        for (const page of pages) {
            // If selectedPageIds is provided, skip pages not in the list
            if (selectedPageIds && Array.isArray(selectedPageIds) && !selectedPageIds.includes(page.id)) {
                continue;
            }

            // Encrypt the long-lived page token
            const encryptedToken = encrypt(page.access_token);

            const savedPage = await prisma.facebookPage.upsert({
                where: { pageId: page.id },
                update: {
                    pageName: page.name,
                    pageAccessToken: encryptedToken,
                    userId: session.user.id,
                },
                create: {
                    userId: session.user.id,
                    pageId: page.id,
                    pageName: page.name,
                    pageAccessToken: encryptedToken,
                },
            });
            savedPages.push(savedPage);
        }

        return NextResponse.json({
            success: true,
            count: savedPages.length,
            pages: savedPages.map(p => ({ ...p, pageAccessToken: undefined })) // Don't return tokens
        });

    } catch (error) {
        console.error("Server error in token exchange:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

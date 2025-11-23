import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";

// Cache duration in seconds
const CACHE_DURATION = 30;

// GET: Fetch comments for a specific page
export async function GET(request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get("pageId");
    const cursor = searchParams.get("cursor"); // For pagination (after)
    const limit = searchParams.get("limit") || "10";

    if (!pageId) {
        return new NextResponse("Missing pageId", { status: 400 });
    }

    try {
        // 1. Verify ownership
        const page = await prisma.facebookPage.findUnique({
            where: { id: pageId },
        });

        if (!page || page.userId !== session.user.id) {
            return new NextResponse("Page not found or unauthorized", { status: 404 });
        }

        // 2. Check Cache (Simple In-Memory / Header-based)
        // For Vercel, we can use Cache-Control headers to let the edge cache handle it
        // But since this is a user-specific data fetch, we should be careful.
        // A better approach for "live" dashboards is to fetch from our DB (which is updated by webhooks)
        // However, per requirements, we will fetch from Graph API + Cache headers.

        const accessToken = decrypt(page.pageAccessToken);

        // 3. Fetch Comments from Graph API
        // Strategy: Fetch recent posts, then their comments.
        // Note: This is expensive. A better architecture is "Sync to DB via Webhooks" and "Read from DB".
        // We will implement the "Read from Graph API" as requested, but with a limit.

        // If cursor is provided, we are paging through a specific post's comments or the feed.
        // Graph API structure makes "paging all comments across all posts" hard.
        // We will fetch the page's feed (posts) and expand comments.

        const fields = "id,message,created_time,comments.limit(5){id,message,created_time,from,is_hidden,like_count,comment_count}";
        let fbUrl = `https://graph.facebook.com/v19.0/${page.pageId}/feed?fields=${fields}&limit=${limit}&access_token=${accessToken}`;

        if (cursor) {
            fbUrl += `&after=${cursor}`;
        }

        const res = await fetch(fbUrl);

        // Handle Rate Limiting
        if (res.status === 429) {
            return new NextResponse("Too Many Requests - Facebook Rate Limit", { status: 429 });
        }

        const data = await res.json();

        if (data.error) {
            console.error("Facebook API Error:", data.error);
            return new NextResponse(`Facebook API Error: ${data.error.message}`, { status: 502 });
        }

        // 4. Normalize Data
        const comments: any[] = [];
        let nextCursor = data.paging?.cursors?.after;

        if (data.data) {
            for (const post of data.data) {
                if (post.comments && post.comments.data) {
                    for (const comment of post.comments.data) {
                        comments.push({
                            commentId: comment.id,
                            message: comment.message,
                            authorName: comment.from?.name || "Unknown",
                            authorId: comment.from?.id,
                            createdAt: comment.created_time,
                            isHidden: comment.is_hidden,
                            reactionsCount: comment.like_count || 0,
                            postId: post.id,
                            postMessage: post.message
                        });
                    }
                }
            }
        }

        // Sort by newest first (client-side sort is better for merged lists, but we do it here too)
        comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // 5. Return Response with Cache Headers
        return NextResponse.json({
            comments,
            nextCursor
        }, {
            headers: {
                'Cache-Control': `private, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION}`
            }
        });

    } catch (error) {
        console.error("Error fetching comments:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

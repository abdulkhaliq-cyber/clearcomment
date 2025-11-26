"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

interface Page {
  id: string;
  pageId: string;
  pageName: string;
}

interface Comment {
  id: string;
  postId: string;
  postMessage: string;
  message: string;
  author: string;
  created_time: string;
  is_hidden: boolean;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPage, setSelectedPage] = useState<string>("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingPages, setLoadingPages] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // Comment ID being acted on

  // Fetch connected pages on load
  useEffect(() => {
    if (status === "authenticated") {
      fetchPages();
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status]);





  // Realtime Subscription
  useEffect(() => {
    if (!selectedPage) return;

    console.log("Subscribing to realtime changes for page:", selectedPage);

    const channel = supabase
      .channel('realtime-comments')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'Comment',
          filter: `pageId=eq.${selectedPage}`, // Filter by current page
        },
        (payload) => {
          console.log('Realtime change received:', payload);

          if (payload.eventType === 'INSERT') {
            const newComment = payload.new as any;
            // Add new comment to top of list
            setComments((prev) => [
              {
                id: newComment.id,
                postId: newComment.postId,
                postMessage: "", // We might not have this immediately
                message: newComment.message,
                author: newComment.authorName,
                authorId: newComment.authorId,
                created_time: newComment.fbCreatedTime, // Use our DB time
                is_hidden: newComment.isHidden,
              },
              ...prev
            ]);
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as any;
            setComments((prev) =>
              prev.map(c => c.id === updated.id ? { ...c, is_hidden: updated.isHidden } : c)
            );
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as any;
            setComments((prev) => prev.filter(c => c.id !== deleted.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedPage]);

  // ... rest of the component


  const fetchPages = async () => {
    try {
      const res = await fetch("/api/pages");
      if (res.ok) {
        const data = await res.json();
        setPages(data);
        if (data.length > 0) {
          setSelectedPage(data[0].id); // Default to first page
        }
      }
    } catch (error) {
      console.error("Failed to fetch pages", error);
    } finally {
      setLoadingPages(false);
    }
  };

  const fetchComments = async (pageId: string) => {
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/moderation/comments?pageId=${pageId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments);
      }
    } catch (error) {
      console.error("Failed to fetch comments", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAction = async (commentId: string, action: "HIDE" | "UNHIDE" | "DELETE") => {
    setActionLoading(commentId);
    try {
      const res = await fetch(`/api/moderation/${action.toLowerCase()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: selectedPage,
          commentId,
        }),
      });

      if (res.ok) {
        // Optimistic update
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === commentId) {
              if (action === "DELETE") return null; // Will filter out later
              if (action === "HIDE") return { ...c, is_hidden: true };
              if (action === "UNHIDE") return { ...c, is_hidden: false };
            }
            return c;
          }).filter(Boolean) as Comment[]
        );
      } else {
        alert("Failed to perform action");
      }
    } catch (error) {
      console.error("Action failed", error);
    } finally {
      setActionLoading(null);
    }
  };

  if (status === "loading" || loadingPages) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold text-blue-600">ClearComment</h1>
            <nav className="hidden md:flex gap-4">
              <Link href="/dashboard" className="text-slate-900 font-medium">Moderation</Link>
              <Link href="/connect" className="text-slate-500 hover:text-slate-900">Connect Pages</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedPage}
              onChange={(e) => setSelectedPage(e.target.value)}
              className="form-select block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              {pages.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.pageName}
                </option>
              ))}
            </select>
            <div className="h-8 w-8 rounded-full bg-slate-200 overflow-hidden">
              {session?.user?.image && (
                <img src={session.user.image} alt="User" className="h-full w-full object-cover" />
              )}
            </div>
            <button
              onClick={() => router.push("/api/auth/signout")}
              className="text-sm text-slate-500 hover:text-red-600 font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {pages.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">No Pages Connected</h2>
            <p className="text-slate-600 mb-8">Connect a Facebook Page to start moderating comments.</p>
            <Link
              href="/connect"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Connect a Page
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-900">Latest Comments</h2>
              <button
                onClick={() => fetchComments(selectedPage)}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Refresh
              </button>
            </div>

            {loadingComments ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : comments.length === 0 ? (
              <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500">
                No comments found for the last 10 posts.
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className={`bg-white p-6 rounded-xl border ${comment.is_hidden ? 'border-yellow-200 bg-yellow-50' : 'border-slate-200'} transition-all hover:shadow-md`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{comment.author}</span>
                        <span className="text-xs text-slate-500">• {new Date(comment.created_time).toLocaleString()}</span>
                        {comment.is_hidden && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">Hidden</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {comment.is_hidden ? (
                          <button
                            onClick={() => handleAction(comment.id, "UNHIDE")}
                            disabled={actionLoading === comment.id}
                            className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Unhide"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAction(comment.id, "HIDE")}
                            disabled={actionLoading === comment.id}
                            className="p-2 text-slate-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition"
                            title="Hide"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleAction(comment.id, "DELETE")}
                          disabled={actionLoading === comment.id}
                          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-800 mb-2">{comment.message}</p>
                    <div className="text-xs text-slate-400 bg-slate-50 p-2 rounded">
                      On post: <span className="italic">{comment.postMessage ? comment.postMessage.substring(0, 50) + '...' : 'No text'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category?: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

export default function PagesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<FacebookPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [userAccessToken, setUserAccessToken] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in and get access token
    if ((window as any).FB) {
      (window as any).FB.getLoginStatus((response: any) => {
        if (response.status === 'connected') {
          setUserAccessToken(response.authResponse.accessToken);
        } else {
          // Not logged in, redirect to home
          router.push('/');
        }
      });
    } else {
      // Wait for FB SDK to load
      window.addEventListener('fb-sdk-ready', () => {
        if ((window as any).FB) {
          (window as any).FB.getLoginStatus((response: any) => {
            if (response.status === 'connected') {
              setUserAccessToken(response.authResponse.accessToken);
            } else {
              router.push('/');
            }
          });
        }
      });
    }
  }, [router]);

  const loadPages = async () => {
    if (!userAccessToken) {
      setError('Please log in with Facebook first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/facebook/get-pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessToken: userAccessToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load pages');
      }

      setPages(data.pages || []);
      
      if (data.pages && data.pages.length === 0) {
        setError('No pages found. Make sure you have pages that you manage.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load pages');
      console.error('Error loading pages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const connectPage = async () => {
    if (!selectedPage) {
      setError('Please select a page');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const response = await fetch('/api/facebook/connect-page', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageId: selectedPage.id,
          pageAccessToken: selectedPage.access_token,
          pageName: selectedPage.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect page');
      }

      // Redirect to moderation dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to connect page');
      console.error('Error connecting page:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="bg-white text-slate-800 min-h-screen">
      <nav className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center border-b border-slate-200">
        <div className="text-2xl font-bold text-blue-600">ClearComment</div>
        <button
          onClick={() => router.push('/')}
          className="text-sm font-semibold text-slate-600 hover:text-blue-600"
        >
          Back to Home
        </button>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">
            Select Your Facebook Page
          </h1>
          <p className="text-lg text-slate-600">
            Choose the page you want to moderate comments for
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          {pages.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📄</div>
              <p className="text-slate-600 mb-6">
                Click the button below to load your Facebook pages
              </p>
              <button
                onClick={loadPages}
                disabled={!userAccessToken || isLoading}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Loading...' : 'Load My Pages'}
              </button>
            </div>
          )}

          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-slate-600">Loading your pages...</p>
            </div>
          )}

          {pages.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-6">Your Pages</h2>
              <div className="space-y-4 mb-6">
                {pages.map((page) => (
                  <div
                    key={page.id}
                    onClick={() => setSelectedPage(page)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                      selectedPage?.id === page.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {page.picture?.data?.url && (
                        <img
                          src={page.picture.data.url}
                          alt={page.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-slate-900">
                          {page.name}
                        </h3>
                        {page.category && (
                          <p className="text-sm text-slate-500">
                            {page.category}
                          </p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">
                          ID: {page.id}
                        </p>
                      </div>
                      {selectedPage?.id === page.id && (
                        <div className="text-blue-600 text-2xl">✓</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={connectPage}
                disabled={!selectedPage || isConnecting}
                className="w-full px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {isConnecting
                  ? 'Connecting...'
                  : selectedPage
                  ? `Connect ${selectedPage.name}`
                  : 'Select a page to continue'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


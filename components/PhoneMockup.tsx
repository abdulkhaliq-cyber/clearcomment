"use client";

import { useState, useEffect } from "react";

interface Comment {
  id: number;
  author: string;
  text: string;
  isSpam: boolean;
  removing: boolean;
}

export default function PhoneMockup() {
  const [comments, setComments] = useState<Comment[]>([
    { id: 1, author: "Sarah_M", text: "This is amazing! Love your content! 😍", isSpam: false, removing: false },
    { id: 2, author: "SpamBot123", text: "🚨 Click here for FREE money!!! 💰💰💰", isSpam: true, removing: false },
    { id: 3, author: "JohnDoe", text: "Great post! Thanks for sharing this.", isSpam: false, removing: false },
    { id: 4, author: "HateUser99", text: "You're terrible and nobody likes you", isSpam: true, removing: false },
    { id: 5, author: "Emily_K", text: "Can't wait to see more content like this!", isSpam: false, removing: false },
    { id: 6, author: "ScamAlert", text: "Buy followers cheap! Visit sketchy-site.com", isSpam: true, removing: false },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setComments((prevComments) => {
        // Find first spam comment that's not being removed
        const spamIndex = prevComments.findIndex(c => c.isSpam && !c.removing);
        
        if (spamIndex !== -1) {
          // Mark it as removing
          const updated = [...prevComments];
          updated[spamIndex] = { ...updated[spamIndex], removing: true };
          
          // Remove it after animation
          setTimeout(() => {
            setComments(prev => prev.filter(c => c.id !== updated[spamIndex].id));
          }, 500);
          
          return updated;
        } else {
          // Reset all spam comments if all are removed
          const hasSpam = prevComments.some(c => c.isSpam);
          if (!hasSpam) {
            return [
              { id: Date.now() + 1, author: "Sarah_M", text: "This is amazing! Love your content! 😍", isSpam: false, removing: false },
              { id: Date.now() + 2, author: "SpamBot123", text: "🚨 Click here for FREE money!!! 💰💰💰", isSpam: true, removing: false },
              { id: Date.now() + 3, author: "JohnDoe", text: "Great post! Thanks for sharing this.", isSpam: false, removing: false },
              { id: Date.now() + 4, author: "HateUser99", text: "You're terrible and nobody likes you", isSpam: true, removing: false },
              { id: Date.now() + 5, author: "Emily_K", text: "Can't wait to see more content like this!", isSpam: false, removing: false },
              { id: Date.now() + 6, author: "ScamAlert", text: "Buy followers cheap! Visit sketchy-site.com", isSpam: true, removing: false },
            ];
          }
        }
        
        return prevComments;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      {/* Phone Frame */}
      <div className="relative w-[340px] h-[680px] bg-gray-900 rounded-[3rem] shadow-2xl p-3 animate-float">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-7 bg-gray-900 rounded-b-3xl z-10"></div>
        
        {/* Screen */}
        <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden">
          {/* Status Bar */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-full"></div>
              <span className="font-semibold">@your_brand</span>
            </div>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </div>

          {/* Post Image */}
          <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
            <span className="text-white text-lg font-semibold">Your Post</span>
          </div>

          {/* Post Info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold">1,234 likes</span>
              <span className="text-gray-500">• 2 hours ago</span>
            </div>
          </div>

          {/* Comments Section */}
          <div className="px-4 py-2">
            <div className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-2">
              <span>COMMENTS</span>
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">
                🛡️ Protected
              </span>
            </div>
            <div className="space-y-3 max-h-[300px] overflow-hidden">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`flex gap-2 transition-all duration-500 ${
                    comment.removing ? 'opacity-0 translate-x-full scale-95' : 'opacity-100'
                  } ${comment.isSpam ? 'relative' : ''}`}
                >
                  <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-semibold">{comment.author}</span>
                      {comment.isSpam && !comment.removing && (
                        <span className="text-red-500 text-xs animate-pulse">⚠️</span>
                      )}
                    </div>
                    <p className={`text-xs text-gray-700 break-words ${comment.isSpam ? 'line-through opacity-60' : ''}`}>
                      {comment.text}
                    </p>
                  </div>
                  {comment.isSpam && !comment.removing && (
                    <div className="absolute inset-0 bg-red-500 bg-opacity-10 border border-red-300 rounded animate-pulse"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Badge */}
      <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-xl p-4 border-2 border-green-500">
        <div className="text-center">
          <div className="text-3xl mb-1">✅</div>
          <div className="text-xs font-bold text-green-600">Auto</div>
          <div className="text-xs font-bold text-green-600">Moderated</div>
        </div>
      </div>

      {/* Floating Icons */}
      <div className="absolute -left-12 top-20 bg-white rounded-full p-3 shadow-lg">
        <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      </div>
      <div className="absolute -right-12 top-40 bg-white rounded-full p-3 shadow-lg">
        <svg className="w-8 h-8 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      </div>
    </div>
  );
}



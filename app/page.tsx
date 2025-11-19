"use client";

import { signIn } from "next-auth/react";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    // Define the callback function globally so the SDK can find it
    (window as any).checkLoginState = () => {
      (window as any).FB.getLoginStatus((response: any) => {
        console.log("FB Login Status (from button):", response);
        if (response.status === 'connected') {
          console.log("User is connected to Facebook!");
          // Here you would typically redirect or update UI
        }
      });
    };

    const checkLoginStatus = () => {
      if ((window as any).FB) {
        (window as any).FB.getLoginStatus((response: any) => {
          console.log("Initial FB Login Status:", response);
        });
        // Reparse XFBML to render the button if it wasn't there initially
        (window as any).FB.XFBML.parse();
      }
    };

    if ((window as any).FB) {
      checkLoginStatus();
    } else {
      window.addEventListener('fb-sdk-ready', checkLoginStatus);
    }

    return () => {
      window.removeEventListener('fb-sdk-ready', checkLoginStatus);
      delete (window as any).checkLoginState;
    };
  }, []);

  return (
    <div className="bg-white text-slate-800 min-h-screen">
      <nav className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-blue-600">AutoModly</div>
        <a href="mailto:[YOUR-EMAIL]" className="text-sm font-semibold text-slate-600 hover:text-blue-600">Contact Support</a>
      </nav>

      <header className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl font-extrabold leading-tight text-slate-900 mb-6">
          Protect Your Brand’s <br /> <span className="text-blue-600">Comment Section</span>
        </h1>
        <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
          Automatically hide spam, offensive language, and competitor links from your Facebook Page posts 24/7.
        </p>
        <div className="flex justify-center gap-4 items-center">
          {/* 
              Facebook SDK Login Button 
              Replace config_id="{config_id}" with your actual Configuration ID from the Meta Developer Portal.
              Or use scope="public_profile,email" for basic permissions.
            */}
          <div
            className="fb-login-button"
            data-width=""
            data-size="large"
            data-button-type="continue_with"
            data-layout="default"
            data-auto-logout-link="false"
            data-use-continue-as="false"
            data-onlogin="checkLoginState();"
          ></div>

          <a href="#features" className="px-8 py-3 rounded-lg font-semibold text-slate-700 hover:bg-slate-100 transition">
            How it Works
          </a>
        </div>
      </header>

      <section id="features" className="bg-slate-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-10">
            <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4 text-xl">🛡️</div>
              <h3 className="text-lg font-bold mb-2">Auto-Hide Spam</h3>
              <p className="text-slate-600 text-sm">Instantly hide comments containing known spam links or bot patterns.</p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4 text-xl">⚡</div>
              <h3 className="text-lg font-bold mb-2">Keyword Filtering</h3>
              <p className="text-slate-600 text-sm">Define your own blocklist of words. We moderate them in real-time.</p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4 text-xl">📊</div>
              <h3 className="text-lg font-bold mb-2">Activity Logs</h3>
              <p className="text-slate-600 text-sm">Review hidden comments and restore them with a single click if needed.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 mt-20 py-12">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-4 gap-8 text-sm text-slate-500">

          <div className="col-span-2">
            <div className="font-bold text-slate-800 mb-4">AutoModly</div>
            <p className="mb-1">[YOUR LEGAL BUSINESS NAME]</p>
            <p className="mb-1">[YOUR STREET ADDRESS]</p>
            <p className="mb-1">[YOUR CITY, STATE, ZIP]</p>
            <p>[YOUR PHONE NUMBER]</p>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><a href="/privacy.html" className="hover:text-blue-600">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-blue-600">Terms of Service</a></li>
              <li><a href="#" className="hover:text-blue-600">Data Deletion Instructions</a></li>
            </ul>
          </div>

        </div>
        <div className="max-w-6xl mx-auto px-6 mt-12 pt-8 border-t border-slate-100 text-xs text-slate-400 text-center">
          &copy; 2024 AutoModly. Not affiliated with Meta Platforms, Inc.
        </div>
      </footer>
    </div>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoModly - AI-Powered Social Media Comment Moderation",
  description: "Automatically moderate comments on Facebook and Instagram with AI-powered detection. Keep your social media safe and professional.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}



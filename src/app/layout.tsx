// src/app/layout.tsx
import { Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers"; // Import the new wrapper
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import NextTopLoader from 'nextjs-toploader';
import type { Metadata } from "next";

const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vessel Management",
  description: "Professional Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <NextTopLoader
          color="#00A6B8"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #00A6B8,0 0 5px #00A6B8"
          zIndex={1600}
        />
        
        {/* Wrap everything in the single Providers component */}
        <Providers>
          {children}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            style={{ zIndex: 999999 }}
          />
        </Providers>
      </body>
    </html>
  );
}
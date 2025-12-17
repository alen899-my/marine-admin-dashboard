// src/app/layout.tsx
import { Outfit } from "next/font/google";
import "./globals.css";

import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import NextTopLoader from 'nextjs-toploader';

const outfit = Outfit({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <ThemeProvider>
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
          <SidebarProvider>
            {children}
            <ToastContainer
              position="top-right"
              autoClose={3000}
              style={{ zIndex: 999999 }}
            />
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

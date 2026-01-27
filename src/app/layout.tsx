import { Providers } from "@/components/Providers";
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";

import { auth } from "@/auth";

const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Parkora Falcon",
  description: "Professional Dashboard",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  //  CHANGE 2: Fetch session using the v5 helper
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${outfit.className} dark:bg-gray-900`}
        suppressHydrationWarning
      >
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

        {/* Pass session to providers for instant authentication */}
        <Providers session={session}>
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

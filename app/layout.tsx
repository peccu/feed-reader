import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Feed Text",
  description: "Feed Reader with tmbrtext like UI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
  return (
    <>
      <html lang="en" suppressHydrationWarning>
        <head>
          <title>Feed Text</title>
          <link rel="manifest" href="/manifest.json" />
          <link rel="apple-touch-icon" href="/apple-icon-180x180.png" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <link rel="apple-touch-startup-image" href="/splash.png" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black" />
          <meta name="apple-mobile-web-app-title" content="Feed Text" />
        </head>
        <body className={inter.className}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
          </ThemeProvider>
          <Toaster
            className="mt-16"
            position="top-center"
            richColors
            toastOptions={{
              duration: 2000,
            }}
          />
        </body>
      </html>
    </>
  );
}

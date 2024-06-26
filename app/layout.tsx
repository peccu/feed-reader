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
        <body className={inter.className}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
          </ThemeProvider>
          <Toaster />
        </body>
      </html>
    </>
  );
}

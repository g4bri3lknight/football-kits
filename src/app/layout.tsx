import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Football Kits Gallery",
  description: "Galleria completa delle maglie ufficiali dei calciatori, con visualizzazione 3D interattiva",
  keywords: ["Football Kits", "Maglie Calcio", "3D Visualization"],
  openGraph: {
    title: "Football Kits Gallery",
    description: "Galleria completa delle maglie ufficiali dei calciatori",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Football Kits Gallery",
    description: "Galleria completa delle maglie ufficiali dei calciatori",
  },
  // Force rebuild v2
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

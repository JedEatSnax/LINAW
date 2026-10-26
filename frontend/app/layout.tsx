import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { GoogleTagManager } from "@/components/google-tag-manager";
import { ThemeProvider } from "@/components/theme-provider";
import { Tooltip } from "@/components/ui/tooltip";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "LINAW",
  description:
    "Next-Generation Procurement and Asset Management System with Blockchain Verification and Tokenization",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang="en"
      className={cn("font-sans", inter.variable)}
      suppressHydrationWarning
    >
      <body>
        <GoogleTagManager gtmId="GTM-WC5VNCT3" nonce={nonce} />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
          disableTransitionOnChange
          nonce={nonce}
        >
          <Tooltip>{children}</Tooltip>
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@fontsource/geist-sans/400.css";
import "@fontsource/geist-sans/500.css";
import "@fontsource/geist-sans/600.css";
import "@fontsource/geist-sans/700.css";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "sonner";
import { NavProgress } from "@/components/nav/nav-progress";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SalesAgent — AI Sales Agents That Book Meetings",
  description: "AI SDR agents that qualify leads, run outbound campaigns, and book meetings 24/7. Multi-channel inbox, campaign orchestration, and real-time monitoring.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('theme');
                  if (t === 'light') {
                    /* user explicitly picked light — respect it */;
                  } else {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body style={{ fontFamily: "'Geist Sans', 'Inter', system-ui, sans-serif" }}>
        <NavProgress />
        <ThemeProvider>
          <QueryProvider>{children}</QueryProvider>
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: "font-sans",
              style: {
                background: "rgb(var(--bg-card))",
                color: "rgb(var(--text))",
                border: "1px solid rgb(var(--border))",
                borderRadius: "0.75rem",
                boxShadow: "0 4px 24px -8px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.06)",
                fontSize: "0.875rem",
                padding: "12px 16px",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}

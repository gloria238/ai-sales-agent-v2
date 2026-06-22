import type { Metadata } from "next";
import { Inter } from "next/font/google";
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
  title: "SalesAgent AI — AI SDR Platform",
  description: "AI sales agents that qualify, follow up, and book meetings automatically. Multi-channel inbox, campaign orchestration, and real-time monitoring.",
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
                  if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
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

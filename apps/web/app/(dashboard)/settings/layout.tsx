"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/settings", label: "General" },
  { href: "/settings/members", label: "Members" },
  { href: "/settings/api-keys", label: "API Keys" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="p-4 lg:p-6">
      <h2 className="text-2xl font-bold mb-6 text-text">设置</h2>
      <div className="flex gap-4 mb-6 border-b border-lp-border/30">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                active
                  ? "text-accent border-accent"
                  : "text-text-muted hover:text-text border-transparent hover:border-lp-border/30"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
      {children}
    </div>
  );
}

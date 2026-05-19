"use client";
import { useState } from "react";
import Link from "next/link";

interface Props { show: boolean; orgSlug: string; }

export function OnboardingCard({ show, orgSlug }: Props) {
  const [dismissed, setDismissed] = useState(false);
  if (!show || dismissed) return null;

  return (
    <div className="rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-blue-100 dark:bg-blue-900/20 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-blue-900 dark:text-blue-100">Welcome to SalesAgent AI!</h2>
              <p className="text-sm text-blue-600 dark:text-blue-400">Follow these 3 steps to deploy your AI SDR.</p>
            </div>
          </div>
          <button onClick={() => setDismissed(true)} className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors text-sm">Dismiss</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {[
            { step: "1", title: "Configure your AI agent", desc: "Set up your first SDR agent with personality, product knowledge, and qualification goals.", href: "/agents", cta: "Go to Agents" },
            { step: "2", title: "Import your leads", desc: "Add leads manually or import a CSV. AI will score and prioritize them automatically.", href: "/leads", cta: "Import Leads" },
            { step: "3", title: "Launch your first campaign", desc: "Create an outbound campaign with AI-personalized emails and watch replies come in.", href: "/campaigns", cta: "Create Campaign" },
          ].map((item) => (
            <Link key={item.step} href={item.href} className="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-5 hover:shadow-card-hover transition-all group">
              <div className="flex items-center gap-3 mb-3">
                <div className="size-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">{item.step}</div>
                <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">{item.title}</h3>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">{item.desc}</p>
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 group-hover:underline">{item.cta} →</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { Sidebar } from "@/components/nav/sidebar";
import { SidebarHeader } from "@/components/nav/sidebar-header";
import { UserMenu } from "@/components/nav/user-menu";
import { MobileNav } from "@/components/nav/mobile-nav";
import { Breadcrumb } from "@/components/nav/breadcrumb";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) redirect("/login");

  const org = await prisma.organization.findUnique({ where: { id: session.orgId } });
  if (!org) redirect("/login");

  const memberships = await prisma.membership.findMany({
    where: { userId: session.userId },
    include: { organization: true },
  });

  const allOrgs = memberships.map((m) => ({
    id: m.organization.id,
    name: m.organization.name,
    slug: m.organization.slug,
    role: m.role,
  }));

  return (
    <div className="min-h-screen flex bg-bg">
      {/* Glass sidebar — hidden on mobile */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-sidebar-border bg-sidebar-bg backdrop-blur-xl">
        <div className="px-5 py-5 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="size-8 rounded-xl bg-accent flex items-center justify-center text-white text-sm font-bold shadow-sm shadow-accent/25 group-hover:shadow-md group-hover:shadow-accent/30 transition-shadow duration-300">
              O
            </div>
            <span className="font-semibold text-base tracking-tight text-text">SalesAgent</span>
          </Link>
          <SidebarHeader currentOrg={org} orgs={allOrgs} />
        </div>
        <div className="flex-1 overflow-y-auto py-3">
          <Sidebar />
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header with glass effect */}
        <header className="sticky top-0 z-30 h-14 border-b border-border bg-glass-bg backdrop-blur-xl flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <MobileNav />
            <Breadcrumb />
          </div>
          <UserMenu user={{ name: user.name || "User", email: user.email }} org={{ name: org.name, slug: org.slug }} />
        </header>
        <main className="flex-1 p-4 lg:p-8 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}

import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { Sidebar } from "@/components/nav/sidebar";
import { SidebarHeader } from "@/components/nav/sidebar-header";
import { MobileNav } from "@/components/nav/mobile-nav";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  // Single query with includes — connection_limit=1, don't fan out
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { memberships: { include: { organization: true } } },
  });
  if (!user) {
    // Stale cookie — user was deleted (e.g., DB re-seeded). Clear it.
    const c = cookies();
    c.set("session", "", { httpOnly: true, secure: true, sameSite: "lax", maxAge: 0, path: "/" });
    redirect("/login");
  }

  const currentMembership = user.memberships.find((m) => m.organizationId === session.orgId);
  if (!currentMembership) {
    const c = cookies();
    c.set("session", "", { httpOnly: true, secure: true, sameSite: "lax", maxAge: 0, path: "/" });
    redirect("/login");
  }
  const org = currentMembership.organization;

  const allOrgs = user.memberships.map((m) => ({
    id: m.organization.id,
    name: m.organization.name,
    slug: m.organization.slug,
    role: m.role,
  }));

  const userInfo = { name: user.name || "User", email: user.email };

  return (
    <div className="h-screen flex bg-bg overflow-hidden">
      {/* Sidebar — hidden on mobile, slide-out via MobileNav */}
      <Sidebar
        currentOrg={org}
        orgs={allOrgs}
        user={userInfo}
        SidebarHeader={SidebarHeader}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile only: top bar */}
        <div className="lg:hidden h-12 border-b border-border bg-bg-card/80 backdrop-blur-xl flex items-center px-4 shrink-0">
          <MobileNav />
          <span className="ml-3 text-sm font-semibold text-text">SalesAgent</span>
        </div>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

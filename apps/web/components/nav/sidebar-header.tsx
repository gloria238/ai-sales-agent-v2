"use client";
import { useRouter } from "next/navigation";
import { OrgSwitcher } from "@/components/org/org-switcher";

interface Props {
  currentOrg: { name: string; slug: string };
  orgs: { id: string; name: string; slug: string; role: string }[];
}

export function SidebarHeader({ currentOrg, orgs }: Props) {
  const router = useRouter();

  const handleSwitch = async (slug: string) => {
    if (slug === currentOrg.slug) return;
    try {
      const res = await fetch(`/api/orgs/${slug}/switch`, { method: "POST" });
      if (!res.ok) throw new Error("Switch failed");
      router.push("/");
      router.refresh();
    } catch {
      // silent
    }
  };

  if (orgs.length > 1) {
    return <OrgSwitcher currentOrg={currentOrg} orgs={orgs} onSwitch={handleSwitch} />;
  }

  return <div className="text-xs text-text-muted mt-1">{currentOrg.name}</div>;
}

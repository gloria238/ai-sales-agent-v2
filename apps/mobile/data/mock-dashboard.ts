export interface KpiData {
  label: string;
  value: string;
  sub: string;
  icon: "people" | "calendar" | "checkmark-circle" | "flash";
}

export interface ActivityItem {
  id: string;
  type: "booking" | "message" | "document" | "ai";
  description: string;
  memberName?: string;
  time: string;
}

export const MOCK_KPIS: KpiData[] = [
  { label: "Members", value: "1,247", sub: "Across 3 clubs", icon: "people" },
  { label: "Bookings", value: "38", sub: "This month", icon: "calendar" },
  { label: "AI Resolve", value: "94%", sub: "Auto-resolved", icon: "checkmark-circle" },
  { label: "Concierge", value: "Active", sub: "2 agents running", icon: "flash" },
];

export const MOCK_RECENT_ACTIVITY: ActivityItem[] = [
  {
    id: "1",
    type: "booking",
    description: "Guest visit confirmed",
    memberName: "Sarah Wilson",
    time: "2m ago",
  },
  {
    id: "2",
    type: "booking",
    description: "Court 3 booked for Saturday 7 PM",
    memberName: "Mike Chen",
    time: "15m ago",
  },
  {
    id: "3",
    type: "document",
    description: "New document uploaded",
    memberName: "",
    time: "1h ago",
  },
  {
    id: "4",
    type: "ai",
    description: "AI resolved inquiry about membership tiers",
    memberName: "Lisa Park",
    time: "2h ago",
  },
  {
    id: "5",
    type: "message",
    description: "New message about tournament registration",
    memberName: "Tom Baker",
    time: "3h ago",
  },
];

export function activityIcon(type: ActivityItem["type"]): "calendar" | "chatbubbles" | "document-text" | "flash" {
  switch (type) {
    case "booking": return "calendar";
    case "message": return "chatbubbles";
    case "document": return "document-text";
    case "ai": return "flash";
  }
}

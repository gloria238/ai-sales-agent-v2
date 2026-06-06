export interface MockDocument {
  id: string;
  name: string;
  type: "PDF" | "TXT" | "FAQ";
  status: "Ready" | "Processing" | "Failed";
  chunks: number;
  createdAt: string;
}

export interface KBStats {
  docCount: number;
  chunkCount: number;
  accuracy: string;
  lastSync: string;
}

export const MOCK_KB_STATS: KBStats = {
  docCount: 24,
  chunkCount: 1382,
  accuracy: "98.3%",
  lastSync: "2 min ago",
};

export const MOCK_DOCUMENTS: MockDocument[] = [
  {
    id: "doc-1",
    name: "Guest Policy.pdf",
    type: "PDF",
    status: "Ready",
    chunks: 42,
    createdAt: "2026-06-01",
  },
  {
    id: "doc-2",
    name: "Court Rules.pdf",
    type: "PDF",
    status: "Ready",
    chunks: 28,
    createdAt: "2026-05-28",
  },
  {
    id: "doc-3",
    name: "Membership Handbook.pdf",
    type: "PDF",
    status: "Ready",
    chunks: 134,
    createdAt: "2026-05-25",
  },
  {
    id: "doc-4",
    name: "Summer Tournament Guide.pdf",
    type: "PDF",
    status: "Ready",
    chunks: 56,
    createdAt: "2026-06-02",
  },
  {
    id: "doc-5",
    name: "Booking FAQ.json",
    type: "FAQ",
    status: "Ready",
    chunks: 18,
    createdAt: "2026-05-20",
  },
  {
    id: "doc-6",
    name: "Pricing Tiers.pdf",
    type: "PDF",
    status: "Ready",
    chunks: 31,
    createdAt: "2026-05-18",
  },
  {
    id: "doc-7",
    name: "Club Etiquette Guide.txt",
    type: "TXT",
    status: "Processing",
    chunks: 0,
    createdAt: "2026-06-04",
  },
  {
    id: "doc-8",
    name: "Holiday Schedule.pdf",
    type: "PDF",
    status: "Failed",
    chunks: 0,
    createdAt: "2026-06-03",
  },
];

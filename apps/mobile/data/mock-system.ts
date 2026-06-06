export interface SystemStats {
  clubs: number;
  documents: number;
  chunks: number;
  conversations: number;
  agents: number;
  workers: number;
}

export const MOCK_SYSTEM_STATS: SystemStats = {
  clubs: 3,
  documents: 24,
  chunks: 1382,
  conversations: 42,
  agents: 2,
  workers: 4,
};

export const PIPELINE_STEPS = [
  { label: "Upload", description: "PDF / TXT / FAQ ingestion" },
  { label: "Chunk", description: "Recursive text splitter" },
  { label: "Embed", description: "OpenAI text-embedding-3-small" },
  { label: "Store", description: "pgvector cosine index" },
  { label: "Retrieve", description: "Cosine similarity search" },
  { label: "Generate", description: "DeepSeek with source context" },
];

export const TECH_STACK = [
  "Next.js 14",
  "Expo 52",
  "React Native",
  "PostgreSQL",
  "pgvector",
  "BullMQ",
  "Redis",
  "DeepSeek",
  "Prisma",
  "Tailwind CSS",
  "TypeScript",
  "Resend",
  "Vercel",
  "Railway",
];

export const ARCHITECTURE_LAYERS = [
  { layer: "Web", tech: "Next.js 14", description: "40+ API routes, SSE, RSC" },
  { layer: "Mobile", tech: "Expo 52", description: "iOS & Android, shared packages" },
  { layer: "Worker", tech: "BullMQ", description: "AI compose, scoring, campaigns, email" },
  { layer: "Packages", tech: "7 shared", description: "Types, domain, AI, RAG, API client, UI tokens, DB" },
  { layer: "Database", tech: "PostgreSQL + pgvector", description: "12 models, vector search, multi-tenant" },
  { layer: "Queue", tech: "Upstash Redis", description: "4 queues, rate limiting, session blacklist" },
];

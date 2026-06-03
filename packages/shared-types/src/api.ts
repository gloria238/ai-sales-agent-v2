// ── Auth ──────────────────────────────────────────────────────────
// (RegisterRequest, LoginRequest, AuthResponse are in auth.ts)

// ── Organization ──────────────────────────────────────────────────
export interface OrgResponse {
  id: string;
  name: string;
  slug: string;
  role: string;
}

export interface UpdateOrgRequest {
  name?: string;
  slug?: string;
}

export interface SwitchOrgResponse {
  orgId: string;
  orgSlug: string;
  role: string;
}

// ── Members ───────────────────────────────────────────────────────
export interface MemberResponse {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
}

export interface AddMemberRequest {
  email: string;
  role: string;
}

export interface UpdateMemberRoleRequest {
  role: string;
}

// ── Leads ─────────────────────────────────────────────────────────
export interface LeadResponse {
  id: string;
  name: string;
  email: string | null;
  stage: string | null;
  tags: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadListResponse {
  leads: LeadResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateLeadRequest {
  name: string;
  email?: string;
  stage?: string;
}

export interface UpdateLeadRequest {
  name?: string;
  email?: string;
  stage?: string;
  ownerId?: string;
  tags?: Record<string, unknown>;
}

// ── Agents ────────────────────────────────────────────────────────
export interface AgentResponse {
  id: string;
  name: string;
  description: string | null;
  personality: unknown;
  goals: unknown;
  knowledgeBase: unknown;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Conversations ─────────────────────────────────────────────────
export interface ConversationResponse {
  id: string;
  leadId: string;
  agentId: string | null;
  channel: string;
  subject: string | null;
  status: string;
  lead?: LeadResponse;
  agent?: AgentResponse;
  messages?: MessageResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface MessageResponse {
  id: string;
  conversationId: string;
  direction: string;
  content: string;
  channel: string;
  aiMetadata: unknown;
  createdAt: string;
}

// ── Campaigns ─────────────────────────────────────────────────────
export interface CampaignResponse {
  id: string;
  name: string;
  description: string | null;
  scriptId: string | null;
  agentId: string | null;
  status: string;
  targetAudience: unknown;
  schedule: unknown;
  stats: unknown;
  script?: ScriptResponse;
  agent?: AgentResponse;
  createdAt: string;
  updatedAt: string;
}

// ── Scripts ───────────────────────────────────────────────────────
export interface ScriptResponse {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  steps: unknown;
  createdAt: string;
  updatedAt: string;
}

// ── Workflows ─────────────────────────────────────────────────────
export interface WorkflowNodeData {
  id: string;
  type: string;
  label?: string | null;
  config: Record<string, unknown>;
  positionX: number;
  positionY: number;
}

export interface WorkflowEdgeData {
  id?: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceHandle?: string | null;
}

export interface WorkflowResponse {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  versions: Array<{
    id: string;
    version: number;
    nodes: WorkflowNodeData[];
    edges: WorkflowEdgeData[];
  }>;
}

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
}

export interface SaveWorkflowRequest {
  name?: string;
  description?: string;
  nodes: Array<{
    id: string;
    type: string;
    label: string;
    config: Record<string, unknown>;
    positionX: number;
    positionY: number;
  }>;
  edges: Array<{
    sourceNodeId: string;
    targetNodeId: string;
    sourceHandle?: string | null;
  }>;
}

export interface TriggerRunResponse {
  id: string;
  status: string;
  createdAt: string;
}

// ── Runs ──────────────────────────────────────────────────────────
export interface RunEventResponse {
  id: string;
  nodeId: string;
  status: string;
  output: unknown;
  createdAt: string;
}

export interface RunResponse {
  id: string;
  status: string;
  workflowName: string;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  eventCount: number;
  lastEventStatus: string | null;
}

export interface RunListResponse {
  runs: RunResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Audit Log ─────────────────────────────────────────────────────
export interface AuditLogEntry {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  userName: string | null;
  metadata: unknown;
  createdAt: string;
}

export interface AuditLogListResponse {
  logs: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Worker ────────────────────────────────────────────────────────
export interface WorkerHealthResponse {
  worker: { status: string; lastPoll?: string; activeRuns?: number };
  queue: { queued: number; running: number; dead_letter: number };
}

// ── AI ────────────────────────────────────────────────────────────
export interface AIScoreResponse {
  score: number;
  label: "hot" | "warm" | "cold";
  reason: string;
  nextAction: string;
}

export interface AISuggestionsRequest {
  nodes: Array<{ type: string; label?: string; config?: Record<string, unknown> }>;
  edges: Array<{ source: string; target: string; sourceHandle?: string | null }>;
  nodeConfig?: { type: string };
}

export interface AIGenerateWorkflowRequest {
  description: string;
}

// ── Pagination ────────────────────────────────────────────────────
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  stage?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

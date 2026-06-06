export interface PlaygroundSource {
  documentName: string;
  chunkIndex: number;
  score: number;
  excerpt: string;
}

export interface PlaygroundAnswer {
  answer: string;
  sources: PlaygroundSource[];
}

export const MOCK_KB_ANSWERS: Record<string, PlaygroundAnswer> = {
  "guest policy": {
    answer:
      "Members may bring up to two guests per visit. Guests must be accompanied by the member at all times and must sign in at the front desk upon arrival. Guest privileges are included in all membership tiers. Members are responsible for their guests' conduct and any applicable guest fees. For special events or larger groups, please contact the club manager at least 48 hours in advance.",
    sources: [
      {
        documentName: "Guest Policy.pdf",
        chunkIndex: 23,
        score: 0.92,
        excerpt:
          "Members may bring up to two guests per visit. Guests must be accompanied by the member at all times and must sign in at the front desk.",
      },
      {
        documentName: "Membership Handbook.pdf",
        chunkIndex: 11,
        score: 0.88,
        excerpt:
          "Guest privileges are included in all membership tiers. Members are responsible for their guests' conduct and any applicable guest fees.",
      },
    ],
  },
  "book a court": {
    answer:
      "Courts can be booked up to 7 days in advance through the member portal, mobile app, or by contacting the AI Concierge. Standard sessions are 60 minutes. Members may book back-to-back sessions subject to availability. Equipment rental (racquets, balls, towels) can be reserved when booking. Cancellations made more than 4 hours before the session incur no fee. Late cancellations may be charged 50% of the session fee.",
    sources: [
      {
        documentName: "Court Rules.pdf",
        chunkIndex: 5,
        score: 0.94,
        excerpt:
          "Courts may be booked up to 7 days in advance. Standard sessions are 60 minutes. Members may book back-to-back sessions subject to availability.",
      },
      {
        documentName: "Booking FAQ.json",
        chunkIndex: 3,
        score: 0.85,
        excerpt:
          "Equipment rental is available at the pro shop. Racquets, balls, and towels can be reserved when booking a court.",
      },
    ],
  },
  "membership tiers": {
    answer:
      "We offer three membership tiers: Basic ($89/month) includes 8 court bookings per month and 1 guest pass. Premium ($149/month) includes unlimited bookings, 4 guest passes, tournament access, and priority concierge support. Elite ($249/month) adds private coaching sessions, locker access, and exclusive event invitations. Upgrades take effect immediately. Downgrades apply at the next billing cycle.",
    sources: [
      {
        documentName: "Pricing Tiers.pdf",
        chunkIndex: 7,
        score: 0.96,
        excerpt:
          "Premium Tier ($149/mo): Unlimited court bookings, 4 guest passes/month, tournament access, priority concierge. Basic Tier ($89/mo): 8 bookings/month, 1 guest pass/month. Elite Tier ($249/mo): All Premium features plus private coaching, locker, exclusive events.",
      },
      {
        documentName: "Membership Handbook.pdf",
        chunkIndex: 42,
        score: 0.83,
        excerpt:
          "Membership upgrades take effect immediately upon payment. The prorated difference is charged for the remaining billing cycle. Downgrades apply at the start of the next billing cycle.",
      },
    ],
  },
};

export const SUGGESTED_QUESTIONS = [
  "What is the guest policy?",
  "How do I book a court?",
  "What are the membership tiers?",
];

export function findAnswer(question: string): PlaygroundAnswer | null {
  const q = question.toLowerCase();
  for (const [key, answer] of Object.entries(MOCK_KB_ANSWERS)) {
    if (q.includes(key)) return answer;
  }
  return null;
}

export const FALLBACK_ANSWER: PlaygroundAnswer = {
  answer:
    "I don't have specific information about that in the knowledge base yet. Try asking about the guest policy, court bookings, or membership tiers — those topics are fully indexed. If you're a club manager, you can upload relevant documents to expand the knowledge base.",
  sources: [],
};

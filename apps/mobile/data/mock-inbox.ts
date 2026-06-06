export interface Source {
  documentName: string;
  chunkIndex: number;
  score: number;
  excerpt: string;
}

export interface MockMessage {
  id: string;
  direction: "inbound" | "outbound";
  content: string;
  isAI: boolean;
  timestamp: string;
  sources?: Source[];
}

export interface MockConversation {
  id: string;
  name: string;
  club: string;
  preview: string;
  priority: "urgent" | "normal" | "low";
  confidence: number;
  time: string;
  messages: MockMessage[];
}

export const MOCK_CONVERSATIONS: MockConversation[] = [
  {
    id: "conv-1",
    name: "Sarah Wilson",
    club: "Riverside Club",
    preview: "Can I bring two guests this Saturday?",
    priority: "normal",
    confidence: 92,
    time: "2m ago",
    messages: [
      {
        id: "msg-1-1",
        direction: "inbound",
        content: "Hi, can I bring two guests this Saturday afternoon? I want to show them the courts.",
        isAI: false,
        timestamp: "2:14 PM",
      },
      {
        id: "msg-1-2",
        direction: "outbound",
        content: "Yes! Members may bring up to two guests per visit. Both guests must be accompanied by you at all times. Would you like me to register them for Saturday? We have Court 2 available at 2 PM and Court 4 at 3:30 PM.",
        isAI: true,
        timestamp: "2:15 PM",
        sources: [
          {
            documentName: "Guest Policy.pdf",
            chunkIndex: 23,
            score: 0.92,
            excerpt: "Members may bring up to two guests per visit. Guests must be accompanied by the member at all times and must sign in at the front desk.",
          },
          {
            documentName: "Membership Handbook.pdf",
            chunkIndex: 11,
            score: 0.88,
            excerpt: "Guest privileges are included in all membership tiers. Members are responsible for their guests' conduct and any applicable guest fees.",
          },
        ],
      },
    ],
  },
  {
    id: "conv-2",
    name: "Mike Chen",
    club: "Riverside Club",
    preview: "Is Court 3 available at 7 PM?",
    priority: "normal",
    confidence: 88,
    time: "15m ago",
    messages: [
      {
        id: "msg-2-1",
        direction: "inbound",
        content: "Is Court 3 available this evening at 7 PM?",
        isAI: false,
        timestamp: "1:45 PM",
      },
      {
        id: "msg-2-2",
        direction: "outbound",
        content: "Court 3 is available at 7 PM tonight. Would you like me to book it for you? The session is 60 minutes by default. If you need equipment rental, I can arrange that as well.",
        isAI: true,
        timestamp: "1:46 PM",
        sources: [
          {
            documentName: "Court Rules.pdf",
            chunkIndex: 5,
            score: 0.94,
            excerpt: "Courts may be booked up to 7 days in advance. Standard sessions are 60 minutes. Members may book back-to-back sessions subject to availability.",
          },
          {
            documentName: "Booking FAQ.json",
            chunkIndex: 3,
            score: 0.85,
            excerpt: "Equipment rental is available at the pro shop. Racquets, balls, and towels can be reserved when booking a court.",
          },
        ],
      },
      {
        id: "msg-2-3",
        direction: "inbound",
        content: "Yes please! Book it for me.",
        isAI: false,
        timestamp: "1:48 PM",
      },
      {
        id: "msg-2-4",
        direction: "outbound",
        content: "Done! Court 3 is booked for 7:00–8:00 PM tonight. A confirmation has been sent to your email. See you on the court! 🎾",
        isAI: true,
        timestamp: "1:48 PM",
        sources: [
          {
            documentName: "Booking FAQ.json",
            chunkIndex: 7,
            score: 0.91,
            excerpt: "Booking confirmations are sent via email and SMS. You can manage your bookings from the member portal or via the concierge.",
          },
        ],
      },
    ],
  },
  {
    id: "conv-3",
    name: "Lisa Park",
    club: "Elite Tennis",
    preview: "What's the cancellation policy?",
    priority: "urgent",
    confidence: 76,
    time: "1h ago",
    messages: [
      {
        id: "msg-3-1",
        direction: "inbound",
        content: "I need to cancel my booking for tomorrow. What's the cancellation policy? Will I get charged?",
        isAI: false,
        timestamp: "11:30 AM",
      },
      {
        id: "msg-3-2",
        direction: "outbound",
        content: "You can cancel up to 4 hours before your session with no charge. Since your booking is for tomorrow, you're well within the window — no fee will apply. I've gone ahead and cancelled it for you. Is there anything else?",
        isAI: true,
        timestamp: "11:31 AM",
        sources: [
          {
            documentName: "Court Rules.pdf",
            chunkIndex: 18,
            score: 0.89,
            excerpt: "Cancellations made more than 4 hours before the session start time incur no fee. Late cancellations or no-shows may be charged 50% of the session fee.",
          },
        ],
      },
    ],
  },
  {
    id: "conv-4",
    name: "Tom Baker",
    club: "Westside Sports",
    preview: "How do I upgrade to Premium?",
    priority: "normal",
    confidence: 95,
    time: "3h ago",
    messages: [
      {
        id: "msg-4-1",
        direction: "inbound",
        content: "I'm on the Basic plan. Thinking about upgrading to Premium. What's included and how do I switch?",
        isAI: false,
        timestamp: "9:15 AM",
      },
      {
        id: "msg-4-2",
        direction: "outbound",
        content: "Premium membership includes unlimited court bookings, 4 guest passes per month, access to all tournaments, and priority concierge support. The upgrade is $149/month (from your current $89). Would you like me to process the upgrade? It takes effect immediately.",
        isAI: true,
        timestamp: "9:16 AM",
        sources: [
          {
            documentName: "Pricing Tiers.pdf",
            chunkIndex: 7,
            score: 0.96,
            excerpt: "Premium Tier ($149/mo): Unlimited court bookings, 4 guest passes/month, tournament access, priority concierge. Basic Tier ($89/mo): 8 bookings/month, 1 guest pass/month.",
          },
          {
            documentName: "Membership Handbook.pdf",
            chunkIndex: 42,
            score: 0.83,
            excerpt: "Membership upgrades take effect immediately upon payment. The prorated difference is charged for the remaining billing cycle.",
          },
        ],
      },
    ],
  },
  {
    id: "conv-5",
    name: "Emma Rodriguez",
    club: "Elite Tennis",
    preview: "When is the summer tournament?",
    priority: "low",
    confidence: 82,
    time: "5h ago",
    messages: [
      {
        id: "msg-5-1",
        direction: "inbound",
        content: "Hi! When does the summer tournament start? I want to register.",
        isAI: false,
        timestamp: "7:30 AM",
      },
      {
        id: "msg-5-2",
        direction: "outbound",
        content: "The Summer Tournament kicks off on July 15th and runs through July 22nd. Registration is open now through July 8th. Categories include Singles, Doubles, and Mixed Doubles. Would you like me to register you?",
        isAI: true,
        timestamp: "7:31 AM",
        sources: [
          {
            documentName: "Summer Tournament Guide.pdf",
            chunkIndex: 2,
            score: 0.97,
            excerpt: "Summer Tournament 2026: July 15–22. Registration opens June 1, closes July 8. Categories: Men's/Women's Singles, Doubles, Mixed Doubles. Entry fee: $45 per category.",
          },
        ],
      },
    ],
  },
];

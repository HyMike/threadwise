// src/prompts/enhancedContext.ts
import { EnhancedThreadContext } from "@/types/threadAnalysis.types";

// Question and Answer test data

export const questionAnswerContext: EnhancedThreadContext = {
  thread: {
    text: "Question about 500 errors",
    user: "U06EVD3E6F2",
    reply_count: 3,
    reply_users_count: 3,
    reply_users: ["U06EVD3E6F2", "U06EVD3E6F3", "U06EVD3E6F4"],
    reactions: undefined,
    is_locked: false,
  },
  messages: [
    {
      timestamp: "1761273885.443439",
      user: "U06EVD3E6F2",
      userName: "Alice",
      text: "Hey team, we're getting 500 errors in production. Anyone know what might be causing this?",
    },
    {
      timestamp: "1761273885.443440",
      user: "U06EVD3E6F3",
      userName: "Bob",
      text: "Check the database connection pool settings. We had this issue last week.",
    },
    {
      timestamp: "1761273885.443441",
      user: "U06EVD3E6F4",
      userName: "Charlie",
      text: "Yeah, it's likely the connection timeout. We increased it to 30 seconds and it fixed it.",
    },
  ],
};

// Decision Discussion test data
export const decisionDiscussionContext: EnhancedThreadContext = {
  thread: {
    text: "Database migration decision",
    user: "U06EVD3E6F2",
    reply_count: 9,
    reply_users_count: 4,
    reply_users: ["U06EVD3E6F2", "U06EVD3E6F3", "U06EVD3E6F4", "U06EVD3E6F5"],
    reactions: undefined,
    is_locked: false,
  },
  messages: [
    {
      timestamp: "1761273885.443439",
      user: "U06EVD3E6F2",
      userName: "Alice",
      text: "Team, we need to decide on our database migration strategy. Should we go with PostgreSQL or stick with MySQL?",
    },
    {
      timestamp: "1761273885.443440",
      user: "U06EVD3E6F3",
      userName: "Bob",
      text: "I think PostgreSQL is the way to go. Better JSON support, more advanced features, and our team already knows it.",
    },
    {
      timestamp: "1761273885.443441",
      user: "U06EVD3E6F4",
      userName: "Charlie",
      text: "But migration will be expensive and risky. We have 2TB of data and zero downtime requirements. MySQL is working fine for us.",
    },
    {
      timestamp: "1761273885.443442",
      user: "U06EVD3E6F5",
      userName: "Diana",
      text: "Charlie has a point about the migration risk. But PostgreSQL would solve our current performance issues with complex queries.",
    },
    {
      timestamp: "1761273885.443443",
      user: "U06EVD3E6F2",
      userName: "Alice",
      text: "What if we do a gradual migration? Start with new features on PostgreSQL, migrate read replicas first?",
    },
    {
      timestamp: "1761273885.443444",
      user: "U06EVD3E6F3",
      userName: "Bob",
      text: "That could work. We could use a dual-write pattern during transition. More complex but safer.",
    },
    {
      timestamp: "1761273885.443445",
      user: "U06EVD3E6F4",
      userName: "Charlie",
      text: "I'm still concerned about the complexity. What's the timeline? We have Q4 deliverables coming up.",
    },
    {
      timestamp: "1761273885.443446",
      user: "U06EVD3E6F5",
      userName: "Diana",
      text: "We could start planning now, execute after Q4. That gives us 6 months to plan properly.",
    },
    {
      timestamp: "1761273885.443447",
      user: "U06EVD3E6F2",
      userName: "Alice",
      text: "Decision: We'll migrate to PostgreSQL using gradual migration approach. Start planning after Q4, begin with read replicas. Bob will lead the technical planning, Diana handles timeline coordination. Charlie, you'll be our risk mitigation advisor.",
    },
  ],
};

// Status Update test data

export const statusUpdateContext: EnhancedThreadContext = {
  thread: {
    text: "v2.1.0 deployment status",
    user: "U06EVD3E6F2",
    reply_count: 7,
    reply_users_count: 4,
    reply_users: [
      "U06EVD3E6F2",
      "U06EVD3E6F3",
      "U06EVD3E6F4",
      "U06EVD3E6F5",
      "U06EVD3E6F6",
    ],
    reactions: undefined,
    is_locked: false,
  },
  messages: [
    {
      timestamp: "1761273885.443439",
      user: "U06EVD3E6F2",
      userName: "Alice",
      text: "🚀 Just deployed v2.1.0 to production! New user dashboard is live.",
    },
    {
      timestamp: "1761273885.443440",
      user: "U06EVD3E6F3",
      userName: "Bob",
      text: "Nice! Performance looks good - 40% faster load times on the dashboard.",
    },
    {
      timestamp: "1761273885.443441",
      user: "U06EVD3E6F4",
      userName: "Charlie",
      text: "Deployment went smooth, no rollbacks needed. Database migration completed successfully.",
    },
    {
      timestamp: "1761273885.443442",
      user: "U06EVD3E6F5",
      userName: "Diana",
      text: "Monitoring shows all green. Next up: starting work on the API rate limiting feature.",
    },
    {
      timestamp: "1761273885.443443",
      user: "U06EVD3E6F2",
      userName: "Alice",
      text: "ETA for rate limiting: end of next week. Blocked on security review approval.",
    },
    {
      timestamp: "1761273885.443444",
      user: "U06EVD3E6F6",
      userName: "Eve",
      text: "Security review scheduled for tomorrow. Should unblock by Wednesday.",
    },
    {
      timestamp: "1761273885.443445",
      user: "U06EVD3E6F2",
      userName: "Alice",
      text: "Perfect! Also, Q4 planning meeting moved to Friday 2pm due to client demo.",
    },
  ],
};

// Casual Chat test data
export const casualChatContext: EnhancedThreadContext = {
  thread: {
    text: "TV show discussion",
    user: "U06EVD3E6F2",
    reply_count: 9,
    reply_users_count: 4,
    reply_users: ["U06EVD3E6F2", "U06EVD3E6F3", "U06EVD3E6F4", "U06EVD3E6F5"],
    reactions: undefined,
    is_locked: false,
  },
  messages: [
    {
      timestamp: "1761273885.443439",
      user: "U06EVD3E6F2",
      userName: "Alice",
      text: "Anyone else watching the new season of that show? 😂",
    },
    {
      timestamp: "1761273885.443440",
      user: "U06EVD3E6F3",
      userName: "Bob",
      text: "Which one? I'm behind on everything",
    },
    {
      timestamp: "1761273885.443441",
      user: "U06EVD3E6F4",
      userName: "Charlie",
      text: "Probably talking about the sci-fi one everyone's been posting about",
    },
    {
      timestamp: "1761273885.443442",
      user: "U06EVD3E6F2",
      userName: "Alice",
      text: "Yeah that one! The plot twist in episode 3 was wild 🤯",
    },
    {
      timestamp: "1761273885.443443",
      user: "U06EVD3E6F5",
      userName: "Diana",
      text: "Don't spoil it! I'm only on episode 1",
    },
    {
      timestamp: "1761273885.443444",
      user: "U06EVD3E6F3",
      userName: "Bob",
      text: "lol I'll add it to my watchlist. Thanks for the rec!",
    },
    {
      timestamp: "1761273885.443445",
      user: "U06EVD3E6F2",
      userName: "Alice",
      text: "Also, anyone know if the coffee machine is fixed? It's been broken all week",
    },
    {
      timestamp: "1761273885.443446",
      user: "U06EVD3E6F4",
      userName: "Charlie",
      text: "Yeah, maintenance fixed it this morning. Should be working now",
    },
    {
      timestamp: "1761273885.443447",
      user: "U06EVD3E6F2",
      userName: "Alice",
      text: "Sweet! Finally can get my afternoon caffeine fix ☕",
    },
  ],
};

// Technical Issue

export const technicalIssueContext: EnhancedThreadContext = {
  thread: {
    text: "API throwing 500 errors on /users endpoint",
    user: "U06EVD3E6F2",
    reply_count: 6,
    reply_users_count: 4,
    reply_users: ["U06EVD3E6F2", "U06EVD3E6F3", "U06EVD3E6F4", "U06EVD3E6F5"],
    reactions: undefined,
    is_locked: false,
  },
  messages: [
    {
      timestamp: "1761273885.443439",
      user: "U06EVD3E6F2",
      userName: "Alice",
      text: "🚨 URGENT: Our /users API endpoint is throwing 500 errors for the last 30 minutes. Users can't log in.",
    },
    {
      timestamp: "1761273885.443440",
      user: "U06EVD3E6F3",
      userName: "Bob",
      text: 'Checking logs now. Looks like database connection pool is exhausted. Getting "too many connections" errors.',
    },
    {
      timestamp: "1761273885.443441",
      user: "U06EVD3E6F4",
      userName: "Charlie",
      text: "Same issue we had last week. The connection pool max size is set to 10 but we have 15 concurrent requests during peak hours.",
    },
    {
      timestamp: "1761273885.443442",
      user: "U06EVD3E6F5",
      userName: "Diana",
      text: "I can increase the pool size to 25 and add connection timeout. Should fix it immediately.",
    },
    {
      timestamp: "1761273885.443443",
      user: "U06EVD3E6F3",
      userName: "Bob",
      text: "Deployed the fix. Pool size increased to 25, timeout set to 30 seconds. Monitoring shows connections dropping.",
    },
    {
      timestamp: "1761273885.443444",
      user: "U06EVD3E6F2",
      userName: "Alice",
      text: "✅ Confirmed - API is responding normally now. All users can log in again. Diana will add monitoring alerts for connection pool usage.",
    },
  ],
};

export interface ThreadInfo {
  text: string;
  user: string;
  reply_count?: number;
  reply_users_count?: number;
  reply_users?: string[];
  reactions?: Array<{
    name: string;
    users: string[];
    counter: number;
  }>;
  is_locked?: boolean;
}

export interface MessageInfo {
  user: string;
  userName: string;
  text: string;
  timestamp: string;
}

export interface EnhancedThreadContext {
  thread: ThreadInfo;
  messages: MessageInfo[];
}
export interface SummaryResponse {
  summary: string;
  status: "resolved" | "in_progress" | "unresolved";
  confidence: number;
}

export interface CategorizingThread {
  category:
    | "technical_issue"
    | "decision_discussion"
    | "question_answer"
    | "status_update"
    | "casual_chat";
  tone: "serious" | "neutral" | "playful" | "sarcastic";
  resolution: "resolved" | "unresolved" | "not_applicable";
}

export interface JiraTasks {
  summary: string;
  description: string;
}

export interface JiraTasksObj {
  tasks: JiraTasks[];
}

// testing out changes from github actions

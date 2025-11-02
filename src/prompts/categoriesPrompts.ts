import { LLMMessage } from "@/types/llmProvider.types";

// // Question_answer + tone
// do we want to implement something like there is a question that need to answer.

export const questionAnswerPrompt: LLMMessage = {
  role: "system" as const,
  content: `Analyze question-answer threads. Extract ONLY the core question and accepted answer.

  ANALYSIS GOALS:
  - Identify the main question being asked
  - Find the accepted/definitive answer
  - Ignore all side conversations, jokes, thank yous, and reactions
  - Or if a question need a answer. 

  [If tone = serious or neutral:]
  Extract:
  - The core question (1 sentence)
  - The accepted answer (2-3 sentences with context)
  - Who answered

  [If tone = playful or sarcastic:]
  Extract:
  - The core question (1 sentence)
  - The accepted answer (1 sentence, facts only)
  - Who answered

  ALWAYS IGNORE: Jokes, thank yous, reaction messages, side discussions, follow-up questions

   IMPORTANT: Respond with JSON in this format only:
  {
      "summary": "brief summary about what happen. 1 sentence max",
      "status": "resolved"|"in_progress"|"unresolved",
      "confidence": 0.85
  }

  IMPORTANT: Focus ONLY on the question-answer pair. Strip out everything else.`,
};

// ### `technical_issue` + tone

export const technicalIssuePrompt: LLMMessage = {
  role: "system" as const,
  content: `Analyze technical issues based on tone and context. Provide concise summaries for lead engineers.

  ANALYSIS GOALS:
  - Summarize key points, decisions made, and blockers
  - Detect resolution status and actionable outcomes
  - Extract critical information for technical leadership

EXTRACT ONLY:
  - What was the problem
  - How it was solved (if resolved)
  - Current status
  - Any blockers or next steps

  RESOLUTION STATUS:
  - White check mark = resolved
  - Explicit resolution statements = resolved
  - Otherwise = in_progress or unresolved

  [If tone = serious:]
  Extract full details:
  - Problem (1-2 sentences)
  - Root cause with explanation
  - Solution with reasoning (2-3 sentences)
  - Owner and status

  [If tone = neutral:]
  Extract standard details:
  - Problem (1 sentence)
  - Root cause (1 sentence)
  - Solution (1-2 sentences)
  - Owner and status

  [If tone = playful or sarcastic:]
  Extract minimal:
  - Problem (1 sentence)
  - Solution (1 sentence)
  - Owner and status
  IGNORE: All jokes, self-deprecating comments, memes

  Context rule: Only include debugging steps if tone is serious AND the issue is unresolved.

  IMPORTANT: Respond with JSON in this format only:
  {
      "summary": "Concise summary focusing on key decisions, blockers, and current status (2-3 sentences max)",
      "status": "resolved"|"in_progress"|"unresolved",
      "confidence": 0.85
  }

    IMPORTANT: 
  - Be concise and factual for technical leadership
  - Don't mention white check marks or technical details
  - Focus on what happened and current status
  - Don't restate obvious information
 `,
};

// ### `decision_discussion` + tone

export const decisionDiscussionPrompt: LLMMessage = {
  role: "system" as const,
  content: `Analyze decision discussion threads. Extract key decisions, tradeoffs, and rationale for technical leadership.

  ANALYSIS GOALS:
  - Identify the decision topic and context
  - Extract key tradeoffs and alternatives discussed
  - Capture the final decision and reasoning
  - Note any dissent or unresolved concerns

  [If tone = serious:]
  Extract full details:
  - Decision topic with full context (2 sentences)
  - Key tradeoffs discussed (3-4 points)
  - Decision made with detailed rationale (2-3 sentences)
  - Note any dissent or concerns

  [If tone = neutral:]
  Extract standard details:
  - Decision topic (1 sentence)
  - Key tradeoffs (2-3 points)
  - Decision and rationale (1-2 sentences)

  [If tone = playful:]
  Extract minimal:
  - Decision topic (1 sentence)
  - Decision made (1 sentence)
  IGNORE: Debates, back-and-forth, jokes, side discussions

  ALWAYS IGNORE: Jokes, memes, unrelated tangents, personal opinions not related to the decision

  IMPORTANT: Respond with JSON in this format only:
  {
      "summary": "Concise summary of the decision topic, key tradeoffs, and final decision (2-3 sentences max)",
      "status": "resolved"|"in_progress"|"unresolved",
      "confidence": 0.85
  }
  IMPORTANT: Focus on actionable decisions and rationale for technical leadership.`,
};

export const statusUpdatePrompt: LLMMessage = {
  role: "system" as const,
  content: `Analyze status update threads. Extract key progress, milestones, and blockers for technical leadership.

  ANALYSIS GOALS:
  - Identify what was accomplished or changed
  - Extract significant impact or blockers
  - Capture next steps or dependencies
  - Focus on actionable information for leadership

  [Tone does NOT affect this category - always extract factual information]

  Extract:
  - What happened (1 sentence)
  - Impact (if significant - performance, timeline, or scope changes)
  - Next steps (if applicable - deadlines, dependencies, or follow-up actions)
  - Any blockers or risks mentioned

  ALWAYS IGNORE: Celebrations, emojis, personal commentary, non-work updates

  IMPORTANT: Respond with JSON in this format only:
  {
      "summary": "Brief factual summary of what happened, impact, and next steps (1-2 sentences max)",
      "status": "resolved"|"in_progress"|"unresolved",
      "confidence": 0.85
  }
  IMPORTANT: Be factual, concise, and focus on information that affects project planning and resource allocation.`,
};

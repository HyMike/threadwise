import { LLMMessage } from "@/types/llmProvider.types";

export const categorizingPrompt: LLMMessage = {
  role: "system" as const,
  content: `You are analyzing Slack threads to classify them for summarization purposes.

  Your job is to classify threads across three dimensions:
  
  1. CATEGORY - Select exactly one:
     - technical_issue: Debugging, errors, outages, bugs, performance problems
     - decision_discussion: Choosing between options, making calls on designs/features/policies
     - question_answer: Someone asks a question and gets an answer
     - status_update: Progress reports, announcements, FYIs, deployment notices
     - casual_chat: Social conversation, jokes, non-work discussion
  
  2. TONE - Select exactly one:
     - serious: Urgent, critical, formal, or high-stakes discussion
     - neutral: Standard work conversation, matter-of-fact
     - playful: Light-hearted, jokes, emojis, casual banter
     - sarcastic: Ironic, mocking tone (even if discussing work topics)
  
  3. RESOLUTION - Select exactly one:
     - resolved: Issue fixed, question answered, decision made, update delivered
     - unresolved: Still open, blocked, needs follow-up
     - not_applicable: No resolution needed (casual chat, ongoing discussions)
  
  CLASSIFICATION GUIDELINES:
  - If a thread mixes work and jokes, classify by the PRIMARY content (what matters for work)
  - If someone asks a question that gets answered, it's question_answer even if there's lots of discussion
  - If it's purely social/memes with zero work content, it's casual_chat
  - Sarcastic tone means ironic/mocking language, not just casual
  - A thread can be playful but still substantive (e.g., debugging with lots of jokes)
  
  Always return valid JSON in this exact format:
  {
    "category": "one of the 5 categories",
    "tone": "one of the 4 tones",
    "resolution": "one of the 3 statuses"
  }`,
};

export const taskExtractionPrompt: LLMMessage = {
   role: "system" as const,
   content: `You are analyzing Slack conversations to extract actionable tasks that need to be completed.
 Your job: Identify unresolved action items or bugs from the conversation and extract clear task information for Jira tickets.
 Return ONLY valid JSON (no markdown, no preamble):
 {
   "tasks": [
     {
       "summary": "Clear, specific summary describing what needs to be done (5-10 words)",
       "description": {
         "type": "doc",
         "version": 1,
         "content": []
       }
     }
   ]
 }
 The description field must be in Atlassian Document Format (ADF). Use these ADF node types:
 - Paragraph: { "type": "paragraph", "content": [{ "type": "text", "text": "your text" }] }
 - Bold text: { "type": "text", "text": "bold text", "marks": [{ "type": "strong" }] }
 - Bullet list: { "type": "bulletList", "content": [{ "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "item" }] }] }] }
 GUIDELINES:
 Summary (Jira ticket headline):
 - Be specific and actionable
 - Start with a verb for tasks ("Fix...", "Add...", "Investigate...")
 - Describe the problem for bugs ("Fix login timeout for EU users")
 - Keep it concise: 5-10 words
 - This is what appears in the Jira ticket list and backlog
 Description (Jira ticket body in ADF format):
 Structure the description with clear section headers using the following pattern:
 REQUIRED SECTIONS (always include if information exists):
 - "Problem:" or "Need:" - What the issue or task is (use bold for headers)
 - "Why it matters / Business impact:" - Why this needs to be done
 OPTIONAL SECTIONS (only include if information is available from the conversation):
 - "Technical context from conversation:" - Error messages, systems involved, deployments, technical details
 - "Who is affected:" - Which users/systems are impacted
 - "Reproduction steps:" - Use bullet list for step-by-step instructions
 - "Workarounds mentioned:" - Temporary solutions discussed
 - "Technical requirements / scope:" - Use bullet list for what needs to be built
 - "Acceptance / Next steps for the ticket:" - Use bullet list for action items
 - "Reproduction / verification:" - Use bullet list for testing steps
 - "Relevant people mentioned:" or "Relevant people:" - Names and their roles/contributions
 ADF FORMATTING RULES:
 - Each section header should be a paragraph with bold text (use "marks": [{ "type": "strong" }])
 - Regular text goes in paragraph nodes
 - Use bulletList nodes for lists (reproduction steps, next steps, requirements)
 - Separate sections with empty paragraphs for spacing
 - Only include sections where you have actual information from the thread
 EXAMPLES:
 Thread: "The /users API is returning 500s. Logs show 'too many connections'. Diana increased pool from 10 to 25 and added timeouts. Bob says error rate dropped but still seeing intermittent 500s. Charlie is investigating connection cleanup. Alice thinks connections aren't being released."
 Good extraction:
 {
   "tasks": [
     {
       "summary": "Fix DB connection leak in /users endpoint",
       "description": {
         "type": "doc",
         "version": 1,
         "content": [
           {
             "type": "paragraph",
             "content": [
               { "type": "text", "text": "Problem:", "marks": [{ "type": "strong" }] },
               { "type": "text", "text": " The /users endpoint is producing persistent 500 errors that prevent user logins. Logs show \\"too many connections\\" from the database, indicating connection pool exhaustion or connections not being released." }
             ]
           },
           {
             "type": "paragraph",
             "content": [{ "type": "text", "text": "" }]
           },
           {
             "type": "paragraph",
             "content": [
               { "type": "text", "text": "Why it matters / Business impact:", "marks": [{ "type": "strong" }] },
               { "type": "text", "text": " Login functionality is failing for customers while this persists. This is a production outage affecting all users that try to authenticate or access /users." }
             ]
           },
           {
             "type": "paragraph",
             "content": [{ "type": "text", "text": "" }]
           },
           {
             "type": "paragraph",
             "content": [
               { "type": "text", "text": "Technical context from conversation:", "marks": [{ "type": "strong" }] },
               { "type": "text", "text": " Team temporarily increased the DB connection pool from 10 to 25 and added timeouts; error rate dropped but intermittent 500s continue. Suspected cause is lingering/unreleased DB connections (connection leak). Charlie is investigating connection cleanup and idle timeout settings; Diana and Bob deployed the pool/timeout changes and observed partial improvement." }
             ]
           },
           {
             "type": "paragraph",
             "content": [{ "type": "text", "text": "" }]
           },
           {
             "type": "paragraph",
             "content": [
               { "type": "text", "text": "Who is affected:", "marks": [{ "type": "strong" }] },
               { "type": "text", "text": " All users attempting to log in or any service calls to /users." }
             ]
           },
           {
             "type": "paragraph",
             "content": [{ "type": "text", "text": "" }]
           },
           {
             "type": "paragraph",
             "content": [
               { "type": "text", "text": "Reproduction steps:", "marks": [{ "type": "strong" }] }
             ]
           },
           {
             "type": "bulletList",
             "content": [
               {
                 "type": "listItem",
                 "content": [
                   {
                     "type": "paragraph",
                     "content": [{ "type": "text", "text": "Send normal login requests that call the /users endpoint (as end users do)." }]
                   }
                 ]
               },
               {
                 "type": "listItem",
                 "content": [
                   {
                     "type": "paragraph",
                     "content": [{ "type": "text", "text": "Observe intermittent 500 responses on /users and corresponding \\"too many connections\\" errors in application and DB logs." }]
                   }
                 ]
               },
               {
                 "type": "listItem",
                 "content": [
                   {
                     "type": "paragraph",
                     "content": [{ "type": "text", "text": "Check DB pool metrics to see connection saturation." }]
                   }
                 ]
               }
             ]
           },
           {
             "type": "paragraph",
             "content": [{ "type": "text", "text": "" }]
           },
           {
             "type": "paragraph",
             "content": [
               { "type": "text", "text": "Workarounds mentioned:", "marks": [{ "type": "strong" }] },
               { "type": "text", "text": " Increasing the connection pool to 25 and adding timeouts temporarily reduced error rate but did not fully resolve the issue." }
             ]
           },
           {
             "type": "paragraph",
             "content": [{ "type": "text", "text": "" }]
           },
           {
             "type": "paragraph",
             "content": [
               { "type": "text", "text": "Acceptance / Next steps for the ticket:", "marks": [{ "type": "strong" }] }
             ]
           },
           {
             "type": "bulletList",
             "content": [
               {
                 "type": "listItem",
                 "content": [
                   {
                     "type": "paragraph",
                     "content": [{ "type": "text", "text": "Reproduce locally or in a staging environment to confirm leak (use load test to simulate sustained traffic)." }]
                   }
                 ]
               },
               {
                 "type": "listItem",
                 "content": [
                   {
                     "type": "paragraph",
                     "content": [{ "type": "text", "text": "Audit all code paths in /users handler and any helpers for missing connection release/close (including error/exception branches and async flows)." }]
                   }
                 ]
               },
               {
                 "type": "listItem",
                 "content": [
                   {
                     "type": "paragraph",
                     "content": [{ "type": "text", "text": "Fix code paths that fail to release connections (ensure finally blocks / using-with-resources / connection pooling API usage is correct)." }]
                   }
                 ]
               },
               {
                 "type": "listItem",
                 "content": [
                   {
                     "type": "paragraph",
                     "content": [{ "type": "text", "text": "Add tests or load test scenario that would reveal the leak and verify fix." }]
                   }
                 ]
               },
               {
                 "type": "listItem",
                 "content": [
                   {
                     "type": "paragraph",
                     "content": [{ "type": "text", "text": "Deploy patch to staging, run load test, confirm connections return to pool and 500s stop." }]
                   }
                 ]
               }
             ]
           },
           {
             "type": "paragraph",
             "content": [{ "type": "text", "text": "" }]
           },
           {
             "type": "paragraph",
             "content": [
               { "type": "text", "text": "Relevant people mentioned:", "marks": [{ "type": "strong" }] },
               { "type": "text", "text": " Charlie (investigating connection cleanup & idle timeouts), Diana (deployed pool/timeout change), Bob (observed logs/partial improvement), Alice (suspected unreleased connections)." }
             ]
           }
         ]
       }
     }
   ]
 }
 Thread: "Add a search bar to the dashboard"
 Good extraction:
 {
   "tasks": [
     {
       "summary": "Add search bar to dashboard",
       "description": {
         "type": "doc",
         "version": 1,
         "content": [
           {
             "type": "paragraph",
             "content": [
               { "type": "text", "text": "Need:", "marks": [{ "type": "strong" }] },
               { "type": "text", "text": " Add a search bar to the dashboard to allow users to search for content." }
             ]
           },
           {
             "type": "paragraph",
             "content": [{ "type": "text", "text": "" }]
           },
           {
             "type": "paragraph",
             "content": [
               { "type": "text", "text": "Why it matters / Business impact:", "marks": [{ "type": "strong" }] },
               { "type": "text", "text": " Will improve user experience by enabling quick content discovery instead of manual scrolling or filtering." }
             ]
           }
         ]
       }
     }
   ]
 }
 Thread: "Hey, what's the status of the mobile app release?" "It went out yesterday, all good!"
 Good extraction:
 {
   "tasks": []
 }
 RULES:
 - Only extract tasks that are unresolved or need follow-up action
 - Don't extract completed work or resolved issues
 - Don't extract vague discussions without clear action items
 - Don't include timestamp IDs (e.g., "reported by Bob at 1762132161.429549")
 - If conversation is just Q&A that was resolved, return empty tasks array
 - Each task should be actionable with enough detail for developers
 - Don't estimate effort or story points - developers will do this during grooming
 - Don't assign priority levels - team will prioritize during planning
 - Don't assign owners - team will self-assign during sprint planning
 - ONLY include information that exists in the conversation - do not invent technical details, metrics, or facts
 - CRITICAL: description MUST be valid ADF format with type, version, and content fields
 Focus on creating well-structured ADF descriptions that render nicely in Jira with clear sections and proper formatting.`,
 };
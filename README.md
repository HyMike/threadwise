# Threadwise

Threadwise is an app you can self-host to serve as your helpful coworker who proactively takes initiative on long slack threads. It helps summarize long threads so you don't have to, pulls out action items, detects unresolved conversations, and gently follows up with folks in the thread when a resolution has not been met.

## Getting Started

1. You need to have a slack bot created with access to read, write messages.
2. Need an OpenAI API Key.
   TO-DO: Add more steps

## Overview of Main Objectives

1. Slack Thread Summarizer / Resolution Detector (Phase 1)
   What it does:
   Watches long Slack threads in real-time.
   Summarizes the discussion (key points, decisions made, blockers).
   Detects whether the thread ended with consensus or unresolved issues.
   Optionally, posts a “TL;DR” summary at the end or sends a daily digest of unresolved threads.

Agent angle:
One agent can gather messages, another can generate the summary, a third can classify resolution status.

2. Action Item Extractor (Phase 3)
   What it does:
   Pulls out tasks, owners, and deadlines mentioned in threads.
   Creates a mini “to-do list” for each thread.
   Could integrate with Jira, Notion, or Google Tasks.

3. Auto Follow-Up Reminder Agent (TBD)
   What it does:
   Detects threads where questions were asked but not answered.
   Sends a gentle Slack reminder to the relevant person.
   Tracks which threads still need attention.

## Rollout Plan

Phase 1: Local MVP 🎯
Goal: Get basic thread analysis working with manual setup
[x] Basic Slack app setup in your workspace
[x] TypeScript project structure (already done)
[ ] Core Features: - Thread detection - Basic summarization - Resolution status check
[ ] Manual configuration via .env file
[ ] Single workspace, single channel

Phase 2: Multi-Channel Support 📚
Goal: Handle multiple channels in your test workspace
[ ] Channel management
[ ] Channel-specific configurations
[ ] Basic persistence (SQLite/JSON for now)
[ ] Simple command interface

Phase 3: Thread Analysis Enhancement 🧠
Goal: Improve the core value proposition
[ ] Better summarization
[ ] Action item extraction
[ ] Participant analysis
[ ] Resolution detection improvements
[ ] Thread categorization

Phase 4: Multi-Workspace Support 🏢
Goal: Support multiple organizations
[ ] Multi-tenant database design
[ ] Proper OAuth flow
[ ] Workspace-specific configurations
[ ] Rate limiting
[ ] Error handling improvements

Phase 5: Public App Distribution 🚀
Goal: Prepare for public release
[ ] Privacy policy
[ ] Terms of service
[ ] App review preparation
[ ] Security audit
[ ] Rate limit handling
[ ] Monitoring & logging

Phase 6: Configuration UI 🎨
Goal: Make it user-friendly
[ ] App Home tab
[ ] Settings interface
[ ] Channel management UI
[ ] Basic analytics

Phase 7: Admin Dashboard 📊
Goal: Add admin features
[ ] Web dashboard
[ ] Advanced analytics
[ ] Usage statistics
[ ] Billing integration
[ ] User management

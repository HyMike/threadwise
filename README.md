# Threadwise

Threadwise is an app you can self-host to serve as your helpful coworker who proactively takes initiative on long slack threads. It helps summarize long threads so you don't have to, pulls out action items, detects unresolved conversations, and gently follows up with folks in the thread when a resolution has not been met.

## Getting Started

### Prerequisites
1. Slack bot with permissions: `channels:history`, `channels:read`, `chat:write`, `reactions:write`, `users:read`
2. OpenAI API Key or other LLM provider
3. Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your Slack and LLM credentials
```

### Running the Application

**Development Mode:**
```bash
# Run API server only
npm run dev

# Run cron scheduler only (in a separate terminal)
npm run dev:cron

# Run both API server and cron together
npm run dev:all
```

**Production Mode:**
```bash
# Build the application
npm run build

# Run API server
npm start

# Run cron scheduler (in a separate process)
npm run start:cron
```

### Environment Variables

```bash
# Deployment mode
DEPLOYMENT_MODE=single  # or 'multi' for multi-workspace

# Single workspace mode
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_CHANNEL_ID=C1234567890

# Multi-workspace mode (for future)
SLACK_CLIENT_ID=your-client-id
SLACK_CLIENT_SECRET=your-client-secret

# LLM Configuration
OPENAI_API_KEY=sk-your-key

# Server configuration
PORT=3000
HOST=localhost

# Cron configuration
CRON_SCHEDULE="*/15 * * * *"  # Every 15 minutes
RUN_ON_START=true  # Run analysis immediately on startup

# Execution Mode
EXECUTION_MODE=in-memory  # or 'kubernetes' for K8s jobs

# Kubernetes Configuration (only needed if EXECUTION_MODE=kubernetes)
K8S_NAMESPACE=default
K8S_IMAGE_NAME=your-registry/threadwise
K8S_IMAGE_TAG=latest
K8S_SECRET_NAME=threadwise-secrets
K8S_TTL_SECONDS=3600
K8S_BACKOFF_LIMIT=3
K8S_MEMORY_REQUEST=256Mi
K8S_CPU_REQUEST=100m
K8S_MEMORY_LIMIT=512Mi
K8S_CPU_LIMIT=500m
```

### API Endpoints

Once the server is running, you can access:

- **Health Check**: `GET http://localhost:3000/health`
- **Analyze Workspace**: `POST http://localhost:3000/api/workspaces/:workspaceId/analyze`

### Testing

```bash
# Test the API manually
curl http://localhost:3000/health

# Trigger analysis for a workspace
curl -X POST http://localhost:3000/api/workspaces/default/analyze
```

## Execution Modes

Threadwise supports two execution modes for workspace analysis:

### 1. In-Memory Mode (Default)
Direct API calls from the cron orchestrator to the API server. Best for:
- Development and testing
- Small number of workspaces (<50)
- Simple infrastructure requirements
- Faster execution

```bash
EXECUTION_MODE=in-memory
```

### 2. Kubernetes Jobs Mode
Each workspace analysis runs as an isolated Kubernetes job. Best for:
- Production deployments with many workspaces
- Need for resource isolation per workspace
- Horizontal scaling across K8s cluster
- Fault isolation (one workspace failure doesn't affect others)

```bash
EXECUTION_MODE=kubernetes
```

## Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (1.19+)
- kubectl configured
- Docker registry for your images

### Step 1: Build and Push Docker Image

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .
RUN npm run build

CMD ["node", "dist/server.js"]
```

```bash
# Build and push
docker build -t your-registry/threadwise:latest .
docker push your-registry/threadwise:latest
```

### Step 2: Create Kubernetes Secret

```bash
kubectl create secret generic threadwise-secrets \
  --from-literal=llm-api-key=your-openai-key \
  --from-literal=llm-provider=openai \
  --from-literal=llm-model=gpt-4o-mini \
  --namespace=default
```

### Step 3: Deploy API Server

```yaml
# k8s/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: threadwise-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: threadwise
      component: api
  template:
    metadata:
      labels:
        app: threadwise
        component: api
    spec:
      containers:
      - name: api
        image: your-registry/threadwise:latest
        ports:
        - containerPort: 3000
        env:
        - name: DEPLOYMENT_MODE
          value: "single"
        - name: EXECUTION_MODE
          value: "kubernetes"
        - name: K8S_NAMESPACE
          value: "default"
        - name: K8S_IMAGE_NAME
          value: "your-registry/threadwise"
        - name: K8S_IMAGE_TAG
          value: "latest"
        envFrom:
        - secretRef:
            name: threadwise-secrets
---
apiVersion: v1
kind: Service
metadata:
  name: threadwise-api
spec:
  selector:
    app: threadwise
    component: api
  ports:
  - port: 3000
    targetPort: 3000
```

### Step 4: Deploy Cron Orchestrator

```yaml
# k8s/cron-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: threadwise-cron
spec:
  replicas: 1
  selector:
    matchLabels:
      app: threadwise
      component: cron
  template:
    metadata:
      labels:
        app: threadwise
        component: cron
    spec:
      containers:
      - name: cron
        image: your-registry/threadwise:latest
        command: ["node", "dist/jobs/cronOrchestrator.js"]
        env:
        - name: EXECUTION_MODE
          value: "kubernetes"
        - name: API_URL
          value: "http://threadwise-api.default.svc.cluster.local:3000"
        - name: CRON_SCHEDULE
          value: "*/15 * * * *"
```

### Step 5: Grant RBAC Permissions

The cron orchestrator needs permissions to create K8s jobs:

```yaml
# k8s/rbac.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: threadwise-cron
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: threadwise-job-manager
rules:
- apiGroups: ["batch"]
  resources: ["jobs"]
  verbs: ["create", "get", "list", "delete"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: threadwise-job-manager
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: threadwise-job-manager
subjects:
- kind: ServiceAccount
  name: threadwise-cron
```

Update the cron deployment to use the service account:

```yaml
spec:
  template:
    spec:
      serviceAccountName: threadwise-cron
      containers:
      # ... rest of config
```

### Deploy Everything

```bash
kubectl apply -f k8s/
```

### Switching Between Modes

Simply change the `EXECUTION_MODE` environment variable:

```bash
# Switch to in-memory
kubectl set env deployment/threadwise-cron EXECUTION_MODE=in-memory

# Switch to kubernetes
kubectl set env deployment/threadwise-cron EXECUTION_MODE=kubernetes
```

No code changes required!

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

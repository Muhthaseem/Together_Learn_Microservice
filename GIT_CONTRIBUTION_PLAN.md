# Git Contribution Plan — 3 Members, 5 Days

Each member works on their own branch and pushes daily. At the end of each day, merge or open a PR into `main`. This makes the commit history show natural parallel development across all three members.

**Member assignments:**
- Member A → Infrastructure & Security → branch: `feat/infrastructure`
- Member B (Muhthaseem) → Learning Domain Services → branch: `feat/domain-services`
- Member C → Advanced Features & DevOps → branch: `feat/devops-deployment`

---

## Current Progress

| Commit | Member | Status |
|---|---|---|
| `47df517` chore: add .gitattributes LF enforcement, remove old doc stubs, update README | B | ✅ Done |
| `67ac6ac` feat: update frontend API client, auth context, nav badge, dashboard pages | B | ✅ Done |
| `001a595` feat: add course service with curriculum seeding and Redis cache | B | ✅ Done |
| `a0faa61` feat: add Maven parent POM and Eureka discovery server | A (on B's branch) | ✅ Done |

---

## One-Time Repo Setup ✅ DONE

Already completed. `.gitattributes` is committed and LF enforcement is active. No further action needed.

---

## Branch Setup

**Member A:** (run once before starting)
```bash
git checkout main
git pull origin main
git checkout -b feat/infrastructure
```

**Member B (Muhthaseem):** ✅ Already on `feat/domain-services`

**Member C:** (run once before starting)
```bash
git checkout main
git pull origin main
git checkout -b feat/devops-deployment
```

---

## Day 1 — Foundation & Project Skeleton

### Member A — Discovery Server + Parent POM ✅ DONE
> Commit `a0faa61` already on `feat/domain-services`. Member A should cherry-pick it or replicate the commit on their own branch:
```bash
git checkout feat/infrastructure
git cherry-pick a0faa61
git push origin feat/infrastructure
```

### Member B (Muhthaseem) — Course Service ✅ DONE
> Commit `001a595` — already pushed.

### Member C — Docker Compose + README
```bash
git checkout feat/devops-deployment
git add docker-compose.yml
git add README.md
git commit -m "feat: add docker-compose orchestration and project README"
git push origin feat/devops-deployment
```

---

## Day 2 — Core Services

### Member A — API Gateway (Routing + JWT)
```bash
git checkout feat/infrastructure
git add services/api-gateway/src/main/java/com/togetherlearn/gateway/ApiGatewayApplication.java
git add services/api-gateway/src/main/java/com/togetherlearn/gateway/filter/JwtAuthFilter.java
git add services/api-gateway/src/main/resources/
git add services/api-gateway/pom.xml
git add services/api-gateway/Dockerfile
git commit -m "feat: add API gateway with JWT validation and route configuration"
git push origin feat/infrastructure
```

### Member B (Muhthaseem) — Group Service
```bash
git checkout feat/domain-services
git add services/group-service/
git commit -m "feat: add group service — study group creation, membership, RabbitMQ events"
git push origin feat/domain-services
```

### Member C — Peer Teaching Service
```bash
git checkout feat/devops-deployment
git add services/peer-teaching-service/
git commit -m "feat: add peer teaching service — offers, requests, applications, sessions"
git push origin feat/devops-deployment
```

---

## Day 3 — Business Logic & Features

### Member A — User Service
```bash
git checkout feat/infrastructure
git add services/user-service/
git commit -m "feat: add user service — registration, login, profiles, RBAC, JWT issuance"
git push origin feat/infrastructure
```

### Member B (Muhthaseem) — Q&A Service + Notification Service
```bash
git checkout feat/domain-services

git add services/qa-service/
git commit -m "feat: add Q&A service — questions, answers, votes, bookmarks, replies"
git push origin feat/domain-services

git add services/notification-service/
git commit -m "feat: add notification service — RabbitMQ consumer, unread count cache"
git push origin feat/domain-services
```

### Member C — Chat Service + Monitoring
```bash
git checkout feat/devops-deployment

git add services/chat-service/
git commit -m "feat: add chat service — WebSocket STOMP, message persistence"
git push origin feat/devops-deployment

git add monitoring/
git commit -m "feat: add Prometheus scrape config, Grafana datasource, Logstash pipeline"
git push origin feat/devops-deployment
```

---

## Day 4 — Infrastructure, Frontend & Kubernetes

### Member A — File Service + Gateway Filters
```bash
git checkout feat/infrastructure

git add services/file-service/
git commit -m "feat: add file service — MinIO S3 upload/download with presigned URLs"
git push origin feat/infrastructure

git add services/api-gateway/src/main/java/com/togetherlearn/gateway/filter/RateLimitFilter.java
git add services/api-gateway/src/main/java/com/togetherlearn/gateway/filter/LoggingFilter.java
git add services/api-gateway/src/main/java/com/togetherlearn/gateway/controller/
git commit -m "feat: add rate limiting (Redis), circuit breakers (Resilience4j), request logging"
git push origin feat/infrastructure
```

### Member B (Muhthaseem) — Admin Panel + Chat UI
```bash
git checkout feat/domain-services

git add frontend/src/app/dashboard/admin/
git add frontend/src/components/chat/
git commit -m "feat: add admin panel and real-time group chat UI"
git push origin feat/domain-services
```

### Member C — Kubernetes Manifests
```bash
git checkout feat/devops-deployment

git add k8s/namespace.yaml
git add k8s/secrets/
git add k8s/configmaps/
git add k8s/stateful/
git commit -m "feat: add K8s namespace, secrets, configmaps, stateful infrastructure"
git push origin feat/devops-deployment

git add k8s/deployments/
git add k8s/hpa/
git add k8s/ingress/
git add k8s/monitoring/
git commit -m "feat: add K8s deployments, HPA autoscaling, ingress, monitoring stack"
git push origin feat/devops-deployment
```

---

## Day 5 — CI/CD, Documentation & Final Polish

### Member A — GitHub Actions CI + Remaining Dockerfiles
```bash
git checkout feat/infrastructure

git add .github/workflows/ci.yml
git add services/user-service/Dockerfile
git add services/group-service/Dockerfile
git add services/notification-service/Dockerfile
git add services/chat-service/Dockerfile
git add services/file-service/Dockerfile
git add services/peer-teaching-service/Dockerfile
git add services/.dockerignore
git commit -m "ci: add GitHub Actions PR validation pipeline — parallel matrix build"
git push origin feat/infrastructure
```

### Member B (Muhthaseem) — Frontend Docker + Postman + Roadmap
```bash
git checkout feat/domain-services

git add frontend/Dockerfile
git add frontend/.dockerignore
git add PRODUCT_ROADMAP.md
git add TogetherLearn.postman_collection.json
git add postman/
git add GIT_CONTRIBUTION_PLAN.md
git commit -m "feat: add frontend Dockerfile, Postman collection, product roadmap"
git push origin feat/domain-services
```

### Member C — Deploy Pipeline + Documentation
```bash
git checkout feat/devops-deployment

git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Actions deploy pipeline — Docker Hub push, rolling K8s deploy"
git push origin feat/devops-deployment

git add RUNNING.md
git add DEPLOYMENT.md
git add docs/
git commit -m "docs: add startup guide, deployment guide, final architecture document"
git push origin feat/devops-deployment
```

---

## Merging to Main (After All 5 Days)

Each member opens a pull request on GitHub from their branch into `main`. Merge in this order:

1. Member A merges `feat/infrastructure` → `main`
2. Member C merges `feat/devops-deployment` → `main`
3. Member B (Muhthaseem) merges `feat/domain-services` → `main`

If conflicts appear, accept the incoming changes for files owned by that member.

---

## Summary of Ownership

| Area | Member A | Member B (Muhthaseem) | Member C |
|---|---|---|---|
| Discovery Server | ✅ Done | | |
| API Gateway (routing, JWT, rate limit, circuit breaker) | To do | | |
| User Service | To do | | |
| File Service | To do | | |
| GitHub Actions CI | To do | | |
| Course Service | | ✅ Done | |
| Frontend API client, auth, nav, dashboard pages | | ✅ Done | |
| Group Service | | To do | |
| Q&A Service | | To do | |
| Notification Service | | To do | |
| Admin Panel + Chat UI | | To do | |
| Frontend Dockerfile + Postman + Roadmap | | To do | |
| Peer Teaching Service | | | To do |
| Chat Service | | | To do |
| Docker Compose | | | To do |
| Monitoring (Prometheus, Grafana, Logstash) | | | To do |
| Kubernetes Manifests | | | To do |
| GitHub Actions Deploy | | | To do |
| Documentation (RUNNING.md, DEPLOYMENT.md, docs/) | | | To do |

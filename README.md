# TogetherLearn

A collaborative learning platform for university students — study groups, Q&A forum, peer teaching with session scheduling and ratings, real-time chat, in-app notifications, and file sharing. Built as a production-grade Spring Boot microservices system with a Next.js frontend.

> **Start here:** [RUNNING.md](RUNNING.md) — startup instructions, all credentials, port reference, CI/CD setup  
> **Architecture deep-dive:** [docs/FINAL_SOFTWARE_ARCHITECTURE.md](docs/FINAL_SOFTWARE_ARCHITECTURE.md) — design decisions, all component diagrams, data architecture, observability, Kubernetes layout

---

## Architecture Overview

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (TypeScript, Tailwind CSS, App Router) |
| API Gateway | Spring Cloud Gateway — JWT validation, rate limiting, circuit breakers |
| Service Discovery | Netflix Eureka |
| Microservices | Spring Boot 3.2.5 + Spring Cloud 2023.0.1 (10 domain services) |
| Databases | PostgreSQL 16 — one isolated database per service |
| DB Migrations | Flyway (versioned, runs automatically on startup) |
| Message Broker | RabbitMQ 3.13 — async event-driven notifications |
| Cache | Redis 7 — user profiles, course catalog, JWT blacklist, unread counts |
| Real-time Chat | WebSocket — STOMP over SockJS |
| File Storage | MinIO (S3-compatible local) via `file-service` |
| Access Control | RBAC — STUDENT (default) and ADMIN roles |
| Metrics | Prometheus + Grafana — per-service request rate, error rate, JVM health |
| Distributed Tracing | Zipkin + Micrometer Brave — 100% trace sampling in dev |
| Centralized Logging | ELK Stack — structured JSON logs shipped to Elasticsearch via Logstash |
| Containerization | Docker Compose (27 containers) / Kubernetes (k8s/) |
| CI/CD | GitHub Actions — PR validation + build, push, rolling K8s deploy on merge to main |

---

## Services

| Service | Port | Responsibility |
|---|---|---|
| `discovery-server` | 8761 | Netflix Eureka service registry |
| `api-gateway` | 8080 | JWT auth, rate limiting, circuit breakers, request logging |
| `user-service` | 8081 | Registration, login, profiles, RBAC, password change |
| `course-service` | 8082 | Course catalog (seeded from JSON), admin CRUD, Redis cache |
| `group-service` | 8083 | Study group creation, membership, RabbitMQ events |
| `qa-service` | 8084 | Questions, answers, upvotes, bookmarks, threaded replies |
| `peer-teaching-service` | 8085 | Peer requests/offers, session scheduling, tutor ratings |
| `notification-service` | 8086 | In-app notifications — RabbitMQ consumer, unread count cache |
| `chat-service` | 8087 | Group chat — REST history + WebSocket STOMP/SockJS |
| `file-service` | 8088 | File upload/download via MinIO (S3) |

---

## Technology Stack

### Backend
- **Java 17** — Spring Boot 3.2.5, Spring Cloud 2023.0.1
- **Spring Cloud Gateway** — reactive API gateway with JWT validation, Redis rate limiting (INCR + TTL), Resilience4j circuit breakers, request/response logging filter
- **Netflix Eureka** — client-side service discovery and load balancing (`lb://SERVICE-NAME`)
- **PostgreSQL 16** — one schema per service; Flyway versioned migrations (V1–V4 per service)
- **RabbitMQ 3.13** — topic exchange `tl.events`, durable queue `tl.notifications`, dead-letter queue; retry with 3-attempt backoff
- **Redis 7** — user profile cache (10 min TTL), course catalog cache (24 hr TTL), JWT blacklist (logout), rate limit counters, unread notification counts
- **Micrometer** — Prometheus registry (`/actuator/prometheus`), Brave tracing bridge
- **Logstash Logback Encoder 7.4** — structured JSON logs to Logstash TCP in Docker; plain console in local dev

### Frontend
- **Next.js 14** (App Router, TypeScript, Tailwind CSS)
- **SockJS + STOMP** — WebSocket chat client
- JWT stored in `localStorage`; forwarded as `Authorization: Bearer <token>` on every API call

### Infrastructure
- **Zipkin 3** — distributed trace collector and UI
- **Prometheus** — time-series metrics scraper (scrapes all 10 services every 15 s)
- **Grafana 10** — dashboards with Prometheus as auto-provisioned datasource
- **Elasticsearch 8.13** — log storage (index per service per day: `togetherlearn-{app}-{date}`)
- **Logstash 8.13** — TCP input (port 5044) → Elasticsearch output
- **Kibana 8.13** — log search and visualisation
- **MinIO** — S3-compatible local object storage

---

## Key Design Decisions

**One database per service** — Group, Q&A, Peer Teaching, Notification, Chat, and User each own their PostgreSQL database. No shared schemas. Cross-service data is propagated via RabbitMQ events.

**Async notifications** — When a user joins a group, answers a question, applies to tutor, or a session is scheduled, the originating service publishes an event to `tl.events`. Notification Service consumes it and stores an in-app notification. No synchronous Feign calls.

**JWT at the gateway** — The API Gateway validates every JWT (signature + Redis blacklist check) and forwards identity as HTTP headers (`X-User-Id`, `X-User-Role`, etc.). Downstream services trust these headers and never re-validate the token.

**Rate limiting** — Three tiers at the gateway: 10 req/min per IP for auth endpoints (brute-force protection), 300 req/min per user ID for authenticated routes, 30 req/min per IP for anonymous routes. Implemented with Redis `INCR + EXPIRE` (fixed window) at filter order 0.

**Circuit breakers** — Every upstream route has a Resilience4j circuit breaker (sliding window 10 calls, 50% failure threshold, 30 s open wait). On open, the gateway returns a `503` JSON response from `FallbackController`. WebSocket route intentionally excluded.

**Session scheduling** — Accepting a peer application automatically creates a `TutoringSession`, rejects all other pending applications for the same request, and publishes `SESSION_SCHEDULED` events to both tutor and student via RabbitMQ.

**CI/CD pipeline** — Two GitHub Actions workflows: `ci.yml` validates every PR (parallel matrix build of all 10 services + frontend type-check), `deploy.yml` runs on merge to main (build → Docker Hub push with SHA tag + Docker layer cache → `kubectl apply` + rolling `kubectl set image` → `kubectl rollout status` wait). Docker Hub images tagged `<sha>` for traceability and `latest` for K8s pulls.

---

## Project Structure

```
TogetherLearn_DisSysArch/
├── docker-compose.yml                   # 27-container full-stack orchestration
├── README.md                            # This file — architecture and design
├── RUNNING.md                           # Startup guide, credentials, ports
├── PRODUCT_ROADMAP.md                   # Phase-by-phase implementation plan
├── TogetherLearn.postman_collection.json
│
├── .github/
│   └── workflows/
│       ├── ci.yml                       # PR validation — parallel build of all services + frontend
│       └── deploy.yml                   # Push-to-main — Docker Hub push + rolling K8s deploy
│
├── monitoring/
│   ├── prometheus.yml                   # Scrape config for all 10 services
│   ├── grafana/
│   │   └── provisioning/
│   │       └── datasources/
│   │           └── prometheus.yml       # Auto-provisions Prometheus datasource
│   └── logstash/
│       └── logstash.conf                # TCP → Elasticsearch pipeline
│
├── k8s/
│   ├── namespace.yaml
│   ├── secrets/app-secrets.yaml         # All credentials (stringData)
│   ├── configmaps/common-config.yaml    # EUREKA_URI, ZIPKIN_URL, SPRING_PROFILES_ACTIVE
│   ├── stateful/                        # PostgreSQL (×7), RabbitMQ, Redis, MinIO StatefulSets
│   ├── deployments/                     # 10 services + frontend Deployments + ClusterIP Services
│   ├── hpa/hpa.yaml                     # HPA for all app services (CPU 70%, 2–8 replicas)
│   ├── ingress/ingress.yaml             # nginx Ingress — app.* → frontend, api.* → gateway
│   └── monitoring/monitoring.yaml       # Zipkin, Prometheus, Grafana, Elasticsearch, Logstash, Kibana
│
├── frontend/                            # Next.js 14 application
│   ├── Dockerfile
│   └── src/
│       ├── app/
│       │   ├── auth/login/
│       │   ├── auth/register/
│       │   └── dashboard/
│       │       ├── admin/               # Admin panel — users + course management
│       │       ├── groups/              # Study groups with live WebSocket chat
│       │       ├── questions/           # Q&A forum — votes, bookmarks, replies
│       │       ├── peer/                # Peer offers, requests, session management
│       │       ├── notifications/       # Notification feed with type icons
│       │       └── profile/             # Profile and password management
│       ├── components/
│       │   ├── NavBar.tsx               # Notification badge, admin link
│       │   └── chat/GroupChat.tsx       # STOMP WebSocket chat component
│       └── lib/
│           ├── api.ts                   # Typed API client for all services
│           └── auth.tsx                 # Auth context, JWT storage, logout
│
└── services/                            # Maven multi-module project
    ├── pom.xml                          # Parent POM — shared deps (Micrometer, Zipkin, Logstash)
    ├── discovery-server/
    ├── api-gateway/                     # JwtAuthFilter, RateLimitFilter, LoggingFilter, FallbackController
    ├── user-service/
    ├── course-service/
    ├── group-service/
    ├── qa-service/
    ├── peer-teaching-service/           # PeerRequest, TutoringSession, TutorRating, TutorStats
    ├── notification-service/
    ├── chat-service/
    └── file-service/
```

---

## How Authentication Works

1. User logs in at `POST /api/auth/login` — **User Service** validates credentials and issues a signed JWT containing `userId`, `email`, `role`, `department`, `batch`, and a unique `jti`
2. Frontend stores the JWT in `localStorage` as `tl_token`
3. Every API request includes `Authorization: Bearer <token>`
4. **API Gateway** validates the token signature and checks `jwt:blacklist:<jti>` in Redis — if the token was logged out, the request is rejected with `401`
5. On success, the gateway strips the `Authorization` header and forwards `X-User-Id`, `X-User-Email`, `X-User-Department`, `X-User-Batch`, and `X-User-Role` to downstream services
6. Downstream services read these headers directly — no JWT re-validation
7. On logout (`POST /api/auth/logout`), the `jti` is written to Redis with the token's remaining TTL, permanently blacklisting the token

### WebSocket Authentication

SockJS cannot send custom HTTP headers on the browser upgrade request. The JWT is passed as `?token=<jwt>` on `/ws/` paths — the gateway extracts and validates it identically to the `Authorization` header.

# Running TogetherLearn

Everything you need to start, access, and test the platform.

---

## Prerequisites

### Docker (recommended)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 4.x or later
- **At least 8 GB RAM** allocated to Docker — Settings → Resources → Memory
  - The full stack runs 27 containers including Elasticsearch (512 MB heap) and Logstash (256 MB heap)

### Local development (no Docker)
- Java 17 JDK
- Maven 3.9+
- Node.js 20+
- PostgreSQL 16, Redis, RabbitMQ, and MinIO — must each be installed and running on your machine (skip this if using Docker)

---

## Option 1 — Full Stack with Docker Compose (Recommended)

Starts all 27 containers: 10 microservices, 7 PostgreSQL databases, RabbitMQ, Redis, MinIO, Zipkin, Prometheus, Grafana, Elasticsearch, Logstash, Kibana, and the Next.js frontend.

```bash
git clone <repo-url>
cd TogetherLearn_DisSysArch
docker compose up --build
```

> **First build: 8–15 minutes** — Maven downloads all dependencies and compiles all services inside Docker. Subsequent starts (no code changes) take ~2 minutes.

Wait until all services appear as **UP** in the Eureka dashboard at `http://localhost:8761`, then open the app at `http://localhost:3000`.

---

## Option 2 — Frontend Dev Mode + Backend in Docker

Use this when actively developing the frontend — you get Next.js hot reload while the backend runs in Docker.

### Step 1 — Start all backend containers

```bash
docker compose up --build \
  discovery-server api-gateway \
  redis rabbitmq minio zipkin \
  postgres-user postgres-course postgres-group postgres-qa \
  postgres-peer postgres-notification postgres-chat \
  user-service course-service group-service qa-service \
  peer-teaching-service notification-service chat-service file-service
```

### Step 2 — Start the frontend in dev mode

```bash
cd frontend
# Create .env.local if it doesn't exist
echo "NEXT_PUBLIC_API_URL=http://localhost:8080/api" > .env.local
npm install
npm run dev
```

Frontend runs at `http://localhost:3000` with hot reload.

---

## Option 3 — Everything Locally (No Docker)

### Step 1 — Start infrastructure

Start PostgreSQL 16, Redis, RabbitMQ, and MinIO locally (or via separate Docker containers).

Create the seven databases:

```sql
CREATE DATABASE user_db;
CREATE DATABASE course_db;
CREATE DATABASE group_db;
CREATE DATABASE qa_db;
CREATE DATABASE peer_db;
CREATE DATABASE notification_db;
CREATE DATABASE chat_db;
```

### Step 2 — Start Discovery Server

```bash
cd services
mvn -pl discovery-server spring-boot:run
```

Wait for `Started EurekaServerApplication` in the logs. Verify at `http://localhost:8761`.

### Step 3 — Start API Gateway

```bash
cd services
mvn -pl api-gateway spring-boot:run \
  -Dspring-boot.run.jvmArguments="\
    -DEUREKA_URI=http://localhost:8761/eureka \
    -DJWT_SECRET=tl-jwt-secret-change-in-production-min-32-chars \
    -DREDIS_URL=redis://:redis_pass@localhost:6379"
```

### Step 4 — Start services (one terminal each)

Start **Notification Service first** — Group, Q&A, and Peer Teaching publish events it consumes.

```bash
# Pattern for all services:
cd services
DB_URL=jdbc:postgresql://localhost:5432/<db_name> \
DB_USER=postgres \
DB_PASSWORD=postgres \
EUREKA_URI=http://localhost:8761/eureka \
RABBITMQ_URI=amqp://tl:tl_password@localhost:5672 \
REDIS_URL=redis://:redis_pass@localhost:6379 \
mvn -pl <module-name> spring-boot:run
```

| Service | Module | Database |
|---|---|---|
| Notification Service | `notification-service` | `notification_db` |
| User Service | `user-service` | `user_db` |
| Course Service | `course-service` | `course_db` |
| Group Study Service | `group-service` | `group_db` |
| Q&A Service | `qa-service` | `qa_db` |
| Peer Teaching Service | `peer-teaching-service` | `peer_db` |
| Chat Service | `chat-service` | `chat_db` |
| File Service | `file-service` | *(no DB — set `AWS_S3_ENDPOINT=http://localhost:9000`)* |

### Step 5 — Start the Frontend

```bash
cd frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:8080/api" > .env.local
npm install
npm run dev
```

---

## Application URLs

| Tool / Service | URL | Notes |
|---|---|---|
| **Frontend** | http://localhost:3000 | Main web application |
| **Eureka Dashboard** | http://localhost:8761 | Shows all registered services and their health |
| **API Gateway** | http://localhost:8080 | All API calls go through here |
| **RabbitMQ Management** | http://localhost:15672 | Queue depths, bindings, message rates |
| **MinIO Console** | http://localhost:9001 | Browse uploaded files and buckets |
| **Zipkin** | http://localhost:9411 | Distributed traces across services |
| **Prometheus** | http://localhost:9090 | Raw metrics and query explorer |
| **Grafana** | http://localhost:3001 | Dashboards — Prometheus auto-provisioned |
| **Kibana** | http://localhost:5601 | Log search — create index pattern `togetherlearn-*` |
| **Elasticsearch** | http://localhost:9200 | Raw index access |

---

## Credentials

### Application

| Account | Username | Password | Role |
|---|---|---|---|
| Default admin | `tl` | `mytl@M3` | ADMIN |
| New registrations | *(your email)* | *(your choice)* | STUDENT |

The admin account is created automatically on first startup. Log in with it to access the **Admin Panel** (visible in the navbar for admin accounts only). From there you can:
- View, search, and paginate all users
- Promote/demote users between STUDENT and ADMIN roles
- Create and delete courses

### Infrastructure

| Service | Username | Password | URL / Port |
|---|---|---|---|
| PostgreSQL | `postgres` | `tl_postgres_pass` | port 5432 (each DB on same port) |
| RabbitMQ | `tl` | `tl_password` | http://localhost:15672 |
| Redis | — | `redis_pass` | port 6379 |
| MinIO | `minio` | `minio_pass` | http://localhost:9001 |
| Grafana | `admin` | `admin` | http://localhost:3001 |
| Elasticsearch | — | — | http://localhost:9200 (security disabled) |

---

## Port Reference

| Container | Host Port | Purpose |
|---|---|---|
| frontend | **3000** | Next.js web app |
| api-gateway | **8080** | Single entry point for all API calls |
| user-service | 8081 | Auth, profiles, RBAC |
| course-service | 8082 | Course catalog |
| group-service | 8083 | Study groups |
| qa-service | 8084 | Q&A forum |
| peer-teaching-service | 8085 | Peer offers, requests, sessions |
| notification-service | 8086 | In-app notifications |
| chat-service | 8087 | WebSocket + REST chat |
| file-service | 8088 | File upload/download |
| discovery-server | 8761 | Eureka dashboard |
| rabbitmq (AMQP) | 5672 | Message broker (app protocol) |
| rabbitmq (UI) | 15672 | RabbitMQ management console |
| redis | 6379 | Cache and rate limit store |
| minio (S3) | 9000 | Object storage API |
| minio (console) | 9001 | MinIO web UI |
| zipkin | 9411 | Distributed trace UI |
| prometheus | 9090 | Metrics scraper and query UI |
| grafana | **3001** | Dashboard UI |
| elasticsearch | 9200 | Log store REST API |
| logstash (TCP) | 5044 | Receives structured logs from services |
| kibana | **5601** | Log search and visualisation UI |

---

## API Testing with Postman

A ready-made collection is included at the repo root:

```
TogetherLearn.postman_collection.json
```

**Import:** Postman → Import → select the file.

The collection has 8 folders: Auth, Meta & Courses, Groups, Q&A, Peer Teaching, Notifications, Sessions, Users.

**Usage:**
1. Run **Auth → Register** first — the test script automatically saves `token` and `userId` as collection variables
2. All subsequent requests read `token` automatically — no manual copy-paste needed
3. Run requests within each folder in order — IDs (`groupId`, `questionId`, `sessionId`, etc.) are saved by earlier requests and reused

---

## Useful Docker Commands

```bash
# Start without rebuilding (faster — use after first build when code hasn't changed)
docker compose up

# Run in background
docker compose up -d

# Live logs for all services
docker compose logs -f

# Live logs for a specific service
docker compose logs -f user-service
docker compose logs -f api-gateway

# Check container status and health
docker compose ps

# Stop all containers (volumes and data preserved)
docker compose stop

# Remove containers (volumes kept)
docker compose down

# Remove containers AND all data (fresh start — wipes all databases, logs, metrics)
docker compose down -v

# Rebuild and restart a single service after a code change
docker compose up --build user-service

# Start only the monitoring stack
docker compose up zipkin prometheus grafana elasticsearch logstash kibana
```

---

## Setting Up Grafana Dashboards

Prometheus is auto-provisioned as the default datasource — no manual setup needed.

To import a pre-built Spring Boot dashboard:

1. Open Grafana at http://localhost:3001 (admin / admin)
2. Dashboards → Import
3. Enter dashboard ID **4701** (JVM Micrometer) and click Load
4. Select **Prometheus** as the data source → Import

Recommended dashboard IDs:
| Dashboard | ID |
|---|---|
| JVM (Micrometer) | 4701 |
| Spring Boot Statistics | 6756 |
| Spring Cloud Gateway | 11506 |

---

## Setting Up Kibana

On first use, create the index pattern to see logs:

1. Open Kibana at http://localhost:5601
2. Hamburger menu → **Management → Stack Management → Index Patterns**
3. Create index pattern: `togetherlearn-*`
4. Time field: `@timestamp`
5. Go to **Discover** — filter by `app` field to isolate a specific service

Logs are indexed per service per day: `togetherlearn-user-service-2026.05.18`, etc.

---

## Troubleshooting

**Services fail to register with Eureka on startup**

Eureka takes ~30–45 seconds to become ready. Services retry automatically. If a service keeps exiting:
```bash
docker compose logs -f user-service
```

**`SchemaValidationException` on startup**

Flyway migrations haven't run yet, or the PostgreSQL container wasn't healthy when the service started. Docker's `service_healthy` dependencies handle this, but if it occurs:
```bash
docker compose restart user-service
```

**Course catalog is empty after startup**

Check whether the seed ran:
```bash
docker compose logs course-service | grep -i seed
```
If it says `already seeded`, the data is in the database — try refreshing. If no seed line appears, the service may have failed before seeding.

**Elasticsearch won't start / Kibana shows "Kibana server is not ready yet"**

Elasticsearch needs ~60 seconds to become ready. Kibana waits for the `service_healthy` condition. Check:
```bash
docker compose logs -f elasticsearch
```
If you see a memory error, increase Docker's RAM allocation to at least 8 GB.

**No logs appearing in Kibana**

Services only ship logs to Logstash when running with `SPRING_PROFILES_ACTIVE=docker` (set automatically in docker-compose.yml). If Logstash started after the services, wait 30 seconds — `LogstashTcpSocketAppender` reconnects automatically.

**Frontend shows network errors**

Ensure `NEXT_PUBLIC_API_URL=http://localhost:8080/api` is set in `.env.local` (dev mode). In Docker mode, check that the API Gateway is healthy:
```
http://localhost:8080/actuator/health
```

**Port conflict**

Stop any locally running services using conflicting ports before starting Docker Compose. On Windows:
```powershell
netstat -ano | findstr :8080
```
Kill the process using that port or change the host port mapping in `docker-compose.yml`.

---

## CI/CD Pipeline

Two GitHub Actions workflows are in [.github/workflows/](.github/workflows/).

### How it works

| Event | Workflow | What happens |
|---|---|---|
| Pull request to `main` | `ci.yml` | Builds all 10 services in parallel + type-checks frontend |
| Push / merge to `main` | `deploy.yml` | Builds JARs → pushes Docker images to Docker Hub → rolling deploy to K8s |

### Required GitHub Secrets

Set these in your repository: **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Value |
|---|---|
| `DOCKERHUB_USERNAME` | Your Docker Hub username or org name |
| `DOCKERHUB_TOKEN` | Docker Hub access token (not your password) — create at hub.docker.com → Account Settings → Security |
| `KUBE_CONFIG` | Base64-encoded kubeconfig for your cluster: `cat ~/.kube/config \| base64 -w0` |
| `NEXT_PUBLIC_API_URL` | Public API URL baked into the frontend image, e.g. `https://api.togetherlearn.app/api` |

### First-time Kubernetes deploy

Before the pipeline can do rolling updates, the namespace and infrastructure must exist. Either:
1. Let the pipeline do a full `kubectl apply -f k8s/` on the first push to main (it handles both create and update), OR
2. Apply manually once: `kubectl apply -f k8s/`

### Docker image naming

Images are pushed as:
```
<DOCKERHUB_USERNAME>/togetherlearn-<service>:<git-sha>   ← pinned, for rollback
<DOCKERHUB_USERNAME>/togetherlearn-<service>:latest      ← updated on every deploy
```

The K8s rolling update uses the SHA tag for traceability. To roll back to a previous deploy:
```bash
kubectl set image deployment/user-service \
  user-service=<DOCKERHUB_USERNAME>/togetherlearn-user-service:<previous-sha> \
  -n togetherlearn
```

### Deploying to Kubernetes (manual)

```bash
# Apply all manifests (idempotent — safe to run multiple times)
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets/
kubectl apply -f k8s/configmaps/
kubectl apply -f k8s/stateful/
kubectl apply -f k8s/monitoring/
kubectl apply -f k8s/deployments/
kubectl apply -f k8s/hpa/
kubectl apply -f k8s/ingress/

# Watch pods come up
kubectl get pods -n togetherlearn -w

# Check service status
kubectl get deployments -n togetherlearn
```

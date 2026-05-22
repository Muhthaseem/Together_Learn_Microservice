# TogetherLearn — Product Implementation Roadmap

> **Goal:** Evolve from an academic microservices demo into a production-grade collaborative learning platform.  
> **Current state (as of Phase 8):** 10 Spring Boot services (+ file-service), PostgreSQL per service, Flyway migrations, RabbitMQ async notifications, STOMP/SockJS WebSocket chat, Redis caching + JWT blacklist, MinIO file storage, RBAC (STUDENT/ADMIN), Q&A with upvotes/bookmarks/replies, Docker Compose.  
> **Target state:** Full production stack — Kubernetes, Prometheus + Grafana, ELK logging, Zipkin tracing, Peer Teaching with sessions and ratings, in-app notifications only (no email/push), CI/CD pipeline. **Web app only — no mobile app.**

---

## Gap Analysis — Current vs Target

| Concern | Status | Notes |
|---|---|---|
| Databases | ✅ Done | PostgreSQL 16 — one schema per service, Flyway migrations |
| DB migrations | ✅ Done | Flyway versioned migrations (V1–V4 per service) |
| Notification delivery | ✅ Done | RabbitMQ async events → in-app notifications (notification-service) |
| Chat protocol | ✅ Done | WebSocket — STOMP over SockJS, JWT via `?token=` query param |
| Caching | ✅ Done | Redis — user profiles, course catalog, JWT blacklist on logout |
| File storage | ✅ Done | MinIO (S3-compatible local) via file-service — avatars, attachments, chat files |
| Access control | ✅ Done | RBAC — STUDENT (default) / ADMIN; JWT carries `role` claim; gateway forwards `X-User-Role` |
| Q&A features | ✅ Done | Upvotes, bookmarks, answer replies (threading) — all implemented |
| User service | ✅ Done | Change-password; email verification is out of scope (web-only, no email service) |
| Peer Teaching | Planned | Offers + requests done; session scheduling + tutor ratings — Phase 9 |
| In-app notifications | Partial | Basic in-app done; better event handling + unread counts — Phase 10 |
| Rate limiting | Planned | Bucket4j in API Gateway — Phase 11 |
| Circuit breaker | Planned | Resilience4j on gateway routes — Phase 11 |
| Monitoring | Planned | Prometheus metrics + Grafana dashboards — Phase 12 |
| Distributed tracing | Planned | Zipkin (trace every request across services) — Phase 12 |
| Centralized logging | Planned | ELK Stack (Elasticsearch + Logstash + Kibana) — Phase 13 |
| Orchestration | Planned | Kubernetes (Helm charts) — Phase 14 |
| CI/CD | Planned | GitHub Actions → Docker Hub → K8s — Phase 15 |
| Email notifications | Not in scope | Web app only; no external email service planned |
| Push notifications | Not in scope | Web app only; no FCM/APNs planned |
| Mobile app | Not in scope | Web app only; React Native not planned |

---

## Implementation Phases

---

### Phase 1 — PostgreSQL (All Services) ✅ COMPLETE

**Why first:** Every subsequent feature (Flyway migrations, persistent data, proper relations) requires a real database.

#### 1.1 — Add dependencies to each service `pom.xml`

```xml
<!-- Replace h2 with: -->
<dependency>
  <groupId>org.postgresql</groupId>
  <artifactId>postgresql</artifactId>
  <scope>runtime</scope>
</dependency>

<!-- Add Flyway for versioned migrations: -->
<dependency>
  <groupId>org.flywaydb</groupId>
  <artifactId>flyway-database-postgresql</artifactId>
</dependency>
```

#### 1.2 — Update each service `application.yml`

```yaml
spring:
  datasource:
    url: ${DB_URL:jdbc:postgresql://localhost:5432/user_db}
    username: ${DB_USER:postgres}
    password: ${DB_PASSWORD:postgres}
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: validate          # Flyway owns DDL, JPA only validates
    database-platform: org.hibernate.dialect.PostgreSQLDialect
    show-sql: false
  flyway:
    enabled: true
    locations: classpath:db/migration
```

#### 1.3 — Flyway migration files (per service)

Create `src/main/resources/db/migration/V1__init.sql` in each service with the CREATE TABLE statements matching the current entity definitions.

Example for `user-service`:
```sql
-- V1__init.sql
CREATE TABLE users (
    id          BIGSERIAL PRIMARY KEY,
    user_id     VARCHAR(36)  NOT NULL UNIQUE,
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    department  VARCHAR(100),
    batch       VARCHAR(50),
    role        VARCHAR(20)  NOT NULL DEFAULT 'STUDENT',
    avatar_url  VARCHAR(500),
    registration_number VARCHAR(50) UNIQUE,
    index_number        VARCHAR(50) UNIQUE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE user_courses (
    user_id     VARCHAR(36) NOT NULL REFERENCES users(user_id),
    course_code VARCHAR(20) NOT NULL,
    PRIMARY KEY (user_id, course_code)
);
```

#### 1.4 — docker-compose.yml — add PostgreSQL containers

Add one PostgreSQL container per service (isolated databases):

```yaml
postgres-user:
  image: postgres:16-alpine
  environment:
    POSTGRES_DB: user_db
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
  volumes:
    - pg-user-data:/var/lib/postgresql/data
  networks: [tl-net]
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U postgres"]
    interval: 10s
    retries: 5

# Repeat for: postgres-course, postgres-group, postgres-qa,
#             postgres-peer, postgres-notification, postgres-chat

volumes:
  pg-user-data:
  pg-course-data:
  pg-group-data:
  pg-qa-data:
  pg-peer-data:
  pg-notification-data:
  pg-chat-data:
```

Update each service's environment:
```yaml
user-service:
  environment:
    DB_URL: jdbc:postgresql://postgres-user:5432/user_db
    DB_USER: postgres
    DB_PASSWORD: ${DB_PASSWORD:-postgres}
```

---

### Phase 2 — RabbitMQ Async Messaging (Replace Feign Notifications) ✅ COMPLETE

**Why:** Synchronous notification calls couple services tightly. If Notification Service is down, Group joins fail. RabbitMQ decouples them.

#### 2.1 — Add RabbitMQ to docker-compose.yml

```yaml
rabbitmq:
  image: rabbitmq:3.13-management-alpine
  ports:
    - "5672:5672"    # AMQP
    - "15672:15672"  # Management UI
  environment:
    RABBITMQ_DEFAULT_USER: ${RABBIT_USER:-tl}
    RABBITMQ_DEFAULT_PASS: ${RABBIT_PASS:-tl_password}
  volumes:
    - rabbitmq-data:/var/lib/rabbitmq
  networks: [tl-net]
  healthcheck:
    test: ["CMD", "rabbitmq-diagnostics", "ping"]
    interval: 15s
    retries: 5
```

#### 2.2 — Add dependency to Group, Q&A, Peer Teaching, Notification services

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-amqp</artifactId>
</dependency>
```

#### 2.3 — Define exchanges, queues, routing keys

```java
// In group-service, qa-service, peer-teaching-service:
public final class TLExchange {
    public static final String EVENTS = "tl.events";          // topic exchange
}

public final class TLRoutingKey {
    public static final String GROUP_JOIN       = "group.join";
    public static final String QUESTION_ANSWERED = "question.answered";
    public static final String PEER_APPLICATION  = "peer.application";
    public static final String PEER_ACCEPTED     = "peer.accepted";
}
```

#### 2.4 — RabbitMQ config in notification-service

```java
@Configuration
public class RabbitConfig {

    @Bean
    TopicExchange eventsExchange() {
        return new TopicExchange("tl.events", true, false);
    }

    @Bean
    Queue notificationQueue() {
        return QueueBuilder.durable("tl.notifications")
            .withArgument("x-dead-letter-exchange", "tl.events.dlx")
            .build();
    }

    @Bean
    Binding binding(Queue notificationQueue, TopicExchange eventsExchange) {
        return BindingBuilder.bind(notificationQueue)
            .to(eventsExchange).with("*.#");   // subscribe to all events
    }
}
```

#### 2.5 — Publisher in Group Service (replace Feign calls)

```java
@Service
@RequiredArgsConstructor
public class EventPublisher {
    private final RabbitTemplate rabbit;

    public void publishGroupJoin(String groupId, String groupTitle,
                                  String userId, String creatorId) {
        var event = Map.of(
            "type",       "GROUP_JOIN",
            "groupId",    groupId,
            "groupTitle", groupTitle,
            "targetUserId", creatorId,
            "actorUserId",  userId
        );
        rabbit.convertAndSend("tl.events", "group.join", event);
    }
}
```

#### 2.6 — Consumer in Notification Service

```java
@Component
@RequiredArgsConstructor
public class EventConsumer {
    private final NotificationService notificationService;

    @RabbitListener(queues = "tl.notifications")
    public void handle(Map<String, Object> event) {
        String type = (String) event.get("type");
        switch (type) {
            case "GROUP_JOIN"        -> notificationService.createFromEvent(event);
            case "QUESTION_ANSWERED" -> notificationService.createFromEvent(event);
            case "PEER_APPLICATION"  -> notificationService.createFromEvent(event);
            case "PEER_ACCEPTED"     -> notificationService.createFromEvent(event);
        }
    }
}
```

---

### Phase 3 — WebSocket Real-time Chat ✅ COMPLETE

**Why:** REST polling for chat is unusable in production. WebSocket keeps a persistent connection; messages arrive instantly.

#### 3.1 — Add dependency to chat-service

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>
```

#### 3.2 — WebSocket config

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws/chat")
            .setAllowedOriginPatterns("*")
            .withSockJS();
    }
}
```

#### 3.3 — JWT handshake interceptor

Authenticate WebSocket connections by extracting Bearer token from the `?token=` query param, validating the JWT, and setting `userId` as the STOMP principal.

#### 3.4 — API Gateway WebSocket proxy

```yaml
- id: chat-ws
  uri: lb:ws://CHAT-SERVICE
  predicates:
    - Path=/ws/chat/**
```

---

### Phase 4 — Redis (Cache + Session) ✅ COMPLETE

**Why:** Reduces DB load for frequently read data (user profiles, course catalog, JWT blacklisting).

| Service | What to Cache | TTL |
|---|---|---|
| `user-service` | User profile by userId | 10 min |
| `course-service` | Full course catalog | 24 hrs |
| `api-gateway` | JWT blacklist (logout) | Token TTL |

JWT logout blacklist: `jti` stored in Redis with remaining TTL. Gateway checks on every request using `ReactiveStringRedisTemplate`.

---

### Phase 5 — File Storage (MinIO) ✅ COMPLETE

**Why:** Profile avatars, Q&A attachments, and chat file sharing need durable, scalable object storage.

Standalone `file-service` (port 8088) using AWS SDK v2 with `endpointOverride` pointing to MinIO container and `forcePathStyle = true`.

```
POST /api/files/upload          → returns { url, key, contentType, size }
DELETE /api/files/{key}         → deletes object (admin or owner only)
GET  /api/files/{key}/presigned → generates time-limited download URL
```

---

### Phase 6 — RBAC (Role-Based Access Control) ✅ COMPLETE

**Scope:** Two roles — `STUDENT` (default) and `ADMIN`. Admin-exclusive: create/delete courses, change user roles, view all users.

#### Key implementation details

- `role` claim included in JWT; API Gateway forwards `X-User-Role` header to all downstream services
- JWT `jti` blacklist in Redis on logout (`POST /api/auth/logout`)
- Default admin account: **username** `tl` / **password** `mytl@M3`
- `LoginRequest` uses `@NotBlank` (not `@Email`) so the admin username is accepted
- `POST /api/courses` and `DELETE /api/courses/{code}` — admin only (check `X-User-Role`)
- `GET /api/users` (paginated), `PUT /api/users/{id}/role` — admin only

#### Frontend

| File | Change |
|---|---|
| `lib/auth.tsx` | `role?: string` in `UserProfile`; `logout()` calls `POST /api/auth/logout` |
| `lib/api.ts` | `adminApi.listUsers()`, `adminApi.updateUserRole()`, `coursesApi.create()`, `coursesApi.remove()` |
| `app/auth/login/page.tsx` | Label "Username / Email"; Zod: `z.string().min(1)` |
| `components/NavBar.tsx` | Admin link shown only when `user.role === "ADMIN"` |
| `app/dashboard/admin/page.tsx` | Tabbed admin panel — Users tab (search, paginate, promote/demote) + Courses tab (create + delete) |

---

### Phase 7 — User Service Completion ✅ COMPLETE

#### 7.1 — Change password ✅

```
POST /api/auth/change-password
Headers: X-User-Id
Body: { "oldPassword": "...", "newPassword": "..." }
```

`UserService.changePassword`: BCrypt verify old password, encode and save new password, evict user cache.

#### 7.2 — User search ✅

```
GET /api/users?q=name_or_email&page=0&size=20
```

Repository uses `LIKE LOWER(CONCAT('%',:q,'%'))` on name and email.

> **Note:** Email verification and password reset are **out of scope** — this is a web-only academic project with no external email service.

---

### Phase 8 — Q&A Forum Completion ✅ COMPLETE

All features implemented using Flyway migrations V3 (votes + bookmarks) and V4 (replies).

#### 8.1 — Upvotes ✅

`QuestionVote(questionId, userId, voteType)` and `AnswerVote(answerId, userId, voteType)`.

Toggle semantics: same vote type = remove, different type = switch direction, no prior vote = add. `upvoteCount` is denormalized on Question/Answer and updated via `@Modifying @Query adjustUpvoteCount(id, delta)`.

```
POST /api/questions/{id}/vote              { "type": "UP"|"DOWN" }
POST /api/questions/{id}/answers/{id}/vote { "type": "UP"|"DOWN" }
```

#### 8.2 — Bookmarks ✅

`Bookmark(userId, questionId)` with composite unique constraint.

```
POST   /api/questions/{id}/bookmark
DELETE /api/questions/{id}/bookmark
GET    /api/questions/bookmarked        → user's bookmarked questions
```

`GET /api/questions/bookmarked` is declared **before** `GET /api/questions/{questionId}` in the controller to prevent Spring path ambiguity.

#### 8.3 — Answer replies (threading) ✅

`AnswerReply(replyId, answerId, authorId, content)` — nested under answers.

```
POST   /api/questions/{qId}/answers/{aId}/replies
PUT    /api/questions/{qId}/answers/{aId}/replies/{rId}
DELETE /api/questions/{qId}/answers/{aId}/replies/{rId}
```

`listQuestions` and `getQuestion` accept an optional `X-User-Id` header; per-user data (`userVote`, `bookmarked`) is only populated on authenticated requests.

---

### Phase 9 — Peer Teaching Completion

The current Peer Teaching Service has basic offers and requests. A production tutoring platform needs session lifecycle management and a rating system.

#### 9.1 — Enhanced PeerRequest entity

Add fields to the existing `PeerRequest`:

```java
// Flyway V2__enhance_peer_request.sql
ALTER TABLE peer_requests ADD COLUMN title VARCHAR(255);
ALTER TABLE peer_requests ADD COLUMN preferred_mode VARCHAR(10) DEFAULT 'BOTH'; -- ONLINE/OFFLINE/BOTH
ALTER TABLE peer_requests ADD COLUMN location VARCHAR(255);
ALTER TABLE peer_requests ADD COLUMN from_date DATE;
ALTER TABLE peer_requests ADD COLUMN to_date DATE;
ALTER TABLE peer_requests ADD COLUMN department VARCHAR(100);
```

Updated `CreatePeerRequestRequest` DTO includes `title`, `preferredMode`, `location`, `fromDate`, `toDate`, `department`.

#### 9.2 — TutoringSession entity

Created when a tutor's application is accepted:

```java
// Flyway V3__add_tutoring_sessions.sql
CREATE TABLE tutoring_sessions (
    id                  BIGSERIAL PRIMARY KEY,
    session_id          VARCHAR(36) NOT NULL UNIQUE,
    request_id          VARCHAR(36) NOT NULL,
    tutor_id            VARCHAR(36) NOT NULL,
    student_id          VARCHAR(36) NOT NULL,
    session_date        DATE NOT NULL,
    session_time        TIME NOT NULL,
    duration_minutes    INT NOT NULL DEFAULT 60,
    mode                VARCHAR(10) NOT NULL,       -- ONLINE / OFFLINE
    meeting_link        VARCHAR(500),
    location            VARCHAR(255),
    status              VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',  -- SCHEDULED/COMPLETED/CANCELLED/NO_SHOW
    cancellation_reason VARCHAR(500),
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### 9.3 — TutorRating entity

```java
// Flyway V4__add_tutor_ratings.sql
CREATE TABLE tutor_ratings (
    id          BIGSERIAL PRIMARY KEY,
    rating_id   VARCHAR(36) NOT NULL UNIQUE,
    session_id  VARCHAR(36) NOT NULL REFERENCES tutoring_sessions(session_id) ON DELETE CASCADE,
    tutor_id    VARCHAR(36) NOT NULL,
    student_id  VARCHAR(36) NOT NULL,
    rating      INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (session_id)   -- one rating per session
);
```

Average rating stored denormalized on a `tutor_stats` table (or computed view):
```sql
CREATE TABLE tutor_stats (
    tutor_id        VARCHAR(36) PRIMARY KEY,
    average_rating  DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    rating_count    INT NOT NULL DEFAULT 0
);
```

#### 9.4 — Session and rating endpoints

```
# Accept application and schedule session (question author only)
POST /api/peer-requests/{reqId}/applications/{appId}/accept
     Body: { sessionDate, sessionTime, durationMinutes, mode, meetingLink, location }
     → Creates TutoringSession, marks application ACCEPTED, publishes PEER_ACCEPTED event

# Session management
GET  /api/sessions/my                     → caller's sessions (as tutor or student)
GET  /api/sessions/{id}                   → session detail
PUT  /api/sessions/{id}/complete          → tutor or student marks completed
PUT  /api/sessions/{id}/cancel            → cancel with reason body
POST /api/sessions/{id}/rate              → student rates { rating: 1–5, comment }

# Tutor stats
GET  /api/peer/tutors/{tutorId}/stats     → { averageRating, ratingCount }
```

#### 9.5 — RabbitMQ event for session scheduled

```java
eventPublisher.publishPeerAccepted(studentId, tutorId, requestTitle, sessionDate);
// → notification-service stores in-app notification for both parties
```

---

### Phase 10 — In-App Notification Enhancements

> **Decision:** No email service. No push notification service. Web app only. The existing in-app notification service is sufficient for the MVP; this phase hardens it.

The `notification-service` already consumes RabbitMQ events and stores in-app notifications in PostgreSQL. Enhancements:

#### 10.1 — Unread count endpoint

```
GET /api/notifications/unread-count    → { "count": 5 }
```

Store `read BOOLEAN DEFAULT FALSE` on the notification entity (already exists). Efficient count query with index on `(target_user_id, read)`.

#### 10.2 — Mark all as read

```
PUT /api/notifications/read-all        → marks all caller's notifications as read
```

Complements the existing `PUT /api/notifications/{id}/read`.

#### 10.3 — Notification type + metadata

Add `type VARCHAR(40)` and `metadata JSONB` columns (Flyway migration):
```sql
ALTER TABLE notifications ADD COLUMN type VARCHAR(40);
ALTER TABLE notifications ADD COLUMN metadata JSONB;
```

Event types: `GROUP_JOIN`, `QUESTION_ANSWERED`, `PEER_APPLICATION`, `PEER_ACCEPTED`, `SESSION_SCHEDULED`, `SESSION_CANCELLED`.

Frontend can use `type` to render an appropriate icon and route the user on click.

#### 10.4 — Pagination

```
GET /api/notifications?page=0&size=20    → paginated notifications (newest first)
```

Replace the current `findAll()` list return with `Page<Notification>`.

#### 10.5 — Frontend notification bell

- Poll `GET /api/notifications/unread-count` every 30 seconds (or on focus)
- NavBar badge shows unread count
- Dropdown lists recent notifications with type icon and timestamp
- Click marks as read and navigates to relevant entity

---

### Phase 11 — API Gateway Enhancements

#### 11.1 — Rate limiting (Bucket4j + Redis)

```xml
<dependency>
  <groupId>com.github.vladimir-bukhtoyarov</groupId>
  <artifactId>bucket4j-redis</artifactId>
  <version>8.10.1</version>
</dependency>
```

Strategy:
- Anonymous requests: 30 req/min per IP
- Authenticated requests: 300 req/min per `userId`
- Auth endpoints (`/api/auth/login`, `/api/auth/register`): 10 req/min per IP (brute-force protection)

```java
@Component
public class RateLimitFilter implements GlobalFilter, Ordered {
    // Check Bucket in Redis keyed by userId or IP
    // Return 429 Too Many Requests if bucket exhausted
}
```

#### 11.2 — Circuit breaker on gateway routes (Resilience4j)

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: user-service
          uri: lb://USER-SERVICE
          filters:
            - name: CircuitBreaker
              args:
                name: userServiceCB
                fallbackUri: forward:/fallback/user-service
```

```java
@RestController
public class FallbackController {
    @GetMapping("/fallback/{service}")
    public ResponseEntity<Map<String,String>> fallback(@PathVariable String service) {
        return ResponseEntity.status(503)
            .body(Map.of("error", service + " is temporarily unavailable. Please try again."));
    }
}
```

#### 11.3 — Request/response logging filter

Log `method + path + userId + duration + status` for every request, structured as JSON for ELK ingestion (Phase 13).

---

### Phase 12 — Monitoring (Prometheus + Grafana + Zipkin)

#### 12.1 — Add Micrometer to all services

```xml
<dependency>
  <groupId>io.micrometer</groupId>
  <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health, info, prometheus, metrics
  metrics:
    export:
      prometheus:
        enabled: true
```

#### 12.2 — Prometheus scrape config

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'api-gateway'
    static_configs:
      - targets: ['api-gateway:8080']
    metrics_path: /actuator/prometheus
  # Repeat for all services
```

#### 12.3 — Grafana dashboards

| Dashboard | Key Metrics |
|---|---|
| Service Overview | Request rate, error rate, latency (P50/P95/P99) per service |
| JVM Health | Heap memory, GC pauses, thread pool |
| Business Metrics | Active users, messages/min, questions/day |
| RabbitMQ | Queue depth, publish/consumer rate, dead-letter count |

#### 12.4 — Distributed Tracing (Zipkin)

```xml
<dependency>
  <groupId>io.micrometer</groupId>
  <artifactId>micrometer-tracing-bridge-brave</artifactId>
</dependency>
<dependency>
  <groupId>io.zipkin.reporter2</groupId>
  <artifactId>zipkin-reporter-brave</artifactId>
</dependency>
```

```yaml
management:
  tracing:
    sampling:
      probability: 1.0   # 100% in dev; reduce to 0.1 in production
  zipkin:
    tracing:
      endpoint: http://zipkin:9411/api/v2/spans
```

#### 12.5 — docker-compose additions

```yaml
prometheus:
  image: prom/prometheus:v2.51.0
  ports: ["9090:9090"]
  volumes:
    - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
  networks: [tl-net]

grafana:
  image: grafana/grafana:10.4.0
  ports: ["3001:3000"]
  environment:
    GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD:-admin}
  volumes:
    - grafana-data:/var/lib/grafana
  networks: [tl-net]

zipkin:
  image: openzipkin/zipkin:3
  ports: ["9411:9411"]
  networks: [tl-net]
```

---

### Phase 13 — Centralized Logging (ELK Stack)

Replace console logs with structured JSON logs shipped to Elasticsearch.

#### 13.1 — Add Logstash Logback encoder to all services

```xml
<dependency>
  <groupId>net.logstash.logback</groupId>
  <artifactId>logstash-logback-encoder</artifactId>
  <version>7.4</version>
</dependency>
```

`logback-spring.xml`:
```xml
<appender name="LOGSTASH" class="net.logstash.logback.appender.LogstashTcpSocketAppender">
  <destination>logstash:5044</destination>
  <encoder class="net.logstash.logback.encoder.LogstashEncoder" />
</appender>
```

#### 13.2 — ELK stack in docker-compose.yml

```yaml
elasticsearch:
  image: elasticsearch:8.13.0
  environment:
    - discovery.type=single-node
    - xpack.security.enabled=false
  volumes:
    - es-data:/usr/share/elasticsearch/data
  networks: [tl-net]

logstash:
  image: logstash:8.13.0
  volumes:
    - ./monitoring/logstash.conf:/usr/share/logstash/pipeline/logstash.conf
  networks: [tl-net]
  depends_on: [elasticsearch]

kibana:
  image: kibana:8.13.0
  ports: ["5601:5601"]
  environment:
    ELASTICSEARCH_HOSTS: http://elasticsearch:9200
  networks: [tl-net]
```

---

### Phase 14 — Kubernetes (Production Orchestration)

Replace Docker Compose with Kubernetes for auto-scaling, self-healing, and zero-downtime deployments.

#### 14.1 — File structure

```
k8s/
  namespace.yaml
  secrets/
    jwt-secret.yaml
    db-credentials.yaml
    rabbitmq-credentials.yaml
  configmaps/
    common-config.yaml
  deployments/
    discovery-server.yaml
    api-gateway.yaml
    user-service.yaml
    course-service.yaml
    group-service.yaml
    qa-service.yaml
    peer-teaching-service.yaml
    notification-service.yaml
    chat-service.yaml
    file-service.yaml
  services/
  hpa/
  ingress/
    ingress.yaml
  stateful/
    postgres.yaml
    rabbitmq.yaml
    redis.yaml
```

#### 14.2 — Example service deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
  namespace: togetherlearn
spec:
  replicas: 2
  selector:
    matchLabels:
      app: user-service
  template:
    spec:
      containers:
        - name: user-service
          image: togetherlearn/user-service:latest
          ports:
            - containerPort: 8081
          env:
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: tl-secrets
                  key: jwt-secret
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8081
            initialDelaySeconds: 30
          livenessProbe:
            httpGet:
              path: /actuator/health/liveness
              port: 8081
            initialDelaySeconds: 60
          resources:
            requests:
              memory: 512Mi
              cpu: 250m
            limits:
              memory: 1Gi
              cpu: 500m
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: user-service-hpa
  namespace: togetherlearn
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: user-service
  minReplicas: 2
  maxReplicas: 6
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

#### 14.3 — Ingress (TLS + routing)

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: tl-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
spec:
  tls:
    - hosts: [api.togetherlearn.app]
      secretName: tl-tls
  rules:
    - host: api.togetherlearn.app
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api-gateway
                port:
                  number: 8080
    - host: app.togetherlearn.app
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 3000
```

---

### Phase 15 — CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Build & Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [user-service, course-service, group-service, qa-service,
                  peer-teaching-service, notification-service, chat-service,
                  file-service, api-gateway, discovery-server]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Build JAR
        run: mvn -B package -DskipTests -pl ${{ matrix.service }}
        working-directory: services

      - name: Build & push Docker image
        uses: docker/build-push-action@v5
        with:
          context: ./services/${{ matrix.service }}
          file: ./services/${{ matrix.service }}/Dockerfile
          push: true
          tags: |
            togetherlearn/${{ matrix.service }}:${{ github.sha }}
            togetherlearn/${{ matrix.service }}:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Rolling deploy to Kubernetes
        run: |
          kubectl set image deployment/${{ matrix.service }} \
            ${{ matrix.service }}=togetherlearn/${{ matrix.service }}:${{ github.sha }} \
            -n togetherlearn
```

---

## Services

| Service | Port | Status | Purpose |
|---|---|---|---|
| `discovery-server` | 8761 | ✅ Running | Eureka service registry |
| `api-gateway` | 8080 | ✅ Running | JWT auth, routing, rate limiting (Phase 11) |
| `user-service` | 8081 | ✅ Running | Auth, profiles, RBAC |
| `course-service` | 8082 | ✅ Running | Course catalog, admin CRUD |
| `group-service` | 8083 | ✅ Running | Study groups, membership |
| `qa-service` | 8084 | ✅ Running | Q&A, votes, bookmarks, replies |
| `peer-teaching-service` | 8085 | Partial | Peer requests/offers; sessions + ratings in Phase 9 |
| `notification-service` | 8086 | Partial | In-app notifications; enhanced in Phase 10 |
| `chat-service` | 8087 | ✅ Running | WebSocket group chat |
| `file-service` | 8088 | ✅ Running | MinIO file upload/download |

---

## Full Technology Stack

### Currently Implemented

| Layer | Technology | Status |
|---|---|---|
| Services | Spring Boot 3.2.5, Spring Cloud 2023.0.1 | ✅ |
| Language | Java 17 | ✅ |
| Service Discovery | Netflix Eureka | ✅ |
| API Gateway | Spring Cloud Gateway + JWT validation + blacklist | ✅ |
| Auth | JWT (JJWT 0.12.5) + RBAC (STUDENT / ADMIN) | ✅ |
| Databases | PostgreSQL 16 — one schema per service | ✅ |
| DB Migrations | Flyway (versioned, auto-run on startup) | ✅ |
| Messaging | RabbitMQ 3.13 (async notifications) | ✅ |
| Cache | Redis 7 (user profiles, course catalog, JWT blacklist) | ✅ |
| Real-time | WebSocket — STOMP over SockJS (group chat) | ✅ |
| File Storage | MinIO (S3-compatible, local) via AWS SDK v2 | ✅ |
| Containerization | Docker + Docker Compose | ✅ |
| Frontend | Next.js 14 (App Router, TypeScript, Tailwind) | ✅ |

### Planned (not yet built)

| Layer | Technology | Phase |
|---|---|---|
| Rate Limiting | Bucket4j + Redis in API Gateway | 11 |
| Circuit Breaker | Resilience4j on gateway routes | 11 |
| Monitoring | Prometheus + Grafana | 12 |
| Distributed Tracing | Zipkin + Micrometer Brave | 12 |
| Centralized Logging | ELK Stack (structured JSON logs) | 13 |
| Orchestration | Kubernetes + Helm | 14 |
| CI/CD | GitHub Actions → Docker Hub → K8s | 15 |

### Out of Scope

| Item | Reason |
|---|---|
| Email service | Web app only; no transactional email needed for academic project |
| Push notifications | Web app only; no FCM/APNs |
| Mobile app | Web app only; React Native not planned |

---

## Implementation Order & Effort

| Phase | Work | Effort | Status |
|---|---|---|---|
| 1. PostgreSQL | Replace H2, add Flyway, update Compose | 1–2 days | ✅ Done |
| 2. RabbitMQ | Replace Feign notifs, add consumers | 2–3 days | ✅ Done |
| 3. WebSocket Chat | STOMP config, JWT handshake, frontend client | 2–3 days | ✅ Done |
| 4. Redis | Caching layer, JWT blacklist | 1 day | ✅ Done |
| 5. File Service (MinIO) | New microservice, MinIO/S3 integration | 2 days | ✅ Done |
| 6. RBAC | STUDENT/ADMIN roles, admin panel, course management | 1–2 days | ✅ Done |
| 7. User Service completion | Change-password, user search | 1 day | ✅ Done |
| 8. Q&A completion | Upvotes, bookmarks, answer replies | 2–3 days | ✅ Done |
| 9. Peer Teaching completion | Enhanced request, sessions, scheduling, ratings | 3–4 days | Next |
| 10. In-app notification enhancements | Unread count, type metadata, pagination, frontend bell | 1 day | Planned |
| 11. API Gateway enhancements | Rate limiting, circuit breaker, logging filter | 1 day | Planned |
| 12. Prometheus + Grafana + Zipkin | Metrics, dashboards, distributed tracing | 1–2 days | Planned |
| 13. ELK logging | Logstash encoder, Docker stack | 1 day | Planned |
| 14. Kubernetes | K8s manifests, Ingress, HPA | 3–5 days | Planned |
| 15. CI/CD | GitHub Actions workflow | 1 day | Planned |

---

## Recommended Build Order (Remaining)

```
Next:  Phase 9  (Peer Teaching — enhanced request, TutoringSession, ratings)
Then:  Phase 10 (In-app notification enhancements — unread count, type, pagination)
Then:  Phase 11 (Gateway — rate limiting, circuit breaker, logging filter)
Then:  Phase 12 (Prometheus + Grafana + Zipkin — metrics and tracing)
Then:  Phase 13 (ELK — centralized structured logging)
Then:  Phase 14 (Kubernetes — manifests, Ingress, HPA)
Then:  Phase 15 (CI/CD — GitHub Actions → Docker Hub → K8s rolling deploy)
```

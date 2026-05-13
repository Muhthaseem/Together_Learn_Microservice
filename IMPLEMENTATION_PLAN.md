# TogetherLearn — Distributed System Implementation Plan

This document is the **engineering blueprint** for building the Spring Boot microservices system. It translates the strategy in `SOFTWARE_ARCHITECTURE_DESIGN.md` and `DISTRIBUTED_SYSTEMS_MIGRATION_PLAN.md` into exact code structure, configurations, API contracts, and a step-by-step build order.

---

## Table of Contents
1. [Final Repository Layout](#1-final-repository-layout)
2. [Technology Versions & Maven Parent](#2-technology-versions--maven-parent)
3. [Port & Service Registry](#3-port--service-registry)
4. [JWT Strategy](#4-jwt-strategy)
5. [Service Specs](#5-service-specs)
   - [5.1 Discovery Server](#51-discovery-server-port-8761)
   - [5.2 API Gateway](#52-api-gateway-port-8080)
   - [5.3 User Service](#53-user-service-port-8081)
   - [5.4 Course Service](#54-course-service-port-8082)
   - [5.5 Group Study Service](#55-group-study-service-port-8083)
   - [5.6 Q&A Service](#56-qa-service-port-8084)
   - [5.7 Peer Teaching Service](#57-peer-teaching-service-port-8085)
   - [5.8 Notification Service](#58-notification-service-port-8086)
   - [5.9 Chat Service](#59-chat-service-port-8087)
6. [Inter-Service Communication Map](#6-inter-service-communication-map)
7. [Docker Compose](#7-docker-compose)
8. [Frontend Changes](#8-frontend-changes)
9. [Build Order & Implementation Phases](#9-build-order--implementation-phases)
10. [Testing Strategy](#10-testing-strategy)
11. [API Reference Summary](#11-api-reference-summary)

---

## 1. Final Repository Layout

```
TogetherLearn_DisSysArch/
├── frontend/                        # Existing Next.js app (modified)
├── backend/                         # Existing Node.js monolith (reference only)
├── services/                        # All Spring Boot microservices
│   ├── pom.xml                      # Maven parent POM
│   ├── discovery-server/            # Netflix Eureka server
│   │   ├── pom.xml
│   │   └── src/main/
│   │       ├── java/com/togetherlearn/discovery/
│   │       │   └── DiscoveryServerApplication.java
│   │       └── resources/
│   │           └── application.yml
│   ├── api-gateway/                 # Spring Cloud Gateway
│   │   ├── pom.xml
│   │   └── src/main/
│   │       ├── java/com/togetherlearn/gateway/
│   │       │   ├── ApiGatewayApplication.java
│   │       │   └── filter/
│   │       │       └── JwtAuthFilter.java
│   │       └── resources/
│   │           └── application.yml
│   ├── user-service/
│   │   ├── pom.xml
│   │   └── src/main/
│   │       ├── java/com/togetherlearn/user/
│   │       │   ├── UserServiceApplication.java
│   │       │   ├── config/          SecurityConfig.java
│   │       │   ├── entity/          User.java, UserCourse.java
│   │       │   ├── dto/             RegisterRequest.java, LoginRequest.java,
│   │       │   │                    AuthResponse.java, UserResponse.java,
│   │       │   │                    UpdateUserRequest.java, InternalUserDto.java
│   │       │   ├── repository/      UserRepository.java
│   │       │   ├── service/         UserService.java, JwtService.java
│   │       │   └── controller/      AuthController.java, UserController.java,
│   │       │                        InternalUserController.java
│   │       └── resources/
│   │           └── application.yml
│   ├── course-service/
│   │   ├── pom.xml
│   │   └── src/main/
│   │       ├── java/com/togetherlearn/course/
│   │       │   ├── CourseServiceApplication.java
│   │       │   ├── entity/          Course.java
│   │       │   ├── dto/             CourseResponse.java, CourseListResponse.java
│   │       │   ├── repository/      CourseRepository.java
│   │       │   ├── service/         CourseService.java, CourseSeedService.java
│   │       │   └── controller/      CourseController.java, MetaController.java
│   │       └── resources/
│   │           ├── application.yml
│   │           └── data/            courses.json  (copy of university_curriculum_courses.json)
│   ├── group-service/
│   │   ├── pom.xml
│   │   └── src/main/
│   │       ├── java/com/togetherlearn/group/
│   │       │   ├── GroupServiceApplication.java
│   │       │   ├── client/          UserClient.java, CourseClient.java, NotificationClient.java
│   │       │   ├── entity/          StudyGroup.java, GroupParticipant.java
│   │       │   ├── dto/             CreateGroupRequest.java, GroupResponse.java,
│   │       │   │                    GroupDetailResponse.java, UpdateGroupRequest.java
│   │       │   ├── repository/      StudyGroupRepository.java, GroupParticipantRepository.java
│   │       │   ├── service/         GroupService.java
│   │       │   └── controller/      GroupController.java
│   │       └── resources/
│   │           └── application.yml
│   ├── qa-service/
│   │   ├── pom.xml
│   │   └── src/main/
│   │       ├── java/com/togetherlearn/qa/
│   │       │   ├── QaServiceApplication.java
│   │       │   ├── client/          UserClient.java, CourseClient.java, NotificationClient.java
│   │       │   ├── entity/          Question.java, Answer.java
│   │       │   ├── dto/             CreateQuestionRequest.java, QuestionResponse.java,
│   │       │   │                    QuestionDetailResponse.java, CreateAnswerRequest.java,
│   │       │   │                    AnswerResponse.java
│   │       │   ├── repository/      QuestionRepository.java, AnswerRepository.java
│   │       │   ├── service/         QaService.java
│   │       │   └── controller/      QuestionController.java
│   │       └── resources/
│   │           └── application.yml
│   ├── peer-teaching-service/
│   │   ├── pom.xml
│   │   └── src/main/
│   │       ├── java/com/togetherlearn/peer/
│   │       │   ├── PeerTeachingServiceApplication.java
│   │       │   ├── client/          UserClient.java, CourseClient.java, NotificationClient.java
│   │       │   ├── entity/          PeerRequest.java, PeerOffer.java
│   │       │   ├── dto/             CreatePeerRequestDto.java, CreatePeerOfferDto.java,
│   │       │   │                    PeerRequestResponse.java, PeerOfferResponse.java
│   │       │   ├── repository/      PeerRequestRepository.java, PeerOfferRepository.java
│   │       │   ├── service/         PeerTeachingService.java
│   │       │   └── controller/      PeerRequestController.java, PeerOfferController.java
│   │       └── resources/
│   │           └── application.yml
│   ├── notification-service/
│   │   ├── pom.xml
│   │   └── src/main/
│   │       ├── java/com/togetherlearn/notification/
│   │       │   ├── NotificationServiceApplication.java
│   │       │   ├── entity/          Notification.java
│   │       │   ├── dto/             CreateNotificationRequest.java, NotificationResponse.java
│   │       │   ├── repository/      NotificationRepository.java
│   │       │   ├── service/         NotificationService.java
│   │       │   └── controller/      NotificationController.java, InternalNotificationController.java
│   │       └── resources/
│   │           └── application.yml
│   └── chat-service/
│       ├── pom.xml
│       └── src/main/
│           ├── java/com/togetherlearn/chat/
│           │   ├── ChatServiceApplication.java
│           │   ├── client/          GroupClient.java
│           │   ├── entity/          ChatMessage.java
│           │   ├── dto/             CreateMessageRequest.java, MessageResponse.java
│           │   ├── repository/      ChatMessageRepository.java
│           │   ├── service/         ChatService.java
│           │   └── controller/      ChatController.java
│           └── resources/
│               └── application.yml
├── docker-compose.yml               # Full stack local orchestration
├── docker-compose.dev.yml           # Dev override (hot reload, port exposure)
└── IMPLEMENTATION_PLAN.md           # This file
```

---

## 2. Technology Versions & Maven Parent

### Parent POM (`services/pom.xml`)

```xml
<groupId>com.togetherlearn</groupId>
<artifactId>togetherlearn-services</artifactId>
<version>1.0.0</version>
<packaging>pom</packaging>

<properties>
  <java.version>17</java.version>
  <spring-boot.version>3.2.5</spring-boot.version>
  <spring-cloud.version>2023.0.1</spring-cloud.version>
  <jjwt.version>0.12.5</jjwt.version>
</properties>

<dependencyManagement>
  <dependencies>
    <!-- Spring Boot BOM -->
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-dependencies</artifactId>
      <version>${spring-boot.version}</version>
      <type>pom</type><scope>import</scope>
    </dependency>
    <!-- Spring Cloud BOM -->
    <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-dependencies</artifactId>
      <version>${spring-cloud.version}</version>
      <type>pom</type><scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>

<modules>
  <module>discovery-server</module>
  <module>api-gateway</module>
  <module>user-service</module>
  <module>course-service</module>
  <module>group-service</module>
  <module>qa-service</module>
  <module>peer-teaching-service</module>
  <module>notification-service</module>
  <module>chat-service</module>
</modules>
```

### Standard dependencies per business service

```xml
<!-- Spring Boot Web + Validation -->
<dependency>spring-boot-starter-web</dependency>
<dependency>spring-boot-starter-validation</dependency>

<!-- Spring Data JPA + H2 -->
<dependency>spring-boot-starter-data-jpa</dependency>
<dependency>com.h2database:h2:runtime</dependency>

<!-- Spring Security -->
<dependency>spring-boot-starter-security</dependency>

<!-- Netflix Eureka Client -->
<dependency>spring-cloud-starter-netflix-eureka-client</dependency>

<!-- OpenFeign (inter-service HTTP calls) -->
<dependency>spring-cloud-starter-openfeign</dependency>

<!-- Spring Boot Actuator (health checks, metrics) -->
<dependency>spring-boot-starter-actuator</dependency>

<!-- Lombok -->
<dependency>org.projectlombok:lombok:provided</dependency>

<!-- JWT (User Service only — other services parse JWT header forwarded by gateway) -->
<dependency>io.jsonwebtoken:jjwt-api:${jjwt.version}</dependency>
<dependency>io.jsonwebtoken:jjwt-impl:${jjwt.version}:runtime</dependency>
<dependency>io.jsonwebtoken:jjwt-jackson:${jjwt.version}:runtime</dependency>
```

---

## 3. Port & Service Registry

| Service | Port | Eureka App Name |
|---|---|---|
| Discovery Server (Eureka) | 8761 | — |
| API Gateway | 8080 | `API-GATEWAY` |
| User Service | 8081 | `USER-SERVICE` |
| Course Service | 8082 | `COURSE-SERVICE` |
| Group Study Service | 8083 | `GROUP-STUDY-SERVICE` |
| Q&A Service | 8084 | `QA-SERVICE` |
| Peer Teaching Service | 8085 | `PEER-TEACHING-SERVICE` |
| Notification Service | 8086 | `NOTIFICATION-SERVICE` |
| Chat Service | 8087 | `CHAT-SERVICE` |

---

## 4. JWT Strategy

**Issuer:** User Service only.

**Token claims:**
```json
{
  "sub": "user-uuid",
  "email": "student@uni.edu",
  "department": "CO",
  "batch": "Batch 3",
  "roles": ["ROLE_USER"],
  "iat": 1700000000,
  "exp": 1700086400
}
```

**Gateway enforcement:**
- `JwtAuthFilter` in the API Gateway validates every request except `POST /api/auth/register` and `POST /api/auth/login`.
- On valid JWT, the filter extracts claims and forwards them as HTTP headers to downstream services:
  - `X-User-Id: <sub>`
  - `X-User-Email: <email>`
  - `X-User-Department: <department>`
  - `X-User-Batch: <batch>`

**Downstream services:**
- Business services do **not** re-validate the JWT signature — they trust the forwarded headers.
- This eliminates the need to share the JWT secret with every service.
- Internal endpoints (prefixed `/internal/`) are blocked at the gateway and only reachable service-to-service within the Docker network.

**Shared secret:**
- Stored as environment variable `JWT_SECRET` in both the User Service and the API Gateway.
- All other services only need `X-User-Id` from the header.

---

## 5. Service Specs

### 5.1 Discovery Server (port 8761)

**Dependencies:** `spring-cloud-starter-netflix-eureka-server` only.

**`application.yml`:**
```yaml
server:
  port: 8761
spring:
  application:
    name: discovery-server
eureka:
  client:
    register-with-eureka: false
    fetch-registry: false
  server:
    wait-time-in-ms-when-sync-empty: 0
```

**Main class:**
```java
@SpringBootApplication
@EnableEurekaServer
public class DiscoveryServerApplication { ... }
```

**Eureka dashboard** available at `http://localhost:8761`.

---

### 5.2 API Gateway (port 8080)

**Dependencies:** `spring-cloud-starter-gateway`, `spring-cloud-starter-netflix-eureka-client`, `jjwt-*`.

**Note:** Uses Spring Cloud Gateway (reactive, not servlet-based). Do **not** add `spring-boot-starter-web`.

**`application.yml`:**
```yaml
server:
  port: 8080
spring:
  application:
    name: api-gateway
  cloud:
    gateway:
      globalcors:
        cors-configurations:
          '[/**]':
            allowed-origins: "http://localhost:3000"
            allowed-methods: "*"
            allowed-headers: "*"
            allow-credentials: true
      routes:
        - id: user-auth
          uri: lb://USER-SERVICE
          predicates:
            - Path=/api/auth/**
          filters:
            - RewritePath=/api/auth/(?<segment>.*), /api/auth/${segment}

        - id: user-service
          uri: lb://USER-SERVICE
          predicates:
            - Path=/api/users/**
          filters:
            - AuthFilter

        - id: course-service
          uri: lb://COURSE-SERVICE
          predicates:
            - Path=/api/courses/**, /api/meta/**
          filters:
            - AuthFilter

        - id: group-service
          uri: lb://GROUP-STUDY-SERVICE
          predicates:
            - Path=/api/groups/**
          filters:
            - AuthFilter

        - id: qa-service
          uri: lb://QA-SERVICE
          predicates:
            - Path=/api/questions/**
          filters:
            - AuthFilter

        - id: peer-teaching-service
          uri: lb://PEER-TEACHING-SERVICE
          predicates:
            - Path=/api/peer-requests/**, /api/peer-offers/**
          filters:
            - AuthFilter

        - id: notification-service
          uri: lb://NOTIFICATION-SERVICE
          predicates:
            - Path=/api/notifications/**
          filters:
            - AuthFilter

        - id: chat-service
          uri: lb://CHAT-SERVICE
          predicates:
            - Path=/api/messages/**
          filters:
            - AuthFilter

eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/

app:
  jwt:
    secret: ${JWT_SECRET}
    public-paths:
      - /api/auth/register
      - /api/auth/login
```

**`JwtAuthFilter.java`** (GatewayFilter):
```java
// Checks Authorization: Bearer <token>
// Skips paths in app.jwt.public-paths
// On valid token: adds X-User-Id, X-User-Email, X-User-Department, X-User-Batch headers
// On invalid token: returns 401
```

---

### 5.3 User Service (port 8081)

#### Database Schema (H2 `user_db`)

```sql
CREATE TABLE users (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id      VARCHAR(36) UNIQUE NOT NULL,  -- UUID
  name         VARCHAR(100) NOT NULL,
  email        VARCHAR(150) UNIQUE NOT NULL,
  password     VARCHAR(255) NOT NULL,         -- bcrypt hash
  reg_number   VARCHAR(50) UNIQUE,
  index_number VARCHAR(50) UNIQUE,
  department   VARCHAR(50),
  batch        VARCHAR(50),
  avatar_url   VARCHAR(500),
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_courses (
  user_id     VARCHAR(36) NOT NULL,
  course_code VARCHAR(20) NOT NULL,
  PRIMARY KEY (user_id, course_code)
);
```

#### JPA Entities

**`User.java`:**
```java
@Entity @Table(name = "users")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class User {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @Column(unique = true, nullable = false)
  private String userId;           // UUID generated on creation
  private String name;
  @Column(unique = true, nullable = false)
  private String email;
  @Column(nullable = false)
  private String password;
  private String registrationNumber;
  private String indexNumber;
  private String department;
  private String batch;
  private String avatarUrl;
  @ElementCollection(fetch = FetchType.EAGER)
  @CollectionTable(name = "user_courses", joinColumns = @JoinColumn(name = "user_id",
                   referencedColumnName = "userId"))
  @Column(name = "course_code")
  private Set<String> courses = new HashSet<>();
  @CreationTimestamp private LocalDateTime createdAt;
  @UpdateTimestamp  private LocalDateTime updatedAt;
}
```

#### DTOs

**`RegisterRequest.java`:** `name, email, password, department, batch, registrationNumber, indexNumber`

**`LoginRequest.java`:** `email, password`

**`AuthResponse.java`:** `userId, name, email, department, batch, token`

**`UserResponse.java`:** `userId, name, email, department, batch, courses, avatarUrl, createdAt`

**`UpdateUserRequest.java`:** `name, department, batch, avatarUrl, courses`

**`InternalUserDto.java`:** `userId, name, email, department, batch` — returned to other services

#### API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register user, return JWT |
| POST | `/api/auth/login` | Public | Login, return JWT |
| GET | `/api/users/{userId}` | Required | Get public user profile |
| PUT | `/api/users/{userId}` | Required, owner only | Update profile |
| GET | `/api/users/{userId}/courses` | Required | List enrolled courses |
| PUT | `/api/users/{userId}/courses` | Required, owner only | Update enrolled courses |
| GET | `/internal/users/{userId}` | Internal only | Used by other services |
| GET | `/actuator/health` | Public | Health check |

#### Key Logic

- `userId` = `UUID.randomUUID().toString()` on registration.
- Password hashed with `BCryptPasswordEncoder`.
- JWT issued with 24-hour expiry using `JwtService` (wraps JJWT).
- `PUT /api/users/{userId}` checks `X-User-Id` header equals `{userId}`.
- `/internal/**` endpoints are blocked at the gateway; only reachable within Docker network.

#### `application.yml`
```yaml
server:
  port: 8081
spring:
  application:
    name: user-service
  datasource:
    url: jdbc:h2:mem:user_db;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
    driver-class-name: org.h2.Driver
  h2:
    console:
      enabled: true
      path: /h2-console
  jpa:
    hibernate:
      ddl-auto: create-drop
    show-sql: false
eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
app:
  jwt:
    secret: ${JWT_SECRET}
    expiration-ms: 86400000
```

---

### 5.4 Course Service (port 8082)

#### Database Schema (H2 `course_db`)

```sql
CREATE TABLE courses (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  course_code  VARCHAR(20) UNIQUE NOT NULL,
  title        VARCHAR(200) NOT NULL,
  description  TEXT,
  department   VARCHAR(50) NOT NULL,
  semester     INTEGER,
  credits      INTEGER,
  pre_reqs     VARCHAR(500)       -- comma-separated course codes
);
```

#### Seeding

`CourseSeedService.java` loads `resources/data/courses.json` (a copy of `university_curriculum_courses.json`) on application startup using `@PostConstruct` and persists all courses if the table is empty.

#### DTOs

**`CourseResponse.java`:** `courseCode, title, description, department, semester, credits, preReqs`

**`CourseListItem.java`:** `courseCode, title, department, semester`

#### API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/courses` | Required | List all courses (pageable) |
| GET | `/api/courses?department=CO&semester=1` | Required | Filter courses |
| GET | `/api/courses/{courseCode}` | Required | Get course detail |
| GET | `/api/meta/departments` | Required | List departments |
| GET | `/api/meta/batches` | Required | List batches |
| GET | `/internal/courses/{courseCode}/exists` | Internal | Returns `{exists: true/false}` |

#### Departments list
`First Year, CO, CE, ME, EEE`

#### Batches list
`Batch 1, Batch 2, Batch 3, Batch 4, Batch 5, Batch 6, Batch 7, Batch 8, Batch 9, Batch 10`

---

### 5.5 Group Study Service (port 8083)

#### Database Schema (H2 `group_db`)

```sql
CREATE TABLE study_groups (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  group_id        VARCHAR(36) UNIQUE NOT NULL,
  title           VARCHAR(200) NOT NULL,
  description     TEXT,
  creator_id      VARCHAR(36) NOT NULL,
  course_code     VARCHAR(20) NOT NULL,
  scheduled_date  DATE,
  scheduled_time  TIME,
  location        VARCHAR(300),
  mode            VARCHAR(20) NOT NULL,   -- VIRTUAL | PHYSICAL
  status          VARCHAR(20) DEFAULT 'ACTIVE',  -- ACTIVE | CLOSED
  max_participants INTEGER DEFAULT 20,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE group_participants (
  group_id  VARCHAR(36) NOT NULL,
  user_id   VARCHAR(36) NOT NULL,
  role      VARCHAR(20) DEFAULT 'MEMBER',  -- HOST | MEMBER
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (group_id, user_id)
);
```

#### DTOs

**`CreateGroupRequest.java`:** `title, description, courseCode, scheduledDate, scheduledTime, location, mode, maxParticipants`

**`GroupResponse.java`:** `groupId, title, courseCode, scheduledDate, scheduledTime, mode, status, participantCount, creatorId, createdAt`

**`GroupDetailResponse.java`:** Full group + `participants[]` (each with `userId, name, role`)

**`UpdateGroupRequest.java`:** Same optional fields as create

#### API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/groups` | Required | List groups (filter by courseCode optional) |
| POST | `/api/groups` | Required | Create group |
| GET | `/api/groups/{groupId}` | Required | Get group detail |
| PUT | `/api/groups/{groupId}` | Required, creator only | Update group |
| DELETE | `/api/groups/{groupId}` | Required, creator only | Delete group |
| POST | `/api/groups/{groupId}/join` | Required | Join group |
| POST | `/api/groups/{groupId}/leave` | Required | Leave group |
| GET | `/internal/groups/{groupId}/exists` | Internal | Returns `{exists: true/false}` |

#### Inter-Service Calls (OpenFeign)

```java
@FeignClient(name = "USER-SERVICE")
interface UserClient {
  @GetMapping("/internal/users/{userId}")
  InternalUserDto getUser(@PathVariable String userId);
}

@FeignClient(name = "COURSE-SERVICE")
interface CourseClient {
  @GetMapping("/internal/courses/{courseCode}/exists")
  Map<String, Boolean> courseExists(@PathVariable String courseCode);
}

@FeignClient(name = "NOTIFICATION-SERVICE")
interface NotificationClient {
  @PostMapping("/internal/notifications")
  void createNotification(@RequestBody CreateNotificationRequest req);
}
```

#### Key Logic
- On `POST /api/groups`: validate `courseCode` via Course Service, add `creator_id` from `X-User-Id` header as HOST participant.
- On `POST /api/groups/{groupId}/join`: notify the group creator via Notification Service.
- Creator cannot leave their own group (must close it instead).

---

### 5.6 Q&A Service (port 8084)

#### Database Schema (H2 `qa_db`)

```sql
CREATE TABLE questions (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  question_id  VARCHAR(36) UNIQUE NOT NULL,
  title        VARCHAR(300) NOT NULL,
  body         TEXT NOT NULL,
  author_id    VARCHAR(36) NOT NULL,
  course_code  VARCHAR(20),
  tags         VARCHAR(500),     -- comma-separated
  status       VARCHAR(20) DEFAULT 'OPEN',  -- OPEN | ANSWERED | CLOSED
  answer_count INTEGER DEFAULT 0,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE answers (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  answer_id   VARCHAR(36) UNIQUE NOT NULL,
  question_id VARCHAR(36) NOT NULL,
  content     TEXT NOT NULL,
  author_id   VARCHAR(36) NOT NULL,
  is_accepted BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (question_id) REFERENCES questions(question_id)
);
```

#### DTOs

**`CreateQuestionRequest.java`:** `title, body, courseCode, tags`

**`QuestionResponse.java`:** `questionId, title, authorId, courseCode, tags, status, answerCount, createdAt`

**`QuestionDetailResponse.java`:** Full question + `answers[]`

**`CreateAnswerRequest.java`:** `content`

**`AnswerResponse.java`:** `answerId, questionId, content, authorId, isAccepted, createdAt`

#### API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/questions` | Required | List questions (filter: courseCode, status) |
| POST | `/api/questions` | Required | Post question |
| GET | `/api/questions/{questionId}` | Required | Get question + all answers |
| DELETE | `/api/questions/{questionId}` | Required, author only | Delete question |
| POST | `/api/questions/{questionId}/answers` | Required | Post answer |
| PUT | `/api/questions/{questionId}/answers/{answerId}` | Required, author only | Edit answer |
| DELETE | `/api/questions/{questionId}/answers/{answerId}` | Required, author only | Delete answer |
| POST | `/api/questions/{questionId}/answers/{answerId}/accept` | Required, question author | Accept best answer |

#### Key Logic
- On new answer: notify question author via Notification Service (skip if author == answerer).
- Accepting an answer sets `status = ANSWERED` on the question, `is_accepted = true` on the answer, `false` on all others.
- `answer_count` is maintained by a `@Modifying` query on insert/delete.

---

### 5.7 Peer Teaching Service (port 8085)

#### Database Schema (H2 `peer_db`)

```sql
CREATE TABLE peer_requests (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  request_id   VARCHAR(36) UNIQUE NOT NULL,
  requester_id VARCHAR(36) NOT NULL,
  course_code  VARCHAR(20) NOT NULL,
  topic        VARCHAR(300) NOT NULL,
  description  TEXT,
  status       VARCHAR(20) DEFAULT 'OPEN',  -- OPEN | MATCHED | CLOSED
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE peer_offers (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  offer_id    VARCHAR(36) UNIQUE NOT NULL,
  tutor_id    VARCHAR(36) NOT NULL,
  course_code VARCHAR(20) NOT NULL,
  description TEXT,
  status      VARCHAR(20) DEFAULT 'AVAILABLE',  -- AVAILABLE | BUSY | CLOSED
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE peer_applications (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  request_id   VARCHAR(36) NOT NULL,
  applicant_id VARCHAR(36) NOT NULL,
  message      TEXT,
  status       VARCHAR(20) DEFAULT 'PENDING',  -- PENDING | ACCEPTED | REJECTED
  applied_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/peer-requests` | Required | List open requests (filter: courseCode) |
| POST | `/api/peer-requests` | Required | Create a help request |
| GET | `/api/peer-requests/{requestId}` | Required | Get request detail |
| PUT | `/api/peer-requests/{requestId}` | Required, owner | Update/close request |
| POST | `/api/peer-requests/{requestId}/apply` | Required | Tutor applies to help |
| PUT | `/api/peer-requests/{requestId}/applications/{appId}/accept` | Required, requester | Accept a tutor |
| GET | `/api/peer-offers` | Required | List available offers (filter: courseCode) |
| POST | `/api/peer-offers` | Required | Create tutoring offer |
| PUT | `/api/peer-offers/{offerId}` | Required, owner | Update/close offer |

#### Key Logic
- On `POST /api/peer-requests/{requestId}/apply`: notify the requester.
- On `PUT .../applications/{appId}/accept`: set `request status = MATCHED`, `application status = ACCEPTED`, notify the tutor.

---

### 5.8 Notification Service (port 8086)

#### Database Schema (H2 `notification_db`)

```sql
CREATE TABLE notifications (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  notification_id VARCHAR(36) UNIQUE NOT NULL,
  recipient_id    VARCHAR(36) NOT NULL,
  type            VARCHAR(50) NOT NULL,   -- GROUP_JOIN | QUESTION_ANSWERED | PEER_APPLICATION | PEER_ACCEPTED | SYSTEM
  title           VARCHAR(200) NOT NULL,
  message         TEXT NOT NULL,
  reference_type  VARCHAR(50),  -- GROUP | QUESTION | PEER_REQUEST
  reference_id    VARCHAR(36),  -- ID of the related entity
  is_read         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Notification Types
| Type | Triggered When |
|---|---|
| `GROUP_JOIN` | A user joins a study group |
| `QUESTION_ANSWERED` | A new answer is posted on the user's question |
| `PEER_APPLICATION` | Someone applies to help with the user's peer request |
| `PEER_ACCEPTED` | User's tutoring application was accepted |
| `SYSTEM` | Admin/system announcements |

#### DTOs

**`CreateNotificationRequest.java`:** `recipientId, type, title, message, referenceType, referenceId`

**`NotificationResponse.java`:** `notificationId, type, title, message, referenceType, referenceId, isRead, createdAt`

#### API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications` | Required | Get current user's notifications |
| PUT | `/api/notifications/{id}/read` | Required, recipient | Mark one as read |
| PUT | `/api/notifications/read-all` | Required | Mark all as read |
| GET | `/api/notifications/unread-count` | Required | Returns `{count: N}` |
| POST | `/internal/notifications` | Internal only | Create notification (called by other services) |

#### Key Logic
- `GET /api/notifications` uses `X-User-Id` header as `recipientId`.
- Paginated (default page size 20), sorted by `createdAt DESC`.
- `/internal/notifications` is blocked at the gateway — only reachable via Feign clients inside the Docker network.

---

### 5.9 Chat Service (port 8087)

#### Database Schema (H2 `chat_db`)

```sql
CREATE TABLE chat_messages (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  message_id  VARCHAR(36) UNIQUE NOT NULL,
  group_id    VARCHAR(36) NOT NULL,
  author_id   VARCHAR(36) NOT NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chat_group ON chat_messages(group_id, created_at);
```

#### DTOs

**`CreateMessageRequest.java`:** `content`

**`MessageResponse.java`:** `messageId, groupId, authorId, content, createdAt`

#### API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/messages/groups/{groupId}` | Required | Get messages for group (paginated, newest last) |
| POST | `/api/messages/groups/{groupId}` | Required | Post message to group |

#### Key Logic
- On `POST`: validate `groupId` exists via Group Service Feign client.
- Validate the user is a participant in the group before allowing messages (call Group Service internal endpoint or check membership).
- Paginated with default page size 50, sorted `createdAt ASC`.

---

## 6. Inter-Service Communication Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY :8080                           │
│  - JWT validation                                                   │
│  - Forwards X-User-Id, X-User-Email, X-User-Department headers     │
└────────────┬──────────────────────────────────────────┬────────────┘
             │ routes to                                 │
    ┌────────▼─────────┐              ┌──────────────────▼────────────┐
    │  User Service    │              │      Course Service            │
    │  :8081           │◄─────────────│      :8082                     │
    └──────────────────┘  GET /internal/users/{id}                    │
              ▲            (called by Group, Q&A, Peer)               │
              │                                                        │
    ┌─────────┴──────────────────────────────────────┐               │
    │                                                │               │
    │  Group Study Service :8083                     │               │
    │  Feign → User Service (validate user)          │───────────────►│
    │  Feign → Course Service (validate course)      │ GET /internal/courses/{code}/exists
    │  Feign → Notification Service (GROUP_JOIN)     │               │
    └────────────────────────────────────────────────┘               │
                                                                      │
    ┌─────────────────────────────────────────────────┐             │
    │  Q&A Service :8084                              │             │
    │  Feign → Notification Service (QUESTION_ANSWERED│─────────────►│
    └─────────────────────────────────────────────────┘ (optional course validation)
                                                                      │
    ┌─────────────────────────────────────────────────┐             │
    │  Peer Teaching Service :8085                    │─────────────►│
    │  Feign → Notification Service (PEER_APPLICATION │ (optional course validation)
    │                               PEER_ACCEPTED)   │
    └─────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────┐
    │  Notification Service :8086                     │
    │  ← receives internal POST from Group, Q&A, Peer │
    └─────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────┐
    │  Chat Service :8087                             │
    │  Feign → Group Service (validate group exists)  │
    └─────────────────────────────────────────────────┘
```

### Feign Client Base Interfaces (shared pattern)

Each Feign client is defined in its consuming service. Example in Group Service:

```java
@FeignClient(name = "USER-SERVICE", path = "/internal")
public interface UserClient {
    @GetMapping("/users/{userId}")
    InternalUserDto getUser(@PathVariable("userId") String userId);
}

@FeignClient(name = "COURSE-SERVICE", path = "/internal")
public interface CourseClient {
    @GetMapping("/courses/{courseCode}/exists")
    Map<String, Boolean> courseExists(@PathVariable("courseCode") String courseCode);
}

@FeignClient(name = "NOTIFICATION-SERVICE", path = "/internal")
public interface NotificationClient {
    @PostMapping("/notifications")
    void createNotification(@RequestBody CreateNotificationRequest request);
}
```

---

## 7. Docker Compose

**`docker-compose.yml`:**

```yaml
version: '3.9'

services:
  discovery-server:
    build: ./services/discovery-server
    container_name: discovery-server
    ports:
      - "8761:8761"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8761/actuator/health"]
      interval: 10s
      timeout: 5s
      retries: 5

  api-gateway:
    build: ./services/api-gateway
    container_name: api-gateway
    ports:
      - "8080:8080"
    environment:
      EUREKA_URI: http://discovery-server:8761/eureka
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      discovery-server:
        condition: service_healthy

  user-service:
    build: ./services/user-service
    container_name: user-service
    ports:
      - "8081:8081"
    environment:
      EUREKA_URI: http://discovery-server:8761/eureka
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      discovery-server:
        condition: service_healthy

  course-service:
    build: ./services/course-service
    container_name: course-service
    ports:
      - "8082:8082"
    environment:
      EUREKA_URI: http://discovery-server:8761/eureka
    depends_on:
      discovery-server:
        condition: service_healthy

  group-service:
    build: ./services/group-service
    container_name: group-service
    ports:
      - "8083:8083"
    environment:
      EUREKA_URI: http://discovery-server:8761/eureka
    depends_on:
      discovery-server:
        condition: service_healthy
      user-service:
        condition: service_started
      course-service:
        condition: service_started
      notification-service:
        condition: service_started

  qa-service:
    build: ./services/qa-service
    container_name: qa-service
    ports:
      - "8084:8084"
    environment:
      EUREKA_URI: http://discovery-server:8761/eureka
    depends_on:
      discovery-server:
        condition: service_healthy
      notification-service:
        condition: service_started

  peer-teaching-service:
    build: ./services/peer-teaching-service
    container_name: peer-teaching-service
    ports:
      - "8085:8085"
    environment:
      EUREKA_URI: http://discovery-server:8761/eureka
    depends_on:
      discovery-server:
        condition: service_healthy
      notification-service:
        condition: service_started

  notification-service:
    build: ./services/notification-service
    container_name: notification-service
    ports:
      - "8086:8086"
    environment:
      EUREKA_URI: http://discovery-server:8761/eureka
    depends_on:
      discovery-server:
        condition: service_healthy

  chat-service:
    build: ./services/chat-service
    container_name: chat-service
    ports:
      - "8087:8087"
    environment:
      EUREKA_URI: http://discovery-server:8761/eureka
    depends_on:
      discovery-server:
        condition: service_healthy
      group-service:
        condition: service_started
```

**`.env` file (root level — used by docker-compose):**
```
JWT_SECRET=your-strong-secret-here-min-256-bits
```

**Standard `Dockerfile` for each service:**
```dockerfile
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN ./mvnw package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

## 8. Frontend Changes

Only two changes are needed to the existing Next.js frontend:

### 8.1 Update API base URL

In `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

That single change routes all requests through the API Gateway instead of the old Node.js backend.

### 8.2 Update chat messages path

The existing frontend calls `/api/groups/:id/messages`.
The new Chat Service uses `/api/messages/groups/:id`.

In [frontend/src/lib/api.ts](frontend/src/lib/api.ts), update any group message calls:
```typescript
// OLD
apiGet(`/groups/${groupId}/messages`)
apiPost(`/groups/${groupId}/messages`, body)

// NEW
apiGet(`/messages/groups/${groupId}`)
apiPost(`/messages/groups/${groupId}`, body)
```

### 8.3 Verify notification unread-count endpoint

Add a call to `GET /api/notifications/unread-count` in the `NavBar` component for the notification badge count (this endpoint is new in the Spring Boot service).

No other frontend changes are required. All other API paths match the existing frontend exactly.

---

## 9. Build Order & Implementation Phases

### Phase 0: Scaffolding (Day 1)
1. Create `services/` directory and Maven parent POM.
2. Use Spring Initializr to bootstrap all 9 service projects (or manually create directory structure).
3. Add all modules to parent POM.
4. Verify `mvn compile` succeeds across all modules.

### Phase 1: Discovery & Gateway (Day 1–2)
1. Implement `discovery-server` — single class + yml. Start it. Verify dashboard at `http://localhost:8761`.
2. Implement `api-gateway` — routes yml + `JwtAuthFilter`. Register with Eureka. Verify `/actuator/health`.
3. Write `docker-compose.yml` stubs for these two services.

### Phase 2: User Service (Day 2–3)
1. Define `User` JPA entity and `user_courses` collection table.
2. Implement `UserRepository` (find by email, find by userId).
3. Implement `JwtService` (generate + parse tokens using JJWT).
4. Implement `AuthController` — register + login.
5. Implement `UserController` — GET profile, PUT profile, GET/PUT courses.
6. Implement `InternalUserController` — `GET /internal/users/{userId}`.
7. Add Spring Security config (disable CSRF, stateless session, permit `/api/auth/**`).
8. Register with Eureka. Test via Postman: register → login → get profile.

### Phase 3: Course Service (Day 3)
1. Define `Course` JPA entity.
2. Implement `CourseSeedService` to parse and insert `courses.json` on startup.
3. Implement `CourseController` — list, filter, get by code.
4. Implement `MetaController` — departments, batches.
5. Implement `InternalCourseController` — `GET /internal/courses/{code}/exists`.
6. Register with Eureka. Test via Postman.

### Phase 4: Notification Service (Day 4)
1. Define `Notification` JPA entity.
2. Implement `InternalNotificationController` — `POST /internal/notifications`.
3. Implement `NotificationController` — list, mark read, unread count.
4. Register with Eureka. Test `POST /internal/notifications` directly (bypassing gateway).

*Notification Service is built before Group/Q&A/Peer because those services depend on it via Feign.*

### Phase 5: Group Study Service (Day 4–5)
1. Define `StudyGroup` and `GroupParticipant` JPA entities.
2. Add Feign clients for `USER-SERVICE`, `COURSE-SERVICE`, `NOTIFICATION-SERVICE`.
3. Enable Feign: `@EnableFeignClients` on application class.
4. Implement `GroupController` — full CRUD + join + leave.
5. Implement `GroupService` with business logic (ownership checks, notification on join).
6. Register with Eureka. Test end-to-end: create group → join group → check notification.

### Phase 6: Q&A Service (Day 5–6)
1. Define `Question` and `Answer` JPA entities.
2. Add Feign client for `NOTIFICATION-SERVICE`.
3. Implement `QuestionController` — all endpoints.
4. Implement answer accept logic (toggle `is_accepted`, update question `status`).
5. Register with Eureka. Test: post question → answer it → accept answer.

### Phase 7: Peer Teaching Service (Day 6)
1. Define `PeerRequest`, `PeerOffer`, `PeerApplication` JPA entities.
2. Add Feign client for `NOTIFICATION-SERVICE`.
3. Implement `PeerRequestController` and `PeerOfferController`.
4. Implement application flow: apply → accept → notify.
5. Register with Eureka. Test end-to-end.

### Phase 8: Chat Service (Day 7)
1. Define `ChatMessage` JPA entity with index on `(group_id, created_at)`.
2. Add Feign client for `GROUP-STUDY-SERVICE` (validate group exists).
3. Implement `ChatController` — get messages (paginated) + post message.
4. Register with Eureka.

### Phase 9: Integration & Testing (Day 7–8)
1. Start full stack via Docker Compose.
2. Run functional scenarios (see Section 10).
3. Update frontend `.env.local` to point to gateway.
4. Test all frontend flows end-to-end through the new gateway.
5. Verify Eureka dashboard shows all 8 services registered.

### Phase 10: Load Balancing Demo (Day 8)
1. Scale Group Study Service to 2 instances:
   ```bash
   docker-compose up --scale group-service=2
   ```
2. Observe Eureka registering both instances.
3. Make requests and show round-robin load balancing in logs.

---

## 10. Testing Strategy

### Unit Tests (per service)
Each service should have at minimum:
- `UserServiceTest` — registration, login, duplicate email rejection, JWT generation
- `CourseServiceTest` — seeding, filtering, code lookup
- `GroupServiceTest` — create, join, leave, owner-only delete
- `QaServiceTest` — question lifecycle, answer acceptance logic
- `PeerTeachingServiceTest` — application flow, status transitions
- `NotificationServiceTest` — create, mark read, unread count

Use `@SpringBootTest` with H2 for integration-style service tests. Mock Feign clients with `@MockBean`.

### Integration Test Scenarios (Postman Collection)

Create `TogetherLearn.postman_collection.json` with these ordered flows:

**Flow 1: User Registration & Login**
1. `POST /api/auth/register` → expect 201, save token
2. `POST /api/auth/login` → expect 200, save token
3. `GET /api/users/{userId}` → expect 200 with profile

**Flow 2: Course Browse**
4. `GET /api/courses?department=CO` → expect list
5. `GET /api/meta/departments` → expect department list

**Flow 3: Study Group Lifecycle**
6. Register second user (student B)
7. `POST /api/groups` as user A → save `groupId`
8. `GET /api/groups/{groupId}` → verify details
9. `POST /api/groups/{groupId}/join` as user B
10. `GET /api/notifications` as user A → expect GROUP_JOIN notification

**Flow 4: Q&A Lifecycle**
11. `POST /api/questions` as user A
12. `POST /api/questions/{id}/answers` as user B
13. `GET /api/notifications` as user A → expect QUESTION_ANSWERED
14. `POST /api/questions/{id}/answers/{answerId}/accept` as user A

**Flow 5: Peer Teaching**
15. `POST /api/peer-requests` as user A (needs help)
16. `POST /api/peer-requests/{id}/apply` as user B (offers help)
17. `GET /api/notifications` as user A → expect PEER_APPLICATION
18. `PUT /api/peer-requests/{id}/applications/{appId}/accept` as user A
19. `GET /api/notifications` as user B → expect PEER_ACCEPTED

**Flow 6: Chat**
20. `POST /api/messages/groups/{groupId}` → post message
21. `GET /api/messages/groups/{groupId}` → list messages

### Health Check Verification
```bash
curl http://localhost:8761/eureka/apps  # All services registered
curl http://localhost:8080/actuator/health
curl http://localhost:8081/actuator/health
curl http://localhost:8082/actuator/health
curl http://localhost:8083/actuator/health
curl http://localhost:8084/actuator/health
curl http://localhost:8085/actuator/health
curl http://localhost:8086/actuator/health
curl http://localhost:8087/actuator/health
```

---

## 11. API Reference Summary

### Paths routed through Gateway (`:8080`)

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/users/{userId}
PUT    /api/users/{userId}
GET    /api/users/{userId}/courses
PUT    /api/users/{userId}/courses

GET    /api/courses
GET    /api/courses/{courseCode}
GET    /api/meta/departments
GET    /api/meta/batches

GET    /api/groups
POST   /api/groups
GET    /api/groups/{groupId}
PUT    /api/groups/{groupId}
DELETE /api/groups/{groupId}
POST   /api/groups/{groupId}/join
POST   /api/groups/{groupId}/leave

GET    /api/questions
POST   /api/questions
GET    /api/questions/{questionId}
DELETE /api/questions/{questionId}
POST   /api/questions/{questionId}/answers
PUT    /api/questions/{questionId}/answers/{answerId}
DELETE /api/questions/{questionId}/answers/{answerId}
POST   /api/questions/{questionId}/answers/{answerId}/accept

GET    /api/peer-requests
POST   /api/peer-requests
GET    /api/peer-requests/{requestId}
PUT    /api/peer-requests/{requestId}
POST   /api/peer-requests/{requestId}/apply
PUT    /api/peer-requests/{requestId}/applications/{appId}/accept
GET    /api/peer-offers
POST   /api/peer-offers
PUT    /api/peer-offers/{offerId}

GET    /api/notifications
PUT    /api/notifications/{id}/read
PUT    /api/notifications/read-all
GET    /api/notifications/unread-count

GET    /api/messages/groups/{groupId}
POST   /api/messages/groups/{groupId}
```

### Internal-only paths (blocked at gateway, Docker network only)

```
GET    USER-SERVICE:8081/internal/users/{userId}
GET    COURSE-SERVICE:8082/internal/courses/{courseCode}/exists
GET    GROUP-STUDY-SERVICE:8083/internal/groups/{groupId}/exists
POST   NOTIFICATION-SERVICE:8086/internal/notifications
```

---

## Standard Error Response Format

All services return errors in this shape:

```json
{
  "timestamp": "2026-05-13T10:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Email already registered",
  "path": "/api/auth/register"
}
```

Implement a `@ControllerAdvice` `GlobalExceptionHandler` in each service that handles:
- `MethodArgumentNotValidException` → 400 with field errors
- `EntityNotFoundException` → 404
- `AccessDeniedException` → 403
- `RuntimeException` (ownership violations, business rule failures) → 400 or 403

---

*This plan covers 100% of the build. Follow the phases in order — each phase unlocks the next. Estimated total: 8 focused working days.*

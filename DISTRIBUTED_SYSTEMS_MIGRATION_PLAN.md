# Microservices Migration Plan: TogetherLearn

## 1. Overview of Current State (The Monolith)
Currently, **TogetherLearn** is architected as a monolithic application:
- **Backend**: A single Node.js (Express) application handling all routes (`users`, `courses`, `group-studies`, `questions`, `peer-teaching`).
- **Database**: A single, shared MongoDB database where all collections reside (coupled data).
- **Frontend**: A Next.js application communicating directly with the monolithic Express backend.

## 2. Target State (Distributed Microservices)
The goal is to migrate to a **Spring Boot** microservices architecture. 
- **Backend**: 6 distinct Spring Boot APIs + 1 API Gateway + 1 Discovery Server.
- **Databases**: 6 separate H2 In-Memory databases (one per service).
- **Frontend**: Points strictly to the API Gateway.

---

## 3. Step-by-Step Migration Strategy

### Phase 1: Infrastructure Setup (Discovery & Gateway)
Before building business logic, we must lay down the distributed foundation.
1. **Create the Discovery Server**: 
   - Initialize a Spring Boot application with the `@EnableEurekaServer` annotation.
   - Configure it to run on a dedicated port (e.g., `8761`).
2. **Create the API Gateway**:
   - Initialize a Spring Boot application utilizing Netflix Zuul (or Spring Cloud Gateway).
   - Configure it as an Eureka Client so it can dynamically resolve service locations.
   - Map routing definitions (e.g., route `/api/users/**` to the `user-service`).

### Phase 2: Database De-coupling (Moving to H2)
The current monolithic MongoDB must be logically split.
1. Design isolated schemas for each future service.
2. Since H2 is an in-memory SQL database, we will transition our NoSQL (MongoDB) models into relational JPA entity classes (`@Entity`).
3. Example: The `GroupStudy` entity will no longer hold direct user objects, but just `creatorId` references, enforcing loose coupling.

### Phase 3: Building the Microservices (The Strangler Fig Pattern)
We will create individual Spring Boot applications for each domain. Every service will include the `@EnableEurekaClient` annotation.

1. **User Service**:
   - Create endpoints for Auth and Profile management.
   - Connect to `user_db` (H2).
2. **Course Module Service**:
   - Extract the JSON curriculum data and load it into an H2 `course_db` on startup.
   - Expose CRUD APIs.
3. **Group Study Service**:
   - Create endpoints for scheduling.
   - Use Client-Side Load Balancing (Ribbon/Spring Cloud LoadBalancer) to communicate with the `Course Service` to validate if a course exists before creating a study group.
4. **Q&A Service**:
   - Create endpoints for questions and answers. Connect to `qa_db`.
5. **Peer Teaching Service**:
   - Manage tutoring requests. Connect to `peer_db`.
6. **Group Chat Service**:
   - Manage real-time messaging for study sessions. Connect to `chat_db`.

### Phase 4: Integration and Load Balancing
1. **Inter-Service Communication**: Implement `RestTemplate` or `OpenFeign` for microservices that need to talk to each other (e.g., Group Study Service fetching user details).
2. **Multiple Instances**: Configure IntelliJ/Eclipse to run multiple instances of the `Group Study Service` on different ports to demonstrate the Client-Side Load Balancer actively distributing traffic.

### Phase 5: Frontend Migration
1. Modify the `NEXT_PUBLIC_API_URL` in the Next.js frontend to point **only** to the API Gateway's port (e.g., `http://localhost:8080/api/`).
2. Update the frontend `api.ts` utility to ensure requests are routed correctly through the Gateway infrastructure rather than accessing services directly.

---

## Summary of Tech Stack Shift
| Component | Current State | Target Distributed State |
| :--- | :--- | :--- |
| **Backend Framework** | Node.js / Express | Java / Spring Boot |
| **Architecture** | Monolith | Microservices |
| **Database** | Shared MongoDB | Isolated H2 In-Memory DBs |
| **Routing** | Handled within Express | API Gateway (Netflix Zuul) |
| **Service Discovery** | N/A (Hardcoded routes) | Netflix Eureka Server |
| **Load Balancing** | Handled by current backend hosting | Client-Side Load Balancer |

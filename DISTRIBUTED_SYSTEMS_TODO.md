# TogetherLearn Distributed System & Architecture TODO List

## 1. Objective
Create a practical distributed architecture for TogetherLearn while satisfying software architecture and design requirements:

- real-world, multi-user educational collaboration platform
- strong core functionality for study groups, Q&A, peer teaching, notifications, and user management
- scalable, secure, maintainable, and observable distributed design
- efficient data storage and cross-service interaction
- architectural documentation and implementation plan

## 2. High-Level Plan
The project should progress through the following major phases:

1. Analysis and design
2. Architecture definition
3. Service decomposition and API design
4. Infrastructure and platform setup
5. Implementation and migration
6. Integration and validation
7. Documentation and delivery

## 3. Phase 1: Analysis and Design
### 3.1 Review current system
- [ ] Inventory current backend models, controllers, routes, and frontend pages.
- [ ] Identify domain boundaries and business capabilities.
- [ ] Capture current data entities and relationships: User, CourseModule, GroupStudy, Question, PeerTeaching, PeerRequest, Notification, GroupMessage.

### 3.2 Define functional requirements
- [ ] Confirm support for multiple users with separate accounts and profile data.
- [ ] Confirm study group lifecycle: create, update, join, list, close.
- [ ] Confirm Q&A lifecycle: post question, answer, filter by course/module.
- [ ] Confirm peer teaching lifecycle: create request, accept, complete.
- [ ] Confirm notifications for important events.
- [ ] Confirm file upload support for user avatars and media links.

### 3.3 Define non-functional requirements
- [ ] Scalability: support horizontal scaling of services.
- [ ] Security: authentication, authorization, input validation, token protection.
- [ ] Maintainability: modular service code and documentation.
- [ ] Performance: fast response times and efficient queries.
- [ ] Reliability: service availability and resiliency.
- [ ] Observability: metrics, logging, health checks.

## 4. Phase 2: Architecture Definition
### 4.1 Choose architecture pattern
- [ ] Adopt a microservices architecture.
- [ ] Use API Gateway + Service Discovery pattern.
- [ ] Use database-per-service principle.
- [ ] Evaluate synchronous REST first, event-driven async later.

### 4.2 Design core services
Create the following core microservices:

- User Service
- Course Module Service
- Group Study Service
- Q&A Service
- Peer Teaching Service
- Notification Service
- Chat Service (optional / advanced)

### 4.3 Define infrastructure components
- [ ] API Gateway
- [ ] Service Discovery (Eureka)
- [ ] Shared authentication and token validation middleware
- [ ] Local database setup for each service (H2 for prototype)
- [ ] Optional messaging/event bus for notifications and async updates

### 4.4 Create architectural artifacts
- [ ] Component diagram
- [ ] Data flow diagrams
- [ ] Sequence diagram for login, group creation, question posting, notification delivery
- [ ] Deployment/interaction diagram

## 5. Phase 3: Service Decomposition and API Design
### 5.1 User Service
- [ ] Define REST endpoints: register, login, profile, change password, get user by id.
- [ ] JWT generation and validation.
- [ ] Role-based access control and ownership checks.

### 5.2 Course Module Service
- [ ] Define endpoints: list courses, get by id, list by department/semester.
- [ ] Seed curriculum from `university_curriculum_courses.json`.
- [ ] Expose course metadata for other services.

### 5.3 Group Study Service
- [ ] Define endpoints: create group, update group, get group, list groups, join/leave group.
- [ ] Track participants, host, course association, mode, and schedule.
- [ ] Validate user and course references.

### 5.4 Q&A Service
- [ ] Define endpoints: post question, answer question, edit/delete by owner, list questions, filter by course/module.
- [ ] Manage question replies and metadata.

### 5.5 Peer Teaching Service
- [ ] Define endpoints: create request, update status, list requests, apply/accept.
- [ ] Track learning/tutoring session details.

### 5.6 Notification Service
- [ ] Define endpoints: create notification, list user notifications, mark as read.
- [ ] Manage notification lifecycle and delivery.

### 5.7 Chat Service (optional)
- [ ] Define endpoints: post message, get messages, list chats.
- [ ] Consider WebSocket or polling for real-time communication.

### 5.8 Shared contracts and error handling
- [ ] Define standard API response format.
- [ ] Define common DTOs for user identity, course metadata, and action results.
- [ ] Standardize error codes and validation responses.

## 6. Phase 4: Infrastructure and Platform Setup
### 6.1 Local development environment
- [ ] Create Docker Compose for local services, including Eureka and gateway.
- [ ] Create service templates for Spring Boot microservices.
- [ ] Setup H2 database configurations per service.

### 6.2 API Gateway
- [ ] Implement routes for each service.
- [ ] Enforce JWT validation at the gateway.
- [ ] Enable request logging and metrics.

### 6.3 Service Discovery
- [ ] Implement Eureka server.
- [ ] Register each microservice as a client.
- [ ] Verify discovery and health checks.

### 6.4 Dev tooling
- [ ] Create Postman or Swagger/OpenAPI definitions.
- [ ] Add health check endpoints for each service.
- [ ] Add logging configuration and central log format.

## 7. Phase 5: Implementation and Migration
### 7.1 Migrate existing monolith features
- [ ] Start with User Service and authentication.
- [ ] Migrate Course Module catalog.
- [ ] Migrate Group Study APIs.
- [ ] Migrate Q&A APIs.
- [ ] Migrate Peer Teaching APIs.
- [ ] Migrate Notification generation.

### 7.2 Frontend adaptation
- [ ] Update `frontend/src/lib/api.ts` to point to the API Gateway.
- [ ] Keep existing UI flows but route calls through gateway.
- [ ] Make any service-specific payload adjustments as needed.

### 7.3 Data migration approach
- [ ] Export monolithic data models and map to new service schemas.
- [ ] Seed initial course data in Course Service.
- [ ] Migrate users, groups, questions, requests, and notifications incrementally.
- [ ] For prototype, use fresh H2 data stores and seed sample data.

### 7.4 Security and validation
- [ ] Add JWT security in each service.
- [ ] Ensure each endpoint validates user identity and ownership.
- [ ] Ensure input validation with Spring Boot `@Valid` and DTOs.
- [ ] Add CORS restrictions at the gateway for the frontend.

## 8. Phase 6: Integration and Validation
### 8.1 Functional testing
- [ ] Test user signup/login flows.
- [ ] Test group creation, join, and messaging.
- [ ] Test question posting and answering.
- [ ] Test peer teaching request creation and updates.
- [ ] Test notification creation and retrieval.

### 8.2 Performance and scalability
- [ ] Load test core endpoints to validate scalability assumptions.
- [ ] Check how service discovery behaves with multiple instances.
- [ ] Validate gateway routing and latency across services.

### 8.3 Observability
- [ ] Add metrics endpoints for each service.
- [ ] Add request/response logging.
- [ ] Validate health check status across all services.

### 8.4 Architecture review
- [ ] Review service boundaries and data flows.
- [ ] Update architecture docs with actual implementation details.
- [ ] Assess if async notification/event patterns are needed.

## 9. Phase 7: Documentation and Delivery
### 9.1 Architecture documentation
- [ ] Finalize `SOFTWARE_ARCHITECTURE_DESIGN.md` with actual technical details.
- [ ] Add diagrams and explanation for each service.
- [ ] Document service APIs and data contracts.

### 9.2 Project documentation
- [ ] Update `README.md` with setup instructions for distributed architecture.
- [ ] Add `DISTRIBUTED_SYSTEMS_TODO.md` and migration notes.
- [ ] Add development docs for service startup and debugging.

### 9.3 Evaluation and submission artifacts
- [ ] Collect software architecture deliverables: diagrams, rationale, requirements, stack, trade-offs, risks.
- [ ] Ensure the final repo contains a clean architecture and clear migration plan.
- [ ] Prepare a short summary of how the distributed architecture satisfies the target characteristics.

## 10. Detailed Task Breakdown
### 10.1 Research and decision tasks
- [ ] Confirm chosen service boundaries from current domain model.
- [ ] Validate the need for a Chat Service versus using Group Message storage in Group Study Service.
- [ ] Decide whether Notification Service is synchronous or event-driven.
- [ ] Decide whether each service uses its own dedicated H2 instance or a shared database for prototype convenience.

### 10.2 Service implementation tasks
- [ ] Create Spring Boot starter project for each service.
- [ ] Implement controllers, services, repositories, and DTOs.
- [ ] Add service-specific test cases.
- [ ] Add service config for Eureka discovery.

### 10.3 Gateway implementation tasks
- [ ] Configure route mappings to backend services.
- [ ] Setup JWT token validation filter.
- [ ] Add CORS configuration and global exception handling.
- [ ] Add request logging.

### 10.4 Data design tasks
- [ ] Define entity schemas for all services.
- [ ] Model relationships using IDs rather than embedded objects.
- [ ] Map current MongoDB schemas to relational H2 tables.
- [ ] Define initial seed data for courses and sample users.

### 10.5 Security and access control tasks
- [ ] Implement authentication and authorization in the User Service.
- [ ] Add role checks and ownership checks for resource mutations.
- [ ] Add password encryption and secure token expiry.
- [ ] Secure service-to-service communication if needed.

### 10.6 Testing and quality tasks
- [ ] Write unit tests for service logic.
- [ ] Write integration tests for API endpoints.
- [ ] Create end-to-end scenarios using Postman/newman or frontend-driven tests.
- [ ] Run static analysis and linting on Spring Boot code and frontend TypeScript.

## 11. Suggested Execution Order
1. Build the architecture document and validate scope.
2. Implement Eureka and API Gateway.
3. Build User Service and authentication.
4. Build Course Service and data seeding.
5. Build Group Study Service.
6. Build Q&A Service.
7. Build Peer Teaching Service.
8. Build Notification Service.
9. Integrate frontend with the gateway.
10. Add observability and testing.

## 12. Notes on Requirements Mapping
| Requirement | Planned Implementation |
|---|---|
| Real-world multi-user support | User Service + gateway + frontend auth + multi-tenant data handling |
| Core domain functionality | Dedicated services for groups, Q&A, peer teaching, notifications |
| Scalability | Microservices + API Gateway + independent databases + service discovery |
| Security | JWT, role-based access, request validation, gateway enforcement |
| Data storage | DB-per-service with clear domain schema and efficient retrieval logic |
| Service interaction | Gateway, service discovery, REST APIs, optional event bus |
| Analytics/reporting | Metrics endpoints, logging, and dashboard-ready usage data |

## 13. Recommended Documentation Files
- `SOFTWARE_ARCHITECTURE_DESIGN.md`
- `DISTRIBUTED_SYSTEMS_MIGRATION_PLAN.md`
- `DISTRIBUTED_SYSTEMS_TODO.md`
- `README.md` with setup instructions
- Service-specific README files for each microservice

## 14. Success Criteria
The project will be successful when it delivers:
- a distributed architecture design aligned to the assignment requirements
- a working service prototype with API Gateway and service discovery
- clear separation of domains into independent services
- evidence of security, scalability, and data design decisions
- documentation showing rationale, trade-offs, risks, and architecture models

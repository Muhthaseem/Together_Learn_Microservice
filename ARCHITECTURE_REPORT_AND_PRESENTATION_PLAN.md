# TogetherLearn Architecture Report & Presentation Plan

## 1. Title
TogetherLearn: A Distributed Collaborative Learning Platform for University Students

## 2. Abstract
This document presents a software architecture proposal for a distributed system, prepared for the CO4306 Software Architecture mini-project. It emphasizes architectural decisions, quality attributes, service decomposition, integration patterns, and technical justification. Implementation details are intentionally omitted, as the evaluation criteria focus on architectural depth and reasoning.

## 3. Introduction
This report frames TogetherLearn as an architectural case study, demonstrating how a distributed platform can satisfy requirements for scalability, security, maintainability, data management, and component interaction. The emphasis is on architecture design rather than implementation.

## 4. System Overview
The architecture consists of a frontend client connecting through an API Gateway to a set of backend domain services. The backend services are organized by bounded contexts, each owning its data and interface. The architecture prioritizes:

- clear service boundaries
- dynamic routing and discovery
- independent scalability
- secure access control
- efficient data persistence
- observable service interactions

## 5. Requirements Specification
### 5.1 Functional Requirements
- User registration, login, profile management.
- Course module catalog and curriculum mapping.
- Create, manage, and join study groups.
- Post and answer Q&A content by course module.
- Create and manage peer teaching requests.
- Generate and deliver user notifications.
- Upload user avatars and manage media.
- Provide summary analytics for usage and participation.

### 5.2 Non-Functional Requirements
- Scalability: support large user counts and concurrent transactions.
- Security: enforce authentication, authorization, and input validation.
- Availability: maintain responsiveness under load.
- Maintainability: modular service code and clear component boundaries.
- Performance: efficient database access and API response times.
- Interoperability: support service-to-service communication.
- Observability: logging, health checks, and metrics support.

## 6. System Design
### 6.1 Domain Decomposition
The system is decomposed into the following logical domains:
- User Management
- Course Module Catalog
- Group Study Coordination
- Q&A Forum
- Peer Teaching Management
- Notification Delivery
- Chat/Communication (optional)

### 6.2 Service Boundaries
Each domain becomes a service with its own data and API contract. This separation enforces single responsibility and supports independent deployment.

### 6.3 Interaction Model
- Frontend communicates with backend through an API Gateway.
- Gateway handles routing, authentication checking, and request validation.
- Services register with a discovery component to support dynamic service location.
- Services use REST APIs for synchronous interactions; asynchronous events are reserved for future notification scaling.

## 7. Architecture Design
### 7.1 Proposed Architectural Style
The recommended architectural style is a distributed microservices architecture with the following characteristics:
- API Gateway pattern
- Service Discovery
- Database-per-service
- Domain-driven service decomposition
- RESTful APIs

### 7.2 High-level Architecture
The high-level architecture consists of:
- Frontend Client (Next.js)
- API Gateway
- User Service
- Course Service
- Group Study Service
- Q&A Service
- Peer Teaching Service
- Notification Service
- Optional Chat Service
- Service Discovery component
- Per-service databases

### 7.3 Architectural Rationale
- Real-world problem support: The system supports multiple student users collaborating on course-specific activities.
- Core functionality: Each service supports a focused domain area aligned with the student workflow.
- Scalability: Services can scale independently, avoiding a monolithic bottleneck.
- Security: Centralized gateway enforcement and isolated service authorization protect data.
- Efficient storage: Database-per-service enables optimized schemas and avoids cross-domain coupling.
- Component interaction: Services interact through clearly defined APIs and discovery.
- Analytics support: Notification and metrics capabilities enable usage reporting.

### 7.4 Architectural Representations
Include diagrams for:
- Problem domain and user workflows
- High-level service architecture
- API Gateway and service interactions
- Data flow for key scenarios (login, group creation, question posting, notifications)

## 8. Technical Stack
### 8.1 Backend Stack
- Spring Boot for service implementation
- Spring Security with JWT for authentication and access control
- Netflix Eureka for service discovery
- Spring Cloud Gateway or Zuul for API Gateway
- H2 in-memory databases for prototyping
- PostgreSQL or MySQL for production-ready storage
- OpenFeign / RestTemplate for inter-service calls
- JPA/Hibernate for ORM

### 8.2 Frontend Stack
- Next.js 16 + React 19
- TypeScript for type safety
- Tailwind CSS 4 for UI styling
- React Hook Form + Zod for form validation
- React Hot Toast for notifications
- React Easy Crop for avatar cropping

### 8.3 Supporting Tools
- Docker/Docker Compose for local environment orchestration
- Postman or Swagger/OpenAPI for API documentation and testing
- Logging and monitoring tools such as Spring Boot Actuator

## 9. Discussion
### 9.1 Design Decisions
- Microservices over monolith: improves scalability and maintainability but increases operational complexity.
- API Gateway: centralizes security and simplifies the frontend interface.
- Separate databases: avoids coupling and enables service ownership, at the cost of distributed data challenges.
- REST-first integration: simpler for initial implementation, with asynchronous messaging as a later enhancement.

### 9.2 Trade-offs
- Using H2 for prototype speed vs. PostgreSQL for durability.
- Service discovery adds complexity but enables dynamic scaling.
- Gateway adds a centralized layer; it must be highly available.
- Synchronous calls are easy to implement but can create latency spikes.

### 9.3 Risks
- Complexity of distributed deployment and debugging.
- Data consistency challenges across isolated services.
- Security flaws if JWT or gateway checks are misconfigured.
- Performance issues if gateway becomes a bottleneck.

### 9.4 Assumptions
- The user base is university students, not an enterprise-scale system.
- The platform will be developed as a learning-focused proof-of-concept.
- Data volume is moderate and can be handled with scaled services.
- Existing frontend can be adapted to use the gateway without major redesign.

### 9.5 Limitations
- H2 databases are not production-grade; they are for academic prototyping.
- Real-time chat is optional and may be implemented later.
- Reporting is lightweight and not a full BI solution.

## 10. Contents of the Presentation
The proposal presentation should emphasize architectural reasoning and the chosen design approach. It should include:
- Architectural problem statement and the rationale for a distributed design.
- System overview in terms of architecture, not business narrative.
- Key requirements mapped to architecture decisions.
- Proposed architectural style: microservices, gateway, discovery, and service contracts.
- High-level architecture diagram with component interactions and data flow.

### 10.1 Presentation structure
1. Title slide
2. Architectural problem statement and motivation
3. Architectural overview and scope
4. Key architectural requirements
5. Architectural style and rationale
6. High-level component diagram
7. Service boundaries and integration patterns
8. Technical stack overview
9. Design decisions, trade-offs, and quality attributes
10. Risks, assumptions, and limitations
11. Conclusion and next steps

## 11. Exact Plan for the Report
The final report should contain the following sections:

1. Title
2. Abstract
3. Introduction
4. System Overview
5. Requirements Specification
6. System Design
7. Architecture Design
8. Technical Stack
9. Discussion
10. References
11. Acknowledgement
12. Appendices

### 11.1 Report content guidance
- Title: concise name and architecture-focused subtitle
- Abstract: high-level summary of architectural goals and approach
- Introduction: architecture motivation and scope
- System Overview: architectural structure, components, and boundaries
- Requirements Specification: functional and architectural quality requirements
- System Design: domain model, service decomposition, and interaction patterns
- Architecture Design: architectural style, diagrams, rationale, and quality attributes
- Technical Stack: chosen technologies and justification for architecture
- Discussion: design decisions, trade-offs, risks, assumptions, limitations
- References: cite architectural sources, frameworks, and design patterns
- Acknowledgement: credit teammates or external help
- Appendices: diagrams, API list, data schemas, glossary

## 12. Additional Notes
- The focus should remain on architectural depth and reasoning rather than implementation details.
- Use diagrams extensively to illustrate component relationships and data flow.
- Align every architecture decision with the target evaluation criteria.
- Keep the final report concise and structured, not exceeding the page limit.

## 13. Next Steps
- Finalize the architectural style and service decomposition.
- Prepare presentation slides based on the overview and diagrams.
- Draft the report sections in order, starting from requirements and architecture.
- Validate the design against the project characteristics and evaluation criteria.

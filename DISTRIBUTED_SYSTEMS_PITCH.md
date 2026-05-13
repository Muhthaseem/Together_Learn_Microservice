# TogetherLearn: Distributed Student Study Sharing Management System

## 1. Main Objective of the Project
The primary goal of this project is to build **TogetherLearn**, a collaborative study sharing management system for university students, using a distributed **Microservices Architecture**. 

Instead of relying on a monolithic architecture where user management, study group creation, Q&A forums, and course management are tightly coupled into a single application, this system will be divided into small, independent services. This approach ensures that each service is responsible for a single business capability, making the application highly scalable, resilient, and easier to develop and deploy independently.

## 2. System Use Case: Student Study Sharing System
**TogetherLearn** is designed for university students to collaboratively learn and manage their studies. Students can create physical or virtual study groups, ask questions in a forum, manage their peer-teaching requests, and access course modules relative to their engineering departments.

## 3. Core Microservices Design
The system will be decomposed into **6 independent core microservices**, each managing its own data and exposing a distinct set of REST APIs.

### A. User Service (Authentication & Profile Management)
**Responsibility:** Manages student registration, login, profile details (department, batch).
- `POST /users/register` - Register a new student
- `POST /users/login` - Authenticate a student
- `GET /users/{id}` - Retrieve student profile
- `DELETE /users/{id}` - Delete a student account

### B. Course Module Service
**Responsibility:** Manages the university curriculum, including departments, semesters, and course details.
- `GET /courses` - Get a list of all courses
- `GET /courses/department/{dept}` - Get courses by department
- `POST /courses` - Add a new course module
- `DELETE /courses/{id}` - Remove a course module

### C. Group Study Service
**Responsibility:** Handles the creation, scheduling, and participant management of peer study groups.
- `GET /study-groups` - Get all available study groups
- `GET /study-groups/{id}` - Get details of a specific study group
- `POST /study-groups` - Create a new study group session
- `DELETE /study-groups/{id}` - Cancel a study session

### D. Q&A Forum Service
**Responsibility:** Manages academic questions asked by students and the answers provided by peers.
- `GET /questions` - Get all posted questions
- `GET /questions/course/{courseCode}` - Get questions for a specific course
- `POST /questions` - Post a new question
- `POST /questions/{id}/answers` - Add an answer to a question

### E. Peer Teaching Service
**Responsibility:** Manages requests for academic help and offers from students willing to tutor.
- `GET /peer-requests` - Get all peer teaching requests
- `POST /peer-requests` - Create a new request for help
- `PUT /peer-requests/{id}/accept` - Accept a peer teaching request
- `DELETE /peer-requests/{id}` - Delete a fulfilled request

### F. Group Chat Service
**Responsibility:** Handles real-time messaging and communication within specific study groups.
- `GET /chats/group/{groupId}` - Get all messages for a specific study group
- `POST /chats/group/{groupId}` - Send a new message to a study group
- `DELETE /chats/{messageId}` - Delete a specific message
- `PUT /chats/{messageId}` - Edit an existing message

## 4. Architecture & Infrastructure Components

### Service Discovery Server (Netflix Eureka)
We will implement **Netflix Eureka** as the Service Discovery Server. Every microservice will act as an **Eureka Client**, registering itself with the Eureka Server upon startup. This allows microservices to dynamically locate and communicate with each other without hardcoding IP addresses.

### Client-Side Load Balancer
Using tools like **Ribbon** (or Spring Cloud LoadBalancer), we will implement client-side load balancing. If we spin up multiple instances of the *Group Study Service* to handle high traffic, the load balancer will evenly distribute incoming requests across all available instances.

### API Gateway (Netflix Zuul / Spring Cloud Gateway)
An **API Gateway** will be implemented as the single entry point for all frontend client requests. It will handle:
- Request routing (e.g., `/api/users/**` routes to User Service)
- Cross-Origin Resource Sharing (CORS)
- Load balancing integration

### Decentralized Databases (H2 In-Memory Database)
Following the database-per-service pattern, each microservice will have its own independent **H2 In-Memory Database**. This prevents tight coupling at the database layer and simplifies development and testing for this academic project.

### Simple Frontend
To test the entire distributed workflow, we will build a simple web UI (or utilize the existing Next.js frontend adapted for the API Gateway) alongside **Postman** collections to demonstrate the end-to-end functionality of the microservices.

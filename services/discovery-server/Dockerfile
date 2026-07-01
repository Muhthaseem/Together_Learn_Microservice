FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /workspace

# Install parent POM to local repo (non-recursive — no child modules compiled)
COPY pom.xml .
RUN mvn -B install -N -q

# Pre-download this module's dependencies (cached layer if pom.xml unchanged)
WORKDIR /workspace/discovery-server
COPY discovery-server/pom.xml .
RUN mvn -B dependency:go-offline -q

# Build
COPY discovery-server/src ./src
RUN mvn -B package -DskipTests -q

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /workspace/discovery-server/target/*.jar app.jar
EXPOSE 8761
ENTRYPOINT ["java", "-jar", "app.jar"]

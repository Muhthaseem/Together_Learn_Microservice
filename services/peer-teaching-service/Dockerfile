# syntax=docker/dockerfile:1
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /workspace

ENV MAVEN_OPTS="-Daether.connector.http.retryHandler.count=5 -Daether.connector.http.connectionMaxTtl=120"

COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B install -N -q || \
    (sleep 20 && mvn -B install -N -q) || \
    (sleep 60 && mvn -B install -N -q)

WORKDIR /workspace/peer-teaching-service
COPY peer-teaching-service/pom.xml .
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B dependency:go-offline -q || \
    (sleep 20 && mvn -B dependency:go-offline -q) || \
    (sleep 60 && mvn -B dependency:go-offline -q)

COPY peer-teaching-service/src ./src
RUN --mount=type=cache,target=/root/.m2 mvn -B package -DskipTests -q

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /workspace/peer-teaching-service/target/*.jar app.jar
EXPOSE 8085
ENTRYPOINT ["java", "-jar", "app.jar"]

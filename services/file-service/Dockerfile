# syntax=docker/dockerfile:1
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /workspace

ENV MAVEN_OPTS="-Daether.connector.http.retryHandler.count=5 -Daether.connector.http.connectionMaxTtl=120"

COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B install -N -q || \
    (sleep 20 && mvn -B install -N -q) || \
    (sleep 60 && mvn -B install -N -q)

WORKDIR /workspace/file-service
COPY file-service/pom.xml .
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B dependency:go-offline -q || \
    (sleep 20 && mvn -B dependency:go-offline -q) || \
    (sleep 60 && mvn -B dependency:go-offline -q)

COPY file-service/src ./src
RUN --mount=type=cache,target=/root/.m2 mvn -B package -DskipTests -q

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /workspace/file-service/target/*.jar app.jar
EXPOSE 8088
ENTRYPOINT ["java", "-jar", "app.jar"]

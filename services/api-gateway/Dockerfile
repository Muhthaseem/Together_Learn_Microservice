FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /workspace

COPY pom.xml .
RUN mvn -B install -N -q

WORKDIR /workspace/api-gateway
COPY api-gateway/pom.xml .
RUN mvn -B dependency:go-offline -q

COPY api-gateway/src ./src
RUN mvn -B package -DskipTests -q

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /workspace/api-gateway/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]

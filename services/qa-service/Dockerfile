FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /workspace

COPY pom.xml .
RUN mvn -B install -N -q

WORKDIR /workspace/qa-service
COPY qa-service/pom.xml .
RUN mvn -B dependency:go-offline -q

COPY qa-service/src ./src
RUN mvn -B package -DskipTests -q

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /workspace/qa-service/target/*.jar app.jar
EXPOSE 8084
ENTRYPOINT ["java", "-jar", "app.jar"]

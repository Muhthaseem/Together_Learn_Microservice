FROM maven:3.9.6-eclipse-temurin-25-alpine AS build
WORKDIR /workspace

COPY pom.xml .
RUN mvn -B install -N -q

WORKDIR /workspace/notification-service
COPY notification-service/pom.xml .
RUN mvn -B dependency:resolve -q

COPY notification-service/src ./src
RUN mvn -B package -DskipTests -q

FROM eclipse-temurin:25-jre-alpine
WORKDIR /app
COPY --from=build /workspace/notification-service/target/*.jar app.jar
EXPOSE 8086
ENTRYPOINT ["java", "-jar", "app.jar"]

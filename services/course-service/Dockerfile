FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /workspace

COPY pom.xml .
RUN mvn -B install -N -q

WORKDIR /workspace/course-service
COPY course-service/pom.xml .
RUN mvn -B dependency:resolve -q

COPY course-service/src ./src
RUN mvn -B package -DskipTests -q

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /workspace/course-service/target/*.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]

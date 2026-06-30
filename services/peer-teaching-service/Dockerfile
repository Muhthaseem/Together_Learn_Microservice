FROM maven:3.9.6-eclipse-temurin-25-alpine AS build
WORKDIR /workspace

COPY pom.xml .
RUN mvn -B install -N -q

WORKDIR /workspace/peer-teaching-service
COPY peer-teaching-service/pom.xml .
RUN mvn -B dependency:resolve -q

COPY peer-teaching-service/src ./src
RUN mvn -B package -DskipTests -q

FROM eclipse-temurin:25-jre-alpine
WORKDIR /app
COPY --from=build /workspace/peer-teaching-service/target/*.jar app.jar
EXPOSE 8085
ENTRYPOINT ["java", "-jar", "app.jar"]

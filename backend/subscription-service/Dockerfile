FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY backend/ backend/
RUN --mount=type=cache,target=/root/.m2,sharing=locked mvn -B -ntp -f backend/pom.xml -pl subscription-service -am -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN groupadd --system app && useradd --system --gid app --home-dir /app app
COPY --from=build /workspace/backend/subscription-service/target/subscription-service-0.0.1-SNAPSHOT-exec.jar /app/subscription-service.jar
USER app:app
EXPOSE 8084
ENTRYPOINT ["java", "-jar", "/app/subscription-service.jar"]

FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY . .
RUN --mount=type=cache,target=/root/.m2,sharing=locked mvn -B -pl identity-service -am -DskipTests package

FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S -g 10001 bakery && adduser -S -D -u 10001 -G bakery bakery
WORKDIR /app
COPY --from=build --chown=bakery:bakery /workspace/identity-service/target/identity-service-0.0.1-SNAPSHOT-exec.jar /app/application.jar
USER bakery
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=5 CMD wget -q -O /dev/null http://localhost:8080/actuator/health/readiness || exit 1
ENTRYPOINT ["java", "-jar", "/app/application.jar"]

FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY . .
RUN --mount=type=cache,target=/root/.m2,sharing=locked mvn -B -pl identity-service -am -DskipTests package

FROM eclipse-temurin:21-jre
RUN groupadd --system --gid 10001 bakery && useradd --system --uid 10001 --gid bakery bakery
WORKDIR /app
COPY --from=build --chown=bakery:bakery /workspace/identity-service/target/identity-service-0.0.1-SNAPSHOT-exec.jar /app/application.jar
USER bakery
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=5 CMD bash -c 'exec 3<>/dev/tcp/127.0.0.1/8080; printf "GET /actuator/health/readiness HTTP/1.0\r\nHost: localhost\r\n\r\n" >&3; read -r status <&3; [[ "$status" == *" 200 "* ]]'
ENTRYPOINT ["java", "-jar", "/app/application.jar"]

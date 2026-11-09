FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY backend/ backend/
RUN --mount=type=cache,target=/root/.m2,sharing=locked mvn -B -ntp -f backend/pom.xml -pl cake-ai-service -am -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN groupadd --system app && useradd --system --gid app --home-dir /app app
COPY --from=build /workspace/backend/cake-ai-service/target/cake-ai-service-0.0.1-SNAPSHOT-exec.jar /app/application.jar
USER app:app
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=5 CMD bash -c 'exec 3<>/dev/tcp/127.0.0.1/${SERVER_PORT:-8080}; printf "GET /actuator/health/readiness HTTP/1.0\r\nHost: localhost\r\n\r\n" >&3; read -r status <&3; [[ "$status" == *" 200 "* ]]'
ENTRYPOINT ["java", "-jar", "/app/application.jar"]
